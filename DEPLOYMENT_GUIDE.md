# Deployment Guide - Hostinger Hosting

This guide explains how to deploy your IV Calculation App to Hostinger. Since your app uses Node.js/Express backend and PostgreSQL, you have several deployment options.

## Important Notes

**Hostinger Shared Hosting** typically does NOT support Node.js applications. For this app, you need one of these options:

### Option 1: Hostinger VPS (Recommended)
- Best for full control
- Supports Node.js, PostgreSQL, and custom configurations
- Requires technical knowledge

### Option 2: Hybrid Approach
- Frontend (React build) on Hostinger Shared Hosting
- Backend on Railway, Render, or Render.com
- Database on Supabase, Railway, or Render.com PostgreSQL

### Option 3: Alternative Platforms (Easier)
- **Frontend**: Vercel, Netlify, or Hostinger (static files)
- **Backend**: Railway, Render, Fly.io, or DigitalOcean
- **Database**: Supabase, Railway PostgreSQL, or Neon

---

## Pre-Deployment Setup

### Step 1: Prepare Environment Variables

Create these files (DO NOT commit `.env` files to git):

**Backend `.env` file** (in `backend/` folder):
```env
PORT=3001
NODE_ENV=production

# Database Configuration
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
```

**Frontend `.env` file** (in root folder):
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

### Step 2: Update Database Connection

Update `backend/dbcon.js` to use environment variables (already done if using the updated version).

---

## Option 1: Hostinger VPS Deployment

### Prerequisites
- Hostinger VPS plan (Linux Ubuntu)
- SSH access to your VPS
- Domain name (optional but recommended)

### Steps

#### 1. Connect to VPS via SSH
```bash
ssh root@your-vps-ip
```

#### 2. Install Node.js and PostgreSQL
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE DATABASE iv_db;
CREATE USER iv_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE iv_db TO iv_user;
\q
```

#### 3. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### 4. Upload Your Code
```bash
# Option A: Using Git
cd /var/www
git clone your-repository-url iv-app
cd iv-app

# Option B: Using FTP/SFTP (upload files to /var/www/iv-app)
```

#### 5. Install Dependencies and Build
```bash
# Install frontend dependencies
npm install

# Build React app
npm run build

# Install backend dependencies
cd backend
npm install
```

#### 6. Configure Environment Variables
```bash
cd /var/www/iv-app/backend
nano .env
```

Add your environment variables (see Step 1 above).

#### 7. Start Backend with PM2
```bash
cd /var/www/iv-app/backend
pm2 start server.js --name iv-backend
pm2 save
pm2 startup
```

#### 8. Configure Nginx (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/iv-app
```

Add this configuration:
```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
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
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/iv-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 9. Setup SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com
```

---

## Option 2: Hybrid Deployment (Easier)

### Frontend on Hostinger Shared Hosting

#### 1. Build React App Locally
```bash
npm install
npm run build
```

#### 2. Upload Build Folder
- Log into Hostinger File Manager or use FTP
- Upload contents of `build/` folder to `public_html/`
- Create `.htaccess` file in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Backend on Railway/Render

#### Railway Deployment:
1. Sign up at railway.app
2. Create new project
3. Connect your GitHub repository
4. Set root directory to `backend/`
5. Add environment variables in Railway dashboard
6. Railway will auto-deploy and provide a URL like `https://your-app.railway.app`

#### Render Deployment:
1. Sign up at render.com
2. Create new Web Service
3. Connect GitHub repository
4. Settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Root Directory: `backend/`
5. Add environment variables
6. Render provides URL: `https://your-app.onrender.com`

#### Database on Supabase (Recommended):
1. Sign up at supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Update backend `.env` with Supabase credentials

### Update Frontend API URL
Set `REACT_APP_API_URL` in frontend `.env` to your backend URL:
```env
REACT_APP_API_URL=https://your-app.railway.app
```

Rebuild and re-upload frontend.

---

## Option 3: Alternative Platforms (Recommended for Beginners)

### Complete Deployment on Render.com (Free Tier Available)

1. **Backend Setup:**
   - Create Web Service on Render
   - Connect GitHub repo
   - Root Directory: `backend/`
   - Build: `cd backend && npm install`
   - Start: `node backend/server.js`
   - Add environment variables

2. **Database Setup:**
   - Create PostgreSQL database on Render
   - Get connection string
   - Update backend environment variables

3. **Frontend Setup:**
   - Create Static Site on Render
   - Connect GitHub repo
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
   - Add environment variable: `REACT_APP_API_URL=https://your-backend.onrender.com`

---

## Post-Deployment Checklist

- [ ] Database tables created successfully
- [ ] Backend API accessible
- [ ] Frontend loads correctly
- [ ] API calls working (check browser console)
- [ ] SSL certificate installed (HTTPS)
- [ ] Environment variables set correctly
- [ ] CORS configured for production domain
- [ ] PM2/process manager running (if using VPS)
- [ ] Database backups configured

---

## Troubleshooting

### Backend won't start:
- Check environment variables
- Verify database connection
- Check logs: `pm2 logs iv-backend` (if using PM2)

### Frontend API errors:
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Check browser console for errors

### Database connection errors:
- Verify database credentials
- Check firewall settings
- Ensure database server is running

### 404 errors on page refresh (React Router):
- Ensure `.htaccess` (Apache) or nginx config has proper rewrite rules

---

## Security Recommendations

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong database passwords**
3. **Enable HTTPS/SSL**
4. **Keep dependencies updated**
5. **Use environment variables for all secrets**
6. **Configure CORS properly** (only allow your frontend domain)
7. **Set up database backups**

---

## Support

For Hostinger-specific issues, contact Hostinger support. For deployment issues, check:
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs





