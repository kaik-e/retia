const express = require('express');
const router = express.Router();
const db = require('../database');

// Get analytics for a domain
router.get('/:domainId', (req, res) => {
  const { domainId } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  db.all(
    `SELECT * FROM access_logs 
     WHERE domain_id = ? 
     ORDER BY timestamp DESC 
     LIMIT ? OFFSET ?`,
    [domainId, parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get analytics summary
router.get('/:domainId/summary', (req, res) => {
  const { domainId } = req.params;
  const { days = 7 } = req.query;

  const queries = {
    total: `SELECT COUNT(*) as count FROM access_logs WHERE domain_id = ? AND timestamp >= datetime('now', '-${days} days')`,
    blocked: `SELECT COUNT(*) as count FROM access_logs WHERE domain_id = ? AND action LIKE 'blocked%' AND timestamp >= datetime('now', '-${days} days')`,
    redirected: `SELECT COUNT(*) as count FROM access_logs WHERE domain_id = ? AND action = 'redirected' AND timestamp >= datetime('now', '-${days} days')`,
    byCountry: `SELECT country, COUNT(*) as count FROM access_logs WHERE domain_id = ? AND timestamp >= datetime('now', '-${days} days') GROUP BY country ORDER BY count DESC LIMIT 10`,
    byAction: `SELECT action, COUNT(*) as count FROM access_logs WHERE domain_id = ? AND timestamp >= datetime('now', '-${days} days') GROUP BY action ORDER BY count DESC`
  };

  const results = {};

  db.get(queries.total, [domainId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    results.total = row.count;

    db.get(queries.blocked, [domainId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      results.blocked = row.count;

      db.get(queries.redirected, [domainId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        results.redirected = row.count;

        db.all(queries.byCountry, [domainId], (err, rows) => {
          if (err) return res.status(500).json({ error: err.message });
          results.byCountry = rows;

          db.all(queries.byAction, [domainId], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            results.byAction = rows;

            res.json(results);
          });
        });
      });
    });
  });
});

// Clear analytics for a domain
router.delete('/:domainId', (req, res) => {
  const { domainId } = req.params;

  db.run('DELETE FROM access_logs WHERE domain_id = ?', [domainId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Analytics cleared', deleted: this.changes });
  });
});

module.exports = router;
