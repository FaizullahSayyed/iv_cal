# Ubuntu VPS Setup Guide - IV Calculation App

Complete step-by-step guide for setting up your IV Calculation App on a fresh Ubuntu VPS.

## Step 1: Initial Server Setup & Security

### 1.1 Connect to Your VPS
```bash
ssh root@your-vps-ip
# Or if you have a username:
ssh username@your-vps-ip
```

### 1.2 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Create Non-Root User (Recommended)
```bash
# Create a new user
sudo adduser ivadmin
# Add to sudo group
sudo usermod -aG sudo ivadmin
# Switch to new user
su - ivadmin
```

### 1.4 Setup SSH Key Authentication (More Secure)
```bash
# On your local machine, generate SSH key if you don't have one:
ssh-keygen -t rsa -b 4096

# Copy public key to server
ssh-copy-id ivadmin@your-vps-ip

# Then disable password authentication (optional, but recommended)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

### 1.5 Configure Firewall (UFW)
```bash
# Allow SSH (important - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend port (temporary, we'll use Nginx later)
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 2: Install Node.js

### Option A: Using NVM (Recommended - Easy Version Management)
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS version
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version
npm --version
```

### Option B: Using NodeSource Repository
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### 3.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE iv_db;
CREATE USER iv_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE iv_db TO iv_user;
ALTER USER iv_user CREATEDB;
\q
```

### 3.2 Configure PostgreSQL for Remote Access (if needed)
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf
# Find and uncomment: listen_addresses = 'localhost'

# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add line: host    iv_db    iv_user    127.0.0.1/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Step 4: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown (usually involves running a sudo command)
```

---

## Step 5: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx

# Test in browser: http://your-vps-ip (should see Nginx welcome page)
```

---

## Step 6: Upload Your Application Code

### Option A: Using Git (Recommended)
```bash
# Install Git if not already installed
sudo apt install git -y

# Navigate to web directory
cd /var/www

# Clone your repository (replace with your actual repo URL)
sudo git clone https://github.com/yourusername/your-repo.git iv-app

# Set proper permissions
sudo chown -R $USER:$USER /var/www/iv-app
cd iv-app
```

### Option B: Using SFTP/SCP
```bash
# From your local machine, upload files:
scp -r /path/to/your/app/* ivadmin@your-vps-ip:/var/www/iv-app/

# Then on server:
cd /var/www/iv-app
```

---

## Step 7: Install Application Dependencies

```bash
# Navigate to project directory
cd /var/www/iv-app

# Install frontend dependencies
npm install

# Build React app
npm run build

# Install backend dependencies
cd backend
npm install
```

---

## Step 8: Configure Environment Variables

### 8.1 Backend Environment Variables
```bash
cd /var/www/iv-app/backend
nano .env
```

Add the following content:
```env
PORT=3001
NODE_ENV=production

# Database Configuration
DB_USER=iv_user
DB_HOST=localhost
DB_NAME=iv_db
DB_PASSWORD=your_secure_password_here
DB_PORT=5432

# Frontend URL (update with your actual domain)
FRONTEND_URL=http://yourdomain.com
```

Save and exit (Ctrl+X, then Y, then Enter)

### 8.2 Frontend Environment Variables (Optional)
```bash
cd /var/www/iv-app
nano .env
```

Add:
```env
REACT_APP_API_URL=http://yourdomain.com:3001
# Or if using Nginx proxy:
REACT_APP_API_URL=http://yourdomain.com/api
```

---

## Step 9: Start Backend with PM2

```bash
cd /var/www/iv-app/backend

# Start the backend server
pm2 start server.js --name iv-backend

# Save PM2 process list
pm2 save

# View logs
pm2 logs iv-backend

# Check status
pm2 status

# View real-time logs
pm2 logs iv-backend --lines 50
```

---

## Step 10: Configure Nginx

