namespace("dom");
namespace("dom.addons");

dom.addons.inputTyping = input => {
    let lastText = uuid();
    let isTyping = false;
    let idTyping = null;
    let typingStart = 0;
    let typingEnd = 0;

    input.bind.keydown$inputTyping = event => {
        if (input.supress.inputTyping) return;
        if (event.key === "Tab" || event.key === "Shift" || event.key === "Control") return;
        if (isTyping || input.value === lastText) return;
        if (idTyping) clearTimeout(idTyping);
        isTyping = true;
        typingStart = new Date();
        input.fire.typingStart = input.value;
    };
    input.bind.keyup$inputTyping = () => {
        if (input.supress.inputTyping) return;
        if (!isTyping) return;
        if (idTyping) clearTimeout(idTyping);
        idTyping = setTimeout(() => {
            isTyping = false;
            idTyping = null;
            typingEnd = new Date();
            lastText = uuid();
            input.fire.typingEnd = input.value;
        }, input.state.typingTime || 500);
        lastText = input.value;
    };

    Object.defineProperty(input.state, "isTyping", { get() { return isTyping } });
    Object.defineProperty(input.state, "typingElapsed", {
        get() {
            if (typingEnd < typingStart) return Number(new Date() - typingStart);
            return Number(typingEnd - typingStart);
        }
    });
};

dom.addons.inputEnter = input => {
    input.bind.keydown$inputEnter = event => {
        if (input.supress.inputEnter) return;
        if (event.key === "Enter") input.fire.enter = input.value;
    };
};

dom.addons.inputEscape = input => {
    input.bind.keydown$inputEscape = event => {
        if (input.supress.inputEscape) return;
        if (event.key === "Escape") input.fire.escape = input.value;
    };
    input.bind.escape$inputEscape = () => {
        if (input.supress.inputEscapeClear) return;
        input.value = "";
    };
};

dom.input = component(state => {
    const input = inline(`<input class="form-control" placeholder="text...">`);

    dom.addons.inputTyping(input);
    dom.addons.inputEnter(input);
    dom.addons.inputEscape(input);

    return input;
});

dom.addons.inputFieldText = inputField => {
    inputField.bind.text = async text => {
        if(inputField.supress.inputFieldText) return;
        if (!inputField.state.validate) return;
        const isValid = await inputField.state.validate(text);
        inputField.state.buttonDisabled = !isValid;
    };
};

dom.addons.inputFieldAccept = inputField => {
    inputField.bind.accept = async text => {
        if(inputField.supress.inputFieldAccept) return;
        if (!inputField.state.confirm) return;
        const isButtonDisabled = inputField.state.buttonDisabled;
        const isInputDisabled = inputField.state.inputDisabled;
        inputField.state.inputDisabled = true;
        inputField.state.buttonDisabled = true;
        inputField.state.status = "confirm:before";
        const isConfirmed = await inputField.state.confirm(text);
        inputField.state.status = "confirm:after";
        inputField.state.inputDisabled = isInputDisabled;
        inputField.state.buttonDisabled = isButtonDisabled;
        if (!isConfirmed) {
            inputField.state.status = "unconfirm";
            inputField.fire.unconfirm = text;
            return;
        }
        inputField.state.inputDisabled = true;
        inputField.state.buttonDisabled = true;
        inputField.fire.confirm = text;
        inputField.state.status = "confirm";
    };
};

dom.addons.inputFieldDefaultState = inputField => {
    inputField.state.confirm = text => {
        inputField.dataset.text = text;
        return true;
    };
    inputField.state.validate = text => { return !!text };
    inputField.defs = {
        "confirm:before": `<span class="text-warning"><i class="fas fa-chevron-circle-right"></i></span>`,
        "confirm:after": "",
        "confirm": `<span class="text-success"><i class="fas fa-check-circle"></i></span>`,
        "unconfirm": `<span class="text-danger"><i class="fas fa-times-circle"></i></span>`,
    };
};

