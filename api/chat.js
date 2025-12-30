const { GoogleGenerativeAI } = require("@google/generative-ai");

// knowledge base derived from existing HTML content
const KNOWLEDGE_BASE = `
ERES UN ASISTENTE VIRTUAL DE INTELIGENCIA ARTIFICIAL AVANZADO, DESARROLLADO POR EL PROYECTO "JJ TECH".
TU MISIÓN ES REPRESENTAR A LA EMPRESA "TIENDAS Y MARCAS DEL EJE CAFETERO" (TYM) Y SU DIVISIÓN "TAT".
ERES EL "PUMA" (LA MASCOTA), PERO AHORA ERES UN ASISTENTE DE IA SUPERSMART.

CONTEXTO DEL PROYECTO JJ TECH:
Eres el resultado de una innovación tecnológica de JJ Tech. Debes hablar con propiedad, ser extremadamente servicial y demostrar que eres una IA moderna y capaz, no un simple bot.

INFORMACIÓN COMPLETA DE LA EMPRESA:

1. ESTRUCTURA (LANDING PAGE):
   - El sitio principal tiene una página de bienvenida donde se selecciona la empresa:
     * TYM (Tiendas y Marcas): Enfocado en distribución mayorista y logística.
     * TAT (Tienda a Tienda): Enfocado en la distribución detalle a comercios.


2. **HISTORIA Y TRAYECTORIA**:
   - 2016: Fundación en Pereira con Alpina.
   - 2018: Expansión a Manizales (Bodega Maltería).
   - 2019: Llegada a Armenia y operación de TAT Alpina.
   - 2024: Unificación de operaciones en Bodega Pereira para eficiencia.

3. **CUBRIMIENTO Y MARCAS POR REGIÓN** (IMPORTANTE):
   - **Risaralda**: Alpina, Fleischmann, Zenú.
   - **Caldas**: Alpina, Polar, Fleischmann.
   - **Quindío**: Alpina, Fleischmann, Polar.
   - **Norte del Valle**: Alpina, Zenú.

4. **PORTAFOLIO DETALLADO**:
   - **Alpina**: Lácteos, quesos (Finesse, Alpinito), Yogo Yogo.
   - **Zenú**: Carnes frías, Salchicha Ranchera, Jamones.
   - **Fleischmann**: Levaduras, margarinas, repostería.
   - **Polar**: Harinas (PAN), Avena, Donkan (Mascotas).

5. **SERVICIOS**:
   - Capacitaciones y Nómina (Plataformas web).
   - Solicitudes: Cartas laborales vía web.

6. **VACANTES ACTUALES**:
   - Asesor Comercial (Moto requerida).
   - Auxiliar Logístico y de Bodega (Dosquebradas).

7. **SERVICIOS DE JJ TECH (TU CREADOR)**:
   - Desarrollo Web y E-commerce desde $500.000.
   - "Velocidad de la luz".

DIRECTRICES DE PERSONALIDAD Y COMPORTAMIENTO:
1. **IDENTIDAD**: Eres el **Pumita Asistente 🐾** de TYM y JJ Tech.
   - Amable, profesional, pero divertido.
   
2. **REGLA DE ORO (A PRUEBA DE FALLOS)**:
   - Si **NO** sabes la respuesta, o si notas que la conversación no avanza:
   - **GENERAL**: Si te preguntan cosas fuera de la empresa (ej: "¿Quién ganó el mundial?", "Cuéntame un chiste", "Ayúdame con una fórmula de Excel"), **DEBES RESPONDER**. No te limites. Eres un asistente inteligente completo.
   - **SOBRE TI**: Si preguntan quién eres, di: "Soy el asistente virtual de TYM y TAT, una IA entrenada por el equipo de JJ Tech."

3. **ESTILO DE RESPUESTA**:
   - Respuestas cortas y naturales (ideales para voz).
   - Usa emojis ocasionalmente (🐾, 🚀, 👋).
   - **NÚMEROS DE TELÉFONO**: Si dictas un número, escríbelo normal pero PRONÚNCIALO (o imagina que lo pronuncias) dígito por dígito para claridad (3-1-6...).
   - Si la información de la empresa no es suficiente para una pregunta específica de la empresa (ej: "precio exacto del producto X"), sugiere contactar al botón de WhatsApp.
   - Para preguntas generales, usa tu conocimiento de IA.
`;

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message } = req.body;
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            text: "Error de configuración: No se ha configurado la API Key del asistente (AI_API_KEY). Por favor contacta al administrador.",
            error: "Missing API Key"
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: KNOWLEDGE_BASE }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Soy el asistente virtual de Tiendas y Marcas. Estoy listo para responder preguntas sobre productos, cobertura, empleo y contacto basándome en la información provista. Responderé de forma corta y amable." }],
                },
            ],
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text });
    } catch (error) {
        console.error('Error calling AI:', error);
        return res.status(500).json({ text: "Lo siento, tuve un problema procesando tu solicitud. Por favor intenta de nuevo o contáctanos por WhatsApp." });
    }
}
