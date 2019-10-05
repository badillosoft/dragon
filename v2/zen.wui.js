{ updateWUI(document.body) }

async function getHTML(url) {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.text();
}

async function getWUI(url) {
    let view = await getHTML(`${url}/view.html`);
    let style = `${url}/style.css`;
    if (!view) view = `
        <div class="wui-error">
            <span>
                <i class="fas fa-exclamation-triangle text-warning"></i>
                <strong>${url}</strong>
            </span>
        </div>
    `;
    return { url, view, style };
}

function updateWUI(control) {
    control.querySelectorAll("[data-control]").forEach(async rootControl => {
        if (rootControl.dataset.initilized) return;
        rootControl.dataset.initilized = true;
        const cid = rootControl.dataset.id = rootControl.dataset.id || `id-${uuid(8)}`;

        const parentControl = wui(rootControl.dataset.control);
        parentControl.soul = rootControl;
        parentControl.dataset.id = rootControl.dataset.id;
        control.ref.id[cid] = parentControl;

        const selfControl = await new Promise(resolve => { parentControl.bind.ready = resolve });
        selfControl.dataset.id = rootControl.dataset.id;
        rootControl.self = selfControl;

        rootControl.fire.ready = selfControl;

        rootControl.querySelectorAll("option").forEach(option => {
            let value = option.innerHTML;
            const mustachStart = value.search("{{") + 2;
            const mustachEnd = value.search("}}");
            if (mustachStart >= 0 && mustachEnd >= mustachStart) {
                const code = value.slice(mustachStart, mustachEnd).trim();
                console.log("code", code);
                (async () => {
                    value = await new Function("self", `return (${ code })`)(selfControl);
                    selfControl.fire[option.value] = value;
                })();
                return;
            }
            selfControl.fire[option.value] = value;
        });
    });
}

function wui(source) {
    const uid = `uid-${uuid()}`;

    const parent = inline(`
        <div data-uid=${uid} class="wui-loading p-2">
            <span class="text-secondary">
                <i class="fas fa-spinner fa-spin"></i>
                <strong>${source}</strong>
            </span>
        </div>
    `);

    (async () => {
        const { url, view, style } = await getWUI(source);

        if (!document.head.querySelector(`[data-source="${url}"]`)) {
            document.head.append(inline(`
                <link rel="stylesheet" href="${style}">
            `));
        }

        const control = inline(view);

        control.soul = parent;

        document.body.ref._uid[uid] = control;

        parent.fire.ready = control;

        updateWUI(control.parentElement);
    })();

    return parent;
}