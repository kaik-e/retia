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

// Get all templates
router.get('/', (req, res) => {
  db.all('SELECT * FROM templates ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single template
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM templates WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(row);
  });
});

// Upload new template
router.post('/', upload.single('template'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const id = uuidv4();
  const name = req.body.name || path.basename(req.file.originalname, '.html');
  const filename = req.file.filename;

  db.run(
    'INSERT INTO templates (id, name, filename) VALUES (?, ?, ?)',
    [id, name, filename],
    function(err) {
      if (err) {
        // Delete uploaded file if database insert fails
        fs.unlinkSync(path.join(templatesDir, filename));
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id,
        name,
        filename,
        created_at: new Date().toISOString()
      });
    }
  );
});

// Delete template
router.delete('/:id', (req, res) => {
  // First check if template is in use
  db.get(
    'SELECT COUNT(*) as count FROM domains WHERE template_id = ?',
    [req.params.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (row.count > 0) {
        return res.status(400).json({ error: 'Template is in use by domains' });
      }

      // Get template info to delete file
      db.get('SELECT filename FROM templates WHERE id = ?', [req.params.id], (err, template) => {
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
          const filePath = path.join(templatesDir, template.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.json({ message: 'Template deleted successfully' });
        });
      });
    }
  );
});

// Get template content
router.get('/:id/content', (req, res) => {
  db.get('SELECT filename FROM templates WHERE id = ?', [req.params.id], (err, template) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const filePath = path.join(templatesDir, template.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Template file not found' });
    }

    res.sendFile(path.resolve(filePath));
  });
});

module.exports = router;
