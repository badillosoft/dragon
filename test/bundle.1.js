prototype("button", parent => {
    view(parent, `<button>test</button>`);

    const button = select(parent, "button");

    listen(button, "click", () => {
        alert("hello button");
    });
});