# Project Structure

```
c0alk/
│
├── 📄 Configuration Files
│   ├── package.json              # Root dependencies & scripts
│   ├── .env.example              # Environment variables template
│   ├── .gitignore                # Git ignore rules
│   └── LICENSE                   # MIT License
│
├── 📚 Documentation
│   ├── README.md                 # Main documentation
│   ├── QUICKSTART.md             # 5-minute setup guide
│   ├── SETUP.md                  # Detailed setup instructions
│   ├── PROJECT_OVERVIEW.md       # Architecture & technical details
│   └── STRUCTURE.md              # This file
│
├── 🖥️ server/                    # Backend API (Node.js/Express)
│   ├── index.js                  # Server entry point
│   ├── database.js               # SQLite setup & schema
│   │
│   ├── routes/                   # API endpoints
│   │   ├── templates.js          # Template CRUD operations
│   │   ├── domains.js            # Domain CRUD operations
│   │   ├── cloak.js              # Main cloaking logic
│   │   └── analytics.js          # Analytics & logging
│   │
│   └── utils/                    # Utilities
│       └── nginx.js              # Nginx config generator
│
├── 🎨 client/                    # Frontend Dashboard (React)
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # TailwindCSS config
│   ├── postcss.config.js         # PostCSS config
│   ├── index.html                # HTML entry point
│   │
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Main app component
│       ├── index.css             # Global styles
│       │
│       ├── components/           # React components
│       │   ├── Layout.jsx        # Main layout with sidebar
│       │   │
│       │   └── ui/               # Reusable UI components
│       │       ├── button.jsx    # Button component
│       │       ├── card.jsx      # Card component
│       │       ├── input.jsx     # Input component
│       │       ├── label.jsx     # Label component
│       │       ├── switch.jsx    # Switch/toggle component
│       │       └── badge.jsx     # Badge component
│       │
│       ├── pages/                # Page components
│       │   ├── Dashboard.jsx     # Dashboard overview
│       │   ├── Domains.jsx       # Domain list page
│       │   ├── DomainEdit.jsx    # Domain create/edit page
│       │   ├── Templates.jsx     # Template management page
│       │   └── Analytics.jsx     # Analytics page
│       │
│       └── lib/                  # Utilities & helpers
│           ├── api.js            # API client functions
│           └── utils.js          # Utility functions
│
├── 🗄️ data/                      # Runtime data (gitignored)
│   ├── cloaker.db                # SQLite database
│   └── templates/                # Uploaded HTML templates
│
├── 🔧 nginx/                     # Nginx configurations
│   ├── nginx.conf.example        # Example main config
│   └── sites-enabled/            # Generated domain configs
│
├── 📝 examples/                  # Example files
│   └── template-example.html     # Sample cloaked page template
│
└── 🛠️ scripts/                   # Utility scripts
    ├── install.sh                # Server installation script
    └── backup.sh                 # Database backup script

```

## File Count Summary

- **Backend**: 6 files (1 entry + 1 database + 4 routes + 1 util)
- **Frontend**: 17 files (3 config + 3 entry + 6 UI + 5 pages + 2 lib)
- **Documentation**: 5 files
- **Configuration**: 4 files
- **Examples**: 2 files
- **Scripts**: 2 files

**Total**: ~36 source files

## Key Technologies

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **File Upload**: Multer
- **Geo Location**: geoip-lite
- **User Agent**: useragent
- **HTTP Client**: Axios

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Infrastructure
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (recommended)
- **SSL**: Certbot/Let's Encrypt

## Data Flow

```
User Request
    ↓
Nginx (Reverse Proxy)
    ↓
Express API (/api/cloak/:domainId)
    ↓
Cloaking Logic (server/routes/cloak.js)
    ├→ Check GCLID
    ├→ Check Device Type
    ├→ Check IP/ASN
    ├→ Check Geo Location
    └→ Decision
        ├→ BLOCKED: Serve Template
        └→ ALLOWED: Redirect to Target
    ↓
Log to Database (access_logs table)
```

## Database Tables

1. **templates** - HTML template storage
2. **domains** - Domain configurations
3. **asn_blocks** - ASN blacklist per domain
4. **country_blocks** - Country blacklist per domain
5. **state_blocks** - State/region blacklist per domain
6. **ip_blocks** - IP blacklist per domain
7. **access_logs** - Request analytics

## Port Configuration

- **Backend API**: 3000 (configurable via PORT env var)
- **Frontend Dev**: 5173 (Vite default)
- **Nginx**: 80 (HTTP) / 443 (HTTPS)

## Environment Variables

```
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/cloaker.db
TEMPLATES_DIR=./data/templates
NGINX_CONFIG_DIR=./nginx/sites-enabled
```

## Build Outputs

### Development
- Backend runs directly with nodemon
- Frontend served by Vite dev server

### Production
- Frontend built to `client/dist/`
- Backend serves static files from dist
- Single Node.js process serves everything

## Dependencies Size

### Backend (~15 packages)
- Production dependencies: ~10
- Dev dependencies: ~2

### Frontend (~20 packages)
- Production dependencies: ~12
- Dev dependencies: ~8

## Generated Files (Runtime)

```
data/
├── cloaker.db              # SQLite database
└── templates/
    ├── uuid1.html
    ├── uuid2.html
    └── ...

nginx/sites-enabled/
├── domain-id-1.conf
├── domain-id-2.conf
└── ...

client/dist/               # Production build
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

## Ignored Files (.gitignore)

- `node_modules/` - Dependencies
- `.env` - Environment variables
- `data/` - Runtime data
- `nginx/sites-enabled/*.conf` - Generated configs
- `client/dist/` - Build output
- `*.log` - Log files

---

This structure is designed for:
- ✅ Easy navigation
- ✅ Clear separation of concerns
- ✅ Scalability
- ✅ Maintainability
- ✅ Development efficiency
