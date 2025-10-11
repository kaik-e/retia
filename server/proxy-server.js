const express = require('express');
const vhost = require('vhost');
const db = require('./database');

const app = express();

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[Proxy] ${req.method} ${req.hostname} ${req.url}`);
  next();
});

// Dynamic virtual host handler
app.use((req, res, next) => {
  const hostname = req.hostname;
  
  // Get domain from database
  db.get(
    'SELECT * FROM domains WHERE domain = ? AND is_active = 1',
    [hostname],
    (err, domain) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Internal Server Error');
      }
      
      if (!domain) {
        return res.status(404).send('Domain not configured');
      }
      
      // Redirect to cloaking endpoint
      const cloakUrl = `http://localhost:3000/api/cloak/${domain.id}${req.url}`;
      
      // Forward the request
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(cloakUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: req.method,
        headers: {
          ...req.headers,
          'X-Forwarded-For': req.ip,
          'X-Forwarded-Proto': req.protocol,
          'X-Forwarded-Host': req.hostname,
        }
      };
      
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (e) => {
        console.error('Proxy error:', e);
        res.status(502).send('Bad Gateway');
      });
      
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        req.pipe(proxyReq);
      } else {
        proxyReq.end();
      }
    }
  );
});

const HTTP_PORT = process.env.PROXY_HTTP_PORT || 8080;

// HTTP Server
const httpServer = app.listen(HTTP_PORT, '0.0.0.0', () => {
  console.log(`🚀 HTTP Proxy server running on port ${HTTP_PORT}`);
  console.log(`📡 Ready to handle domain requests`);
  console.log(`💡 Cloudflare will forward to this port`);
  console.log(`☁️  Cloudflare Proxied mode compatible!`);
  console.log(`🔧 Make sure Cloudflare is configured with SSL Flexible`);
});

// HTTPS Server (optional, for SSL)
// Uncomment if you have SSL certificates
/*
const https = require('https');
const fs = require('fs');

const httpsOptions = {
  key: fs.readFileSync('path/to/private.key'),
  cert: fs.readFileSync('path/to/certificate.crt')
};

const httpsServer = https.createServer(httpsOptions, app);
httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log(`🔒 HTTPS Proxy server running on port ${HTTPS_PORT}`);
});
*/

module.exports = app;
