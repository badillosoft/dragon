// House Hack Team
// Alan Badillo Salas (badillo.soft@hotmail.com)
// https://github.com/badillosoft

// Dragon Project (dragon.js)
// A Prototype Microframework

function gluer(source, name, target) {
    const [_, basename, identifier] = name.match(/([^\(]+)((\([^\)]*\))?)/); 

    console.log(basename, identifier);

    window.glues = window.glues || {};
    if (!window.glues[basename]) {
        console.warn("invalid glue", basename);
        return;
    }
    window.glues[basename](source, target, identifier);
}

function glue(name, model) {
    window.glues = window.glues || {};
    window.glues[name] = model
    return window.glues[name];
}

function prototyper(element, name) {
    window.prototypes = window.prototypes || {};
    window.prototypes[name](element);
}

function prototype(name, model) {
    window.prototypes = window.prototypes || {};
    const base = window.prototypes[name] || (() => {});
    window.prototypes[name] = parent => {
        model(parent, base);
    };
    return window.prototypes[name];
}

function inline(model, container = null) {
    const parent = document.createElement("div");
    parent.dataset.name = name;

    if (typeof model === "function") model(parent);

    if (container instanceof HTMLElement) {
        mount(container, parent);
    }

    return parent;
}

function component(name, container = null) {
    window.prototypes = window.prototypes || {};
    
    if (!window.prototypes[name]) {
        console.warn(`invalid component ${name}`);
        return document.createElement("div");
    }

    const parent = document.createElement("div");
    parent.dataset.name = name;

    window.prototypes[name](parent);

    if (container instanceof HTMLElement) {
        mount(container, parent);
    }

    return parent;
}

function mount(target, element) {
    [...element.children].forEach(child => target.appendChild(child));
    element.$parent = target;
    dispatch(element, "#mounted", target);
    dispatch(target, "#notify", element);
    if (target.$parent) {
        mount(target.$parent, target);
    }
}

function select(element, selector, prototype = null) {
    // console.log("select", element, element.dataset.currentId, selector);
    const id = element.dataset.currentId;
    selector = selector.replace(/@/g, `[data-id="${id}"]`);
    const $prototype = document.createElement("span");
    $prototype.textContent = selector;
    prototype = prototype || $prototype;
    return element.querySelector(selector) || prototype;
}

function dispatch(element, eventName, data, source) {
    return element.dispatchEvent(new CustomEvent(eventName, { detail: { source, data } }));
}

function listen(element, eventName, handler) {
    return element.addEventListener(eventName, event => {
        const detail = event instanceof CustomEvent ? event.detail.data : event;
        handler(detail, (event.detail || {}).source);
    });
}

function transmit(source, eventNames, target) {
    eventNames = eventNames instanceof Array ? eventNames : [eventNames];
    for (let eventName of eventNames) {
        const [eventNameSource, eventNameTarget] = eventName.split(/\s*->\s*/);
        listen(source, eventNameSource, data => dispatch(target, eventNameTarget || eventNameSource, data));
    }
}

function wrapper(script) {
    const wrapperDocument = {};

    for (let key in document) {
        if (key === "currentScript") continue;
        if (typeof document[key] === "function") {
            wrapperDocument[key] = (...params) => document[key](...params);
            continue;
        }
        wrapperDocument[key] = document[key];
    }

    wrapperDocument.currentScript = script;

    return wrapperDocument;
}

function view(element, html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const node = document.importNode(template.content, true);
    [...node.children].forEach(child => {
        element.appendChild(child)
    });
    element.querySelectorAll(":scope > script").forEach(script => {
        if (script.dataset.processed) return;
        script.dataset.processed = "true";
        document.body.appendChild(script);
        // element.appendChild(script);
        new Function(
            "document",
            "parent",
            "id",
            `(async () => {
                parent.dataset.currentId = id;
                ${script.textContent}
                dispatch(parent, "#ready"); 
            })()`
        )(
            wrapper(script),
            element
        );
    });
    return element.firstElementChild;
}

async function install($source) {
    if ($source instanceof Array) {
        for (let src of $source) {
            try {
                await install(src);
            } catch (error) {
                console.warn(`error installing ${src}`, error);
            }
        }
        return;
    }

    const script = document.createElement("script");

    const scriptContent = sessionStorage.getItem(`script://${$source}`);

    if (scriptContent) {
        script.dataset.src = $source;
        document.body.appendChild(script);
        new Function("document", `((document) => { 
            ${source.toString()}

            ${scriptContent} 
        })(document)`)(wrapper(script));
        return;
    }

    script.dataset.src = $source;

    await new Promise((resolve, reject) => {
        listen(script, "load", resolve);
        listen(script, "error", reject);
        script.src = $source;
        document.body.appendChild(script);
    });

    let content = "";

    console.log(script.src);

    try {
        content = await request(script.src);
    } catch(error) {
        console.warn(error);
    }

    if (content) {
        sessionStorage.setItem(`script://${$source}`, content);
    }
    
    console.log(`installed ${$source}`);
}

async function source(sources) {
    const script = document.currentScript;
    console.log(`source ${script.dataset.src}`);
    await install(sources);
    dispatch(document, script.dataset.src);
}

async function origin(target, channels, callback) {
    const waitings = [];

    for (let channel of channels) {
        listen(target, channel, () => {
            waitings.push(channel);
            if (channels.every(ch => waitings.indexOf(ch) >= 0)) {
                callback(waitings);
            }
        });
    }

    await install(channels);
}