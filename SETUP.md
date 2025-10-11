# Quick Setup Guide

## Initial Setup

1. **Install dependencies**
```bash
npm run setup
```

2. **Configure environment**
```bash
# Copy the example env file
cp .env.example .env

# The default settings should work for development
# Edit .env if you need to change ports or paths
```

3. **Start development**
```bash
npm run dev
```

Access the dashboard at: http://localhost:5173

## First Domain Setup

1. **Upload a template** (optional)
   - Go to Templates page
   - Upload an HTML file
   - This will be shown to blocked visitors

2. **Create a domain**
   - Go to Domains → Add Domain
   - Enter domain name (e.g., example.com)
   - Enter target URL (where real traffic goes)
   - Select a template (optional)
   - Configure filters (GCLID, mobile, geo, etc.)
   - Save

3. **Deploy to Nginx**
   - After creating a domain, a config file is generated in `./nginx/sites-enabled/`
   - Link it to Nginx:
   ```bash
   sudo ln -s $(pwd)/nginx/sites-enabled/DOMAIN_ID.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Point your domain**
   - Update DNS A record to point to your server IP
   - Wait for DNS propagation

5. **Add SSL** (recommended)
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## Production Deployment

1. **Build frontend**
```bash
npm run build
```

2. **Start production server**
```bash
NODE_ENV=production npm start
```

3. **Use process manager** (recommended)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server/index.js --name c0alk
pm2 save
pm2 startup
```

## Troubleshooting

**Port 3000 already in use?**
```bash
# Change PORT in .env file
PORT=3001
```

**Nginx not reloading?**
```bash
sudo nginx -t  # Test config
sudo systemctl status nginx  # Check status
sudo tail -f /var/log/nginx/error.log  # Check errors
```

**Database errors?**
```bash
# Ensure data directory exists
mkdir -p data

# Check permissions
chmod 755 data
```
