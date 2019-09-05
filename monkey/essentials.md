# Fundamentos del Framework **Dragon.js**

## Definir la vista (contenido) de un elemento DOM

Un componente es un elememento DOM (una etiqueta HTML virtual) que puede contener otros elementos
DOM como hijos. Por ejemplo, un botón (button), una imagen (img), una caja de texto (input), etc.

El elemento DOM puede ser creado a partir de document.createElement(tagName) o recurperado
desde la interfaz HTML mediante document.querySelector o element.querySelector en general.

El framework **dragon.js** permite definir los elementos hijos en un elemento DOM 
mediante una plantilla HTML usando la función `view(element, HTMLTemplate)`.

La función `view(element, html)` carga todos los elementos del HTML como elementos DOM
y se los transfiere al elemento `element` de tal forma que agrega como hijos los elementos
DOM extraídos de la plantilla.

> Ejemplo: Crea un elemento div y agrega un H1 con texto definido.

``` js
const element = document.createElement("div");

view(element, `<h1>Hola mundo</h1>`);
```

> Ejemplo: Agregar múltiples vistas a un mismo elemento.

```js
const element = document.createElement("div");

view(element, `
    <h1>Title App</h1>
    <h2>Description App</h2>
`);

view(element, `<br>`);
view(element, `<br>`);
view(element, `<br>`);

view(element, `
    <p>This is a paragraph.</p>
    <p>This is another paragraph.</p>
`);

view(element, `<a href="#">This is a repeated link</a>`.repeat(10));
```

## Buscar o recuperar sub-elementos dentro de un elemento DOM

La función `select(element, query)` nos permite recuperar el primer elemento DOM contenido dentro de
`element` si concuerda con el `query` que sigue las reglas de `document.querySelector`, es decir,
las búsquedas de elementos mediante selectores. Si el elemento no existe o no se encuentra se
devolverá un elemento virtual sin significado y no montado.

> Ejemplo: Definir una vista que contenga un botón y recuperarlo.

``` js
const element = document.createElement("div");

view(element, `<button>Hello world</button>`);

const button = select(element, "button");
```

> Ejemplo: Definir múltiples `<span>` y recuperar uno por uno.

``` js
const element = document.createElement("div");

view(element, `
    <span>This is the span one</span>
    <span>This is the span two</span>
    <span>This is the span three</span>
    <span>This is the span four</span>
`);

const span1 = select(element, "span:nth-of-type(1)");
const span2 = select(element, "span:nth-of-type(2)");
const span3 = select(element, "span:nth-of-type(3)");
const span4 = select(element, "span:nth-of-type(4)");
```

> Ejemplo: Definir un formulario de login y recuperar sus elementos.

``` js
const element = document.createElement("div");

view(element, `
    <form>
        <input type="text" placeholder="Username" data-rel="username">
        <input type="password" placeholder="Password" data-rel="password">
        <button>Login</button>
    </form>
`);

const inputUser = select(element, "input[data-rel='username']");
const inputPassword = select(element, "input[data-rel='password']");
const buttonLogin = select(element, "button");
```

## Manejo de eventos sobre elementos DOM

Los elementos DOM generan eventos mediante `element.dispatchEvent(event)` los cuales pueden ser recuperados usando `element.addEventListener(eventName, callback)`. Sin embargo, estas funciones son díficiles de operar para transmitir eventos genéricos, por eso en **dragon.js** se diseñaron las funciones `dispatch(element, data)` y `listen(element, eventName, callback)`. Las cuáles permiten emitir y escuchar respectivamente eventos genéricos y propios. 

> Ejemplo: Crear un botón y escuchar su evento `click`.

``` js
const button = document.createElement("button");

button.textContent = "touch me!".

listen(button, "click", event => {
    console.log("button click", button, event);
    alert("Clicked");
});
```

Cuándo los eventos son reservados de DOM como `click`, `mouseover`, `keydown`, etc. Usamos la convención de operarlos directamente con el mismo nombre, en otro caso, si el evento se trata de un evento de entrada (desde fuera del componente hacia el componente) decimos que se trata de una instrucción externa y convenimos anteponer `:` (signo de dos puntos) antes del nombre del evento, por ejemplo, `:text` significaría que el componente tiene que ajustar su texto y se espera que el dato de entrada sea un texto.

> Ejemplo: Escuchar el evento `:text` en una caja de texto.

``` js
const input = document.createElement("input");

listen(input, ":text", text => input.value = text);

// Después de 2 segundos enviar el texto `hello` hacia el input
setTimeout(() => {
    dispatch(input, ":text", "hello");
}, 2000);
```

Otra convención es que los eventos que se generan dentro del componente y van fuera del componente se conviene que empiezan con el prefijo `@` (signo arroba).

> Ejemplo: Escuchar el evento natural `keydown` en una caja de texto y emitir el evento `@enter` cuándo pulsen la tecla `Enter` con el dato `input.value` como parámetro.

``` js
const input = document.createElement("input");

listen(input, "keydown", event => {
    if (event.key === "Enter") dispatch(input, "@enter", input.value);
});

listen(input, "@enter", text => alert(text));
```

