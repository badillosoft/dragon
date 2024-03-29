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
{ zen(window) }
{ zen(document) }
{ zen(document.body) }
{ zen(document.head) }

function zen(node) {
    if (!node) return;

    node.supress = node.supress || {};

    node.state = node.state || {};

    node.watcher = new Proxy(node, {
        set(node, name, watcher) {
            if (node.state.self.$dead) return;
            node.state["@watchers"] = node.state["@watchers"] || {};
            node.state["@watchers"][name] = node.state["@watchers"][name] || [];
            node.state["@watchers"][name].push(watcher);
            // console.log(node.state["@watchers"][name]);
        }
    });

    node.watch = new Proxy(node, {
        set(node, name, data) {
            // if (!document.body.ref._component[node.state.self.dataset.component]) {
            //     delete node.state["@watchers"];
            //     console.warn("node is dead", node);
            //     return;
            // }
            if (node.state.self.$dead) return;
            // console.log("watch", node, node.state, name, data);
            node.state[name] = data;
            node.state["@watchers"] = node.state["@watchers"] || {};
            node.state["@watchers"][name] = node.state["@watchers"][name] || [];
            // console.log(node.state["@watchers"][name]);
            for (let watcher of node.state["@watchers"][name]) watcher(data, name, state, node);
            node.fire[name] = data;
        }
    });

    node.state.root = node.state.root || node;
    node.state.self = node;

    node.defs = node.defs || {};

    node.def = new Proxy(node, {
        get(node, name) {
            return (node.defs[name] || "").trim().replace(/@:[\w-_.]+/g, w => {
                return node.state[w.replace("@:", "")];
            });
        }
    });

    node.property = new Proxy(node, {
        set(node, name, descriptor) {
            descriptor.configurable = true;
            Object.defineProperty(node.state, name, descriptor)
        }
    });

    node.bindings = node.bindings || {};

    node.bind = node.bind || new Proxy(node, {
        get(target, channel) { return target.bindings[channel] },
        set(target, channel, handler) {
            const eventName = channel.replace(/\$.*/, "");
            if (target.bindings[channel]) target.removeEventListener(eventName, target.bindings[eventName]);
            target.bindings[channel] = event => {
                handler.call(node, event instanceof CustomEvent ? event.detail : event);
            };
            target.addEventListener(eventName, target.bindings[channel]);
        }
    });

    node.fire = node.fire || new Proxy(node, {
        set(node, eventName, event) {
            const dispatcher = new CustomEvent(eventName, {
                detail: event instanceof CustomEvent ? event.detail : event
            });
            node.dispatchEvent(dispatcher);
            // console.log("fire", eventName, node, node.soul, node.ether)
            if (node.soul) node.soul.fire[eventName] = event;
            if (node.state.root && node !== node.state.root) node.state.root.dispatchEvent(dispatcher);
        }
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
                if (!element) return;
                const parent = zen(element.parentNode);
                zen(element).fire.remove = { target, parent };
                element.parentNode.removeChild(element);
                return;
            }
            const origin = target.ref[selector];
            if (!origin) return;
            const parent = zen(origin.parentNode);
            zen(origin).fire.remove = { target, parent };
            parent.replaceChild(element, origin);
            element.fire.mount = { target, parent };
        },
    });
    return node;
}

function inline(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    const parent = document.importNode(template.content, true);
    const node = zen(parent.firstElementChild);
    parent.querySelectorAll("script").forEach(script => {
        let source = node;
        let sourceId = script.dataset.source || "*";
        if (sourceId !== "*") source = node.ref.id[sourceId];
        const ids = [...node.querySelectorAll("[data-id]")].map(element => element.dataset.id);

        const handler = new Function("node", "script", `
            return (event, scope = {}) => (
                (
                    control, self,
                    { ref, bind, watch, fire }, 
                    { ${ ids.join(", ") } },
                    ${ script.dataset.key || "input" }
                ) => {
                    (async () => {
                        ${ script.innerHTML }
                        if (scope.resolve) scope.resolve();
                    })();
                }
            )(node.self || node, node.self || node, node, node.ref.id, event);
        `)(node, script);

        if (script.dataset.scope) {
            source.bind[script.dataset.scope] = async event => {
                if (typeof event === "object" && event["@scoped"]) return;
                event["@scoped"] = true;
                let aborted = false;
                await new Promise(resolve => {
                    handler(event, {
                        event,
                        cancel() {
                            aborted = true;
                        },
                        resolve
                    });
                })
                if (!aborted) source.fire.click = event;
            };
            
        }
        if (script.dataset.bind) {
            source.bind[script.dataset.bind] = handler;
        }
    });
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
    return parts;
}

function assign(source, target) {
    Object.entries(source).forEach(([key, value]) => target[key] = value);
}

function define(state, initialState) {
    Object.entries(initialState).forEach(([key, value]) => state[key] = value);
}