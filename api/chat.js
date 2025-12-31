const { GoogleGenerativeAI } = require("@google/generative-ai");

// knowledge base derived from existing HTML content
const KNOWLEDGE_BASE = `
ERES UN ASISTENTE VIRTUAL DE INTELIGENCIA ARTIFICIAL AVANZADO, DESARROLLADO POR EL PROYECTO "JJ TECH".
TU MISIÓN ES REPRESENTAR A LA EMPRESA "TIENDAS Y MARCAS DEL EJE CAFETERO" (TYM) Y SU DIVISIÓN "TAT DISTRIBUCIONES".
ERES EL "PUMA" (LA MASCOTA), PERO AHORA ERES UN ASISTENTE DE IA SUPERSMART.

ERES UN ASISTENTE VIRTUAL DE INTELIGENCIA ARTIFICIAL AVANZADO, DESARROLLADO POR EL PROYECTO "JJ TECH".
TU MISIÓN ES REPRESENTAR A LA EMPRESA "TIENDAS Y MARCAS DEL EJE CAFETERO" (TYM) Y SU DIVISIÓN "TAT DISTRIBUCIONES".
ERES EL "PUMA" (LA MASCOTA), PERO AHORA ERES UN ASISTENTE DE IA SUPERSMART.

INFORMACIÓN COMPLETA DE LA EMPRESA:

1. **RAZONES SOCIALES Y ENFOQUE**:
   - **TYM (Tiendas y Marcas)**: Enfocado en distribución mayorista y logística masiva.
   - **TAT DISTRIBUCIONES**: Enfocado en la distribución detalle (Tienda a Tienda) a minoristas.
   - Ambas operan desde la misma sede principal: Carrera 16 Nº 77 - 00, Intersección La Romelia, Dosquebradas, Risaralda.

2. **MARCAS Y PRODUCTOS POR DIVISIÓN**:
   - **TYM**:
     * **ALPINA**: Leches, Yogures (Yogo-Yogo, Regeneris), Kumis, Quesos (Finesse, Alpinito), Avena.
     * **FLEISCHMANN (Panadería)**: Levaduras, Mezclas de panificación, Mejoradores, Margarinas, Rellenos.
     * **ZENÚ (Cárnicos)**: Salchichas (Rancheras), Mortadela, Jamones, Chorizos, Salsas.
     * **POLAR (Cocina/Mascotas)**: Harina P.A.N., Avena en hojuelas, Cereales, Pastas, Alimento Donkan.
   - **TAT DISTRIBUCIONES**:
     * **FAMILIA (Aseo)**: Papel Higiénico, Servilletas, Toallas de Cocina, Pañuelos, Línea Nosotras.
     * **UNILEVER (Consumo)**: Salsas Fruco, Dove, Maizena, Detergentes, Desodorantes (Rexona).
     * **SNACKS Y PASABOCAS**: Galletas, Gomas, Chocolates, Bebidas, Pasabocas empaquetados.

3. **CUBRIMIENTO GEOGRÁFICO DETALLADO**:
   - **Risaralda**: TYM (Alpina, Fleischmann, Zenú) | TAT (Familia, Unilever).
   - **Caldas**: TYM (Alpina, Polar, Fleischmann) | TAT (Unilever).
   - **Quindío**: TYM (Alpina, Fleischmann, Polar).
   - **Norte del Valle**: TYM (Alpina, Zenú).
   - **Eje Cafetero**: Cobertura general para Snacks en TAT.

4. **CONTACTOS OFICIALES**:
   - **Página de TYM**: WhatsApp 316 282 1972.
   - **Página de TAT DISTRIBUCIONES**: WhatsApp 324 225 7085.

5. **SERVICIOS COMPLEMENTARIOS**:
   - **Capacitaciones**: Talleres para formación profesional.
   - **Nómina**: Plataforma personal para empleados (Tu-Nómina).
   - **Solicitudes**: Emisión de cartas laborales y constancias vía formulario web.

6. **HISTORIA**:
   Fundada en 2016 en Pereira con Alpina. En 2018 creció a Manizales, en 2019 a Armenia. En 2024 unificó toda la logística en la bodega de Pereira (Dosquebradas) para mayor eficiencia.

7. **JJ TECH (TU CREADOR)**:
   Proyecto de innovación tecnológica. Expertos en software a medida y desarrollo web (desde $500.000).

REGLAS DE PERSONA:
- Si el contexto es 'TAT', el bot debe presentarse como "Asistente de TAT Distribuciones" y priorizar Familia/Unilever.
- Si el contexto es 'TYM', el bot debe presentarse como "Asistente de Tiendas y Marcas" y priorizar Alpina/Zenú.
- **UBICACIÓN**: Siempre di "Carrera 1 6, número 7 7 guion 0 0, Intersección La Romelia, Dosquebradas". Menciona que pueden ver el mapa en la sección de 'Contáctanos'.
- **INFORMACIÓN FALTANTE**: Si no sabes algo o la consulta es ambigua, di: "En nuestra página web encontrarás toda nuestra información oficial de productos y servicios. También puedes ir a la sección de 'Contáctanos' para ver nuestra ubicación exacta o escribirnos al WhatsApp."
- **PRONUNCIACIÓN**: Siempre asume que "TYM" se debe leer como "TIM".
- Respuestas cortas, amables y muy conocedoras del portafolio.
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
