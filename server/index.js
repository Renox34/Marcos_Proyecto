require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/users', require('./routes/users'));
app.use('/api/garments', require('./routes/garments'));
app.use('/api/outfits', require('./routes/outfits'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/capsule', require('./routes/capsule'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n✨ VESTRY corriendo en http://localhost:${PORT}`);
    console.log(`   Base de datos: ${process.env.DATABASE_URL?.split('@')[1] || 'configurada'}`);
  });
}

start();
