const express = require('express');
const router = express.Router();
const geoip = require('geoip-lite');
const useragent = require('useragent');
const db = require('../database');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const COMMON_ASNS = require('../utils/common-asns');

// Main cloaking endpoint
router.get('/:domainId', async (req, res) => {
  const domainId = req.params.domainId;
  // Prioritize CloudFlare header, then X-Forwarded-For, then direct IP
  const clientIp = req.headers['cf-connecting-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] ||
                   req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const queryParams = req.query;
  
  // Get CloudFlare country if available (faster than GeoIP lookup)
  const cfCountry = req.headers['cf-ipcountry'];

  try {
    // Get domain configuration
    const domain = await new Promise((resolve, reject) => {
      db.get(
        `SELECT d.*, 
                t.filename as template_filename,
                lt.filename as lockdown_template_filename
         FROM domains d
         LEFT JOIN templates t ON d.template_id = t.id
         LEFT JOIN templates lt ON d.lockdown_template_id = lt.id
         WHERE d.id = ?`,
        [domainId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!domain) {
      return res.status(404).send('Domain not found');
    }

    // Check if domain is active
    if (domain.is_active === 0 || domain.is_active === false) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'domain_inactive');
      return serveCloakedContent(res, domain, 'Domain inactive');
    }

    // Check lockdown mode FIRST - blocks ALL traffic
    if (domain.lockdown_mode) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'lockdown_mode');
      return serveCloakedContent(res, { 
        template_filename: domain.lockdown_template_filename || domain.template_filename 
      }, 'Lockdown mode active');
    }

    // Check GCLID requirement
    if (domain.require_gclid && !queryParams.gclid) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'missing_gclid');
      return serveCloakedContent(res, domain, 'Missing GCLID');
    }

    // Check mobile only
    if (domain.mobile_only) {
      const agent = useragent.parse(userAgent);
      const isMobile = agent.device.family !== 'Other' && 
                       (agent.device.family.includes('Phone') || 
                        agent.device.family.includes('Mobile') ||
                        agent.os.family === 'iOS' ||
                        agent.os.family === 'Android');
      
      if (!isMobile) {
        await logAccess(domainId, clientIp, userAgent, 'blocked', 'not_mobile');
        return serveCloakedContent(res, domain, 'Desktop device detected');
      }
    }

    // Get geo location (use CloudFlare header if available, otherwise GeoIP)
    let country, state;
    if (cfCountry && cfCountry !== 'XX') {
      country = cfCountry;
      // For state, still need GeoIP lookup
      const geo = geoip.lookup(clientIp);
      state = geo?.region || 'Unknown';
    } else {
      const geo = geoip.lookup(clientIp);
      country = geo?.country || 'Unknown';
      state = geo?.region || 'Unknown';
    }

    // Check IP blocks
    const ipBlocked = await checkIpBlock(domainId, clientIp);
    if (ipBlocked) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'ip_blocked', country, state);
      return serveCloakedContent(res, domain, 'IP blocked');
    }

    // Check country blocks
    const countryBlocked = await checkCountryBlock(domainId, country);
    if (countryBlocked) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'country_blocked', country, state);
      return serveCloakedContent(res, domain, 'Country blocked');
    }

    // Check state blocks
    const stateBlocked = await checkStateBlock(domainId, country, state);
    if (stateBlocked) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'state_blocked', country, state);
      return serveCloakedContent(res, domain, 'State blocked');
    }

    // Check ASN blocks (if available)
    if (domain.block_pingable_ips) {
      const isPingable = await checkPingableIp(clientIp);
      if (isPingable) {
        await logAccess(domainId, clientIp, userAgent, 'blocked', 'pingable_ip', country, state);
        return serveCloakedContent(res, domain, 'Pingable IP detected');
      }
    }

    // Check common ASN blocks (auto)
    if (domain.block_asn) {
      const commonAsnBlocked = await checkCommonAsn(clientIp);
      if (commonAsnBlocked) {
        await logAccess(domainId, clientIp, userAgent, 'blocked', 'common_asn_blocked', country, state);
        return serveCloakedContent(res, domain, 'Common ASN blocked');
      }
    }

    // Check custom ASN blocks
    const asnBlocked = await checkAsnBlock(domainId, clientIp);
    if (asnBlocked) {
      await logAccess(domainId, clientIp, userAgent, 'blocked', 'asn_blocked', country, state);
      return serveCloakedContent(res, domain, 'ASN blocked');
    }

    // All checks passed - redirect to target
    await logAccess(domainId, clientIp, userAgent, 'redirected', null, country, state);
    
    let targetUrl = domain.target_url;
    if (domain.pass_query_params && Object.keys(queryParams).length > 0) {
      const urlObj = new URL(targetUrl);
      Object.keys(queryParams).forEach(key => {
        urlObj.searchParams.set(key, queryParams[key]);
      });
      targetUrl = urlObj.toString();
    }

    res.redirect(302, targetUrl);

  } catch (error) {
    console.error('Cloaking error:', error);
    res.status(500).send('Internal server error');
  }
});

