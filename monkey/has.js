glue("has.displayer", (element, parent, id) => {
    listen(parent, `:show${id}`, () => element.hidden = false);
    listen(parent, `:hide${id}`, () => element.hidden = true);
    listen(parent, `:displayer${id}`, hidden => element.hidden = !!hidden);
    listen(parent, `^displayer${id}`, callback => callback(element.hidden));
});

glue("has.enabler", (element, parent, id) => {
    listen(parent, `:enable${id}`, () => element.disabled = false);
    listen(parent, `:disable${id}`, () => element.disabled = true);
    listen(parent, `:enabler${id}`, disabled => element.disabled = !!disabled);
    listen(parent, `^enabler${id}`, callback => callback(element.disabled));
});

glue("has.texter", (element, parent, id) => {
    listen(parent, `:text${id}`, text => element.textContent = text);
    listen(parent, `^text${id}`, callback => callback(element.textContent));
});

glue("has.identifier", (element, parent, id) => {
    listen(parent, `:id${id}`, id => element.id = id);
    listen(parent, `^id${id}`, callback => callback(element.id));
});

glue("has.attributor", (element, parent, id) => {
    listen(parent, `:attribute${id}`, ([key, value]) => element.setAttribute(key, value));
    listen(parent, `^attribute${id}`, callback => callback(element.attributes));
});

glue("has.styler", (element, parent, id) => {
    listen(parent, `:style${id}`, ([key, value]) => element.style[key] = value);
    listen(parent, `^style${id}`, callback => callback(element.style));
});

glue("has.dom", (element, parent, id) => {
    gluer(element, `has.attributor${id}`, parent);
    gluer(element, `has.styler${id}`, parent);
    gluer(element, `has.identifier${id}`, parent);
    gluer(element, `has.displayer${id}`, parent);
    gluer(element, `has.enabler${id}`, parent);
    gluer(element, `has.texter${id}`, parent);
});

glue("has.valuer", (element, parent, id) => {
    listen(parent, `:value${id}`, value => element.value = value);
    listen(parent, `^value${id}`, callback => callback(element.value));
});

glue("has.placeholder", (element, parent, id) => {
    listen(parent, `:placeholder${id}`, text => element.placeholder = text);
    listen(parent, `^placeholder${id}`, callback => callback(element.placeholder));
});