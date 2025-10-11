const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'retia-secret-key-change-in-production';

// Default credentials
const DEFAULT_USER = {
  username: 'retia',
  password: 'Retia10@@' // In production, this should be hashed
};

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

// Login function
const login = (username, password) => {
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    const token = jwt.sign(
      { username: DEFAULT_USER.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return { success: true, token };
  }
  return { success: false, error: 'Invalid credentials' };
};

module.exports = {
  authenticateToken,
  login,
  JWT_SECRET
};
