async function post(url, data = {}) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        console.warn(await response.text());
        return {};
    }

    if (url[0] === "^") {
        return await response.text();
    }

    const json = await response.json();

    return JSON.parse(json);
}

async function gest(url, data = {}) {
    const response = await fetch(url);

    if (!response.ok) {
        console.warn(await response.text());
        return {};
    }

    if (url[0] === "^") {
        return await response.text();
    }

    const json = await response.json();

    return JSON.parse(json);
}

function clear(element) {
    // element.textContent = "";
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function uuid(n = 16, radix = 32) {
    let token = "";
    while (token.length < n) {
        token += Math.random().toString(radix).slice(2);
    }
    return token.slice(0, n);
} 