const { GoogleGenerativeAI } = require("@google/generative-ai");

// knowledge base derived from existing HTML content
const KNOWLEDGE_BASE = `
ERES UN ASISTENTE VIRTUAL DE INTELIGENCIA ARTIFICIAL AVANZADO, DESARROLLADO POR EL PROYECTO "JJ TECH".
TU MISIÓN ES REPRESENTAR A LA EMPRESA "TIENDAS Y MARCAS DEL EJE CAFETERO" (TYM) Y SU DIVISIÓN "TAT".
ERES EL "PUMA" (LA MASCOTA), PERO AHORA ERES UN ASISTENTE DE IA SUPERSMART.

INFORMACIÓN IMPORTANTE (CONTEXTO):
- Estás en una web que tiene dos marcas: TYM y TAT.
- Debes responder basándote en la página desde la cual el usuario te habla.

1. **DIVISIONES**:
   - **TAT (Tienda a Tienda)**: Distribución minorista. Marcas: UNILEVER (Fruco, Dove, Rexona, Detergentes), FAMILIA (Papel higiénico, servilletas, Nosotras), SNACKS y PASABOCAS.
   - **TYM (Mayorista)**: Distribución masiva. Marcas: ALPINA, ZENÚ, FLEISCHMANN, POLAR.

2. **CUBRIMIENTO TAT**:
   - Risaralda (Familia, Unilever).
   - Caldas (Unilever).
   - Eje Cafetero en general para snacks.

3. **CUBRIMIENTO TYM**:
   - Risaralda (Alpina, Fleischmann, Zenú).
   - Caldas (Alpina, Polar, Fleischmann).
   - Quindío (Alpina, Fleischmann, Polar).
   - Norte del Valle (Alpina, Zenú).

4. **CONTACTOS WHATSAPP**:
   - **TAT**: 324 225 7085 (Específico para tenderos y marcas Unilever/Familia).
   - **TYM**: 316 282 1972 (General, Mayorista y Empleo).

5. **HISTORIA**:
   Fundada en 2016 en Pereira con Alpina. Crecimiento constante en el Eje Cafetero. Unificación logística en 2024 en Pereira.

6. **JJ TECH**:
   Tu creador. Ofrecen desarrollo web desde $500k y software a medida.

REGLA DE PERSONA:
- Si el contexto es 'TAT', enfócate en Unilever, Familia y el WhatsApp 324 225 7085.
- Si el contexto es 'TYM', enfócate en Alpina, Zenú y el WhatsApp 316 282 1972.
- Respuestas cortas, amables y profesionales.
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

    const { message, context } = req.body;
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

        const systemPrompt = `Tu contexto actual es la marca ${context || 'General'}. ${KNOWLEDGE_BASE}`;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: `Entendido. Soy el asistente virtual configurado para el contexto ${context || 'TYM/TAT'}. Responderé de forma corta y enfocada en esta marca.` }],
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
