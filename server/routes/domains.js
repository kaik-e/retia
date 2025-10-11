const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Get all domains
router.get('/', (req, res) => {
  const query = `
    SELECT d.*, t.name as template_name
    FROM domains d
    LEFT JOIN templates t ON d.template_id = t.id
    ORDER BY d.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single domain with all settings
router.get('/:id', (req, res) => {
  const query = `
    SELECT d.*, t.name as template_name, t.filename as template_filename
    FROM domains d
    LEFT JOIN templates t ON d.template_id = t.id
    WHERE d.id = ?
  `;
  
  db.get(query, [req.params.id], (err, domain) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Get ASN blocks
    db.all('SELECT * FROM asn_blocks WHERE domain_id = ?', [req.params.id], (err, asnBlocks) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get country blocks
      db.all('SELECT * FROM country_blocks WHERE domain_id = ?', [req.params.id], (err, countryBlocks) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get state blocks
        db.all('SELECT * FROM state_blocks WHERE domain_id = ?', [req.params.id], (err, stateBlocks) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get IP blocks
          db.all('SELECT * FROM ip_blocks WHERE domain_id = ?', [req.params.id], (err, ipBlocks) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              ...domain,
              asn_blocks: asnBlocks,
              country_blocks: countryBlocks,
              state_blocks: stateBlocks,
              ip_blocks: ipBlocks
            });
          });
        });
      });
    });
  });
});

// Create new domain
router.post('/', (req, res) => {
  const {
    domain,
    target_url,
    template_id,
    pass_query_params = true,
    require_gclid = false,
    mobile_only = false,
    block_pingable_ips = false,
    block_asn = false,
    lockdown_mode = false,
    lockdown_template_id = null,
    is_active = true,
    asn_blocks = [],
    country_blocks = [],
    state_blocks = [],
    ip_blocks = []
  } = req.body;

  if (!domain || !target_url) {
    return res.status(400).json({ error: 'Domain and target URL are required' });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO domains (id, domain, target_url, template_id, pass_query_params, 
     require_gclid, mobile_only, block_pingable_ips, block_asn, lockdown_mode, lockdown_template_id, is_active) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, domain, target_url, template_id || null, pass_query_params, require_gclid, mobile_only, block_pingable_ips, block_asn, lockdown_mode, lockdown_template_id || null, is_active],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Insert ASN blocks
      const asnPromises = asn_blocks.map(asn => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO asn_blocks (domain_id, asn, description) VALUES (?, ?, ?)',
            [id, asn.asn, asn.description || null],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      // Insert country blocks
      const countryPromises = country_blocks.map(country => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO country_blocks (domain_id, country_code) VALUES (?, ?)',
            [id, country.country_code],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      // Insert state blocks
      const statePromises = state_blocks.map(state => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO state_blocks (domain_id, country_code, state_code) VALUES (?, ?, ?)',
            [id, state.country_code, state.state_code],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      // Insert IP blocks
      const ipPromises = ip_blocks.map(ip => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO ip_blocks (domain_id, ip_address, description) VALUES (?, ?, ?)',
            [id, ip.ip_address, ip.description || null],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      Promise.all([...asnPromises, ...countryPromises, ...statePromises, ...ipPromises])
        .then(() => {
          // Generate Nginx config
          generateNginxConfig(id);
          res.json({ id, domain, message: 'Domain created successfully' });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        });
    }
  );
});

// Update domain
router.put('/:id', (req, res) => {
  const {
    domain,
    target_url,
    template_id,
    pass_query_params,
    require_gclid,
    mobile_only,
    block_pingable_ips,
    block_asn,
    lockdown_mode,
    lockdown_template_id,
    is_active = true,
    asn_blocks,
    country_blocks,
    state_blocks,
    ip_blocks
  } = req.body;

  db.run(
    `UPDATE domains SET 
     domain = ?, target_url = ?, template_id = ?, pass_query_params = ?,
     require_gclid = ?, mobile_only = ?, block_pingable_ips = ?, block_asn = ?,
     lockdown_mode = ?, lockdown_template_id = ?, is_active = ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [domain, target_url, template_id || null, pass_query_params, require_gclid, mobile_only, block_pingable_ips, block_asn, lockdown_mode, lockdown_template_id || null, is_active, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Delete existing blocks
      db.run('DELETE FROM asn_blocks WHERE domain_id = ?', [req.params.id]);
      db.run('DELETE FROM country_blocks WHERE domain_id = ?', [req.params.id]);
      db.run('DELETE FROM state_blocks WHERE domain_id = ?', [req.params.id]);
      db.run('DELETE FROM ip_blocks WHERE domain_id = ?', [req.params.id]);

      // Re-insert blocks (same logic as create)
      const asnPromises = (asn_blocks || []).map(asn => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO asn_blocks (domain_id, asn, description) VALUES (?, ?, ?)',
            [req.params.id, asn.asn, asn.description || null],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      const countryPromises = (country_blocks || []).map(country => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO country_blocks (domain_id, country_code) VALUES (?, ?)',
            [req.params.id, country.country_code],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      const statePromises = (state_blocks || []).map(state => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO state_blocks (domain_id, country_code, state_code) VALUES (?, ?, ?)',
            [req.params.id, state.country_code, state.state_code],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      const ipPromises = (ip_blocks || []).map(ip => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO ip_blocks (domain_id, ip_address, description) VALUES (?, ?, ?)',
            [req.params.id, ip.ip_address, ip.description || null],
            (err) => err ? reject(err) : resolve()
          );
        });
      });

      Promise.all([...asnPromises, ...countryPromises, ...statePromises, ...ipPromises])
        .then(() => {
          res.json({ message: 'Domain updated successfully' });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        });
    }
  );
});

// Delete domain
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM domains WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    
    res.json({ message: 'Domain deleted successfully' });
  });
});

// Check if domain is proxied (accessible via proxy server)
router.get('/:id/proxy-status', async (req, res) => {
  try {
    const domain = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM domains WHERE id = ?', [req.params.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    // Try to make a request to the domain through the proxy
    const http = require('http');
    
    const options = {
      hostname: '127.0.0.1',
      port: 8080,
      path: '/',
      method: 'GET',
      headers: {
        'Host': domain.domain
      },
      timeout: 3000
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Consume response data to free up memory
      proxyRes.resume();
      
      res.json({
        proxied: proxyRes.statusCode < 500,
        statusCode: proxyRes.statusCode,
        message: proxyRes.statusCode < 500 ? 'Domain is proxied and working' : 'Proxy error'
      });
    });

    proxyReq.on('error', (e) => {
      res.json({
        proxied: false,
        error: e.message,
        message: 'Proxy server not responding or domain not configured'
      });
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      res.json({
        proxied: false,
        message: 'Proxy server timeout'
      });
    });

    proxyReq.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