Una convención más es que cuándo se emite un evento con un callback como parámetro, entonces se dice que la emisión debe ser bidireccional, ya que al despachar el evento mandamos una función para que nos devuelva la respuesta o el resultado de la emisión, entonces usamos el prefijo `^` (signo de gorro o exponente tradicional).

> Ejemplo: Crear una caja `<div>` que emita una pregunta al usuario cada que se emita el evento `^question` recibiendo un callback como parámetro el cuál tenemos que mandar a llamar cuándo el usuario conteste.

``` js
const div = document.createElement("div");

listen(div, `^question`, callback => {
    const answer = prompt("What is your name?");

    callback(answer);
});

dispatch(div, "^question", answer => {
    alert(`Hi ${answer}`);
});
```

## Crear un prototipo para un componente reusable

Los protipos son la forma central de crear componentes complejos en **dragon.js**. Un prototipo es creado mediante la función `prototype(name, model)` la cuál recibe un nombre (`name`) o identificador único para usar ese protipo en un componente y `model` que es una función que recibe el elemento DOM que será alterado o protipado. La acción de prototipar significa *seguir construyendo un elemento*, es decir, al mandar a llamar un prototipo, le agregará funcionalidad (nuestra filosofía es la **construcción aditiva**, es decir, siempre seguir añadiendo o construyendo). 

> Ejemplo: Definir un prototipo que agregue una caja de texto y un botón al elemento principal (`parent`).

``` js
prototype("submit", parent => {

    view(parent, `
        <input placeholder="Type a message"><button>send<button>
    `);

});
```

> En el ejemplo anterior, el prototipo recibe cualquier elemento DOM y le agrega la vista como contenido.

Entonces, podemos definir prototipos para que realicen una o varias de las siguientes tareas para crear componentes (piezas de software).

* Agregar o definir la vista del elemento.
* Buscar sub-elementos dentro del elemento para conectar sus eventos con el elemento.
* Escuchar o emitir eventos sobre el elemento o su hijo.
* Controlar un estado, variables y comuniciones hacia un API.
* Manipular el estado local, el estado de sesión o las API del dispositivo.

Con estas tareas podemos comenzar a definir prototipos para generar aplicaciones complejas.

## Crear componentes a partir de prototipos

Para utilizar un componente debemos crear o disponer de un contenedor y usar la función `component(name, container)` dónde `name` es el nombre del prototipo y `container` es un elemento DOM que será simulado como el padre (`parent` dentro del prototipo).

> Ejemplo usar el prototipo `submit` como componente.

``` js
const container = document.createElement("div");

const submit = component("submit", container);
```

Los componentes están aislados y la única forma de acceder a sus eventos y datos es a tráves de la variable devuelta por `component(...)`, la cuál es una etiqueta DOM virtual que no contiene hijos (ya que se los transfirió a `parent`), pero que es capaz de mandarle los eventos a sus antiguos hijos.

En el siguiente ejemplo vamos a definir un prototipo para un botón que al recibir el evento click emita dicho evento a su `parent`, para demostrar que los elementos prototipados están aislados (es decir, no se pueden interceptar ni confundir sus eventos con otros componentes en el mismo padre y con el mismo prototipo).

``` js
prototype("button", parent => {
    view(parent, `<button>hi</button>`);
    const button = select(parent, "button");
    listen(button, "click", event => dispatch(parent, "@click", event));
});

const container = document.createElement("div");

const button1 = component("button", container);
const button2 = component("button", container);
const button3 = component("button", container);

listen(button1, "@click", () => alert(`button 1 click`));
listen(button2, "@click", () => alert(`button 2 click`));
listen(button3, "@click", () => alert(`button 3 click`));
listen(container, "@click", () => alert(`container click?`)); // no existe
```

## Ejercicios

**Ej.1** Deninir un prototipo que le agregue un botón al `parent` y que escuche en `parent` los siguientes eventos:

* `:text` - cambia el `textContent` del botón. **Hint** `listen(parent, ":text", text => button.textContent = text)`.
* `:disable` - deshabilita el botón con la propiedad `disabled`.
* `:enable` - habilita el botón con la propiedad `disabled`.

**Ej.2** Definir el prototipo `input` que le agregue una caja de texto al `parent` y que en el `parent` escuche el evento `@enter` como en los ejemplos de las notas y el evento `:value` que ajuste el valor de la caja de texto. 

**Ej.3** Definir otro prototipo llamado `inputreverse` que agregue dos componentes input (`component("input", parent)`) sobre el `parent`. Ligar el evento `@enter` del primer `input` para emitir el evento `:value` en el segundo `input` usando el texto de `@enter` al revés para pasarsélo al segun input mediante `:value`. En pocas pocas palabras, cuándo le den `Enter` a la primer caja pasarle el texto al revés a la segunda caja mediante los eventos `@enter` y `:value` definidos en (**Ej.2**).

**Ej.4** Definir un prototipo que recupere una lista de usuarios desde el api `https://randomuser.me/api?results=10` y agruege los datos de cada usuario en una tarjeta de presentación. Nota: La tarjeta debe ser un componente independiente. Puedes utilizar la función `fetch` que es asíncrona (investiga el uso de promesas y funciones asíncronas) para obtener los resultados, no puedes utilizar `ajax` ni `jquery` sólo `fetch` (investiga sobre la función `fetch` nativa en `ECMAScript2015` o `ES6`).