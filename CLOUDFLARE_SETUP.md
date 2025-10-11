# CloudFlare Setup Guide

## Architecture Overview

```
Visitor
  ↓
CloudFlare (DNS + CDN)
  ↓
Your Server IP
  ↓
Nginx (or Nginx Proxy Manager)
  ↓
C0alk Backend (localhost:3000)
  ↓
Cloaking Decision
```

## Option 1: Direct Nginx (Simpler)

### Step 1: Configure CloudFlare DNS

1. Go to CloudFlare dashboard
2. Select your domain
3. Go to **DNS** section
4. Add A record:
   - **Type**: A
   - **Name**: @ (or subdomain like `offer`)
   - **IPv4 address**: Your server IP
   - **Proxy status**: ☁️ Proxied (Orange cloud)
   - **TTL**: Auto

### Step 2: Configure Nginx on Your Server

The generated config already works with CloudFlare! Just link it:

```bash
# After creating domain in dashboard
sudo ln -s /path/to/c0alk/nginx/sites-enabled/DOMAIN_ID.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Step 3: CloudFlare SSL Settings

1. Go to **SSL/TLS** → **Overview**
2. Set to **Full** or **Full (strict)**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites

### Step 4: Get Real Visitor IPs

CloudFlare passes real IPs via headers. Update your Nginx config:

Edit `/etc/nginx/nginx.conf` and add in `http` block:

```nginx
# CloudFlare IP ranges
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

# Use CloudFlare header
real_ip_header CF-Connecting-IP;
```

Then reload:
```bash
sudo systemctl reload nginx
```

---

## Option 2: Using Nginx Proxy Manager (GUI)

### Step 1: Install Nginx Proxy Manager

```bash
# Create directory
mkdir -p ~/nginx-proxy-manager
cd ~/nginx-proxy-manager

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
EOF

# Start NPM
docker-compose up -d
```

### Step 2: Access NPM Dashboard

1. Go to `http://YOUR_SERVER_IP:81`
2. Default login:
   - Email: `admin@example.com`
   - Password: `changeme`
3. Change password immediately

### Step 3: Add Proxy Host in NPM

1. Click **Hosts** → **Proxy Hosts** → **Add Proxy Host**
2. **Details** tab:
   - **Domain Names**: `yourdomain.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `localhost` (or `host.docker.internal` on Mac)
   - **Forward Port**: `3000`
   - ✅ Cache Assets
   - ✅ Block Common Exploits
   - ✅ Websockets Support

3. **SSL** tab:
   - **SSL Certificate**: Request a new SSL Certificate
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled

4. **Advanced** tab (Important for real IPs):
```nginx
# Get real visitor IP from CloudFlare
real_ip_header CF-Connecting-IP;
set_real_ip_from 0.0.0.0/0;

# Pass headers to backend
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
proxy_set_header CF-IPCountry $http_cf_ipcountry;
```

5. Click **Save**

### Step 4: Configure CloudFlare

Same as Option 1 - point A record to your server IP with orange cloud enabled.

### Step 5: Update C0alk to Read CloudFlare Headers

The cloaking logic already reads `X-Forwarded-For`, but you can enhance it:

Edit `server/routes/cloak.js` to prioritize CloudFlare header:

```javascript
// Around line 14, replace:
const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

// With:
const clientIp = req.headers['cf-connecting-ip'] || 
                 req.headers['x-forwarded-for']?.split(',')[0] || 
                 req.ip;
```

---

## Option 3: CloudFlare Tunnel (No Open Ports)

For extra security, use CloudFlare Tunnel (formerly Argo Tunnel):

### Step 1: Install cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 2: Authenticate

```bash
cloudflared tunnel login
```

### Step 3: Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create c0alk

# Note the tunnel ID shown
```

### Step 4: Configure Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/user/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:3000
  - hostname: www.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### Step 5: Route DNS

```bash
cloudflared tunnel route dns c0alk yourdomain.com
cloudflared tunnel route dns c0alk www.yourdomain.com
```

### Step 6: Run Tunnel

```bash
# Test
cloudflared tunnel run c0alk

# Run as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## Recommended Setup by Use Case

### Small Scale (1-5 domains)
→ **Option 1: Direct Nginx**
- Simplest setup
- No extra dependencies
- Full control

### Medium Scale (5-20 domains)
→ **Option 2: Nginx Proxy Manager**
- GUI management
- Easy SSL
- Multiple services

### High Security / No Open Ports
→ **Option 3: CloudFlare Tunnel**
- No firewall changes needed
- DDoS protection
- Zero trust security

---

## CloudFlare Settings for Cloaking

### Recommended Settings

1. **SSL/TLS**: Full (strict)
2. **Speed** → **Optimization**:
   - ❌ Auto Minify (can break templates)
   - ✅ Brotli
   - ✅ Early Hints
3. **Caching**:
   - ❌ Don't cache cloaking pages (they're dynamic)
   - Add page rule: `yourdomain.com/*` → Cache Level: Bypass
4. **Security**:
   - Set as needed (Medium recommended)
   - ⚠️ Don't enable "I'm Under Attack" mode (breaks legitimate traffic)
5. **Network**:
   - ✅ HTTP/2
   - ✅ HTTP/3 (QUIC)
   - ✅ WebSockets

### Page Rules for Cloaking

Create these page rules in CloudFlare:

1. **Bypass Cache**
   - URL: `yourdomain.com/*`
   - Settings: Cache Level = Bypass

2. **Security Level**
   - URL: `yourdomain.com/*`
   - Settings: Security Level = Medium

---

## Testing Your Setup

### Test 1: Check Real IP

```bash
# Should show visitor's real IP, not CloudFlare IP
curl -H "CF-Connecting-IP: 1.2.3.4" http://localhost:3000/api/cloak/DOMAIN_ID
```

### Test 2: Test from External

```bash
# From another machine
curl -v https://yourdomain.com?gclid=test123
```

### Test 3: Check Headers

```bash
curl -I https://yourdomain.com
# Should see CloudFlare headers like:
# cf-ray: ...
# cf-cache-status: DYNAMIC
```

---

## Troubleshooting

### Issue: Getting CloudFlare IPs instead of visitor IPs

**Solution**: Make sure you configured `real_ip_header CF-Connecting-IP` in Nginx

### Issue: SSL errors

**Solution**: Set CloudFlare SSL mode to "Full" or "Full (strict)"

### Issue: Cloaking not working

**Solution**: 
1. Check C0alk logs: `pm2 logs c0alk`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify domain is created in dashboard
4. Test directly: `http://YOUR_IP:3000/api/cloak/DOMAIN_ID`

### Issue: 502 Bad Gateway

**Solution**:
- Ensure C0alk backend is running: `pm2 status`
- Check if port 3000 is accessible: `curl http://localhost:3000`
- Verify Nginx config: `sudo nginx -t`

---

## Security Considerations

1. **Always use CloudFlare proxy** (orange cloud) for DDoS protection
2. **Block direct IP access** - only allow CloudFlare IPs
3. **Enable CloudFlare WAF** for additional protection
4. **Use authenticated origin pulls** for extra security
5. **Monitor CloudFlare Analytics** for suspicious traffic

---

## Summary

**Quick Setup (Recommended for most users):**

1. Point CloudFlare DNS A record to your server IP (orange cloud on)
2. Configure Nginx with generated config
3. Add CloudFlare IP ranges to Nginx config
4. Enable SSL in CloudFlare (Full mode)
5. Test and monitor

That's it! CloudFlare handles the DNS and CDN, Nginx handles the reverse proxy, and C0alk handles the cloaking logic.
