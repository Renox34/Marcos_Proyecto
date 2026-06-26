const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { userId, month } = req.query;
    if (!userId || !month) return res.status(400).json({ error: 'userId y month requeridos' });

    const result = await pool.query(
      `SELECT ce.*, o.name as outfit_name, o.thumbnail_url, o.garment_ids
       FROM calendar_entries ce
       LEFT JOIN outfits o ON o.id = ce.outfit_id
       WHERE ce.user_id = $1 AND TO_CHAR(ce.date, 'YYYY-MM') = $2
       ORDER BY ce.date`,
      [userId, month]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener calendario' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, outfitId, date, notes } = req.body;
    if (!userId || !date) return res.status(400).json({ error: 'userId y date requeridos' });

    const result = await pool.query(
      `INSERT INTO calendar_entries (user_id, outfit_id, date, notes)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, date) DO UPDATE
       SET outfit_id = $2, notes = $4
       RETURNING *`,
      [userId, outfitId || null, date, notes || '']
    );

    if (outfitId) {
      const outfit = await pool.query('SELECT garment_ids FROM outfits WHERE id = $1', [outfitId]);
      if (outfit.rows[0]?.garment_ids?.length) {
        for (const gid of outfit.rows[0].garment_ids) {
          await pool.query(
            'UPDATE garments SET times_worn = times_worn + 1, last_worn = $1 WHERE id = $2',
            [date, gid]
          );
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar entrada de calendario' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_entries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando entrada' });
  }
});

module.exports = router;
