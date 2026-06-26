const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, 'avatar-' + Date.now() + '.png')
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      const user = await pool.query('SELECT id, name, email, avatar_url, style_preferences FROM users WHERE email = $1', [email]);
      return res.json({ user: user.rows[0], isNew: false });
    }

    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      'INSERT INTO users (name, email, avatar_url) VALUES ($1,$2,$3) RETURNING id, name, email, avatar_url, style_preferences',
      [name, email, avatarUrl]
    );
    res.json({ user: result.rows[0], isNew: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.patch('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
    const avatarUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING *',
      [avatarUrl, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando avatar' });
  }
});

router.patch('/:id/styles', async (req, res) => {
  try {
    const { styles } = req.body;
    const result = await pool.query(
      'UPDATE users SET style_preferences = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(styles), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estilos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, style_preferences FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});

module.exports = router;
