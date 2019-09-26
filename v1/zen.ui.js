async function requestText(url) {
    const response = await fetch(url);
    if (!response.ok) {
        // console.warn("[requestText]", url, await response.text(), response);
        return "";
    }
    return await response.text();
}

async function requestJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        // console.warn("[reqestJSON]", url, await response.text(), response);
        return {};
    }
    return await response.json();
}

async function waitScript(src) {
    const script = zen(document.createElement("script"));
    return await new Promise((resolve, reject) => {
        script.bind.load = resolve;
        script.bind.error = resolve;
        document.body.append(script);
        script.src = src;
    });
}

async function loadComponent(url, state = null) {
    // base = base.replace(/\/?$/, () => "/");

    // const parts = namespace(name);
    // namespace(`${name}.properties`);
    // namespace(`${name}.bindings`);

    // const path = parts.join("/");

    const view = await requestText(`${url}/view.html`);
    
    const styleLink = inline(`<link data-ns="${url}" rel="stylesheet" href="${url}/style.css">`);

    // const properties = await requestText(`${base}${path}/properties.html`);
    // const logic = await requestText(`${base}${path}/logic.html`);

    const scripts = inline(`<div>${view}</div>`);

    if (!document.head.querySelector(`[data-ns="${url}"]`)) document.head.append(styleLink);

    const control = inline(view || `
        <div>
            <span data-error="true">
                <i class="fas fa-exclamation-triangle"></i> Component <strong>${url}</strong> not found
            </span>
        </div>
    `);

    if (state) {
        control.state = state;
        zen(control);
    }
    state = control.state;

    control.dataset.url = url;

    // let model = window;

    // for (let part of parts) model = model[part];

    scripts.querySelectorAll("script").forEach(script => {
        if (script.dataset.watch) {
            const name = script.dataset.watch;
            const watcher = new Function("control", `
                return ((control, { state, ref, def, bind, fire, watch }) => {
                    ${ control.dataset.id ? `const ${control.dataset.id} = control;` : "" }

                    ${ 
                        [...control.querySelectorAll("[data-id]")]
                            .map(element => `const ${element.dataset.id} = control.ref.id["${element.dataset.id}"];`)
                            .join("\n")
                    }

                    return (${name}) => {
                        ${script.textContent}
                    };
                })(control, control);
            `)(control);
            control.watcher[name] = watcher;
        }
        if (script.dataset.property) {
            const name = script.dataset.property;
            const descriptor = new Function("control", `
                return ((control, { state, ref, def, bind, fire, watch }) => {
                    const property = { 
                        get() { console.warn("deprecated set") }, 
                        set(value) { console.warn("deprecated set") } 
                    };

                    const get = callback => property.get = callback;
                    const set = callback => property.set = callback;

                    ${ control.dataset.id ? `const ${control.dataset.id} = control;` : "" }

                    ${ 
                        [...control.querySelectorAll("[data-id]")]
                            .map(element => `const ${element.dataset.id} = control.ref.id["${element.dataset.id}"];`)
                            .join("\n")
                    }

                    ${script.textContent}

                    return { 
                        get(...params) { return property.get(...params) },
                        set(...params) { property.set(...params) }
                    };
                })(control, control);
            `)(control);
            control.property[name] = descriptor;
        }
        if (script.dataset.bind) {
            let sources = script.dataset.source ? 
                script.dataset.source.split(/\s+/).map(sourceId => control.ref.id[sourceId]) : [control];

            for (let source of sources) {
                for (let name of script.dataset.bind.split(/\s+/)) {
                    let handler = new Function("control", "source", `
                        return (...params) => (({ state, ref, def, bind, fire, watch }, event, input, ...params) => {
                            ${ control.dataset.id ? `const ${control.dataset.id} = control;` : "" }

                            ${ 
                                [...control.querySelectorAll("[data-id]")]
                                    .map(element => 
                                        `const ${element.dataset.id} = control.ref.id["${element.dataset.id}"];`
                                    ).join("\n")
                            }
                            ${script.textContent}
                        })(control, params[0], params[0], ...params);
                    `)(control, source);
                    source.bind[name] = handler;
                }
            }


        }
    });

    control.querySelectorAll(`[data-control]`).forEach(element => {
        const name = element.dataset.control;
        let state = null;
        if (element.dataset.state) {
            state = control.state;
            for (let key of element.dataset.state.split(".")) {
                if (key === "*") continue;
                state[key] = state[key] || {};
                state = state[key];
            }
        }
        const _component = component(name, state);
        control.ref._control[name] = _component;
        _component.dataset.id = element.dataset.id;
    });

    control.fire.initialize = control;

    if (state.notify) state.notify(state.root, control);

    if (control.dataset.error) {
        control.fire.error = control;
    }

    return control;
}

function component(url, state = null) {
    const id = `component-${uuid()}`;

    const container = inline(`
        <div data-component="${id}"><div>
    `);

    (async () => {
        const control = await loadComponent(url, state);
        control.fire.willMount = control;
        while (!container.parentElement) {
            await new Promise(resolve => setTimeout(() => {}, 100));
        }
        zen(container.parentElement).ref._component[id] = control;
        control.dataset.id = id;
        control.fire.didMount = control;
        control.fire.load = control;
    })();

    return container;
}