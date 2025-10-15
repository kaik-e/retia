const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const templatesDir = process.env.TEMPLATES_DIR || './data/templates';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templatesDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html' || path.extname(file.originalname) === '.html') {
      cb(null, true);
    } else {
      cb(new Error('Only HTML files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all templates for current user
router.get('/', (req, res) => {
  const userId = req.user?.id || 'master-user-id';
  
  db.all(
    'SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get single template (check ownership)
router.get('/:id', (req, res) => {
  const userId = req.user?.id || 'master-user-id';
  
  db.get(
    'SELECT * FROM templates WHERE id = ? AND user_id = ?',
    [req.params.id, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(row);
    }
  );
});

// Upload new template
router.post('/', upload.single('template'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userId = req.user?.id || 'master-user-id';
  const id = uuidv4();
  const name = req.body.name || path.basename(req.file.originalname, '.html');
  const file_path = req.file.filename;

  db.run(
    'INSERT INTO templates (id, user_id, name, file_path) VALUES (?, ?, ?, ?)',
    [id, userId, name, file_path],
    function(err) {
      if (err) {
        // Delete uploaded file if database insert fails
        fs.unlinkSync(path.join(templatesDir, file_path));
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id,
        user_id: userId,
        name,
        file_path,
        created_at: new Date().toISOString()
      });
    }
  );
});

// Delete template (check ownership)
router.delete('/:id', (req, res) => {
  const userId = req.user?.id || 'master-user-id';
  
  // First check if template is in use
  db.get(
    'SELECT COUNT(*) as count FROM domains WHERE template_id = ? OR lockdown_template_id = ?',
    [req.params.id, req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row.count > 0) {
        return res.status(400).json({ error: 'Template is in use by domains' });
      }

      // Get template info to delete file (check ownership)
      db.get(
        'SELECT file_path FROM templates WHERE id = ? AND user_id = ?',
        [req.params.id, userId],
        (err, template) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          if (!template) {
            return res.status(404).json({ error: 'Template not found' });
          }

          // Delete from database
          db.run('DELETE FROM templates WHERE id = ?', [req.params.id], (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Delete file
            const filePath = path.join(templatesDir, template.file_path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }

            res.json({ message: 'Template deleted successfully' });
          });
        }
      );
    }
  );
});

// Get template content (check ownership)
router.get('/:id/content', (req, res) => {
  const userId = req.user?.id || 'master-user-id';
  
  db.get(
    'SELECT file_path FROM templates WHERE id = ? AND user_id = ?',
    [req.params.id, userId],
    (err, template) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const filePath = path.join(templatesDir, template.file_path);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Template file not found' });
      }

      res.sendFile(path.resolve(filePath));
    }
  );
});

module.exports = router;
