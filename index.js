require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let urlDatabase = {};  // Kısaltılmış URL'leri saklayacağımız in-memory (geçici) bir obje
let urlCounter = 1;    // Her yeni URL için artan bir sayaç

// Root Route
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Example API Endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// URL Kısaltma API'si
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  const urlPattern = /^https?:\/\/(www\.)?/i;  // URL'nin geçerliliğini kontrol eden bir regex

  if (!urlPattern.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // DNS lookup ile domain geçerliliğini kontrol et
  const hostname = originalUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  dns.lookup(hostname, (err, addresses) => {
    if (err || !addresses) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = urlCounter++;  // Kısaltılmış URL için benzersiz bir ID
    urlDatabase[shortUrl] = originalUrl;  // Orijinal URL'yi kısaltılmış ID ile eşleştir

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// Kısaltılmış URL ile Yönlendirme
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);  // Orijinal URL'ye yönlendir
  } else {
    res.json({ error: 'No short URL found' });
  }
});

// Server'ı dinleme
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
