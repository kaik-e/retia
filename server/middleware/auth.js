const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'retia-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is master
const requireMaster = (req, res, next) => {
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Master access required' });
  }
  next();
};

// Login function
const login = (username, password, callback) => {
  db.get(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username],
    (err, user) => {
      if (err) {
        return callback({ success: false, error: 'Database error' });
      }

      if (!user || user.password !== password) {
        return callback({ success: false, error: 'Invalid credentials' });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      const token = jwt.sign(
        { 
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      callback({ 
        success: true, 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    }
  );
};

module.exports = {
  authenticateToken,
  requireMaster,
  login,
  JWT_SECRET
};
