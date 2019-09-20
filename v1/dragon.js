/** 
 * dragon.js
 * Author: Alan Badillo Salas (badillo.soft@hotmail.com)
 * Github: https://github.com/badillosoft
 * 
 * Derechos reservados (C) 2019
 * 
 * Microframework DOM Library
 * version 1.0
 * 
*/

function create(tag) {
    return document.createElement(tag);
}

function template(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return document.importNode(template.content, true);
}

function append(parent, node) {
    [...node.children].forEach(child => {
        child.$node = node;
        child.$parent = parent;
        parent.appendChild(child)
    });
}

function prepend(parent, node) {
    [...node.children].forEach(child => {
        child.$node = node;
        child.$parent = parent;
        parent.prepend(child)
    });
}

function remove(parent, node) {
    [...parent.children].forEach(child => {
        if (child.$node === node) {
            node.appendChild(child);
        }
    });
}

function view(parent, html, pusher = append) {
    const node = template(html);
    const first = node.firstElementChild;
    pusher(parent, node);
    return first;
}

function mount(container, parent, pusher = append) {
    pusher(container, parent);
    // if (container.$parent) mount(container.$parent, container);
}

function unmount(container, parent, unpusher = remove) {
    // if (container.$parent) unmount(container.$parent, container);
    unpusher(container, parent);
}

function select(parent, selector) {
    return parent.querySelector(selector) || create("div");
}

function dispatch(parent, eventName, data, source) {
    return parent.dispatchEvent(new CustomEvent(eventName, { detail: { source, data } }));
}

function listen(parent, eventName, handler) {
    const suscriber = event => {
        const detail = event instanceof CustomEvent ? event.detail.data : event;
        handler(detail, (event.detail || {}).source);
    };
    parent.addEventListener(eventName, suscriber);
    return () => {
        parent.removeEventListener(eventName, suscriber);
    };
}

function transmit(source, eventNames, target) {
    eventNames = eventNames instanceof Array ? eventNames : [eventNames];
    const unsubscribers = {};
    for (let eventName of eventNames) {
        const [eventNameSource, eventNameTarget] = eventName.split(/\s*->\s*/);
        unsubscribers[eventName] = listen(source, eventNameSource, data =>
            dispatch(target, eventNameTarget || eventNameSource, data)
        );
    }
    return unsubscribers;
}

function classOf(object) {
    if (object === true) return "True";
    if (object === false) return "False";
    if (object === undefined || object === null) return "Null";
    if (
        typeof object === "object" &&
        object.constructor &&
        object.constructor.name
    ) return object.constructor.name;
    return (Function.prototype.call.bind(Object.prototype.toString))(object).match(/\[\w+\s(\w+)\]/)[1];
}

function merge(origin, partial) {
    if (classOf(origin) !== "Object") {
        console.warn("[dragon.js merge] invalid origin", origin);
        return;
    }
    if (classOf(partial) !== "Object") {
        console.warn("[dragon.js merge] invalid partial", partial);
        return;
    }
    let notify = false;
    for (let [key, value] of Object.entries(partial)) {
        // console.log(key, value);

        if (classOf(value) === "Object") {
            if (classOf(origin[key]) !== "Object") origin[key] = {};
            notify = merge(origin[key], value) || notify;
            continue;
        }
        if (origin[key] === value) continue;
        // console.log("notify", key, origin[key], value);
        // origin[key] = value;
        notify = true;
    }
    Object.defineProperties(origin, Object.getOwnPropertyDescriptors(partial));
    return notify;
}

function assign(origin, partial) {
    // if (classOf(origin) !== "Object") {
    //     console.warn("[dragon.js assing] invalid origin", origin);
    //     return;
    // }
    // if (classOf(partial) !== "Object") {
    //     console.warn("[dragon.js assing] invalid partial", partial);
    //     return;
    // }
    for (let [key, value] of Object.entries(partial)) origin[key] = value;
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