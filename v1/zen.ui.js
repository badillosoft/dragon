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

async function loadComponent(base, name) {
    base = base.replace(/\/?$/, () => "/");

    const parts = namespace(name);
    // namespace(`${name}.properties`);
    // namespace(`${name}.bindings`);

    const path = parts.join("/");

    const view = await requestText(`${base}${path}/view.html`);
    
    const styleLink = inline(`<link data-ns="${name}" rel="stylesheet" href="${base}${path}/style.css">`);

    // const properties = await requestText(`${base}${path}/properties.html`);
    const logic = await requestText(`${base}${path}/logic.html`);

    const scripts = inline(`<div>${logic}</div>`);

    if (!document.head.querySelector(`[data-ns="${name}"]`)) document.head.append(styleLink);

    const control = inline(view || `<span data-error="true" class="text-danger">${name}</span>`);

    control.dataset.name = name;

    let model = window;

    for (let part of parts) model = model[part];

    const state = await requestJSON(`${base}${path}/state.json`);
    
    const defs = await requestJSON(`${base}${path}/translate.json`);
    
    define(control.defs, defs);

    scripts.querySelectorAll("script").forEach(script => {
        if (script.dataset.property) {
            const name = script.dataset.property;
            const descriptor = new Function("control", `
                return ((control, { state, ref, def, bind, fire }) => {
                    const property = { 
                        get() { console.warn("deprecated set") }, 
                        set(value) { console.warn("deprecated set") } 
                    };

                    const get = callback => property.get = callback;
                    const set = callback => property.set = callback;

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
                        return (...params) => (({ state, ref, def, bind, fire }, event, input, ...params) => {
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

    define(control.state, state);

    control.fire.initialize = control;

    if (control.dataset.error) {
        control.fire.error = control;
    }

    return control;
}

function component(base, name) {
    const id = `component-${uuid()}`;

    const container = inline(`
        <div data-id="${id}"><div>
    `);

    (async () => {
        const control = await loadComponent(base, name);
        control.fire.willMount = control;
        while (!container.parentElement) {
            await new Promise(resolve => setTimeout(() => {}, 100));
        }
        zen(container.parentElement).ref.id[id] = control;
        control.dataset.id = id;
        control.fire.didMount = control;
        control.fire.load = control;
    })();

    return container;
}