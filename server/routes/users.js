const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { requireMaster } = require('../middleware/auth');

// All routes require master role
router.use(requireMaster);

// Get all users
router.get('/', (req, res) => {
  db.all(
    'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(users);
    }
  );
});

// Get single user
router.get('/:id', (req, res) => {
  db.get(
    'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ?',
    [req.params.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Create user
router.post('/', (req, res) => {
  const { username, password, email, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (role === 'master') {
    return res.status(403).json({ error: 'Cannot create master users' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO users (id, username, password, email, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [id, username, password, email || null, role || 'user'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      db.get(
        'SELECT id, username, email, role, is_active, created_at FROM users WHERE id = ?',
        [id],
        (err, user) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.status(201).json(user);
        }
      );
    }
  );
});

// Update user
router.put('/:id', (req, res) => {
  const { username, password, email, role, is_active } = req.body;

  // Prevent changing master user
  db.get('SELECT role FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'master') {
      return res.status(403).json({ error: 'Cannot modify master user' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (password) {
      updates.push('password = ?');
      values.push(password);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role && role !== 'master') {
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        db.get(
          'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
          [req.params.id],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json(user);
          }
        );
      }
    );
  });
});

// Delete user
router.delete('/:id', (req, res) => {
  // Prevent deleting master user
  db.get('SELECT role FROM users WHERE id = ?', [req.params.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'master') {
      return res.status(403).json({ error: 'Cannot delete master user' });
    }

    db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

module.exports = router;
