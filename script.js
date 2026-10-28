// =================================================================
// DESAFÍO GAMIFICADO - LÓGICA DE TRIVIA Y CONEXIÓN A LA NUBE
// =================================================================

// NOTA: El banco de preguntas se carga automáticamente desde "banco_preguntas.js"
// mediante la variable global 'bancoPreguntasCompleto'.

let preguntasClase = [];
let indicePreguntaActual = 0;
let puntuacion = 0;
let nombreEstudiante = "";

let tiempoRestante = 30;
let intervaloTemporizador = null;
const TIEMPO_MAXIMO = 30;

// URL de la API de Google Sheets Apps Script
const urlGoogleSheet = "https://script.google.com/macros/s/AKfycbysQJ9hQKt14XG2Fsh6W8ORUiVnATrtYH4iT4ooBPj_3PXiBQrX4lA190ZDy7TLg7WMnA/exec";

// Elementos del DOM
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaFinal = document.getElementById("pantalla-final");

const inputNombre = document.getElementById("input-nombre");
const btnComenzar = document.getElementById("btn-comenzar");
const btnVerRanking = document.getElementById("btn-ver-ranking");

const displayNombre = document.getElementById("display-nombre");
const scoreDisplay = document.getElementById("score");
const scoreFinal = document.getElementById("score-final");
const nombreFinal = document.getElementById("nombre-final");
const listaRanking = document.getElementById("lista-ranking");

const preguntaTexto = document.getElementById("pregunta-texto");
const opcionesContenedor = document.getElementById("opciones-contenedor");
const progresoPregunta = document.getElementById("progreso-pregunta");
const barraProgresoFill = document.getElementById("barra-progreso-fill");
const retroalimentacion = document.getElementById("retroalimentacion");
const btnReiniciar = document.getElementById("btn-reiniciar");
const spanTiempoRestante = document.getElementById("tiempo-restante");

const backdropModal = document.getElementById("backdrop-modal");
const modalRanking = document.getElementById("modal-ranking");
const listaRankingGlobal = document.getElementById("lista-ranking-global");
const btnCerrarRanking = document.getElementById("btn-cerrar-ranking");

// -----------------------------------------------------------------
// 1. INICIALIZACIÓN Y COMIENZO DEL JUEGO
// -----------------------------------------------------------------
btnComenzar.addEventListener("click", () => {
    nombreEstudiante = inputNombre.value.trim();
    if (nombreEstudiante === "") {
        alert("Por favor, ingresa tu nombre antes de comenzar.");
        inputNombre.focus();
        return;
    }

    // Verificar si el banco de preguntas de banco_preguntas.js se cargó correctamente
    if (typeof bancoPreguntasCompleto === "undefined" || !Array.isArray(bancoPreguntasCompleto) || bancoPreguntasCompleto.length === 0) {
        alert("Error: No se encontró el banco de preguntas. Asegúrate de incluir 'banco_preguntas.js' en la misma carpeta.");
        return;
    }

    // Seleccionar 10 preguntas al azar del banco completo
    let bancoMezclado = [...bancoPreguntasCompleto].sort(() => Math.random() - 0.5);
    preguntasClase = bancoMezclado.slice(0, Math.min(10, bancoMezclado.length));

    // Reiniciar variables de estado
    indicePreguntaActual = 0;
    puntuacion = 0;
    scoreDisplay.textContent = "0";
    displayNombre.textContent = nombreEstudiante;

    // Transición de pantallas
    pantallaInicio.classList.add("oculto");
    pantallaJuego.classList.remove("oculto");

    cargarPregunta();
});

// -----------------------------------------------------------------
// 2. CARGAR Y MOSTRAR PREGUNTA
// -----------------------------------------------------------------
function cargarPregunta() {
    clearInterval(intervaloTemporizador);

    if (indicePreguntaActual >= preguntasClase.length) {
        mostrarPantallaFinal();
        return;
    }

    // Ocultar feedback anterior
    retroalimentacion.classList.add("oculto");
    retroalimentacion.className = "feedback-card oculto";

    const actual = preguntasClase[indicePreguntaActual];
    
    // Actualizar encabezados y progreso
    progresoPregunta.textContent = `Pregunta ${indicePreguntaActual + 1} de ${preguntasClase.length}`;
    preguntaTexto.textContent = actual.pregunta;
    
    // Renderizar opciones
    opcionesContenedor.innerHTML = "";
    actual.opciones.forEach((opcion, index) => {
        const boton = document.createElement("button");
        boton.textContent = opcion;
        boton.classList.add("btn-opcion");
        boton.addEventListener("click", () => verificarRespuesta(index, actual.correcta));
        opcionesContenedor.appendChild(boton);
    });

    // Iniciar temporizador
    tiempoRestante = TIEMPO_MAXIMO;
    actualizarBarraTiempo();
    iniciarTemporizador();
}

// -----------------------------------------------------------------
// 3. CONTROL DEL TEMPORIZADOR
// -----------------------------------------------------------------
function iniciarTemporizador() {
    intervaloTemporizador = setInterval(() => {
        tiempoRestante--;
        actualizarBarraTiempo();

        if (tiempoRestante <= 0) {
            clearInterval(intervaloTemporizador);
            manejarTiempoAgotado();
        }
    }, 1000);
}

function actualizarBarraTiempo() {
    if (spanTiempoRestante) spanTiempoRestante.textContent = tiempoRestante;
    if (barraProgresoFill) {
        const porcentaje = (tiempoRestante / TIEMPO_MAXIMO) * 100;
        barraProgresoFill.style.width = `${porcentaje}%`;
    }
}

