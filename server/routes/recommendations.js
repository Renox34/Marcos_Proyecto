const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  try {
    const { userId, styles } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const garments = await pool.query(
      'SELECT name, category, color, brand FROM garments WHERE user_id = $1',
      [userId]
    );

    const activeStyles = styles || [];

    const prompt = `Analiza el armario de este usuario:
- Prendas existentes: ${JSON.stringify(garments.rows)}
- Estilos que sigue: ${activeStyles.join(', ') || 'ninguno especificado'}

Sugiere exactamente 6 prendas específicas para completar su armario según sus estilos.
Para cada prenda incluye:
1. Nombre específico del producto
2. Por qué complementa su armario actual
3. Precio estimado en USD (número)
4. Temporada ideal de compra para mejor precio
5. Categoría de la prenda (top/bottom/shoes/outerwear/accessory/dress)
6. Color sugerido

Responde SOLO en JSON válido con esta estructura exacta:
{
  "recommendations": [
    {
      "item_name": "nombre del producto",
      "reason": "por qué lo necesita",
      "estimated_price": 49.99,
      "best_season_to_buy": "Enero-Febrero (rebajas de invierno)",
      "style_category": "Minimal Chic",
      "category": "top",
      "color": "blanco crema",
      "asos_link": "https://www.asos.com/search/?q=white+linen+shirt",
      "zara_link": "https://www.zara.com/search?term=camisa+lino+blanca"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Respuesta inválida de IA' });

    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando recomendaciones' });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { userId, item } = req.body;
    const result = await pool.query(
      `INSERT INTO purchase_recommendations (user_id, item_name, style_category, estimated_price, buy_link, best_season_to_buy, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, item.item_name, item.style_category, item.estimated_price, item.asos_link, item.best_season_to_buy, item.reason]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error guardando recomendación' });
  }
});

router.get('/saved', async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await pool.query(
      'SELECT * FROM purchase_recommendations WHERE user_id = $1 ORDER BY saved_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recomendaciones guardadas' });
  }
});

module.exports = router;
