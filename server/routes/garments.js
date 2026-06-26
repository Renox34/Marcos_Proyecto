const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '.png');
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });
    const result = await pool.query(
      'SELECT * FROM garments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener prendas' });
  }
});

router.post('/', upload.fields([{ name: 'image' }, { name: 'original' }]), async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar prenda' });
  }
});

router.patch('/:id/worn', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE garments SET times_worn = times_worn + 1, last_worn = CURRENT_DATE
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando uso' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM garments WHERE id = $1 RETURNING image_url, original_url', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Prenda no encontrada' });

    const { image_url, original_url } = result.rows[0];
    [image_url, original_url].forEach(url => {
      if (url) {
        const filePath = path.join(__dirname, '..', url);
        fs.unlink(filePath, () => {});
      }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando prenda' });
  }
});

module.exports = router;
