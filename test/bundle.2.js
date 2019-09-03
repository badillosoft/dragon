prototype("image", parent => {
    view(parent, `<img src="http://placehold.it/200">`);

    const img = select(parent, "img");

    listen(img, "click", () => {
        alert("hello image");
    });
});