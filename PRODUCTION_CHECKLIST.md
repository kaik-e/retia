# ✅ Production Checklist - Retia Cloaker

## 🔒 Security

- [ ] **Change JWT_SECRET** in `.env`
  ```bash
  JWT_SECRET=your-super-secret-random-string-here-min-32-chars
  ```

- [ ] **Change default credentials** (optional but recommended)
  - Edit `server/middleware/auth.js`
  - Change `username` and `password`

- [ ] **Set NODE_ENV to production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **Configure firewall**
  ```bash
  sudo ufw allow 3000/tcp
  sudo ufw allow 8080/tcp
  sudo ufw enable
  ```

## 📦 Installation

- [ ] **Clone repository**
  ```bash
  git clone [your-repo]
  cd retia
  ```

- [ ] **Install dependencies**
  ```bash
  npm run setup
  ```

- [ ] **Configure environment**
  ```bash
  cp .env.example .env
  nano .env
  ```

- [ ] **Run migrations**
  ```bash
  npm run migrate
  ```

- [ ] **Build frontend**
  ```bash
  npm run build
  ```

## 🚀 PM2 Setup

- [ ] **Install PM2**
  ```bash
  npm install -g pm2
  ```

- [ ] **Start services**
  ```bash
  pm2 start server/index.js --name retia-api
  pm2 start server/proxy-server.js --name retia-proxy
  ```

- [ ] **Save and enable auto-start**
  ```bash
  pm2 save
  pm2 startup
  ```

## ☁️ Cloudflare Configuration

- [ ] **DNS Record**
  - Type: A
  - Name: your-domain.com
  - IPv4: [Your VPS IP]
  - Proxy: 🟠 Proxied (ON)
  - TTL: Auto

- [ ] **SSL/TLS Settings**
  - Mode: Flexible
  - Always Use HTTPS: ON

- [ ] **Security Rules**
  ```
  Expression: (http.user_agent contains "AdsBot-Google")
  Action: Skip (All remaining rules)
  ```

## 🧪 Testing

- [ ] **Access panel**
  ```
  https://your-domain.com
  ```

- [ ] **Login**
  - Username: retia
  - Password: Retia10@@

- [ ] **Create test domain**
  - Add domain
  - Upload template
  - Configure filters

- [ ] **Test cloaking**
  ```bash
  curl -H "Host: test-domain.com" http://localhost:8080/
  ```

- [ ] **Check logs**
  ```bash
  pm2 logs retia-api
  pm2 logs retia-proxy
  ```

## 📊 Monitoring

- [ ] **Setup PM2 monitoring**
  ```bash
  pm2 monitor
  ```

- [ ] **Check status regularly**
  ```bash
  pm2 list
  pm2 status
  ```

## 🔧 Maintenance

- [ ] **Regular backups**
  ```bash
  # Backup database
  cp data/cloaker.db data/cloaker.db.backup-$(date +%Y%m%d)
  
  # Backup templates
  tar -czf templates-backup-$(date +%Y%m%d).tar.gz data/templates/
  ```

- [ ] **Update dependencies**
  ```bash
  npm update
  cd client && npm update
  ```

- [ ] **Monitor disk space**
  ```bash
  df -h
  ```

## ✅ Production Ready Checklist

### Security ✅
- [x] JWT authentication implemented
- [x] Protected routes
- [x] Token expiration (7 days)
- [x] Auto-logout on 401
- [ ] JWT_SECRET changed
- [ ] Default credentials changed (optional)

### Features ✅
- [x] Domain management (CRUD)
- [x] Template upload system
- [x] ASN/Country/State/IP blocking
- [x] Lockdown mode
- [x] Analytics & logs
- [x] Proxy status monitor
- [x] Cloudflare compatible

### Performance ✅
- [x] Database optimized
- [x] Frontend built for production
- [x] Static file serving
- [x] PM2 process management

### Documentation ✅
- [x] README.md
- [x] DEPLOY.md
- [x] .env.example
- [x] Production checklist

## 🎯 Default Credentials

**Username:** `retia`  
**Password:** `Retia10@@`

⚠️ **IMPORTANT:** Change these in production!

## 🆘 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs`
2. Verify Cloudflare settings
3. Check firewall rules: `sudo ufw status`
4. Test database: `sqlite3 data/cloaker.db ".tables"`

---

**Ready for production! 🚀**
