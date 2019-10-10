window.modes = ["primary", "secondary", "success", "warning", "danger", "info", "dark", "light"];

window.tags = [
    "a", "abbr", "acronym", "address", "applet", "area", "article", "aside",
    "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote",
    "body", "br", "button", "canvas", "caption", "center", "cite", "code",
    "col", "colgroup", "data", "datalist", "dd", "del", "details", "dfn",
    "dialog", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption",
    "figure", "font", "footer", "form", "frame", "frameset", "h1", "head",
    "header", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "label",
    "legend", "li", "link", "main", "map", "mark", "meta", "meter", "nav",
    "noframes", "noscript", "object", "ol", "optgroup", "option", "output",
    "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s",
    "samp", "script", "section", "select", "small", "source", "span", "strike",
    "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td",
    "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr",
    "track", "tt", "u", "ul", "var", "video", "wbr"
];

function bloku_template(name) {
    const template = document.body.ref._template[name];
    const node = document.importNode(template.content, true);

    const defaultScript = document.createElement("script");
    defaultScript.dataset.prototype = "page dom";
    node.append(defaultScript);
    // console.log(node);

    let control = zen(node.firstElementChild);
    const scripts = [...node.querySelectorAll("script")];

    if (control.tagName === "script") {
        scripts.unshift(control);
        control = null;
    }

    const newScripts = [];
    scripts.forEach(script => {
        if (script.dataset.processed) return;
        if (script.dataset.prototype) {
            script.dataset.processed = true;
            for (let protoName of script.dataset.prototype.split(/\s+/)) {
                const protoTemplate = document.body.ref._prototype[protoName];
                const protoNode = document.importNode(protoTemplate.content, true);
                newScripts.push(...protoNode.querySelectorAll("script"));
            }
        }
    });
    [...node.childNodes]
        .filter(node => node instanceof Comment)
        .filter(comment => comment.textContent.match(/@prototype:\s*[^\s]+/))
        .forEach(comment => {
            const [_, name] = comment.textContent.match(/@prototype:\s*([^\s]+)/);
            const protoTemplate = document.body.ref._prototype[name];
            const protoNode = document.importNode(protoTemplate.content, true);
            newScripts.push(...protoNode.querySelectorAll("script"));
        });
    [...newScripts, ...scripts].forEach(script => {
        if (script.dataset.processed) return;
        script.dataset.processed = true;
        const parent = zen(script.parentElement || control);
        const code = `
            (async () => { 
                ${script.innerHTML
                .replace(/document.currentScript/g, "script")
                .replace(/script.parentElement/g, "parent")} 
            })()`;
        new Function(
            "root",
            "parent",
            "self",
            "control",
            "script",
            code
        )(control, parent, parent, self, script);
    });
    return control;
}

async function bloku_import(url) {
    url = url.replace(/\.html\s*$/, "");

    document.body.state.urls = document.body.state.urls || {};

    if (document.body.state.urls[url]) return;

    document.body.state.urls[url] = true;

    const response = await fetch(`${url}.html`);
    if (!response.ok) return;
    const html = await response.text();
    const template = document.createElement("template");
    template.innerHTML = html;
    const node = document.importNode(template.content, true);
    const templates = [];
    [...node.querySelectorAll("template")].map(zen).forEach(template => {
        if (!template.dataset.prototype) {
            template.dataset.template = template.dataset.template || url;
        }
        template.dataset.url = url;
        document.body.append(template);
    });
    // await bloku_register(document.body);
}

async function bloku_register(root) {
    const imports = [];

    [...root.childNodes]
        .filter(node => node instanceof Comment)
        .filter(comment => comment.textContent.match(/@import:\s*[^\s]+/))
        .forEach(comment => {
            const [_, url] = comment.textContent.match(/@import:\s*([^\s]+)/);
            imports.push(url);
            console.log(comment);
            comment.remove();
        });
    
    await Promise.all(imports.map(async url => {
        await bloku_import(url);
    }));

    await Promise.all(
        [...root.querySelectorAll("template")].map(async template => {
            const node = document.importNode(template.content, true);
            // console.log([...node.childNodes]);
            await bloku_register(node);
        })
    );
}

{
    (async () => {
        while (document.readyState !== "complete") {
            // console.warn("wating...");
            await new Promise(r => setTimeout(r, 100));
        }
        await bloku_register(document.body);
        document.fire.import = "success";
        const main = bloku_template("main");
        document.body.append(main);
        // await bloku_register(main);
        main.notify = document.body;
    })();
}