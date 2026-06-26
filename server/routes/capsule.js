const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../db');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  try {
    const { userId, count, season, style } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const garments = await pool.query(
      'SELECT id, name, category, color, brand, times_worn FROM garments WHERE user_id = $1',
      [userId]
    );

    if (garments.rows.length === 0) {
      return res.status(400).json({ error: 'No hay prendas en el armario' });
    }

    const prompt = `El usuario quiere crear un armario cápsula de ${count || 10} prendas para ${season || 'todo el año'} con estilo ${style || 'versátil'}.

Inventario disponible:
${JSON.stringify(garments.rows, null, 2)}

Selecciona las ${count || 10} prendas óptimas que:
1. Maximicen combinaciones posibles entre sí
2. Cubran las principales ocasiones (casual, trabajo, evento)
3. Tengan paleta de colores cohesiva
4. Incluyan las prendas más versátiles

Para cada prenda seleccionada explica brevemente por qué es esencial.
Responde SOLO en JSON válido:
{
  "capsule": [
    {"garment_id": 1, "reason": "por qué es esencial"}
  ],
  "total_outfits_possible": 42,
  "color_palette": ["negro", "blanco", "camel"],
  "summary": "breve descripción de la cápsula"
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

    const ids = data.capsule.map(c => c.garment_id);
    if (ids.length > 0) {
      const garmentsData = await pool.query(
        'SELECT * FROM garments WHERE id = ANY($1)',
        [ids]
      );
      const gMap = {};
      garmentsData.rows.forEach(g => gMap[g.id] = g);
      data.capsule = data.capsule.map(c => ({ ...c, garment: gMap[c.garment_id] }));
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando cápsula' });
  }
});

module.exports = router;