// Helper functions
function serveCloakedContent(res, domain, reason) {
  if (domain.template_filename) {
    const templatesDir = process.env.TEMPLATES_DIR || './data/templates';
    const templatePath = path.join(templatesDir, domain.template_filename);
    
    if (fs.existsSync(templatePath)) {
      return res.sendFile(path.resolve(templatePath));
    }
  }
  
  // Default cloaked page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Welcome</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <h1>Welcome</h1>
      <p>This page is currently unavailable.</p>
    </body>
    </html>
  `);
}

function checkIpBlock(domainId, ip) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM ip_blocks WHERE domain_id = ? AND ip_address = ?',
      [domainId, ip],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      }
    );
  });
}

function checkCountryBlock(domainId, country) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM country_blocks WHERE domain_id = ? AND country_code = ?',
      [domainId, country],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      }
    );
  });
}

function checkStateBlock(domainId, country, state) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM state_blocks WHERE domain_id = ? AND country_code = ? AND state_code = ?',
      [domainId, country, state],
      (err, row) => {
        if (err) reject(err);
        else resolve(row.count > 0);
      }
    );
  });
}

async function checkCommonAsn(ip) {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
      timeout: 2000
    }).catch(() => null);

    if (!response || !response.data.org) {
      return false;
    }

    const asn = response.data.org.split(' ')[0]; // Extract ASN number
    return COMMON_ASNS.includes(asn);
  } catch (error) {
    console.error('Common ASN check error:', error);
    return false;
  }
}

async function checkAsnBlock(domainId, ip) {
  try {
    // Use ipinfo.io or similar service to get ASN
    // For now, we'll use a simple lookup
    const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
      timeout: 2000
    }).catch(() => null);

    if (!response || !response.data.org) {
      return false;
    }

    const asn = response.data.org.split(' ')[0]; // Extract ASN number

    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM asn_blocks WHERE domain_id = ? AND asn = ?',
        [domainId, asn],
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count > 0);
        }
      );
    });
  } catch (error) {
    console.error('ASN check error:', error);
    return false;
  }
}

async function checkPingableIp(ip) {
  // Simple check - in production, you might want to use a more sophisticated method
  // This checks if the IP is from common hosting/VPN/datacenter ranges
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`, {
      timeout: 2000
    }).catch(() => null);

    if (!response || !response.data) {
      return false;
    }

    const org = (response.data.org || '').toLowerCase();
    const hostname = (response.data.hostname || '').toLowerCase();

    // Check for common datacenter/hosting indicators
    const suspiciousKeywords = [
      'hosting', 'datacenter', 'cloud', 'server', 'vpn', 'proxy',
      'amazon', 'aws', 'google', 'azure', 'digitalocean', 'linode',
      'ovh', 'hetzner', 'vultr'
    ];

    return suspiciousKeywords.some(keyword => 
      org.includes(keyword) || hostname.includes(keyword)
    );
  } catch (error) {
    return false;
  }
}

function logAccess(domainId, ip, userAgent, action, reason = null, country = null, state = null, asn = null) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO access_logs (domain_id, ip_address, user_agent, country, state, asn, action)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [domainId, ip, userAgent, country, state, asn, `${action}${reason ? ':' + reason : ''}`],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

// Test endpoint - shows what the cloaker sees
router.get('/test/:domainId', async (req, res) => {
  const domainId = req.params.domainId;
  const clientIp = req.headers['cf-connecting-ip'] || 
                   req.headers['x-forwarded-for']?.split(',')[0] || 
                   req.headers['x-real-ip'] ||
                   req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const cfCountry = req.headers['cf-ipcountry'];
  
  // Parse user agent
  const agent = useragent.parse(userAgent);
  const isMobile = agent.device.family !== 'Other' && 
                   (agent.device.family.includes('Phone') || 
                    agent.device.family.includes('Mobile') ||
                    agent.os.family === 'iOS' ||
                    agent.os.family === 'Android');
  
  // Get geo
  const geo = geoip.lookup(clientIp);
  
  // Get domain config
  const domain = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM domains WHERE id = ?',
      [domainId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
  
  // Check what would happen
  let decision = 'REDIRECT';
  let reason = null;
  
  if (domain) {
    if (domain.require_gclid && !req.query.gclid) {
      decision = 'BLOCK';
      reason = 'Missing GCLID';
    } else if (domain.mobile_only && !isMobile) {
      decision = 'BLOCK';
      reason = 'Not mobile device';
    }
  }
  
  res.json({
    test_mode: true,
    domain_id: domainId,
    domain_found: !!domain,
    detected: {
      ip: clientIp,
      country: cfCountry || geo?.country || 'Unknown',
      state: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
      timezone: geo?.timezone || 'Unknown',
      is_mobile: isMobile,
      device: agent.device.family,
      os: agent.os.toString(),
      browser: agent.toAgent(),
    },
    request: {
      has_gclid: !!req.query.gclid,
      query_params: req.query,
      headers: {
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'cf-ipcountry': req.headers['cf-ipcountry'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'user-agent': userAgent,
      }
    },
    decision: {
      action: decision,
      reason: reason,
      would_redirect_to: domain?.target_url,
    },
    domain_settings: domain ? {
      require_gclid: domain.require_gclid,
      mobile_only: domain.mobile_only,
      block_pingable_ips: domain.block_pingable_ips,
      pass_query_params: domain.pass_query_params,
    } : null
  });
});

module.exports = router;
