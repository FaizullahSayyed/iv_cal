# Docker Deployment Guide

This guide explains how to run the IV Calculation App using Docker Compose.

## Prerequisites

- Docker Desktop installed ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose (usually included with Docker Desktop)

## Quick Start

### 1. Production Setup

1. **Copy environment file:**
   ```bash
   cp .env.docker.example .env
   ```

2. **Edit `.env` file** with your configuration:
   ```env
   DB_PASSWORD=your_secure_password
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f postgres
   ```

5. **Stop services:**
   ```bash
   docker-compose down
   ```

6. **Stop and remove volumes (clears database):**
   ```bash
   docker-compose down -v
   ```

### 2. Development Setup

For development with hot reload:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This uses `docker-compose.dev.yml` which includes:
- Hot reload with nodemon
- Development environment variables
- Separate volumes for dev data

## Services

### PostgreSQL Database
- **Container:** `iv-cal-postgres`
- **Port:** `5432` (configurable via `DB_PORT`)
- **Data Volume:** `postgres_data` (persists data)
- **Health Check:** Automatic health monitoring

### Backend API
- **Container:** `iv-cal-backend`
- **Port:** `3001` (configurable via `BACKEND_PORT`)
- **Depends on:** PostgreSQL (waits for DB to be healthy)
- **Health Check:** HTTP health check endpoint

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=iv_db
DB_PORT=5432

# Backend
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:3000
```

These values will be used by Docker Compose and passed to containers.

## Database Access

### From Host Machine

Using psql or any PostgreSQL client:
```bash
psql -h localhost -p 5432 -U postgres -d iv_db
```

### From Within Docker Container

```bash
docker-compose exec postgres psql -U postgres -d iv_db
```

## Useful Commands

### View running containers
```bash
docker-compose ps
```

### Restart a specific service
```bash
docker-compose restart backend
docker-compose restart postgres
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Execute commands in container
```bash
# Backend container
docker-compose exec backend sh

# PostgreSQL container
docker-compose exec postgres psql -U postgres -d iv_db
```

### Rebuild containers (after code changes)
```bash
# Rebuild and restart
docker-compose up -d --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres iv_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres iv_db < backup.sql
```

## Volumes

Data is persisted in Docker volumes:

- **`postgres_data`**: PostgreSQL database files
- **`postgres_data_dev`**: Development database files (if using dev compose)

To view volumes:
```bash
docker volume ls
```

To remove volumes (⚠️ This deletes all data):
```bash
docker-compose down -v
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
netstat -an | grep 3001
netstat -an | grep 5432
```

### Database connection errors
```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "require('./dbcon').connect().then(() => console.log('Connected')).catch(console.error)"
```

### Rebuild from scratch
```bash
# Stop and remove everything
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild and start
docker-compose up -d --build
```

### Clear everything (nuclear option)
```bash
# Stop containers
docker-compose down -v

# Remove all related images
docker rmi $(docker images | grep iv-cal | awk '{print $3}')

# Remove volumes
docker volume rm iv-cal-postgres-data
```

## Production Deployment

For production deployment:

1. **Use strong passwords** in `.env`
2. **Set proper `FRONTEND_URL`** environment variable
3. **Enable SSL/HTTPS** (use reverse proxy like Nginx)
4. **Set up regular backups** of the database volume
5. **Monitor logs** regularly
6. **Keep Docker images updated**

Example production `.env`:
```env
DB_PASSWORD=very_secure_random_password_here
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

## Docker Compose Files

- **`docker-compose.yml`**: Production configuration
- **`docker-compose.dev.yml`**: Development configuration with hot reload

## Network

All services communicate via the `iv-cal-network` Docker network. The backend connects to PostgreSQL using the service name `postgres` as the hostname.





