const express = require('express');
const router = express.Router();
const db = require('../database');
const CloudflareService = require('../services/cloudflare');
const { v4: uuidv4 } = require('uuid');

// Get user's Cloudflare settings
router.get('/settings', (req, res) => {
  db.get(
    'SELECT cloudflare_api_token, cloudflare_account_id FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        hasToken: !!row?.cloudflare_api_token,
        accountId: row?.cloudflare_account_id || null
      });
    }
  );
});

// Save Cloudflare API token
router.post('/settings', async (req, res) => {
  const { apiToken, accountId } = req.body;

  if (!apiToken) {
    return res.status(400).json({ error: 'API token is required' });
  }

  try {
    // Verify token is valid
    const cf = new CloudflareService(apiToken);
    await cf.verifyToken();

    // Save to database
    db.run(
      'UPDATE users SET cloudflare_api_token = ?, cloudflare_account_id = ? WHERE id = ?',
      [apiToken, accountId || null, req.user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Cloudflare settings saved successfully' });
      }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete Cloudflare settings
router.delete('/settings', (req, res) => {
  db.run(
    'UPDATE users SET cloudflare_api_token = NULL, cloudflare_account_id = NULL WHERE id = ?',
    [req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Cloudflare settings removed' });
    }
  );
});

// List zones from Cloudflare
router.get('/zones', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT cloudflare_api_token FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.cloudflare_api_token) {
      return res.status(400).json({ error: 'Cloudflare API token not configured' });
    }

    const cf = new CloudflareService(user.cloudflare_api_token);
    const zones = await cf.listZones();

    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get zone details
router.get('/zones/:zoneId', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT cloudflare_api_token FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.cloudflare_api_token) {
      return res.status(400).json({ error: 'Cloudflare API token not configured' });
    }

    const cf = new CloudflareService(user.cloudflare_api_token);
    const zone = await cf.getZone(req.params.zoneId);

    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-setup domain from Cloudflare
router.post('/auto-setup', async (req, res) => {
  const { zoneId, domain, targetUrl, templateId } = req.body;

  if (!zoneId || !domain || !targetUrl) {
    return res.status(400).json({ error: 'Zone ID, domain, and target URL are required' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT cloudflare_api_token FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.cloudflare_api_token) {
      return res.status(400).json({ error: 'Cloudflare API token not configured' });
    }

    const vpsIp = process.env.VPS_IP || '185.245.183.247';
    const cf = new CloudflareService(user.cloudflare_api_token);

    // Auto-setup on Cloudflare
    const cfResults = await cf.autoSetupDomain(zoneId, domain, vpsIp);

    // Create domain in our database
    const domainId = uuidv4();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO domains (id, user_id, domain, target_url, template_id, pass_query_params, 
         require_gclid, mobile_only, block_pingable_ips, block_asn, lockdown_mode, lockdown_template_id, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [domainId, req.user.id, domain, targetUrl, templateId || null, true, true, true, false, false, false, null, true],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      success: true,
      domainId,
      cloudflare: cfResults,
      message: 'Domain auto-configured successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List DNS records for a zone
router.get('/zones/:zoneId/dns', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT cloudflare_api_token FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.cloudflare_api_token) {
      return res.status(400).json({ error: 'Cloudflare API token not configured' });
    }

    const cf = new CloudflareService(user.cloudflare_api_token);
    const records = await cf.listDNSRecords(req.params.zoneId);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
