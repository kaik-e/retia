const express = require('express');
const router = express.Router();
const db = require('../database');
const CloudflareService = require('../services/cloudflare');
const GoDaddyService = require('../services/godaddy');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CLOUDFLARE ROUTES
// ============================================

// Get Cloudflare settings
router.get('/cloudflare/settings', (req, res) => {
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

// Save Cloudflare settings
router.post('/cloudflare/settings', async (req, res) => {
  const { apiToken, accountId } = req.body;

  if (!apiToken) {
    return res.status(400).json({ error: 'API token is required' });
  }

  try {
    const cf = new CloudflareService(apiToken);
    await cf.verifyToken();

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
router.delete('/cloudflare/settings', (req, res) => {
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

// List Cloudflare zones
router.get('/cloudflare/zones', async (req, res) => {
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

// Import from Cloudflare
router.post('/cloudflare/import', async (req, res) => {
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

    // Create domain in database
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
      message: 'Domain imported from Cloudflare successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GODADDY ROUTES
// ============================================

// Get GoDaddy settings
router.get('/godaddy/settings', (req, res) => {
  db.get(
    'SELECT godaddy_api_key, godaddy_api_secret FROM users WHERE id = ?',
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        hasCredentials: !!(row?.godaddy_api_key && row?.godaddy_api_secret)
      });
    }
  );
});

// Save GoDaddy settings
router.post('/godaddy/settings', async (req, res) => {
  const { apiKey, apiSecret } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'API key and secret are required' });
  }

  try {
    const gd = new GoDaddyService(apiKey, apiSecret);
    await gd.verifyCredentials();

    db.run(
      'UPDATE users SET godaddy_api_key = ?, godaddy_api_secret = ? WHERE id = ?',
      [apiKey, apiSecret, req.user.id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'GoDaddy settings saved successfully' });
      }
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete GoDaddy settings
router.delete('/godaddy/settings', (req, res) => {
  db.run(
    'UPDATE users SET godaddy_api_key = NULL, godaddy_api_secret = NULL WHERE id = ?',
    [req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'GoDaddy settings removed' });
    }
  );
});

// List GoDaddy domains
router.get('/godaddy/domains', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT godaddy_api_key, godaddy_api_secret FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.godaddy_api_key || !user?.godaddy_api_secret) {
      return res.status(400).json({ error: 'GoDaddy credentials not configured' });
    }

    const gd = new GoDaddyService(user.godaddy_api_key, user.godaddy_api_secret);
    const domains = await gd.listDomains();

    res.json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get GoDaddy domain details
router.get('/godaddy/domains/:domain', async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT godaddy_api_key, godaddy_api_secret FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user?.godaddy_api_key || !user?.godaddy_api_secret) {
      return res.status(400).json({ error: 'GoDaddy credentials not configured' });
    }

    const gd = new GoDaddyService(user.godaddy_api_key, user.godaddy_api_secret);
    const domain = await gd.getDomain(req.params.domain);

    res.json(domain);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import from GoDaddy (full flow: GoDaddy → Cloudflare → Cloaker)
router.post('/godaddy/import', async (req, res) => {
  const { domain, targetUrl, templateId } = req.body;

  if (!domain || !targetUrl) {
    return res.status(400).json({ error: 'Domain and target URL are required' });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT godaddy_api_key, godaddy_api_secret, cloudflare_api_token FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user?.godaddy_api_key || !user?.godaddy_api_secret) {
      return res.status(400).json({ error: 'GoDaddy credentials not configured' });
    }

    if (!user?.cloudflare_api_token) {
      return res.status(400).json({ error: 'Cloudflare API token not configured' });
    }

    const results = {
      godaddy: null,
      cloudflare: null,
      domain: null,
      errors: []
    };

    const gd = new GoDaddyService(user.godaddy_api_key, user.godaddy_api_secret);
    const cf = new CloudflareService(user.cloudflare_api_token);
    const vpsIp = process.env.VPS_IP || '185.245.183.247';

    // Step 1: Get current nameservers from GoDaddy
    const currentNS = await gd.getNameservers(domain);
    results.godaddy = { currentNameservers: currentNS };

    // Step 2: Create zone in Cloudflare (if doesn't exist)
    let zoneId;
    try {
      const zones = await cf.listZones();
      const existingZone = zones.find(z => z.name === domain);
      
      if (existingZone) {
        zoneId = existingZone.id;
        results.cloudflare = { zoneId, status: 'existing' };
      } else {
        // Note: Creating zones requires Enterprise plan, so we'll assume zone exists
        return res.status(400).json({ 
          error: 'Domain not found in Cloudflare. Please add the domain to Cloudflare first.' 
        });
      }
    } catch (error) {
      results.errors.push(`Cloudflare zone check: ${error.message}`);
      throw error;
    }

    // Step 3: Get Cloudflare nameservers for this zone
    const zone = await cf.getZone(zoneId);
    const cloudflareNS = zone.name_servers;

    // Step 4: Update GoDaddy nameservers to Cloudflare
    try {
      await gd.updateNameservers(domain, cloudflareNS);
      results.godaddy.nameserversUpdated = cloudflareNS;
    } catch (error) {
      results.errors.push(`GoDaddy nameserver update: ${error.message}`);
      throw error;
    }

    // Step 5: Configure DNS and SSL on Cloudflare
    try {
      const cfSetup = await cf.autoSetupDomain(zoneId, domain, vpsIp);
      results.cloudflare = { ...results.cloudflare, ...cfSetup };
    } catch (error) {
      results.errors.push(`Cloudflare setup: ${error.message}`);
    }

    // Step 6: Create domain in cloaker database
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

    results.domain = { id: domainId, domain };

    res.json({
      success: true,
      results,
      message: 'Domain imported from GoDaddy and configured successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
