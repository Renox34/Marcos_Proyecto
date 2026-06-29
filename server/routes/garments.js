const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('../db');
const upload = require('../upload');
const { asyncHandler } = require('../middleware');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/garments/analyze — VERA identifica prenda desde imagen base64
router.post('/analyze', asyncHandler(async (req, res) => {
  const { image, mimeType = 'image/png' } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
        { type: 'text', text: 'Analiza esta prenda de ropa. Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional: {"name":"nombre descriptivo en español","category":"top|bottom|dress|outerwear|shoes|accessory","color":"color principal en español en minúsculas"}' }
      ]
    }]
  });

  const raw = response.content[0].text.trim().replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  res.json(JSON.parse(raw));
}));

router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });
  const result = await pool.query(
    'SELECT * FROM garments WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json(result.rows);
}));

router.post('/', upload.fields([{ name: 'image' }, { name: 'original' }]), asyncHandler(async (req, res) => {
  const { userId, name, category, color, brand, tags, price } = req.body;
  if (!userId || !req.files?.image) {
    return res.status(400).json({ error: 'userId e imagen requeridos' });
  }
  const imageUrl = `/uploads/${req.files.image[0].filename}`;
  const originalUrl = req.files.original ? `/uploads/${req.files.original[0].filename}` : imageUrl;
  const tagsArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

  const result = await pool.query(
    `INSERT INTO garments (user_id, name, category, color, brand, image_url, original_url, tags, price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, name || 'Sin nombre', category || 'top', color || '', brand || '', imageUrl, originalUrl, tagsArray, price || null]
  );
  res.json(result.rows[0]);
}));

// PATCH /api/garments/:id — editar prenda (campos + imagen opcional)
router.patch('/:id', upload.fields([{ name: 'image' }, { name: 'original' }]), asyncHandler(async (req, res) => {
  const { name, category, color, brand, price } = req.body;

  const params  = [name, category, color || '', brand || '', price || null];
  let imgClause = '';

  if (req.files?.image) {
    const imageUrl    = `/uploads/${req.files.image[0].filename}`;
    const originalUrl = req.files.original ? `/uploads/${req.files.original[0].filename}` : imageUrl;
    params.push(imageUrl, originalUrl);
    imgClause = `, image_url=$6, original_url=$7`;
  }

  params.push(req.params.id);
  const idIdx  = params.length;
  const result = await pool.query(
    `UPDATE garments SET name=$1,category=$2,color=$3,brand=$4,price=$5${imgClause} WHERE id=$${idIdx} RETURNING *`,
    params
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Prenda no encontrada' });
  res.json(result.rows[0]);
}));

router.patch('/:id/worn', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE garments SET times_worn = times_worn + 1, last_worn = CURRENT_DATE
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Prenda no encontrada' });
  res.json(result.rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM garments WHERE id = $1 RETURNING image_url, original_url', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Prenda no encontrada' });

  const { image_url, original_url } = result.rows[0];
  const urls = new Set([image_url, original_url]);
  for (const url of urls) {
    if (!url) continue;
    const filePath = path.join(__dirname, '..', url);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') console.error('Error eliminando archivo:', filePath, err.message);
    }
  }
  res.json({ success: true });
}));

module.exports = router;
