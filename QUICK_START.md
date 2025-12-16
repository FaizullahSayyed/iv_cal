# Quick Start Deployment Guide

## Fastest Way to Deploy (Recommended for Beginners)

### Option A: Render.com (Free Tier Available)

#### 1. Backend Deployment (5 minutes)
1. Sign up at [render.com](https://render.com) (free account)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `iv-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node backend/server.js`
5. Add Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-name.onrender.com
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_NAME=your_db_name
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   ```
6. Click "Create Web Service"
7. Copy the URL (e.g., `https://iv-backend-xxxx.onrender.com`)

#### 2. Database Setup (3 minutes)
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Create database
3. Copy connection details from "Connect" tab
4. Update backend environment variables with these details

#### 3. Frontend Deployment (5 minutes)
1. In Render, click "New +" → "Static Site"
2. Connect GitHub repository
3. Configure:
   - **Name**: `iv-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://iv-backend-xxxx.onrender.com
   ```
5. Click "Create Static Site"
6. Your app will be live at `https://iv-frontend.onrender.com`

---

### Option B: Hostinger VPS (If you already have it)

1. **SSH into your VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PostgreSQL**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib -y
   sudo -u postgres createdb iv_db
   sudo -u postgres psql -c "CREATE USER iv_user WITH PASSWORD 'your_password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iv_db TO iv_user;"
   ```

4. **Upload your code**
   ```bash
   cd /var/www
   # Upload files via FTP/SFTP or use git clone
   ```

5. **Install dependencies**
   ```bash
   cd /path/to/your/app
   npm install
   cd backend
   npm install
   ```

6. **Create .env files**
   ```bash
   # backend/.env
   PORT=3001
   DB_USER=iv_user
   DB_HOST=localhost
   DB_NAME=iv_db
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

7. **Build frontend**
   ```bash
   npm run build
   ```

8. **Install PM2**
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name iv-backend
   pm2 save
   ```

9. **Setup Nginx**
   ```bash
   sudo apt install nginx -y
   sudo nano /etc/nginx/sites-available/iv-app
   ```
   
   Add configuration (see DEPLOYMENT_GUIDE.md for full nginx config)

---

## Environment Variables Summary

### Backend (.env in backend/ folder)
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
```

### Frontend (.env in root folder)
```env
REACT_APP_API_URL=https://your-backend-domain.com
```

---

## Important Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Build frontend before deploying** - Run `npm run build`
3. **Update API URLs** - Set `REACT_APP_API_URL` to your backend URL
4. **Database migration** - Tables are created automatically on first run
5. **CORS** - Backend CORS is configured via `FRONTEND_URL` environment variable

---

## Testing Locally Before Deploying

1. **Backend:**
   ```bash
   cd backend
   npm install
   # Create .env file with local database credentials
   node server.js
   ```

2. **Frontend:**
   ```bash
   npm install
   # Create .env file with REACT_APP_API_URL=http://localhost:3001
   npm start
   ```

---

## Need Help?

- See `DEPLOYMENT_GUIDE.md` for detailed instructions
- Check platform documentation:
  - Render: https://render.com/docs
  - Railway: https://docs.railway.app
  - Hostinger: https://www.hostinger.com/tutorials