function manejarTiempoAgotado() {
    deshabilitarBotones();

    // Mostrar respuesta correcta
    const actual = preguntasClase[indicePreguntaActual];
    const botones = opcionesContenedor.querySelectorAll("button");
    if (botones[actual.correcta]) {
        botones[actual.correcta].classList.add("btn-correcta");
    }

    retroalimentacion.textContent = "⏰ ¡Tiempo agotado! (0 puntos)";
    retroalimentacion.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
    retroalimentacion.style.color = "#ef4444";
    retroalimentacion.classList.remove("oculto");

    setTimeout(() => {
        indicePreguntaActual++;
        cargarPregunta();
    }, 1800);
}

// -----------------------------------------------------------------
// 4. VERIFICAR RESPUESTA Y CÁLCULO DE PUNTAJE
// -----------------------------------------------------------------
function verificarRespuesta(seleccionada, correcta) {
    clearInterval(intervaloTemporizador);
    deshabilitarBotones();
    
    const botones = opcionesContenedor.querySelectorAll("button");

    if (seleccionada === correcta) {
        // Cálculo de puntaje por velocidad (10 pts base + hasta 20 pts según rapidez)
        let puntosObtenidos = 10 + Math.floor((tiempoRestante / TIEMPO_MAXIMO) * 20);
        puntuacion += puntosObtenidos;
        scoreDisplay.textContent = puntuacion;
        
        botones[seleccionada].classList.add("btn-correcta");
        retroalimentacion.textContent = `¡Correcto! 🎉 (+${puntosObtenidos} puntos)`;
        retroalimentacion.style.backgroundColor = "rgba(16, 185, 129, 0.2)";
        retroalimentacion.style.color = "#10b981";
    } else {
        botones[seleccionada].classList.add("btn-incorrecta");
        if (botones[correcta]) {
            botones[correcta].classList.add("btn-correcta");
        }
        retroalimentacion.textContent = "Incorrecto ❌ (0 puntos)";
        retroalimentacion.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
        retroalimentacion.style.color = "#ef4444";
    }
    
    retroalimentacion.classList.remove("oculto");
    
    setTimeout(() => {
        indicePreguntaActual++;
        cargarPregunta();
    }, 1800);
}

function deshabilitarBotones() {
    const botones = opcionesContenedor.querySelectorAll("button");
    botones.forEach(btn => btn.disabled = true);
}

// -----------------------------------------------------------------
// 5. PANTALLA FINAL Y RANKING CLOUD (GOOGLE SHEETS)
// -----------------------------------------------------------------
function mostrarPantallaFinal() {
    pantallaJuego.classList.add("oculto");
    pantallaFinal.classList.remove("oculto");
    
    scoreFinal.textContent = puntuacion;
    nombreFinal.textContent = nombreEstudiante;

    // 1. Enviar resultado a Google Sheets
    if (urlGoogleSheet && urlGoogleSheet !== "") {
        fetch(urlGoogleSheet, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ nombre: nombreEstudiante, puntaje: puntuacion })
        }).catch(err => console.error("Error al enviar a Google Sheets:", err));
    }

    // 2. Cargar ranking actualizado
    cargarRankingGenerico(listaRanking);
}

function cargarRankingGenerico(contenedorLista) {
    if (!contenedorLista) return;
    contenedorLista.innerHTML = "<li>🔄 Cargando tabla de posiciones...</li>";

    if (!urlGoogleSheet || urlGoogleSheet === "") {
        contenedorLista.innerHTML = "<li>Configura la URL de Google Sheets.</li>";
        return;
    }

    setTimeout(() => {
        fetch(urlGoogleSheet)
            .then(res => res.json())
            .then(data => {
                contenedorLista.innerHTML = "";
                if (!data || data.length === 0) {
                    contenedorLista.innerHTML = "<li>Sé el primero en registrar un puntaje.</li>";
                    return;
                }

                // Ordenar de mayor a menor puntaje
                data.sort((a, b) => b.puntaje - a.puntaje);

                data.forEach((item, index) => {
                    const li = document.createElement("li");
                    let medalla = `#${index + 1}`;
                    if (index === 0) medalla = "🥇";
                    else if (index === 1) medalla = "🥈";
                    else if (index === 2) medalla = "🥉";

                    li.innerHTML = `
                        <div>
                            <span class="ranking-pos">${medalla}</span>
                            <span class="ranking-nombre">${escaparHTML(item.nombre)}</span>
                        </div>
                        <strong class="ranking-puntaje">${item.puntaje} pts</strong>
                    `;
                    contenedorLista.appendChild(li);
                });
            })
            .catch(err => {
                console.error("Error al cargar ranking:", err);
                contenedorLista.innerHTML = "<li>❌ No se pudo sincronizar con el servidor.</li>";
            });
    }, 800);
}

function escaparHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}

// -----------------------------------------------------------------
// 6. EVENTOS SECUNDARIOS Y RANKING GLOBAL MODAL
// -----------------------------------------------------------------
btnReiniciar.addEventListener("click", () => {
    pantallaFinal.classList.add("oculto");
    pantallaInicio.classList.remove("oculto");
    inputNombre.value = "";
});

if (btnVerRanking && backdropModal) {
    btnVerRanking.addEventListener("click", () => {
        backdropModal.classList.remove("oculto");
        cargarRankingGenerico(listaRankingGlobal);
    });
}

if (btnCerrarRanking && backdropModal) {
    btnCerrarRanking.addEventListener("click", () => {
        backdropModal.classList.add("oculto");
    });
}

// Cerrar modal al hacer clic en el backdrop fuera de la tarjeta
if (backdropModal) {
    backdropModal.addEventListener("click", (e) => {
        if (e.target === backdropModal) {
            backdropModal.classList.add("oculto");
        }
    });
}