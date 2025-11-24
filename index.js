'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// Si tu app está detrás de un proxy (Render, Heroku, etc.) para obtener IP real:
app.set('trust proxy', true);

// Allow cross-origin requests (FreeCodeCamp requiere esto para probar)
app.use(cors());

// Endpoint base
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ----- Request Header Parser Microservice -----
// Endpoint que devuelve ipaddress, language y software
app.get('/api/whoami', (req, res) => {
  // IP: preferimos x-forwarded-for (puede contener lista), si no -> req.ip
  const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
  let ipaddress = '';
  if (xff) {
    // x-forwarded-for: "client, proxy1, proxy2"
    ipaddress = String(xff).split(',')[0].trim();
  } else if (req.ip) {
    ipaddress = req.ip;
  } else {
    ipaddress = req.connection && req.connection.remoteAddress ? req.connection.remoteAddress : '';
  }

  // Language: primer valor del header accept-language
  const acceptLang = req.headers['accept-language'] || '';
  const language = acceptLang.split(',')[0];

  // Software: el user-agent completo (o podés extraer la sección entre paréntesis)
  const userAgent = req.headers['user-agent'] || '';
  // Opcional: extraer texto entre paréntesis si existe, para que quede más corto
  const match = userAgent.match(/\(([^)]+)\)/);
  const software = match ? match[1] : userAgent;

  res.json({
    ipaddress,
    language,
    software
  });
});
// -----------------------------------------------

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

// Endpoint con parámetro (timestamp)
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
  console.log(`Timestamp + Header microservices running on port ${PORT}`);
});
