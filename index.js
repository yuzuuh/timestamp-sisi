'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// Allow cross-origin requests (FreeCodeCamp requiere esto para probar)
app.use(cors());

// Endpoint base
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html'); // apunta a views
});

// Helper: crea el objeto de respuesta dado un Date válido
function buildTimeResponse(d) {
  return {
    unix: d.getTime(),
    utc: d.toUTCString()
  };
}

// Endpoint principal: devuelve fecha actual
app.get('/api', (req, res) => {
  const now = new Date();
  res.json(buildTimeResponse(now));
});

// Endpoint con parámetro
app.get('/api/:date', (req, res) => {
  const { date } = req.params;

  let dateObj;
  if (/^\d+$/.test(date)) {
    if (date.length === 13) {
      dateObj = new Date(Number(date));
    } else {
      dateObj = new Date(Number(date) * 1000);
    }
  } else {
    dateObj = new Date(date);
  }

  if (dateObj.toString() === 'Invalid Date') {
    return res.json({ error: 'Invalid Date' });
  }

  return res.json(buildTimeResponse(dateObj));
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Timestamp microservice running on port ${PORT}`);
});
