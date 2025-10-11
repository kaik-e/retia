# Deployment Options

## Quick Comparison

| Method | Difficulty | Best For | Pros | Cons |
|--------|-----------|----------|------|------|
| **Direct Nginx** | ⭐⭐ Easy | 1-10 domains | Simple, full control | Manual SSL, CLI only |
| **Nginx Proxy Manager** | ⭐ Easiest | 5-50 domains | GUI, auto SSL | Extra dependency |
| **CloudFlare Tunnel** | ⭐⭐⭐ Medium | High security | No open ports | CloudFlare only |

---

## Option 1: Direct Nginx + CloudFlare

### Architecture
```
CloudFlare → Your Server IP:80/443 → Nginx → C0alk:3000
```

### Setup Steps

1. **Point CloudFlare DNS**
   ```
   A record: yourdomain.com → YOUR_SERVER_IP (orange cloud ON)
   ```

2. **Link Nginx Config**
   ```bash
   sudo ln -s /path/to/c0alk/nginx/sites-enabled/DOMAIN_ID.conf /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. **Configure Real IP** (Edit `/etc/nginx/nginx.conf`)
   ```nginx
   http {
       # CloudFlare IPs
       set_real_ip_from 173.245.48.0/20;
       set_real_ip_from 103.21.244.0/22;
       # ... (see CLOUDFLARE_SETUP.md for full list)
       real_ip_header CF-Connecting-IP;
   }
   ```

4. **Get SSL**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### Pros
- ✅ Simple setup
- ✅ Full control
- ✅ No extra services
- ✅ Best performance

### Cons
- ❌ CLI configuration
- ❌ Manual SSL renewal (though automatic with certbot)

---

## Option 2: Nginx Proxy Manager + CloudFlare

### Architecture
```
CloudFlare → Your Server IP:80/443 → NPM:80/443 → C0alk:3000
```

### Setup Steps

1. **Install NPM**
   ```bash
   mkdir ~/nginx-proxy-manager && cd ~/nginx-proxy-manager
   
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
   
   docker-compose up -d
   ```

2. **Access NPM Dashboard**
   - URL: `http://YOUR_SERVER_IP:81`
   - Login: `admin@example.com` / `changeme`
   - Change password!

3. **Add Proxy Host**
   - Domain: `yourdomain.com`
   - Forward to: `localhost:3000`
   - Enable SSL (auto-provision)
   - Advanced tab:
     ```nginx
     real_ip_header CF-Connecting-IP;
     set_real_ip_from 0.0.0.0/0;
     ```

4. **Point CloudFlare DNS**
   ```
   A record: yourdomain.com → YOUR_SERVER_IP (orange cloud ON)
   ```

### Pros
- ✅ GUI management
- ✅ Auto SSL
- ✅ Easy to manage multiple domains
- ✅ Visual interface

### Cons
- ❌ Extra Docker dependency
- ❌ Slightly more complex
- ❌ Additional resource usage

---

## Option 3: CloudFlare Tunnel (No Open Ports)

### Architecture
```
CloudFlare → Tunnel → C0alk:3000 (no public ports!)
```

### Setup Steps

1. **Install cloudflared**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. **Authenticate**
   ```bash
   cloudflared tunnel login
   ```

3. **Create Tunnel**
   ```bash
   cloudflared tunnel create c0alk
   # Note the tunnel ID
   ```

4. **Configure** (`~/.cloudflared/config.yml`)
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /home/user/.cloudflared/YOUR_TUNNEL_ID.json
   
   ingress:
     - hostname: yourdomain.com
       service: http://localhost:3000
     - service: http_status:404
   ```

5. **Route DNS**
   ```bash
   cloudflared tunnel route dns c0alk yourdomain.com
   ```

6. **Run as Service**
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   ```

### Pros
- ✅ No firewall configuration needed
- ✅ No open ports
- ✅ Built-in DDoS protection
- ✅ Zero-trust security

### Cons
- ❌ CloudFlare dependency
- ❌ More complex setup
- ❌ Requires CloudFlare account

---

## Recommended Setup by Scenario

### Scenario 1: Single Domain, Testing
**→ Option 1: Direct Nginx**
```bash
# Simplest setup
1. Point DNS
2. Link Nginx config
3. Get SSL
Done!
```

### Scenario 2: Multiple Domains, Production
**→ Option 2: Nginx Proxy Manager**
```bash
# GUI makes it easy
1. Install NPM with Docker
2. Add domains via web interface
3. Auto SSL for all domains
Manage everything from browser!
```

### Scenario 3: High Security, Corporate
**→ Option 3: CloudFlare Tunnel**
```bash
# Maximum security
1. No ports exposed
2. CloudFlare handles everything
3. Zero-trust architecture
Perfect for sensitive operations!
```

---

## Performance Comparison

| Method | Latency | Throughput | Resource Usage |
|--------|---------|------------|----------------|
| Direct Nginx | ~1ms | Highest | Lowest |
| NPM | ~2-3ms | High | Medium |
| CF Tunnel | ~5-10ms | Medium | Low |

---

## Cost Comparison

| Method | Monthly Cost | Notes |
|--------|-------------|-------|
| Direct Nginx | $0 | Free, open source |
| NPM | $0 | Free, open source |
| CF Tunnel | $0 | Free tier available |

All options are free! Choose based on your needs, not cost.

---

## Migration Between Options

### From Direct Nginx → NPM
1. Install NPM
2. Add domains in NPM GUI
3. Remove old Nginx configs
4. Update DNS if needed

### From NPM → Direct Nginx
1. Export NPM configs
2. Create Nginx configs manually
3. Stop NPM
4. Start Nginx

### To CloudFlare Tunnel
1. Set up tunnel
2. Route DNS through CloudFlare
3. Close firewall ports (optional)
4. Stop old proxy

---

## Quick Decision Tree

```
Do you need a GUI?
├─ YES → Nginx Proxy Manager
└─ NO
   └─ Do you need maximum security?
      ├─ YES → CloudFlare Tunnel
      └─ NO → Direct Nginx
```

---

## Summary

**Most Users**: Start with **Direct Nginx** (Option 1)
- Simplest
- Best performance
- Easy to understand

**Growing**: Upgrade to **NPM** (Option 2)
- When managing 5+ domains
- When you want GUI
- When team needs access

**Enterprise**: Use **CF Tunnel** (Option 3)
- Maximum security
- No exposed ports
- Compliance requirements

All options work perfectly with C0alk! Choose what fits your workflow.