dom.inputField = component(state => {
    const inputField = inline(`
        <div class="d-flex flex-column p-2">
            <div class="d-flex align-items-center" data-rel="header" hidden>
                <label class="label mr-2">Field title</label>
                <span class="text-primary" hidden>...</span>
            </div>
            <div class="input-group mb-3">
                <input >
                <datalist></datalist>
                <div class="input-group-append">
                    <button class="btn btn-primary" disabled>confirm</button>
                </div>
            </div>
        </div>
    `);

    const header = inputField.ref._rel.header;
    const label = inputField.ref.label;
    const span = inputField.ref.span;
    const button = inputField.ref.button;
    const datalist = inputField.ref.datalist;

    const input = inputField.ref.input = dom.input(null, state.input);
    
    datalist.id = uuid();
    input.setAttribute("list", datalist.id);

    input.id = uuid();
    label.setAttribute("for", input.id);

    button.bind.click$inputField = () => { inputField.fire.accept = input.value };
    input.bind.enter$inputField = () => { if (!button.disabled) inputField.fire.accept = input.value };

    input.bind.keydown$inputField = () => { 
        inputField.state.selectedItem = "";
        inputField.fire.text = uuid();
    };
    input.bind.escape$inputField = () => { 
        inputField.state.selectedItem = "";
        inputField.fire.text = uuid();
    };
    input.bind.keyup$inputField = () => { inputField.fire.text = input.value };
    input.bind.typingStart = event => {
        span.hidden = false;
        inputField.fire.typingStart = event;
    };
    input.bind.typingEnd = event => {
        span.hidden = true;
        inputField.fire.typingEnd = event;
    };

    dom.addons.inputFieldText(inputField);
    dom.addons.inputFieldAccept(inputField);

    dom.addons.inputFieldDefaultState(inputField);

    inputField.property.label = { 
        get() { return label.textContent },
        set(value) { 
            if (value) header.hidden = false;
            inputField.dataset.label = value;
            label.textContent = value;
        }
    };

    inputField.property.buttonLabel = { 
        get() { return button.textContent },
        set(value) { button.textContent = value }
    };
    inputField.property.buttonDisabled = { 
        get() { return button.disabled },
        set(value) { button.disabled = value }
    };
    
    inputField.property.text = { 
        get() { return input.value },
        set(value) { 
            input.value = value;
            inputField.fire.text = value;
        }
    };
    inputField.property.placeholder = { 
        get() { return input.placeholder },
        set(value) { input.placeholder = value }
    };
    inputField.property.inputDisabled = { 
        get() { return input.disabled },
        set(value) { input.disabled = value }
    };

    inputField.property.status = {
        set(status) {
            const text = inputField.dataset.label;
            const message = inputField.defs[status];
            if (message) return label.innerHTML = `${text} ${message}`;
            label.textContent = text;
        }
    };

    inputField.property.list = {
        set(list) {
            if (!list) return;
            inputField.state.currentList = list;
            clear(datalist);
            if (list instanceof Array) {
                for (let item of list) {
                    let option = inline(`<option>${item}</option>`);
                    datalist.append(option);
                }
                return;
            }
            for (let [key, value] of Object.entries(list)) {
                let option = inline(`<option value="${key}">${value}</option>`);
                datalist.append(option);
            }
        }
    };

    input.bind.change$inputField = () => {
        inputField.state.selectedItem = "";
        inputField.fire.text = uuid();
        if (!inputField.state.currentList) return;
        const value = input.value;
        const list = inputField.state.currentList;
        if (list instanceof Array) {
            for (let item of list) {
                if (`${item}` === value) {
                    inputField.state.selectedItem = item;
                    inputField.fire.item = item;
                    inputField.fire.text = item;
                }
            }
            return;
        }
        for (let [key, item] of Object.entries(list)) {
            if (`${key}` === value) {
                inputField.state.selectedItem = item;
                inputField.fire.item = key;
                inputField.fire.text = key;
            }
        }
    };

    return inputField;
});