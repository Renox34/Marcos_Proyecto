const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const upload = require('../upload');
const { asyncHandler } = require('../middleware');

router.get('/', asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });
  const result = await pool.query(
    'SELECT * FROM outfits WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json(result.rows);
}));

router.post('/', upload.single('thumbnail'), asyncHandler(async (req, res) => {
  const { userId, name, garmentIds, occasion, season } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId requerido' });

  const ids = garmentIds ? (Array.isArray(garmentIds) ? garmentIds.map(Number) : JSON.parse(garmentIds)) : [];
  const thumbnailUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const result = await pool.query(
    `INSERT INTO outfits (user_id, name, garment_ids, occasion, season, thumbnail_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [userId, name || 'Mi Outfit', ids, occasion || '', season || '', thumbnailUrl]
  );
  res.json(result.rows[0]);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const { name, occasion } = req.body;
  const result = await pool.query(
    `UPDATE outfits SET name=COALESCE($1,name), occasion=COALESCE($2,occasion) WHERE id=$3 RETURNING *`,
    [name || null, occasion || null, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Outfit no encontrado' });
  res.json(result.rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM outfits WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'Outfit no encontrado' });
  res.json({ success: true });
}));

module.exports = router;
