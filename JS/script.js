// Contador de notas
let contadorNota = 0;
// Añadimos al botón "crearNota" el evento de crear nota
document.getElementById("crearNota").addEventListener("click", crearNota);
// Añadimos al botón "eliminarNotas" el evento de eliminar todas las notas
document.getElementById("eliminarTodo").addEventListener("click", eliminarTodasNotas);

/* Función editarNota()
¿Qué hace? --> Creamos mediante DOM la estructura completa de la nota y la añadimos al main de la aplicación
¿Dónde se utiliza? --> Ésta función va asignada como evento de click al botón "crearNota" */
function crearNota() {
    let contenedor = document.getElementById("main");
    // Contenedor de la nota
    let notaContenedor = document.createElement("div");
    notaContenedor.classList.add("container-nota");
    // Cabecera de la nota
    let cabeceraNota = document.createElement("div");
    cabeceraNota.classList.add("cabecera-nota");
    // Cuerpo de la nota
    let nota = document.createElement("div");
    nota.classList.add("nota");
    // Contenedor botones
    let botonesNota = document.createElement("div");
    botonesNota.classList.add("botones-nota");
    // Botones
    let botonEditar = document.createElement("button");
    let botonEliminar = document.createElement("button");
    botonEditar.classList.add("boton-nota");
    botonEditar.innerHTML = "E";
    botonEliminar.classList.add("boton-nota");
    botonEliminar.innerHTML = "D";
    // Asignación de eventos a los botones
    botonEditar.addEventListener("click", editarNota);
    botonEliminar.addEventListener("click", eliminarNota);
    // Creamos el Textarea junto con el id correspondiente
    let textarea = document.createElement("textarea");
    textarea.id = "nota" + contadorNota;
    textarea.classList.add("textarea");
    textarea.value = "Escribe aqui...";
    // Añadimos un límite de palabras para que no desborde la nota
    textarea.maxLength = "580";
    // Creamos el texto(párrafo) junto con el id correspondiente de la nota
    let texto = document.createElement("p");
    texto.id = "texto" + contadorNota;
    texto.setAttribute("hidden", true);
    // Añadimos los elementos hijos a los elementos padres
    nota.append(textarea, texto);
    botonesNota.append(botonEditar, botonEliminar);
    cabeceraNota.appendChild(botonesNota);
    notaContenedor.append(cabeceraNota, nota);
    // Añadimos la nota al contenedor(main)
    contenedor.appendChild(notaContenedor);
    // Llamamos a la función aniadirDato y le pasamos el contenido de la nota para alamacenarla en la BD
    aniadirDato(textarea.value);
    // Actualizamos el contadorNota para la siguiente nota que se vaya a crear
    contadorNota++;
}

/* Función editarNota()
¿Qué hace? --> Obtenemos el evento y buscamos el elemento padre que lo contiene mediante .closest y una vez obtenido el elemento padre buscamos
               su textarea(hijo) y su párrafo(hijo). Una vez obtenido los hijos lo que hará la función es añadir el contenido del text area al 
               párrafo e irá alternando su visibilidad mediante la propiedad hidden. El textarea será visible cuando el usuario quiera escribir
               en la nota y el párrafo cuando termine de editar la nota y se aplique el cambio del texto.
¿Dónde se utiliza? --> Ésta función va asignada como evento de click a los botones de editar nota    */
function editarNota(event) {

    // Obtengo el elemento con la clase ".container_nota" (Que en este caso es el elemento padre)
    let nota = event.target.closest(".container-nota");
    let textarea = nota.querySelector("textarea");

    let texto = nota.querySelector("p");
    // Alternamos la visibilidad de un elemento u otro en función del que esté previamente visible
    if (textarea.hidden === false) {
        texto.removeAttribute("hidden");
        texto.innerHTML = textarea.value;
        actualizarDato(textarea);
        textarea.setAttribute("hidden", true);
    } else {
        let textoRecuperado = nota.querySelector("p");
        textoRecuperado.setAttribute("hidden", true);
        console.log(textoRecuperado);
        textarea.removeAttribute("hidden");
    }
}

// -------- Parte de Base de Datos --------

// Variables que vamos a usar para la BD
let dataBase = null;
let contador = 0;   // Usamos un contador global ya que se ha tenido problemas con el autoincrement del id de la BD

// Constantes que vamos a utilizar para la BD
const INDEXDB_NAME = "notasBD";
const INDEXDB_VERSION = 1;
const STORE_NAME = "notasAlmacen";


