const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const [byCategory, topWorn, sleeping, colors, total] = await Promise.all([
      pool.query(
        'SELECT category, COUNT(*) as count FROM garments WHERE user_id = $1 GROUP BY category ORDER BY count DESC',
        [userId]
      ),
      pool.query(
        'SELECT id, name, category, color, image_url, times_worn FROM garments WHERE user_id = $1 ORDER BY times_worn DESC LIMIT 10',
        [userId]
      ),
      pool.query(
        `SELECT id, name, category, color, image_url, times_worn, last_worn
         FROM garments WHERE user_id = $1
         AND (last_worn < NOW() - INTERVAL '60 days' OR last_worn IS NULL)
         ORDER BY last_worn ASC NULLS FIRST`,
        [userId]
      ),
      pool.query(
        'SELECT color, COUNT(*) as count FROM garments WHERE user_id = $1 AND color != \'\' GROUP BY color ORDER BY count DESC LIMIT 12',
        [userId]
      ),
      pool.query('SELECT COUNT(*) as total FROM garments WHERE user_id = $1', [userId])
    ]);

    const saturation = byCategory.rows.filter(r => parseInt(r.count) > 8);

    res.json({
      byCategory: byCategory.rows,
      topWorn: topWorn.rows,
      sleeping: sleeping.rows,
      colors: colors.rows,
      total: parseInt(total.rows[0].total),
      saturation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generando análisis' });
  }
});

module.exports = router;
