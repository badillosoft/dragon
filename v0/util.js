// House Hack Team
// Alan Badillo Salas (badillo.soft@hotmail.com)
// https://github.com/badillosoft

// Util Project (util.js)
// A Utilities for DOM

async function request(url, data = null) {
    // let html = localStorage.getItem(url);

    // if (html) return html;
    let options = null;

    if (data) {
        options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    }

    const response = await fetch(url.replace(/^\^/, ""), options);

    if (!response.ok) {
        // console.warn(await response.text());
        return "";
    }

    if (url[0] === "^") {
        return await response.json();
    }

    html = await response.text();

    // localStorage.setItem(url, html);

    return html;
}

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
    while (element.firstChild) {
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

function month_year() {
    const date = new Date();
    const month = `${date.getMonth() + 1}`;
    const year = `${date.getFullYear()}`.slice(2);
    return `${month < 10 ? `0${month}` : month}${year}`;
}