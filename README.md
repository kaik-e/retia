# Retia - Website Cloaker

A powerful website cloaking system with Nginx reverse proxy integration and a modern management dashboard.

## Features

### 🛡️ Advanced Cloaking
- **Query Parameter Forwarding** - Pass URL parameters to target redirects
- **GCLID Requirement** - Enforce Google Click ID presence
- **Device Filtering** - Mobile-only traffic enforcement
- **Pingable IP Detection** - Block datacenter/hosting IPs
- **ASN Blocking** - Block specific Autonomous System Numbers
- **Geo-blocking** - Block by country and state/region
- **IP Blacklisting** - Block specific IP addresses

### 📊 Analytics & Monitoring
- Real-time traffic analytics
- Request filtering breakdown
- Geographic traffic distribution
- Detailed access logs
- Block rate tracking

### 🎨 Template Management
- Upload custom HTML templates
- Template preview functionality
- Multiple templates per domain
- Easy template switching

### ⚙️ Nginx Integration
- Automatic Nginx configuration generation
- Reverse proxy setup
- SSL/HTTPS support ready
- Easy deployment

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, TailwindCSS, Vite
- **Proxy**: Nginx
- **UI Components**: Radix UI, Lucide Icons

## Installation

### Prerequisites
- Node.js 16+ and npm
- Nginx
- Linux/Unix system (recommended)

### Setup

1. **Clone and install dependencies**
```bash
cd c0alk
npm run setup
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start development server**
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173` and the API at `http://localhost:3000`.

### Production Deployment

1. **Build the frontend**
```bash
npm run build
```

2. **Start the production server**
```bash
NODE_ENV=production npm start
```

3. **Configure Nginx**

For each domain you create in the dashboard, an Nginx configuration file will be generated in `./nginx/sites-enabled/`.

Link the configuration to Nginx:
```bash
sudo ln -s /path/to/c0alk/nginx/sites-enabled/DOMAIN_ID.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. **Setup SSL (recommended)**

Use Let's Encrypt for free SSL certificates:
```bash
sudo certbot --nginx -d yourdomain.com
```

The generated Nginx configs include commented HTTPS sections - uncomment and update paths after obtaining certificates.

## Usage

### Creating a Domain

1. Navigate to **Domains** → **Add Domain**
2. Configure basic settings:
   - Domain name
   - Target URL (where legitimate traffic goes)
   - Cloaked template (optional)
3. Enable cloaking options:
   - Pass query parameters
   - Require GCLID
   - Mobile only
   - Block pingable IPs
4. Add filters:
   - ASN blocks (e.g., AS15169 for Google)
   - Country blocks (e.g., US, GB)
   - State blocks (e.g., US/CA)
   - IP blocks
5. Save and deploy Nginx configuration

### Uploading Templates

1. Navigate to **Templates**
2. Enter a template name
3. Select an HTML file (max 10MB)
4. Upload

**Template Guidelines:**
- Use complete, self-contained HTML files
- Include CSS/JS inline or via CDN
- Host images externally or use data URIs
- Test in browser before uploading

### Viewing Analytics

1. Navigate to **Domains**
2. Click the analytics icon for any domain
3. View:
   - Total requests
   - Redirect vs block ratio
   - Top countries
   - Action breakdown
   - Recent activity logs

## Architecture

```
┌─────────────┐
│   Visitor   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Nginx    │ (Reverse Proxy)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  C0alk API  │ (Cloaking Logic)
└──────┬──────┘
       │
       ├─── Blocked? ──→ Serve Template
       │
       └─── Allowed? ──→ Redirect to Target
```

## API Endpoints

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Upload template
- `GET /api/templates/:id` - Get template details
- `DELETE /api/templates/:id` - Delete template
- `GET /api/templates/:id/content` - Get template HTML

### Domains
- `GET /api/domains` - List all domains
- `POST /api/domains` - Create domain
- `GET /api/domains/:id` - Get domain details
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain

### Analytics
- `GET /api/analytics/:domainId` - Get access logs
- `GET /api/analytics/:domainId/summary` - Get analytics summary
- `DELETE /api/analytics/:domainId` - Clear logs

### Cloaking
- `GET /api/cloak/:domainId` - Main cloaking endpoint (used by Nginx)

## Configuration

### Environment Variables

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/cloaker.db
TEMPLATES_DIR=./data/templates
NGINX_CONFIG_DIR=./nginx/sites-enabled
```

### Database Schema

The system uses SQLite with the following tables:
- `templates` - HTML templates
- `domains` - Domain configurations
- `asn_blocks` - ASN blacklist
- `country_blocks` - Country blacklist
- `state_blocks` - State/region blacklist
- `ip_blocks` - IP blacklist
- `access_logs` - Analytics data

## Security Considerations

⚠️ **Important Security Notes:**

1. **Legal Compliance**: Ensure your use case complies with local laws and regulations
2. **Access Control**: Add authentication to the dashboard in production
3. **Rate Limiting**: Implement rate limiting on the API
4. **SSL/TLS**: Always use HTTPS in production
5. **Database Backups**: Regularly backup your SQLite database
6. **Log Rotation**: Implement log rotation for access logs

## Troubleshooting

### Nginx Configuration Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

### Database Issues
```bash
# Check database file permissions
ls -la data/cloaker.db

# Reset database (WARNING: deletes all data)
rm data/cloaker.db
# Restart server to recreate
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## Development

### Project Structure
```
c0alk/
├── server/              # Backend API
│   ├── routes/         # API routes
│   ├── utils/          # Utilities
│   ├── database.js     # Database setup
│   └── index.js        # Server entry
├── client/             # Frontend dashboard
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # Utilities
│   │   └── App.jsx     # Main app
│   └── package.json
├── data/               # SQLite DB & templates
├── nginx/              # Generated configs
└── package.json
```

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add pages in `client/src/pages/`
3. **Database**: Update schema in `server/database.js`

## License

MIT License - See LICENSE file for details

## Disclaimer

This software is provided for educational and legitimate business purposes only. Users are responsible for ensuring their use complies with all applicable laws and regulations. The authors assume no liability for misuse of this software.

## Support

For issues and questions:
- Check the troubleshooting section
- Review Nginx and application logs
- Ensure all dependencies are installed correctly

---

Built with ❤️ for legitimate traffic filtering and A/B testing purposes.
