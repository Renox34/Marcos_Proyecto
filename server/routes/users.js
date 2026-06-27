const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const upload = require('../upload');
const { asyncHandler, generateToken } = require('../middleware');

router.post('/register', upload.single('avatar'), asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email requeridos' });

  const existing = await pool.query('SELECT id, name, email, avatar_url, style_preferences FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    const token = generateToken(user);
    return res.json({ user, token, isNew: false });
  }

  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const result = await pool.query(
    'INSERT INTO users (name, email, avatar_url) VALUES ($1,$2,$3) RETURNING id, name, email, avatar_url, style_preferences',
    [name, email, avatarUrl]
  );
  const user = result.rows[0];
  const token = generateToken(user);
  res.json({ user, token, isNew: true });
}));

router.patch('/:id/avatar', upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  const result = await pool.query(
    'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, avatar_url, style_preferences',
    [avatarUrl, req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
}));

router.patch('/:id/styles', asyncHandler(async (req, res) => {
  const { styles } = req.body;
  const result = await pool.query(
    'UPDATE users SET style_preferences = $1::jsonb WHERE id = $2 RETURNING id, name, email, avatar_url, style_preferences',
    [JSON.stringify(styles), req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, avatar_url, style_preferences FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(result.rows[0]);
}));

module.exports = router;
