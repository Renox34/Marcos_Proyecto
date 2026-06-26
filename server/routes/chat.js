const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;
    if (!message || !userId) return res.status(400).json({ error: 'message y userId requeridos' });

    const garments = await pool.query(
      'SELECT id, name, category, color, brand, tags, times_worn FROM garments WHERE user_id = $1',
      [userId]
    );

    const systemPrompt = `Eres VERA, la asistente de moda personal de VESTRY, una app de closet digital elegante.
Eres sofisticada, concisa y con un ojo impecable para la moda. Tu personalidad: directa, cálida, con toques de humor refinado.

El usuario tiene estas prendas disponibles en su armario:
${JSON.stringify(garments.rows, null, 2)}

Cuando sugieras outfits, usa los IDs reales de las prendas del inventario anterior.
Responde SIEMPRE en español. Sé elegante pero accesible.

Si sugieres un outfit específico, incluye al final un bloque JSON en este formato exacto (no lo omitas si das sugerencia de outfit):
\`\`\`json
{"suggested_garment_ids": [1, 2, 3]}
\`\`\`

Si no hay prendas suficientes para la ocasión, sugiere qué comprar de forma general.`;

    const history = conversationHistory.slice(-10);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }]
    });

    res.json({ reply: response.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al conectar con VERA' });
  }
});

module.exports = router;
