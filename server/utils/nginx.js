const fs = require('fs');
const path = require('path');
const db = require('../database');

function generateNginxConfig(domainId) {
  return new Promise((resolve, reject) => {
    // Get domain configuration
    const query = `
      SELECT d.*, t.filename as template_filename
      FROM domains d
      LEFT JOIN templates t ON d.template_id = t.id
      WHERE d.id = ?
    `;

    db.get(query, [domainId], (err, domain) => {
      if (err) {
        return reject(err);
      }
      if (!domain) {
        return reject(new Error('Domain not found'));
      }

      const nginxConfigDir = process.env.NGINX_CONFIG_DIR || './nginx/sites-enabled';
      const configPath = path.join(nginxConfigDir, `${domainId}.conf`);

      // Generate Nginx configuration
      const config = `
# Configuration for ${domain.domain}
# Generated automatically - do not edit manually

server {
    listen 80;
    server_name ${domain.domain};

    # Pass real IP to backend
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $host;
    proxy_set_header User-Agent $http_user_agent;

    location / {
        # Proxy to cloaking backend
        proxy_pass http://localhost:${process.env.PORT || 3000}/api/cloak/${domainId}$is_args$args;
        proxy_redirect off;
    }
}

# HTTPS configuration (uncomment and configure SSL certificates)
# server {
#     listen 443 ssl http2;
#     server_name ${domain.domain};
#
#     ssl_certificate /etc/letsencrypt/live/${domain.domain}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${domain.domain}/privkey.pem;
#
#     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#     proxy_set_header X-Real-IP $remote_addr;
#     proxy_set_header Host $host;
#     proxy_set_header User-Agent $http_user_agent;
#
#     location / {
#         proxy_pass http://localhost:${process.env.PORT || 3000}/api/cloak/${domainId}$is_args$args;
#         proxy_redirect off;
#     }
# }
`;

      fs.writeFileSync(configPath, config.trim());
      console.log(`Nginx config generated for ${domain.domain}`);
      resolve(configPath);
    });
  });
}

function deleteNginxConfig(domainId) {
  const nginxConfigDir = process.env.NGINX_CONFIG_DIR || './nginx/sites-enabled';
  const configPath = path.join(nginxConfigDir, `${domainId}.conf`);

  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(`Nginx config deleted for domain ${domainId}`);
  }
}

module.exports = {
  generateNginxConfig,
  deleteNginxConfig
};
