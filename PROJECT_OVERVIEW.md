# C0alk Project Overview

## What is C0alk?

C0alk is a sophisticated website cloaking system that allows you to serve different content to different visitors based on various filtering criteria. It combines a powerful backend API with a clean, modern dashboard for easy management.

## Key Components

### 1. Backend API (Node.js/Express)
- **Location**: `/server`
- **Database**: SQLite (lightweight, file-based)
- **Key Features**:
  - RESTful API for all operations
  - Real-time cloaking logic
  - Automatic Nginx config generation
  - Analytics and logging

### 2. Frontend Dashboard (React)
- **Location**: `/client`
- **Framework**: React + Vite
- **Styling**: TailwindCSS
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Key Features**:
  - Clean, modern interface
  - Domain management
  - Template upload/management
  - Real-time analytics
  - Responsive design

### 3. Nginx Integration
- **Location**: `/nginx`
- Acts as reverse proxy
- Auto-generated configurations
- SSL/HTTPS ready

## Core Features Breakdown

### Cloaking Rules

1. **Query Parameter Forwarding**
   - Pass URL parameters to redirect target
   - Preserves tracking parameters (UTM, GCLID, etc.)

2. **GCLID Requirement**
   - Enforce Google Click ID presence
   - Block traffic without GCLID parameter
   - Useful for Google Ads campaigns

3. **Device Filtering**
   - Mobile-only mode
   - User-agent parsing
   - Device type detection

4. **Pingable IP Detection**
   - Identifies datacenter/hosting IPs
   - Blocks VPN/proxy traffic
   - Uses IP intelligence APIs

5. **ASN Blocking**
   - Block by Autonomous System Number
   - Target specific ISPs or networks
   - Useful for blocking scrapers

6. **Geographic Filtering**
   - Country-level blocking
   - State/region-level blocking
   - GeoIP lookup integration

7. **IP Blacklisting**
   - Block specific IP addresses
   - Manual IP management
   - Optional descriptions

### Template System

- Upload custom HTML templates
- Multiple templates per account
- Assign templates to domains
- Preview functionality
- Default fallback template

### Analytics

- Request counting
- Block vs redirect ratio
- Geographic distribution
- Action breakdown
- Detailed access logs
- Time-based filtering (1/7/30/90 days)

## Data Flow

```
1. Visitor → Domain
2. Nginx → Reverse Proxy
3. C0alk API → Cloaking Logic
4. Decision:
   - Blocked → Serve Template
   - Allowed → Redirect to Target
5. Log Action → Analytics
```

## File Structure

```
c0alk/
├── server/                 # Backend
│   ├── routes/
│   │   ├── templates.js   # Template CRUD
│   │   ├── domains.js     # Domain CRUD
│   │   ├── cloak.js       # Cloaking logic
│   │   └── analytics.js   # Analytics API
│   ├── utils/
│   │   └── nginx.js       # Nginx config generator
│   ├── database.js        # SQLite setup
│   └── index.js           # Server entry
│
├── client/                # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/       # Reusable UI components
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Domains.jsx
│   │   │   ├── DomainEdit.jsx
│   │   │   ├── Templates.jsx
│   │   │   └── Analytics.jsx
│   │   ├── lib/
│   │   │   ├── api.js    # API client
│   │   │   └── utils.js  # Utilities
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── data/                  # Runtime data
│   ├── cloaker.db        # SQLite database
│   └── templates/        # Uploaded templates
│
├── nginx/                # Nginx configs
│   ├── sites-enabled/    # Generated configs
│   └── nginx.conf.example
│
├── examples/             # Example files
│   └── template-example.html
│
├── scripts/              # Utility scripts
│   ├── install.sh       # Server setup
│   └── backup.sh        # Backup script
│
├── package.json          # Root dependencies
├── .env.example          # Environment template
├── .gitignore
├── README.md
├── SETUP.md
├── LICENSE
└── PROJECT_OVERVIEW.md
```

## Database Schema

### Tables

1. **templates**
   - id (TEXT, PK)
   - name (TEXT)
   - filename (TEXT)
   - created_at (DATETIME)

2. **domains**
   - id (TEXT, PK)
   - domain (TEXT, UNIQUE)
   - target_url (TEXT)
   - template_id (TEXT, FK)
   - pass_query_params (BOOLEAN)
   - require_gclid (BOOLEAN)
   - mobile_only (BOOLEAN)
   - block_pingable_ips (BOOLEAN)
   - created_at (DATETIME)
   - updated_at (DATETIME)

3. **asn_blocks**
   - id (INTEGER, PK)
   - domain_id (TEXT, FK)
   - asn (TEXT)
   - description (TEXT)

4. **country_blocks**
   - id (INTEGER, PK)
   - domain_id (TEXT, FK)
   - country_code (TEXT)

