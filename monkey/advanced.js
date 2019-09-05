prototype("monkey.button", parent => {
    view(parent, `<button>monkey button</button>`);

    const button = select(parent, "button");

    gluer(button, "is.button", parent);
});

prototype("monkey.button.test", parent => {
    const button = component("monkey.button", parent);

    dispatch(button, ":text", "hello monkey button");

    listen(button, "@click", () => {
        alert("hi there");
    });
});

prototype("monkey.input", parent => {
    view(parent, `<input type="text" placeholder="monkey input">`);

    const input = select(parent, "input");

    gluer(input, "is.input", parent);
});

prototype("monkey.input.test", parent => {
    const input = component("monkey.input", parent);

    dispatch(input, ":placeholder", "hello monkey input");

    listen(input, "@enter", () => {
        dispatch(input, "^value", text => alert(text));
    });
});