// Función abrir la BD cuando se añada la primera nota y asegura que existe la estructura necesaria para almacenar datos.
function abrirDB() {
    return new Promise((resolve, reject) => {
        // Solicitud para abrir la BD
        let request = indexedDB.open(INDEXDB_NAME, INDEXDB_VERSION);
        // Evento para saber si está lista la BD
        request.onsuccess = (event) => {
            //Referencia a la BD
            dataBase = event.target.result;
            // Indicador de que la Promise se completó con éxito
            resolve();
        };
        // Indicador de que ha fallado la apertura de la BD
        request.onerror = (event) => {
            // Mensaje de error
            reject(event.target.error);
        };

        request.onupgradeneeded = (event) => {
            dataBase = event.target.result;

            if (!dataBase.objectStoreNames.contains(STORE_NAME)) {
                // Creamos la tabla, campo "id" como clave primaria y le añadimos el contador para hacerlo "autoincremental"
                let objectStore = dataBase.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    //autoincrement: true,  (Aquí es dónde se tuvo el problema que se comentó en la declaración de contador)
                    value: contador,
                });
            }
        };
    });
}


// Función para añadir un tipo de datos concreto a la BD (Agrega el dato en respuesta al evento de click que se le ha asociado al boton de añadir nota)
function aniadirDato(contenido) {

    // Abrimos la BD
    abrirDB()
        .then(() => {
            // Creamos y añadimos el dato

            let dato = { "id": contador, contenido: contenido };
            addData(dato)
                .then(() => {
                    // Si se ha añadido correctamente
                    contador++;
                })
                .catch((error) => {
                    // Si no se ha podido añadir
                    console.error("Error en addData: " + error);
                });
        })
        .catch((error) => {
            // Mensaje de error para notificar que no se pudo abrir la BD
            console.error("Error en abrirDB: " + error);
        });
}

/* Función genérica de añadir el dato a la BD
   Inserta el dato en la tabla almacenNota de forma asíncrona y en modo readwrite (lectura y escritura ) */
