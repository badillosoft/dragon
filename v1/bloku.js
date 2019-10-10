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
    const control = zen(node.firstElementChild);
    node.querySelectorAll("script").forEach(script => {
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