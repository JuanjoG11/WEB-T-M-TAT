document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Voice Modal HTML (Corporate Theme)
    const modalHTML = `
    <div id="voice-modal" class="voice-modal">
        <div class="voice-header">
            <div class="voice-status">
                <div class="voice-waves" id="voice-waves">
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                    <div class="voice-bar"></div>
                </div>
                PUMITA ASISTENTE 🐾
            </div>
            <i class="fas fa-times" id="close-voice-modal" style="cursor:pointer; font-size: 1rem; color: rgba(255,255,255,0.8);"></i>
        </div>
        <div class="voice-content" id="voice-text">
            <span>¡Hola! Soy el Pumita.<br>¿En qué puedo ayudarte hoy?</span>
        </div>
        <div class="voice-controls">
            <span id="listening-status" class="listening-text">Click para hablar...</span>
            <button id="modal-mic-btn" class="voice-btn-action">
                <i class="fas fa-microphone"></i>
            </button>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 2. DOM Elements
    const modal = document.getElementById('voice-modal');
    const closeBtn = document.getElementById('close-voice-modal');
    const voiceText = document.getElementById('voice-text');
    const micBtn = document.getElementById('modal-mic-btn');
    const statusText = document.getElementById('listening-status');
    const mascotLink = document.querySelector('.mascota-container a');

    // 3. State & APIs
    let synthesis = window.speechSynthesis;
    let recognition = null;
    let isSpeaking = false;
    let silenceTimer = null;

    // Check Support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'es-CO';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        // continuous makes it keep listening, but we want turn-taking, so false is better for "Walkie Talkie" style loop
        recognition.continuous = false;

        recognition.onstart = () => {
            statusText.textContent = "Te escucho...";
            statusText.classList.add('listening-active');
            modal.classList.remove('speaking');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            voiceText.innerHTML = `<em>"${transcript}"</em>`;
            handleAIQuery(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            // If error is 'no-speech', restart?
            if (event.error === 'no-speech') {
                statusText.textContent = "No escuché nada...";
            } else {
                statusText.textContent = "Error. Click micro.";
            }
            statusText.classList.remove('listening-active');
        };

        recognition.onend = () => {
            statusText.classList.remove('listening-active');
            if (statusText.textContent === "Te escucho...") {
                statusText.textContent = "Click para hablar...";
            }
        };
    } else {
        voiceText.innerHTML = "Navegador no compatible.";
        micBtn.style.display = 'none';
    }

    // 4. Interaction Logic

    // Open Modal
    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        // AUTO-START CONVERSATION
        if (!isSpeaking) {
            const greeting = "¡Hola! Soy el Pumita Asistente de TYM. ¿Cómo te ayudo?";
            typeWriter(voiceText, greeting);
            speak(greeting, true); // True to auto-listen after speaking
        }
    }

    // Close Modal
    function closeModal() {
        modal.classList.remove('active');
        if (synthesis) synthesis.cancel();
        if (recognition) recognition.stop();
        isSpeaking = false;
    }

    if (mascotLink) {
        mascotLink.addEventListener('click', openModal);
        mascotLink.setAttribute('href', '#');
    }

    closeBtn.addEventListener('click', closeModal);

    // Mic Trigger (Manual)
    micBtn.addEventListener('click', () => {
        if (synthesis) synthesis.cancel(); // Stop talking if talking
        if (recognition) recognition.start();
    });

    // 5. AI & Speech Logic
    async function handleAIQuery(text) {
        try {
            voiceText.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Pensando...';

            // Call our Backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (!response.ok) throw new Error('API Error');

            const data = await response.json();

            if (data.text) {
                // Typewriter effect for visual
                typeWriter(voiceText, data.text);
                // Speak audio
                speak(data.text, true); // Auto-listen after answering
            } else {
                // Backend error fallback
                processFallback(text);
            }

        } catch (err) {
            console.warn("Backend unavailable, using local fallback:", err);
            // Fallback to client-side logic if API fails
            processFallback(text);
        }
    }

    // Client-side Fallback (Offline Mode / "Mini-Brain")
    function processFallback(text) {
        text = text.toLowerCase();
        let response = "";

        // 1. SALUDOS Y EMPATÍA
        if (text.match(/hola|inicio|buenos|buenas|estás ahí/)) {
            response = "¡Hola! Soy el Pumita Asistente de TYM. Conozco nuestra historia, cobertura y portafolio. ¿Qué necesitas saber?";
        }

        // 2. HISTORIA Y EMPRESA
        else if (text.match(/historia|fundada|creada|origen|quienes somos|empresa/)) {
            response = "TYM se fundó en 2016 en Pereira distribuendo Alpina. En 2018 crecimos a Manizales, en 2019 a Armenia, y hoy operamos todo el Eje Cafetero con logística unificada.";
        }

        // 3. COBERTURA GEOGRÁFICA (Muy específico)
        else if (text.match(/cobertura|donde llegan|cubrimiento|mapa/)) {
            response = "Cubrimos Risaralda, Caldas, Quindío y Norte del Valle, llegando directamente a tiendas y comercios.";
        }
        else if (text.match(/risaralda|pereira/)) {
            response = "En Risaralda distribuimos Alpina, Fleischmann y Zenú. Nuestra sede principal está en Dosquebradas.";
        }
        else if (text.match(/caldas|manizales/)) {
            response = "En Caldas llevamos Alpina, Polar y Fleischmann. Tenemos operación fuerte en Manizales.";
        }
        else if (text.match(/quindio|armenia/)) {
            response = "Para el Quindío contamos con Alpina, Fleischmann y Polar. Atendemos toda la zona desde Armenia.";
        }
        else if (text.match(/norte del valle|cartago/)) {
            response = "En el Norte del Valle somos distribuidores oficiales de Alpina y Zenú.";
        }

        // 4. PORTAFOLIO DE MARCAS
        else if (text.match(/alpina|leche|yogo|queso|bon yurt/)) {
            response = "Somos distribuidores máster de ALPINA: Leches, Yogo Yogo, Quesos Finesse, Avena y toda la línea fría.";
        }
        else if (text.match(/zenu|zenú|carne|salchicha|jamon|ranchera|embutido/)) {
            response = "Llevamos el sabor de ZENÚ: Salchichas Rancheras, Jamones, Mortadela y toda la línea de cárnicos. Especialmente en Risaralda y Norte del Valle.";
        }
        else if (text.match(/fleischmann|panaderia|levadura|margarina/)) {
            response = "Para panaderías tenemos FLEISCHMANN: levaduras, margarinas y repostería de alta calidad.";
        }
        else if (text.match(/polar|harina|pan|mascotas|donkan/)) {
            response = "Distribuimos POLAR: Harinas P.A.N, Avenas y alimento para mascotas Donkan.";
        }
        else if (text.match(/productos|catalogo|venden/)) {
            response = "Manejamos líderes como Alpina, Zenú, Familia, Unilever y Polar. Dime una marca y te doy detalles. 🛒";
        }

        // 5. SERVICIOS Y TRÁMITES
        else if (text.match(/vacante|trabajo|empleo|hoja de vida/)) {
            response = "¡Buscamos talento! Necesitamos Asesores Comerciales (con moto) y Auxiliares Logísticos. Escríbenos al WhatsApp 316 282 1972 para aplicar.";
        }
        else if (text.match(/nomina|pago|desprendible/)) {
            response = "Si eres empleado, puedes ver tu desprendible en la plataforma de 'Tu-Nómina' en nuestra web.";
        }
        else if (text.match(/certificado|carta laboral|constancia/)) {
            response = "Puedes solicitar tu carta laboral aquí mismo en la sección 'Solicitudes'. Llénala y te la enviamos.";
        }

        // 6. JJ TECH
        else if (text.match(/web|página|software|jj tech|creador/)) {
            response = "Soy una creación de JJ TECH. Hacemos webs desde $500.000 y software a la medida. ¿Te agendo una demo?";
        }
        else if (text.match(/precio|costo|cotizacion/)) {
            response = "Si es sobre webs, desde $500k. Si es productos TYM, varía según el pedido. ¿Qué necesitas?";
        }

        // 7. CONTACTO Y UBICACIÓN
        else if (text.match(/ubicacion|direccion|donde estan/)) {
            response = "Estamos en Dosquebradas, Carrera 16 # 77-00, sector La Romelia. ¡Visítanos!";
        }
        else if (text.match(/telefono|celular|llamada|contacto/)) {
            response = "Llámanos o escribe al 316 282 1972. Estamos listos para atenderte.";
        }

        // 8. FALLBACK FINAL (Inteligente)
        else {
            response = "Entiendo que buscas información específica. Para eso, lo más rápido es hablar con un asesor humano al 316 282 1972. ¿Te ayudo con algo más?";
        }

        typeWriter(voiceText, response);
        speak(response, true); // Keep conversation alive
    }

    function speak(text, autoListen = false) {
        if (!synthesis) return;

        // Stabilization: Cancel previous speech
        synthesis.cancel();

        modal.classList.add('speaking');
        isSpeaking = true;

        // CLEANUP FOR SPEECH:
        // 1. Remove emojis
        let speakText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

        // 2. Format Phone Numbers to be read digit by digit (3 1 6...)
        speakText = speakText.replace(/316 282 1972/g, "3 1 6, 2 8 2, 1 9 7 2");
        speakText = speakText.replace(/3162821972/g, "3 1 6, 2 8 2, 1 9 7 2");

        const utterance = new SpeechSynthesisUtterance(speakText);
        utterance.lang = 'es-CO';
        utterance.rate = 1.0;

        utterance.onend = () => {
            modal.classList.remove('speaking');
            isSpeaking = false;

            // AUTO LISTEN
            if (autoListen && recognition) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) { }
                }, 500);
            }
        };

        utterance.onerror = () => {
            modal.classList.remove('speaking');
            isSpeaking = false;
        };

        synthesis.speak(utterance);
    }

    function typeWriter(element, text, i = 0) {
        if (i === 0) element.innerHTML = '';
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            setTimeout(() => typeWriter(element, text, i + 1), 25);
        }
    }
});