function addData(dato) {
    // Comprobamos si la BD está abierta
    if (!dataBase) {
        throw new Error("La base de datos no está abierta.");
    }

    return new Promise((resolve, reject) => {
        let transaction = dataBase.transaction(STORE_NAME, "readwrite");
        let objectStore = transaction.objectStore(STORE_NAME);
        /* Utilizamos el método "put" ya que nos sirve tanto para añadir datos nuevos como para sobreescribirlos y así poder usarlo tanto en 
           los métodos aniadirDato() y actualizarDato() [Optimización del código] */
        let request = objectStore.put(dato);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Función para actualizar un dato en la BD
function actualizarDato(event) {
    /* El evento que vamos a obtener por parámetro es el textarea que está dentro del contenedor dónde se encuentra el botón que ha activado el
       evento de click asociado con ésta función. Una vez obtenido el textarea obtenemos su ide y eliminamos del id la palabra "nota" para así
       obtener el número exacto que concidirá con el id en la BD */
    let id = event.id.replace("nota", "");
    // Abrimos la BD
    abrirDB()
        .then(() => {
            // Añadimos el dato
            // Parseamos el id a int
            let dato = { "id": parseInt(id), contenido: event.value };
            addData(dato)
                .then(() => {
                    // Si se ha añadido correctamente
                    contador++;
                })
                .catch((error) => {
                    // Si no se ha podido añadir
                    console.error("Error addData: " + error);
                });
        })
        .catch((error) => {
            // Mensaje de error para notificar que no se pudo abrir la BD
            console.error("Error abrirDB: " + error);
        });
}

/* Función eliminarTodasNota
¿Dónde se usa? --> Ésta función está asociada mediante evento de click al botón "eliminarTodo" que estará en el nav de la aplicación
*/
function eliminarTodasNotas() {
    // Elimino todas las notas del main
    document.getElementById("main").innerHTML = "";

    return new Promise((resolve, reject) => {
        // Comprobamos si la BD está abierta
        if (!dataBase) {
            reject(new Error("La base de datos no está abierta."));
            return;
        }

        let transaction = dataBase.transaction(STORE_NAME, "readwrite");
        let objectStore = transaction.objectStore(STORE_NAME);
        // Hacemos un clear() a la tabla
        let request = objectStore.clear();
        // Resetamos el contador ya que se han eliminado todas las notas
        contador = 0;
        request.onsuccess = () => {
            // Si se han eliminado correctamente
            console.log("Todos los datos han sido eliminados correctamente.");
            resolve();
        };

        request.onerror = (event) => {
            // Si no se han podido eliminar
            console.error("No se han podido eliminar los datos: ", event.target.error);
            reject(event.target.error);
        };
    });
}
/* Función eliminarNota
¿Dónde se usa? --> Ésta función está asociada mediante evento de click al los botones "eliminarNota" que estarán en la cabecera de la nota
*/
function eliminarNota(event) {

    // Obtenemos el elemento padre con la clase".container-nota" asociado al botón que llama a la función
    let nota = event.target.closest(".container-nota");
    let textarea = nota.querySelector("textarea");
    console.log(textarea.id);
    // Obtenemos el id de la nota
    let id = textarea.id.replace("nota", "");
    // Eliminamos el elemento
    nota.remove();
    return new Promise((resolve, reject) => {
        // Comprobamos si la BD está abierta
        if (!dataBase) {
            reject(new Error("La base de datos no está abierta."));
            return;
        }

        let transaction = dataBase.transaction(STORE_NAME, "readwrite");
        let objectStore = transaction.objectStore(STORE_NAME);
        // Borramos el elemento de la tabla
        let request = objectStore.delete(parseInt(id));

        request.onsuccess = () => {
            // Si se ha eliminado el dato correctamente
            console.log("La nota has sido eliminada correctamente.");
            resolve();
        };

        request.onerror = (event) => {
            // Si no se ha podido eliminar el dato
            console.error("No se han podido eliminar el dato seleccionado: ", event.target.error);
            reject(event.target.error);
        };
    });

}
/* Función obtenerNotas()
¿Qué hace? --> Abre la BD y se obtiene los datos almacenado en las tablas y se crean las notas con los datos obtenidos */
function obtenerNotas() {
    // Abrimos la BD
    abrirDB()
        .then(() => {
            let transaction = dataBase.transaction(STORE_NAME, "readonly");
            let objectStore = transaction.objectStore(STORE_NAME);

            // Obtenemos todos los elementos(datos) mediante el método getAll()
            let request = objectStore.getAll();

            request.onsuccess = (event) => {
                // Obtenemos los datos que vamos a meter en las diferentes notas
                let notas = event.target.result;

                // Limpiamos el main previamente
                let contenedor = document.getElementById("main");
                contenedor.innerHTML = "";

                // Realizamos un forEach para iterar sobre cada nota y la creamos en el DOM
                notas.forEach(nota => {
                    // Contenedor de la nota
                    let notaContenedor = document.createElement("div");
                    notaContenedor.classList.add("container-nota");
                    // Cabecera de la nota
                    let cabeceraNota = document.createElement("div");
                    cabeceraNota.classList.add("cabecera-nota");
                    // Cuerpo de la nota
                    let notaElemento = document.createElement("div");
                    notaElemento.classList.add("nota");
                    // Contenedor botones
                    let botonesNota = document.createElement("div");
                    botonesNota.classList.add("botones-nota");
                    // Botones
                    let botonEditar = document.createElement("button");
                    let botonEliminar = document.createElement("button");
                    botonEditar.classList.add("boton-nota");
                    botonEditar.innerHTML = "E";
                    botonEliminar.classList.add("boton-nota");
                    botonEliminar.innerHTML = "D";
                    // Asignación de eventos a los botones
                    botonEditar.addEventListener("click", editarNota);
                    botonEliminar.addEventListener("click", eliminarNota);
                    // Creamos el Textarea junto con el id correspondiente
                    let textarea = document.createElement("textarea");
                    textarea.id = "nota" + nota.id;
                    textarea.classList.add("textarea");
                    // Añadimos un límite de palabras para que no desborde la nota
                    textarea.maxLength = "580";
                    // Añadimos al textarea el contenido de la nota
                    textarea.value = nota.contenido;
                    textarea.setAttribute("hidden", true);
                    // Creamos el texto junto con el id correspondiente
                    let texto = document.createElement("p");
                    texto.id = "texto" + nota.id;
                    texto.textContent = nota.contenido;
                    // Añadimos los elementos hijos a los elementos padres
                    notaElemento.append(textarea, texto);
                    botonesNota.append(botonEditar, botonEliminar);
                    cabeceraNota.appendChild(botonesNota);
                    notaContenedor.append(cabeceraNota, notaElemento);
                    // Añadimos la nota al main
                    contenedor.appendChild(notaContenedor);
                });
            };

            request.onerror = (event) => {
                // Si no se ha podido obtener los datos de la BD
                console.error("No se ha podido obtener los datos: ", event.target.error);
            };
        })
        .catch((error) => {
            // Si no se ha podido abrir la BD
            console.error("Error en abrirDB: " + error);
        });
}
// Llamada a la función obtenerNotas()
obtenerNotas();