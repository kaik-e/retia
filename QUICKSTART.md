# Quick Start Guide

Get C0alk running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm run setup
```

This installs both backend and frontend dependencies.

## Step 2: Start Development Server

```bash
npm run dev
```

This starts:
- Backend API on `http://localhost:3000`
- Frontend dashboard on `http://localhost:5173`

## Step 3: Access Dashboard

Open your browser to: **http://localhost:5173**

## Step 4: Create Your First Domain

1. **Upload a Template** (Optional)
   - Click "Templates" in sidebar
   - Upload an HTML file
   - This will be shown to blocked visitors

2. **Add a Domain**
   - Click "Domains" → "Add Domain"
   - Enter domain: `example.com`
   - Enter target URL: `https://your-target-site.com`
   - Select template (optional)
   - Configure filters:
     - ✅ Pass Query Params (recommended)
     - ✅ Require GCLID (for Google Ads)
     - ✅ Mobile Only (if needed)
     - ✅ Block Pingable IPs (recommended)
   - Add blocks:
     - ASN: `AS15169` (Google)
     - Country: `US`, `GB`, etc.
     - IP: Specific IPs to block
   - Click "Create Domain"

## Step 5: Deploy to Nginx

After creating a domain, a config file is generated in `./nginx/sites-enabled/`

### For Development Testing

You can test locally without Nginx by accessing:
```
http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test123
```

### For Production

1. **Link Nginx config:**
```bash
sudo ln -s $(pwd)/nginx/sites-enabled/DOMAIN_ID.conf /etc/nginx/sites-enabled/
```

2. **Test Nginx:**
```bash
sudo nginx -t
```

3. **Reload Nginx:**
```bash
sudo systemctl reload nginx
```

4. **Point DNS:**
   - Add A record: `example.com` → Your server IP
   - Wait for DNS propagation

5. **Add SSL:**
```bash
sudo certbot --nginx -d example.com
```

## Step 6: Monitor Analytics

1. Go to "Domains"
2. Click the analytics icon (📈) for your domain
3. View:
   - Total requests
   - Redirected vs blocked
   - Top countries
   - Recent activity

## Testing Your Setup

### Test Redirect (Allowed Traffic)
```bash
curl -L "http://your-domain.com?gclid=test123" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
```

Should redirect to your target URL.

### Test Block (Blocked Traffic)
```bash
curl "http://your-domain.com"
```

Should show your cloaked template (no GCLID).

## Common Configurations

### Google Ads Campaign
```
✅ Pass Query Params
✅ Require GCLID
✅ Mobile Only
✅ Block Pingable IPs
+ Add ASN blocks for competitors
+ Add country blocks if targeting specific regions
```

### Affiliate Marketing
```
✅ Pass Query Params
✅ Block Pingable IPs
+ Add ASN blocks for known scrapers
+ Add IP blocks for competitors
```

### A/B Testing
```
✅ Pass Query Params
+ Select appropriate template
+ Configure geo-targeting as needed
```

## Production Checklist

- [ ] Build frontend: `npm run build`
- [ ] Set `NODE_ENV=production` in .env
- [ ] Use PM2: `pm2 start server/index.js --name c0alk`
- [ ] Configure Nginx properly
- [ ] Add SSL certificates
- [ ] Set up backups: `./scripts/backup.sh`
- [ ] Configure firewall
- [ ] Add monitoring
- [ ] Test all domains

## Need Help?

- 📖 Read [README.md](README.md) for full documentation
- 🔧 Check [SETUP.md](SETUP.md) for detailed setup
- 📋 Review [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for architecture
- 🐛 Check logs: `pm2 logs c0alk` or `tail -f /var/log/nginx/error.log`

## Tips

1. **Always test locally first** before deploying to production
2. **Use the example template** in `/examples` as a starting point
3. **Monitor analytics regularly** to tune your filters
4. **Backup your database** before making major changes
5. **Keep dependencies updated** for security patches

---

Happy cloaking! 🚀
