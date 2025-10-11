#!/bin/bash

# C0alk Installation Script
# This script helps set up the cloaker system on a fresh server

set -e

echo "================================"
echo "C0alk Installation Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Node.js
echo "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install Nginx
echo "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
fi

echo "Nginx version: $(nginx -v 2>&1)"

# Install Certbot for SSL
echo "Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
fi

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Create application directory
APP_DIR="/opt/c0alk"
echo "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR

# Set permissions
echo "Setting permissions..."
chown -R $USER:$USER $APP_DIR

echo ""
echo "================================"
echo "Installation Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Copy your c0alk files to $APP_DIR"
echo "2. Run: cd $APP_DIR && npm run setup"
echo "3. Configure .env file"
echo "4. Run: npm run build"
echo "5. Start with PM2: pm2 start server/index.js --name c0alk"
echo "6. Save PM2 config: pm2 save && pm2 startup"
echo ""
echo "For SSL certificates, run:"
echo "  sudo certbot --nginx -d yourdomain.com"
echo ""
