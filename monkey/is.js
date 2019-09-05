glue("is.dom", (element, parent, id) => {
    gluer(element, `has.dom${id}`, parent);
});

glue("is.button", (element, parent, id) => {
    gluer(element, `has.dom${id}`, parent);

    listen(element, "click", event => {
        dispatch(parent, "@click", event);
    });
});

glue("is.input", (element, parent, id) => {
    gluer(element, `has.dom${id}`, parent);
    gluer(element, `has.placeholder${id}`, parent);
    gluer(element, `has.valuer${id}`, parent);

    let currentText = "";

    listen(element, "change", () => {
        currentText = element.value;
        dispatch(parent, "@change", currentText);
    });

    listen(element, "@type", text => {
        if (text !== currentText) {
            currentText = text;
            dispatch(parent, "@change", currentText);
        }
    });

    listen(element, "keydown", event => {
        dispatch(element, "@type", element.value);
        if (event.key === "Enter") {
            dispatch(parent, "@enter", element.value);
        }
    });
});