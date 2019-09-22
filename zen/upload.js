namespace("dom");

dom.upload = component(state => {
    const upload = inline(`
            <div class="custom-file">
                <input type="file" class="custom-file-input">
                <label class="custom-file-label" data-browse="select">Choose file</label>
            </div>
        `);

    const input = upload.ref.input;
    const label = upload.ref.label;

    input.id = uuid();
    label.setAttribute("for", input.id);

    input.bind.change$upload = event => {
        if (!input.files || input.files.length === 0) return;
        const [file, ...otherFiles] = input.files;
        upload.state.file = file;
        upload.state.otherFiles = otherFiles;
        label.textContent = file.name;
        upload.fire.file = file;
    };

    upload.property.disabled = {
        get() { return input.disabled },
        set(value) { input.disabled = value },
    };

    upload.state.validate = () => true;

    upload.defs.select = `select`;
    upload.defs.label = `Choose file`;
    upload.defs.invalid = `<span class="text-danger"><i class="fas fa-times-circle"></i></span> @:currentFileName`;
    upload.defs.valid = `<span class="text-success"><i class="fas fa-check-circle"></i></span> @:currentFileName`;
    upload.defs.validating = `
        <span class="text-warning"><i class="fas fa-chevron-circle-right"></i></span> @:currentFileName
    `;

    upload.bind.file$upload = async file => {
        upload.state.currentFileName = file.name;
        label.innerHTML = upload.def.validating;
        upload.state.disabled = true;
        const isValid = await upload.state.validate(file, upload.state);
        upload.state.disabled = false;
        if (!isValid) {
            label.innerHTML = upload.def.invalid;
            upload.fire.invalid = file;
            return;
        }
        label.innerHTML = upload.def.valid;
        upload.state.disabled = true;
        upload.fire.valid = file;
    };

    upload.bind.update$upload = currentState => {
        label.dataset.browse = upload.def.select;
        label.innerHTML = upload.def.label;
    };

    return upload;
});