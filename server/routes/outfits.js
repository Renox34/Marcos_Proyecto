const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, 'outfit-' + Date.now() + '.png')
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });
    const result = await pool.query(
      'SELECT * FROM outfits WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener outfits' });
  }
});

router.post('/', upload.single('thumbnail'), async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar outfit' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM outfits WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando outfit' });
  }
});

module.exports = router;
