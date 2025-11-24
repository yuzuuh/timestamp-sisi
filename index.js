'use strict';

const express = require('express');
const cors = require('cors');
const dns = require('dns');
const { URL } = require('url');

const app = express();

// Si la app está detrás de proxy (Render, Heroku)
app.set('trust proxy', true);

// middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false })); // importante para manejar form POST (body parser)
app.use(express.json());

// Ruta base (usa views/index.html si lo tenés)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// ----------------- Request Header Parser -----------------
app.get('/api/whoami', (req, res) => {
  const xff = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
  let ipaddress = '';
  if (xff) {
    ipaddress = String(xff).split(',')[0].trim();
  } else if (req.ip) {
    ipaddress = req.ip;
  } else {
    ipaddress = req.connection && req.connection.remoteAddress ? req.connection.remoteAddress : '';
  }

  const acceptLang = req.headers['accept-language'] || '';
  const language = acceptLang.split(',')[0] || '';

  const userAgent = req.headers['user-agent'] || '';
  const match = userAgent.match(/\(([^)]+)\)/);
  const software = match ? match[1] : userAgent;

  res.json({ ipaddress, language, software });
});
// ---------------------------------------------------------

// ----------------- Timestamp Microservice ----------------
function buildTimeResponse(d) {
  return { unix: d.getTime(), utc: d.toUTCString() };
}


app.get('/api', (req, res) => {
  res.json(buildTimeResponse(new Date()));
});


app.get('/api/:date', (req, res) => {
 
 const { date } = req.params;
  let dateObj;


  if (/^\d+$/.test(date)) {
    // dígitos puros: tratar como timestamp (ms o s)
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
// ---------------------------------------------------------

// ----------------- URL Shortener Microservice -------------
/*
 POST /api/shorturl
   - body: url=<original_url>
   - validates url format and dns.lookup(hostname)
   - response on success: { original_url, short_url }
   - response on invalid: { error: 'invalid url' }

 GET /api/shorturl/:short_url
   - redirects to original url if exists
   - otherwise returns { error: 'No short URL found for the given input' }
*/

// almacenamiento en memoria (para FCC es suficiente)
const urlToId = {};
const idToUrl = {};
let nextId = 1;

app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  if (!/^https?:\/\//i.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  let hostname;
  try {
    const parsed = new URL(originalUrl);
    hostname = parsed.hostname;
  } catch (e) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(hostname, (err/*, address, family*/) => {
    if (err) {
      // dns no resolvió -> url inválida
      return res.json({ error: 'invalid url' });
    }

    if (urlToId[originalUrl]) {
      return res.json({ original_url: originalUrl, short_url: urlToId[originalUrl] });
    }

    const id = nextId++;
    urlToId[originalUrl] = id;
    idToUrl[id] = originalUrl;

    return res.json({ original_url: originalUrl, short_url: id });
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  const original = idToUrl[id];
  if (!original) {
    return res.json({ error: 'No short URL found for the given input' });
  }

  return res.redirect(original);
});

// File Metadata Microservice - agrega esto a tu index.js
const multer = require('multer');

// usar memoria (no guardamos archivos en disco)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint esperado por FCC: POST /api/fileanalyse
app.post('/api/fileanalyse', upload.single('upfile'), (req, res) => {
  // req.file viene de multer
  if (!req.file) {
    return res.status(400).json({ error: 'no file uploaded' });
  }

  const file = req.file;
  res.json({
    name: file.originalname,
    type: file.mimetype,
    size: file.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`All microservices running on port ${PORT}`);
});