### 10.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/iv-app
```

Add this configuration (replace `yourdomain.com` with your actual domain):
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # or use subdomain for API

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend (React Build)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/iv-app/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Serve static assets with cache
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Alternative: Single Domain Setup** (if you want everything on one domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/iv-app/build;
    index index.html;

    # API Proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        rewrite ^/api(.*)$ $1 break;  # Remove /api prefix
    }

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 10.2 Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/iv-app /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 11: Update Backend CORS Settings

Edit `backend/server.js` to allow your domain:
```bash
nano /var/www/iv-app/backend/server.js
```

Update the CORS configuration:
```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",  // For local development
    "http://yourdomain.com",
    "https://yourdomain.com",
    "http://www.yourdomain.com",
    "https://www.yourdomain.com"
  ],
  credentials: true
}));
```

Then restart PM2:
```bash
pm2 restart iv-backend
```

---

## Step 12: Setup SSL/HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# If using subdomain for API:
sudo certbot --nginx -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configuration to use HTTPS.

---

## Step 13: Update Frontend API URL

After setting up SSL, update your frontend `.env`:
```env
REACT_APP_API_URL=https://yourdomain.com/api
```

Rebuild the frontend:
```bash
cd /var/www/iv-app
npm run build
```

---

## Step 14: Final Security Hardening

### 14.1 Remove Backend Port from Firewall (if using Nginx)
```bash
# Since Nginx handles requests, we can close port 3001 from external access
sudo ufw delete allow 3001/tcp
```

### 14.2 Set Proper File Permissions
```bash
# Set ownership
sudo chown -R $USER:$USER /var/www/iv-app

# Set permissions (directories: 755, files: 644)
find /var/www/iv-app -type d -exec chmod 755 {} \;
find /var/www/iv-app -type f -exec chmod 644 {} \;

# Make scripts executable if needed
chmod +x /var/www/iv-app/backend/server.js
```

---

## Step 15: Verify Everything Works

### 15.1 Check Services
```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql

# Check firewall
sudo ufw status
```

### 15.2 Test Backend API
```bash
# From server
curl http://localhost:3001/

# Should return: "Server is running!"
```

### 15.3 Test Frontend
Visit `http://yourdomain.com` (or `https://yourdomain.com` if SSL is set up)

---

## Useful Commands for Maintenance

### PM2 Commands
```bash
# View all processes
pm2 list

# View logs
pm2 logs iv-backend

# Restart backend
pm2 restart iv-backend

# Stop backend
pm2 stop iv-backend

# Delete process
pm2 delete iv-backend

# Monitor processes
pm2 monit
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Database Commands
```bash
# Connect to database
psql -U iv_user -d iv_db -h localhost

# Backup database
pg_dump -U iv_user -d iv_db -h localhost > backup_$(date +%Y%m%d).sql

# Restore database
psql -U iv_user -d iv_db -h localhost < backup_20240101.sql
```

---

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs iv-backend --lines 100

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Test database connection
cd /var/www/iv-app/backend
node -e "require('./dbcon').connect().then(() => console.log('OK')).catch(console.error)"
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l

# Test connection
psql -U iv_user -d iv_db -h localhost
```

### Nginx 502 Bad Gateway
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs iv-backend`
- Verify proxy_pass URL in Nginx config

### Frontend shows blank page
- Check browser console for errors
- Verify API_URL is correct
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

## Next Steps

1. ✅ Set up regular database backups
2. ✅ Configure monitoring (optional: use PM2 Plus, or monitoring tools)
3. ✅ Set up log rotation
4. ✅ Configure automatic security updates
5. ✅ Set up domain DNS records pointing to your VPS IP

---

## Quick Reference Checklist

- [ ] System updated and secured
- [ ] Node.js installed
- [ ] PostgreSQL installed and database created
- [ ] PM2 installed and configured
- [ ] Application code uploaded
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Backend running with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured
- [ ] Everything tested and working

---

**Congratulations! Your IV Calculation App should now be running on your Ubuntu VPS!** 🎉

