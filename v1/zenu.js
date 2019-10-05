async function zenu_html(url) {
    const respose = await fetch(url);
    if (!respose.ok) return `
        <div>invalid</div>
    `;
    return await respose.text();
}

async function zenu_view(html) {
    const view = html
        .replace(/\^notify/, `:listen="notify" *control-store="notify.event" *control="notify.control"`)
        .replace(/:[^\s=]+=/g, w => `data-${w.slice(1)}`)
        .replace(/\*[^\s=]+="[^"]+"/g, (w, i) => {
            let [_, a, b] = w.match(/\*([^=]+)="([^"]+)"/);
            a = a.replace(/-\w/g, w => w.slice(1).toUpperCase());
            // console.log(w, i);
            return `data-let-${i}="const ${a}=${b};"`;
        });
    return view;
}

async function zenu_node(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const node = document.importNode(template.content, true);
    return node;
}

async function zenu_widget(meta) {
    let url = meta.dataset.component;

    // console.log(meta, url);

    let metaControl = await new Promise(resolve => {
        component(url, {
            notify(metaControl) {
                resolve(metaControl);
            }
        });
    });
    metaControl.dataset.id = meta.dataset.id;
    console.log("widget", metaControl);
    metaControl.bind.state = event => {
        for (let [key, data] of Object.entries(event)) {
            metaControl.state[key] = data;
        }
        metaControl.watch.initialize = true;
        metaControl.watch.update = true;
    };
    metaControl.bind.watch = event => {
        for (let [key, data] of Object.entries(event)) {
            console.log(key, data);
            metaControl.watch[key] = data;
        }
        console.log("watch", event);
    };
    return metaControl;
}

async function zenu_meta(meta) {
    let url = meta.dataset.load;
    let metaControl = await zenu_component(url);
    metaControl.dataset.id = meta.dataset.id;
    return metaControl;
}

function zenu_handler(control, prototype, code) {
    let self = prototype.parentElement || control;

    if (prototype.dataset.source && prototype.dataset.source !== "self") {
        self = control.querySelector(`[data-id=${prototype.dataset.source}]`);
    }

    self = self || control;

    if (!self) console.log("self", control , self);

    const lets = [];
    for (let attibute in prototype.dataset) {
        if (attibute.match(/let-\d+/)) lets.push(prototype.dataset[attibute]);
    }
    // console.log(lets);

    const $eventName = prototype.dataset.listen || prototype.dataset.dispatch || "eventName";

    let storeId = prototype.dataset.store || "temp";

    for (let eventName of $eventName.split(/\s+/)) {
        // console.log(prototype);
    
        const ids = [...control.querySelectorAll("[data-id]")]
            .map(element => [element.dataset.id, element])
            .reduce((ids, [key, value]) => {
                value.store = value.store || zenu_proxy_store(value);
                ids[key] = value;
                return ids;
            }, {});
    
        // console.log(ids, eventName);
    
        const fun = new Function("root", "self", "ids", "...params", `
            ~return (async (
            ~    { ${Object.keys(ids).join(", ")} }, 
            ~    event, 
            ~    ${eventName.replace(/-\w/g, w => w.slice(1).toUpperCase()).replace(/[^\w]/g, "")},
            ~    store,
            ~    parent,
            ~) => {
            ~
            ~${lets.join("\n\t")}
            ~
            ~   if (root) root.store = root.store || zenu_proxy_store(root);
            ~   if (self) self.store = self.store || zenu_proxy_store(self);
            ~
            ~   if (root) root.store["${storeId}"] = event;
            ~
            ~    ${code}
            ~
            ~})(
            ~    ids,
            ~    params[0] instanceof CustomEvent ? params[0].detail : params[0],
            ~    params[0] instanceof CustomEvent ? params[0].detail : params[0],
            ~    root.store,
            ~    root.parentElement,
            );
        `.replace(/\s*~/g, "\n\t"));
        // console.log(fun.toString());
    
        const handler = async (...params) => {
            let detail = await fun(control, self, ids, ...params);
            // console.log("result", detail);
            if (prototype.dataset.dispatch) {
                detail = detail instanceof CustomEvent ? detail.detail : detail;
                const event = new CustomEvent(prototype.dataset.dispatch, { detail });
                if (self) self.dispatchEvent(event);
                if (self !== control) control.dispatchEvent(event);
            }
        };
    
        if (prototype.dataset.listen) {
            self.unsubscribe = self.unsubscribe || (() => {
                for (let [eventName, handler] of self.listeners) {
                    self.removeEventListener(eventName, handler);
                }
            });
            self.listeners = self.listeners || [];
            self.listeners.push([eventName, handler]);
            self.addEventListener(eventName, handler);
            return;
        }
    
        if (prototype.dataset.dispatch) {
            // console.log(control, script);
            handler(new CustomEvent({ detail: { control, self } }));
            return;
        }
    }

}

