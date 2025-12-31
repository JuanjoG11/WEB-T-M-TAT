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
    const isTAT = window.location.pathname.includes('tat.html');
    const chatbotContext = isTAT ? 'TAT' : 'TYM';
    const whatsappNumber = isTAT ? '324 225 7085' : '316 282 1972';

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
        voiceText.innerHTML = "<span>Tu navegador no soporta voz. ☹️<br>Por favor usa <b>Google Chrome</b> o <b>Microsoft Edge</b>.</span>";
        micBtn.style.display = 'none';
    }

    // 4. Interaction Logic

    // Open Modal
    function openModal(e) {
        if (e) e.preventDefault();
        modal.classList.add('active');
        // AUTO-START CONVERSATION
        if (!isSpeaking) {
            const greeting = isTAT
                ? "¡Hola! Soy el Pumita Asistente de TAT Distribuciones. Distribuyo Unilever y Familia. ¿Cómo te ayudo?"
                : "¡Hola! Soy el Pumita Asistente de TYM. Conecto marcas como Alpina y Zenú. ¿Qué necesitas?";
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
                body: JSON.stringify({ message: text, context: chatbotContext })
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
            const name = isTAT ? 'TAT Distribuciones' : 'TYM';
            response = `¡Hola! Soy el Pumita Asistente de ${name}. Conozco nuestra historia, cobertura y portafolio. ¿Qué necesitas saber?`;
        }

        // 2. HISTORIA Y EMPRESA
        else if (text.match(/historia|fundada|creada|origen|quienes somos|empresa/)) {
            response = "Tiendas y Marcas (TYM) nació en 2016 en Pereira con Alpina. En 2024 unificamos toda nuestra logística en la bodega de Dosquebradas para atender mejor a todo el Eje Cafetero.";
        }

        // 3. COBERTURA GEOGRÁFICA (Específico TAT vs TYM)
        else if (text.match(/cobertura|donde llegan|cubrimiento|mapa/)) {
            response = isTAT
                ? "En TAT Distribuciones cubrimos Risaralda (Familia/Unilever) y Caldas (Unilever), llevando productos directo a los tenderos."
                : "En TYM cubrimos Risaralda, Caldas, Quindío y Norte del Valle con marcas como Alpina, Zenú y Polar.";
        }
        else if (text.match(/risaralda|pereira/)) {
            response = isTAT
                ? "En Risaralda distribuimos Familia y Unilever. ¡Llegamos a todas las tiendas de barrio!"
                : "En Risaralda distribuimos Alpina, Fleischmann y Zenú. Operamos desde Dosquebradas.";
        }
        else if (text.match(/caldas|manizales/)) {
            response = isTAT
                ? "En Caldas operamos con Unilever para el canal TAT, cubriendo Manizales y el área metropolitana."
                : "En Caldas llevamos Alpina, Polar y Fleischmann. Contamos con logística propia en Manizales.";
        }
        else if (text.match(/quindio|armenia/)) {
            response = "En el Quindío atendemos toda la zona desde Armenia con nuestro portafolio de marcas aliadas.";
        }
        else if (text.match(/norte del valle|cartago/)) {
            response = "En el Norte del Valle somos distribuidores oficiales de Alpina y Zenú.";
        }

        // 4. PORTAFOLIO DE MARCAS (TAT vs TYM)
        else if (text.match(/unilever|jabón|detergente|comida|fruco|rexona|dove|maizena/)) {
            response = "En TAT Distribuciones somos aliados de UNILEVER: Salsas Fruco, Dove, Rexona, Maizena y detergentes líderes.";
        }
        else if (text.match(/familia|papel|higiene|servilletas|nosotras|toallas/)) {
            response = "Distribuimos todo el portafolio de FAMILIA: Papel higiénico, servilletas, toallas de manos y la línea Nosotras.";
        }
        else if (text.match(/alpina|leche|yogo|queso|bon yurt|kumis/)) {
            response = "Para productos ALPINA como quesos, yogurt y leches, contacta a nuestra línea de TYM Mayorista.";
        }
        else if (text.match(/zenu|zenú|carne|salchicha|jamon|ranchera|embutido/)) {
            response = "Los cárnicos ZENÚ (Salchichas Rancheras, Jamón) son distribuidos por TYM en Risaralda y Norte del Valle.";
        }
        else if (text.match(/fleischmann|panaderia|levadura|margarina/)) {
            response = "Para panaderías tenemos FLEISCHMANN: levaduras, margarinas y repostería de alta calidad.";
        }
        else if (text.match(/polar|harina|pan|mascotas|donkan/)) {
            response = "Distribuimos POLAR: Harina P.A.N., Avenas y alimento Donkan en Caldas y Quindío.";
        }
        else if (text.match(/snacks|papas|galletas|gomas/)) {
            response = "Manejamos Snacks y Pasabocas de impulso: galletas, gomas, chocolates y bebidas para tiendas.";
        }
        else if (text.match(/productos|catalogo|venden/)) {
            response = isTAT
                ? "En TAT vendemos Unilever, Familia y Snacks. ¿Sobre cuál marca quieres información? 🛒"
                : "En TYM manejamos Alpina, Zenú, Fleischmann y Polar. ¿Qué marca buscas? 🛒";
        }

        // 5. SERVICIOS Y TRÁMITES
        else if (text.match(/vacante|trabajo|empleo|hoja de vida/)) {
            response = `¡Buscamos talento! Necesitamos Asesores Comerciales y Auxiliares. Escríbenos al WhatsApp ${whatsappNumber} para aplicar.`;
        }
        else if (text.match(/nomina|pago|desprendible/)) {
            response = "Puedes consultar tu nómina en la plataforma web. Busca el botón 'Ir a plataforma de Nómina'.";
        }
        else if (text.match(/certificado|carta laboral|constancia/)) {
            response = "Solicita tu carta laboral en la sección de 'Solicitudes' de nuestra página web.";
        }

        // 6. JJ TECH
        else if (text.match(/web|página|software|jj tech|creador/)) {
            response = "Soy una creación de JJ TECH. Creamos soluciones digitales modernas. ¿Quieres que te contacte un desarrollador?";
        }
        else if (text.match(/precio|costo|cotizacion/)) {
            response = "Si es sobre webs, desde $500k. Si es productos TYM, varía según el pedido. ¿Qué necesitas?";
        }

        // 7. CONTACTO Y UBICACIÓN
        else if (text.match(/ubicacion|direccion|donde estan/)) {
            response = "Nuestra ubicación exacta es Carrera 1 6, número 7 7 guion 0 0, Intersección La Romelia, en Dosquebradas. También puedes ver el mapa en la sección de 'Contáctanos' de nuestra web.";
        }
        else if (text.match(/telefono|celular|llamada|contacto/)) {
            response = `Puedes contactarnos al WhatsApp ${whatsappNumber}. ¡Estamos para servirte!`;
        }

        // 8. FALLBACK FINAL
        else {
            response = `Toda nuestra información oficial de productos, coberturas y empleo está disponible aquí mismo en la página web. Si buscas nuestra ubicación, entra en la sección de 'Contáctanos' o escríbenos al WhatsApp ${whatsappNumber}.`;
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

        // 3. Pronunciation fixes
        speakText = speakText.replace(/TYM/g, "TIM");
        speakText = speakText.replace(/tym/gi, "TIM");

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
