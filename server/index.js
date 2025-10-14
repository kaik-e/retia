require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure required directories exist
const templatesDir = process.env.TEMPLATES_DIR || './data/templates';

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Initialize database
require('./database');

const { authenticateToken } = require('./middleware/auth');

// Serve static files from templates directory (public for preview)
app.use('/templates', express.static(templatesDir));

// Public routes (no auth required)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cloak', require('./routes/cloak')); // Cloaking must be public

// Protected routes (auth required)
app.use('/api/templates', authenticateToken, require('./routes/templates'));
app.use('/api/domains', authenticateToken, require('./routes/domains'));
app.use('/api/analytics', authenticateToken, require('./routes/analytics'));
app.use('/api/users', authenticateToken, require('./routes/users'));
app.use('/api/cloudflare', authenticateToken, require('./routes/cloudflare'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Retia API running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Connected to database`);
});
