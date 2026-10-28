// --- BASE DE DATOS DE TU CLASE ---
const preguntasClase = [
    {
        pregunta: "¿En que país se inventó la brújula?",
        opciones: ["China", "Takataka", 'Greengoland'],
        correcta: 0 
    },
    {
        pregunta: "¿Pizza, completo o arepa?",
        opciones: ["pizza", "completo", "arepa"],
        correcta: 1
    },
    {
        pregunta: "¿Perros o gatos?",
        opciones: ['perros', 'gatos', 'ambos'],
        correcta: 2 
    },
    {
        pregunta: "¿Premio o castigo?",
        opciones: ['premio', 'castigo', 'ambos'],
        correcta: 2 
    }
];

let indicePreguntaActual = 0;
let puntuacion = 0;
let nombreEstudiante = "";

// Elementos del HTML
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaFinal = document.getElementById("pantalla-final");

const inputNombre = document.getElementById("input-nombre");
const btnComenzar = document.getElementById("btn-comenzar");
const displayNombre = document.getElementById("display-nombre");
const scoreDisplay = document.getElementById("score");
const scoreFinal = document.getElementById("score-final");
const nombreFinal = document.getElementById("nombre-final");
const listaRanking = document.getElementById("lista-ranking");

const preguntaTexto = document.getElementById("pregunta-texto");
const opcionesContenedor = document.getElementById("opciones-contenedor");
const progresoPregunta = document.getElementById("progreso-pregunta");
const retroalimentacion = document.getElementById("retroalimentacion");
const btnReiniciar = document.getElementById("btn-reiniciar");

// URL oficial de Google Sheets Apps Script
const urlGoogleSheet = "https://script.google.com/macros/s/AKfycbysQJ9hQKt14XG2Fsh6W8ORUiVnATrtYH4iT4ooBPj_3PXiBQrX4lA190ZDy7TLg7WMnA/exec";

// Comenzar juego
if (btnComenzar) {
    btnComenzar.addEventListener("click", () => {
        nombreEstudiante = inputNombre.value.trim();
        if (nombreEstudiante === "") {
            alert("Por favor, ingresa tu nombre antes de comenzar.");
            return;
        }
        
        displayNombre.textContent = nombreEstudiante;
        pantallaInicio.classList.add("oculto");
        pantallaJuego.classList.remove("oculto");
        
        cargarPregunta();
    });
}

function cargarPregunta() {
    retroalimentacion.classList.add("oculto");
    const actual = preguntasClase[indicePreguntaActual];
    
    progresoPregunta.textContent = `Pregunta ${indicePreguntaActual + 1} de ${preguntasClase.length}`;
    preguntaTexto.textContent = actual.pregunta;
    
    opcionesContenedor.innerHTML = "";
    
    actual.opciones.forEach((opcion, index) => {
        const boton = document.createElement("button");
        boton.textContent = opcion;
        boton.classList.add("btn-opcion");
        boton.addEventListener("click", () => verificarRespuesta(index, actual.correcta));
        opcionesContenedor.appendChild(boton);
    });
}

function verificarRespuesta(seleccionada, correcta) {
    const botones = opcionesContenedor.querySelectorAll("button");
    botones.forEach(btn => btn.disabled = true);
    
    if (seleccionada === correcta) {
        puntuacion += 10;
        scoreDisplay.textContent = puntuacion;
        retroalimentacion.textContent = "¡Correcto! 🎉 +10 puntos";
        retroalimentacion.style.color = "#10b981";
        botones[seleccionada].style.backgroundColor = "#10b981";
    } else {
        retroalimentacion.textContent = "Incorrecto. ❌ La próxima será.";
        retroalimentacion.style.color = "#ef4444";
        botones[seleccionada].style.backgroundColor = "#ef4444";
        botones[correcta].style.backgroundColor = "#10b981";
    }
    
    retroalimentacion.classList.remove("oculto");
    
    setTimeout(() => {
        indicePreguntaActual++;
        if (indicePreguntaActual < preguntasClase.length) {
            cargarPregunta();
        } else {
            mostrarPantallaFinal();
        }
    }, 2000);
}

