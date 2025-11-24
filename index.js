'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// Allow cross-origin requests (FreeCodeCamp requiere esto para probar)
app.use(cors());

// Servir carpeta public si querís una UI (index.html), opcional
app.use(express.static('public'));

// Endpoint base (opcional: puede devolver un README o html)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // crea public/index.html si querís
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

  // Si la entrada es solo dígitos, puede ser unix en segundos o milisegundos.
  // Detectamos por longitud: 13 dígitos => ms. 10 dígitos (o menos) => segundos.
  let dateObj;
  if (/^\d+$/.test(date)) {
    // dígitos puros
    if (date.length === 13) {
      // ya está en ms
      dateObj = new Date(Number(date));
    } else {
      // asumimos segundos u otro -> convertir a ms
      dateObj = new Date(Number(date) * 1000);
    }
  } else {
    // intenta parsear string de fecha (ej: "2015-12-25")
    dateObj = new Date(date);
  }

  if (dateObj.toString() === 'Invalid Date') {
    return res.json({ error: 'Invalid Date' });
  }

  return res.json(buildTimeResponse(dateObj));
});

// Puerto (soporta env var PORT para deploys)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Timestamp microservice running on port ${PORT}`);
});