async function zenu_scripts(node, control) {
    node.querySelectorAll("script").forEach(script => {
        zenu_handler(control, script, script.textContent);
    });
}

async function zenu_templates(node, control) {
    node.querySelectorAll("template").forEach(template => {
        let injector = "";

        const emit = template.dataset.emit || "{parent,child:$control} as data";
        let [emitFrom, emitTo] = emit.split(/\s+as\s+/);
        emitTo = emitTo || emitFrom;

        let code = template.innerHTML.replace(/`/g, "\\`").replace(/\${/g, "\\${");

        if (template.dataset.if) {
            injector += `
                if (${template.dataset.if}) {
                    while(self.firstChild) {
                        if (self.firstChild.unsubscribe) self.firstChild.unsubscribe();
                        self.removeChild(self.firstChild);
                    };
                    const $view = await zenu_view(\`${code}\`);
                    const $node = await zenu_node($view);
                    const $control = await zenu_control($node);
                    $control.dataset.uid = Math.random().toString(32).slice(2);
                    self.append($control);
                    $control.dispatchEvent(new CustomEvent("${emitTo}", { detail: ${emitFrom} }));
                    $control.addEventListener("update", (...params) => {
                        // console.log("update", params);
                        let event = params[0] instanceof CustomEvent ? params[0].detail : params[0];
                        self.dispatchEvent(new CustomEvent("notify", {
                            detail: {
                                event,
                                params,
                                self,
                                control: $control
                            }
                        }));
                    });
                }
            `;
        }

        if (template.dataset.for) {
            injector += `
                while(self.firstChild) {
                    if (self.firstChild.unsubscribe) self.firstChild.unsubscribe();
                    self.removeChild(self.firstChild);
                };
                let index = 0;
                for (${template.dataset.for}) {
                    const $view = await zenu_view(\`${code}\`);
                    const $node = await zenu_node($view);
                    const $control = await zenu_control($node);
                    $control.dataset.uid = Math.random().toString(32).slice(2);
                    $control.store.index = index;
                    self.append($control);
                    $control.dispatchEvent(new CustomEvent("${emitTo}", { detail: ${emitFrom} }));
                    $control.addEventListener("update", (...params) => {
                        // console.log("update", params);
                        let event = params[0] instanceof CustomEvent ? params[0].detail : params[0];
                        self.dispatchEvent(new CustomEvent("notify", {
                            detail: {
                                event,
                                params,
                                self,
                                control: $control
                            }
                        }));
                    });
                    index++;
                }
            `;
        }

        zenu_handler(control, template, injector);
    });
}

function zenu_proxy_store(element) {
    return new Proxy(element, {
        get(el, key) {
            el._store = el._store || {};
            return el._store[key];
        },
        set(el, key, value) {
            el._store = el._store || {};
            el._store[key] = value;
            el.dispatchEvent(new CustomEvent("update", el._store));
        }
    });
}

async function zenu_control(node) {
    let control = node.firstElementChild;

    if (control.dataset.component) control = await zenu_widget(control);

    if (control.dataset.load) control = await zenu_meta(control);

    // console.log(control);

    control.store = control.store || zenu_proxy_store(control);

    for (let meta of [...control.querySelectorAll(`[data-component]`)]) {
        let metaControl = await zenu_widget(meta);
        meta.parentNode.replaceChild(metaControl, meta);
    }

    for (let meta of [...control.querySelectorAll(`[data-load]`)]) {
        let metaControl = await zenu_meta(meta);
        meta.parentNode.replaceChild(metaControl, meta);
    }

    await zenu_templates(node, control);
    await zenu_scripts(node, control);
    
    control.dispatchEvent(new CustomEvent("#control"));

    return control;
}

async function zenu_component(url) {
    const html = await zenu_html(`${url}/view.html`);
    const view = await zenu_view(html);
    const node = await zenu_node(view);
    const control = await zenu_control(node);
    // console.log(html);
    // console.log(view);
    // console.log(node);
    // console.log(control);
    control.dataset.uid = Math.random().toString(32).slice(2);

    control.dispatchEvent(new CustomEvent("#component"));

    console.log("log");

    return control;
}