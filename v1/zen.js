/**
 * zen.js - DOM Micro Library
 * 
 * Alan Badillo Salas (badillo.soft@hotmail.com)
 * 
 * https://github.com/badillosoft/zen
 * 
 * version 1.0
 * 
 */

{ window.dom = {} }
{ window.dom.addons = {} }
{ zen(document.body) }

function zen(node) {
    if (!node) return;

    node.supress = node.supress || {};

    node.state = node.state || {};
    node.defs = node.defs || {};

    node.def = new Proxy(node.state, {
        get(state, name) {
            return (node.defs[name] || "").trim().replace(/@:[\w-_.]+/g, w => {
                return state[w.replace("@:", "")];
            });
        }
    });

    node.property = new Proxy(node.state, {
        set(state, name, descriptor) { Object.defineProperty(state, name, descriptor) }
    });

    node.bindings = node.bindings || {};

    node.bind = node.bind || new Proxy(node, {
        get(target, channel) { return target.bindings[channel] },
        set(target, channel, handler) {
            const eventName = channel.replace(/\$.*/, "");
            if (target.bindings[channel]) target.removeEventListener(eventName, target.bindings[eventName]);
            target.bindings[channel] = event => {
                handler(event instanceof CustomEvent ? event.detail : event);
            };
            target.addEventListener(eventName, target.bindings[channel]);
        },
    });

    node.fire = node.fire || new Proxy(node, {
        set(target, eventName, event) { target.dispatchEvent(new CustomEvent(eventName, { 
            detail: event instanceof CustomEvent ? event.detail : event
        })) },
    });

    node.ref = node.ref || new Proxy(node, {
        get(target, selector) {
            if (selector === "id") selector = "_id";
            if (selector.match(/^_/)) return new Proxy(target, {
                get(_, name) { return target.ref[`[data${selector.replace(/_/g, "-")}="${name}"]`] },
                set(_, name, element) { target.ref[`[data${selector.replace(/_/g, "-")}="${name}"]`] = element }
            });
            selector = selector.replace(/\$[\w_]+/g, w => w.replace("$", ".").replace(/_/g, "-").toLowerCase());
            return zen(target.querySelector(selector)) || console.warn(
                `[zen.js error] selector (${selector}) not found`
            );
        },
        set(target, selector, element) {
            if (!element) {
                element = target.ref[selector];
                if(element) element.parentNode.removeChild(element);
                return;
            }
            const origin = target.ref[selector];
            if (!origin) return;
            origin.parentNode.replaceChild(element, origin);
        },
    });
    return node;
}

function component(builder) {
    return (container = null, state = {}) => {
        const control = builder(state);

        for (let [key, value] of Object.entries(state)) {
            if (key === "defs") {
                Object.assign(control.defs, value);
                continue;
            }
            control.state[key] = value;
        }

        if (container) zen(container).appendChild(control);

        control.fire.update = control.state;

        return control;
    };
}

function inline(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const node = document.importNode(template.content, true).firstChild;
    zen(node);
    return node;
}

function clear(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function uuid(n = 16, radix = 32) {
    let token = "";
    while (token.length < n) {
        token += Math.random().toString(radix).slice(2);
    }
    return token.slice(0, n);
}

function namespace(name) {
    const parts = name.split(".");
    let root = window;
    for (let part of parts) {
        root = root[part] = root[part] || {};
    }
};