5. **state_blocks**
   - id (INTEGER, PK)
   - domain_id (TEXT, FK)
   - country_code (TEXT)
   - state_code (TEXT)

6. **ip_blocks**
   - id (INTEGER, PK)
   - domain_id (TEXT, FK)
   - ip_address (TEXT)
   - description (TEXT)

7. **access_logs**
   - id (INTEGER, PK)
   - domain_id (TEXT, FK)
   - ip_address (TEXT)
   - user_agent (TEXT)
   - country (TEXT)
   - state (TEXT)
   - asn (TEXT)
   - action (TEXT)
   - timestamp (DATETIME)

## API Endpoints

### Templates
- `GET /api/templates` - List all
- `POST /api/templates` - Upload (multipart/form-data)
- `GET /api/templates/:id` - Get one
- `DELETE /api/templates/:id` - Delete
- `GET /api/templates/:id/content` - Get HTML

### Domains
- `GET /api/domains` - List all
- `POST /api/domains` - Create
- `GET /api/domains/:id` - Get one
- `PUT /api/domains/:id` - Update
- `DELETE /api/domains/:id` - Delete

### Analytics
- `GET /api/analytics/:domainId` - Get logs
- `GET /api/analytics/:domainId/summary?days=7` - Get summary
- `DELETE /api/analytics/:domainId` - Clear logs

### Cloaking
- `GET /api/cloak/:domainId` - Main endpoint (used by Nginx)

## Environment Variables

```env
PORT=3000                              # API server port
NODE_ENV=development                   # Environment
DATABASE_PATH=./data/cloaker.db       # SQLite file
TEMPLATES_DIR=./data/templates        # Template storage
NGINX_CONFIG_DIR=./nginx/sites-enabled # Nginx configs
```

## Dependencies

### Backend
- express - Web framework
- sqlite3 - Database
- cors - CORS middleware
- multer - File uploads
- axios - HTTP client
- geoip-lite - IP geolocation
- useragent - User-agent parsing
- uuid - ID generation

### Frontend
- react - UI framework
- react-router-dom - Routing
- axios - API client
- lucide-react - Icons
- @radix-ui/* - UI primitives
- tailwindcss - Styling
- vite - Build tool

## Security Considerations

1. **Authentication**: Add auth middleware in production
2. **Rate Limiting**: Implement rate limits on API
3. **Input Validation**: Validate all user inputs
4. **SQL Injection**: Using parameterized queries
5. **XSS Protection**: React auto-escapes by default
6. **HTTPS**: Always use SSL in production
7. **Environment Variables**: Never commit .env
8. **File Uploads**: Validate file types and sizes

## Performance Tips

1. **Database**: Consider PostgreSQL for high traffic
2. **Caching**: Add Redis for caching lookups
3. **CDN**: Use CDN for static assets
4. **Nginx**: Tune worker processes
5. **PM2**: Use cluster mode for Node.js
6. **Monitoring**: Add APM tools (New Relic, DataDog)

## Scaling Considerations

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add caching layer

### Horizontal Scaling
- Multiple API instances behind load balancer
- Shared database (PostgreSQL)
- Shared file storage (S3, NFS)
- Session management (Redis)

## Common Use Cases

1. **Affiliate Marketing**
   - Filter bot traffic
   - Ensure quality clicks
   - Protect affiliate links

2. **A/B Testing**
   - Show different content to segments
   - Geographic targeting
   - Device-specific content

3. **Ad Campaign Protection**
   - Verify GCLID presence
   - Block competitor clicks
   - Filter invalid traffic

4. **Content Delivery**
   - Geographic content delivery
   - Device-optimized content
   - ISP-specific routing

## Maintenance

### Regular Tasks
- Backup database (use backup.sh)
- Review analytics
- Update dependencies
- Monitor disk space
- Check Nginx logs

### Updates
```bash
# Update dependencies
npm update
cd client && npm update

# Rebuild frontend
npm run build

# Restart server
pm2 restart c0alk
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change PORT in .env
2. **Database locked**: Check file permissions
3. **Nginx errors**: Run `nginx -t` to test config
4. **Template not showing**: Check file permissions
5. **Analytics not recording**: Check database writes

### Logs
- Application: `pm2 logs c0alk`
- Nginx: `/var/log/nginx/error.log`
- Database: Check SQLite file permissions

## Future Enhancements

Potential features to add:
- User authentication system
- Multi-user support with roles
- Advanced analytics dashboard
- API key management
- Webhook notifications
- Custom redirect rules
- A/B testing framework
- Traffic replay/testing
- Integration with ad platforms
- Machine learning for bot detection

## Support & Resources

- **Documentation**: README.md, SETUP.md
- **Examples**: /examples directory
- **Scripts**: /scripts directory
- **Issue Tracking**: Use GitHub issues
- **Community**: Create Discord/Slack channel

---

Built for legitimate traffic filtering and optimization purposes.