// Enviar puntaje a Google Sheets y mostrar el Ranking Global al finalizar
function mostrarPantallaFinal() {
    pantallaJuego.classList.add("oculto");
    pantallaFinal.classList.remove("oculto");
    scoreFinal.textContent = puntuacion;
    nombreFinal.textContent = nombreEstudiante;

    // 1. Enviar los datos del nuevo puntaje a Google Sheets (en segundo plano)
    if (urlGoogleSheet !== "") {
        fetch(urlGoogleSheet, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                nombre: nombreEstudiante,
                puntaje: puntuacion
            })
        }).catch(error => console.error("Error al enviar a Google Sheets:", error));
    }

    // 2. Mostrar mensaje de carga mientras se descargan los datos de la nube
    if (listaRanking) {
        listaRanking.innerHTML = "<li>🔄 Actualizando ranking global...</li>";
    }

    // 3. Descargar el ranking actualizado desde Google Sheets para mostrarlo en la pantalla final
    // (Damos un pequeño respiro de 1 segundo para que Google Sheets alcance a guardar el nuevo puntaje)
    setTimeout(() => {
        fetch(urlGoogleSheet)
            .then(response => response.json())
            .then(data => {
                if (!listaRanking) return;
                listaRanking.innerHTML = "";
                
                if (!data || data.length === 0) {
                    listaRanking.innerHTML = "<li>No hay puntajes registrados todavía.</li>";
                    return;
                }

                // Ordenar de mayor a menor puntaje
                data.sort((a, b) => b.puntaje - a.puntaje);

                // Dibujar la lista con las clases optimizadas para evitar solapamientos
                data.forEach((item, index) => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span class="ranking-nombre">#${index + 1} &nbsp; ${item.nombre}</span> 
                        <strong class="ranking-puntaje">${item.puntaje} pts</strong>
                    `;
                    listaRanking.appendChild(li);
                });
            })
            .catch(error => {
                console.error("Error al cargar el ranking global:", error);
                if (listaRanking) {
                    listaRanking.innerHTML = "<li>❌ Error al conectar con la nube.</li>";
                }
            });
    }, 1000);
}

// Reiniciar juego
if (btnReiniciar) {
    btnReiniciar.addEventListener("click", () => {
        indicePreguntaActual = 0;
        puntuacion = 0;
        scoreDisplay.textContent = 0;
        pantallaFinal.classList.add("oculto");
        pantallaInicio.classList.remove("oculto");
        inputNombre.value = "";
    });
}

// --- LÓGICA PARA VER EL RANKING GLOBAL DESDE GOOGLE SHEETS ---
const btnVerRanking = document.getElementById("btn-ver-ranking");
const modalRanking = document.getElementById("modal-ranking");
const listaRankingGlobal = document.getElementById("lista-ranking-global");
const btnCerrarRanking = document.getElementById("btn-cerrar-ranking");

if (btnVerRanking) {
    btnVerRanking.addEventListener("click", () => {
        if (pantallaInicio) pantallaInicio.classList.add("oculto");
        if (modalRanking) modalRanking.classList.remove("oculto");
        if (listaRankingGlobal) listaRankingGlobal.innerHTML = "<li>🔄 Cargando puntajes desde la nube...</li>";

        // Consultamos los datos a Google Sheets
        fetch(urlGoogleSheet)
            .then(response => response.json())
            .then(data => {
                if (!listaRankingGlobal) return;
                listaRankingGlobal.innerHTML = "";
                
                if (!data || data.length === 0) {
                    listaRankingGlobal.innerHTML = "<li>No hay puntajes registrados todavía. ¡Sé el primero!</li>";
                    return;
                }

                // Ordenar de mayor a menor puntaje
                data.sort((a, b) => b.puntaje - a.puntaje);

                data.forEach((item, index) => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span class="ranking-nombre">#${index + 1} &nbsp; ${item.nombre}</span> 
                        <strong class="ranking-puntaje">${item.puntaje} pts</strong>
                    `;
                    listaRankingGlobal.appendChild(li);
                });
            })
            .catch(error => {
                console.error("Error al cargar el ranking:", error);
                if (listaRankingGlobal) {
                    listaRankingGlobal.innerHTML = "<li>❌ Error al conectar con la nube.</li>";
                }
            });
    });
}

if (btnCerrarRanking) {
    btnCerrarRanking.addEventListener("click", () => {
        if (modalRanking) modalRanking.classList.add("oculto");
        if (pantallaInicio) pantallaInicio.classList.remove("oculto");
    });
}
if (btnCerrarRanking) {
    btnCerrarRanking.addEventListener("click", () => {
        if (modalRanking) modalRanking.classList.add("oculto");
        if (pantallaInicio) pantallaInicio.classList.remove("oculto");
    });
}
