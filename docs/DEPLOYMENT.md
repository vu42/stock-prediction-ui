# Deployment Guide for EC2

## Overview
This guide explains how to configure and deploy the stock prediction UI to connect to the backend API running in Docker containers on your Ubuntu EC2 instance.

## Problem Summary
The frontend was hardcoded to use `http://localhost:8000` for API calls, which doesn't work when deployed to EC2 where the backend is accessible at `http://13.215.215.232:8000`.

## Solution Implemented
We've configured the application to use environment variables for the API base URL, allowing different configurations for development and production.

## Files Modified

### 1. Environment Configuration Files
- **`.env.development`**: Contains `VITE_API_BASE_URL=http://localhost:8000` for local development
- **`.env.production`**: Contains `VITE_API_BASE_URL=http://13.215.215.232:8000` for production deployment

### 2. TypeScript Type Definitions
- **`src/vite-env.d.ts`**: Added TypeScript definitions for the `VITE_API_BASE_URL` environment variable

### 3. API Client Files (Updated to use environment variable)
- `src/api/authApi.ts`
- `src/api/trainingApi.ts`
- `src/api/modelsApi.ts`
- `src/api/stocksApi.ts`
- `src/api/pipelinesApi.ts`

All now use: `const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';`

## Deployment Steps

### Step 1: Build the Production Bundle
On your local machine or EC2 instance, run:

```bash
npm run build
```

This will:
- Use the `.env.production` file automatically
- Set `VITE_API_BASE_URL=http://13.215.215.232:8000`
- Create an optimized production build in the `build/` directory

### Step 2: Deploy to EC2

#### Option A: Using a Web Server (Recommended)

**Using Nginx:**

1. Install Nginx on your EC2 instance:
```bash
sudo apt update
sudo apt install nginx -y
```

2. Copy your build files to the web server directory:
```bash
sudo cp -r build/* /var/www/html/
```

3. Configure Nginx (optional - for better routing):
```bash
sudo nano /etc/nginx/sites-available/default
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name 13.215.215.232;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Restart Nginx:
```bash
sudo systemctl restart nginx
```

#### Option B: Using Python HTTP Server (Quick Test)

For quick testing only:
```bash
cd build
python3 -m http.server 80
```

### Step 3: Configure EC2 Security Group

Ensure your EC2 security group allows:
- **Port 80** (HTTP) - for the frontend
- **Port 8000** - for the backend API
- **Port 8080** - for Airflow (if needed)

### Step 4: Access Your Application

Open your browser and navigate to:
```
http://13.215.215.232/
```

The frontend should now successfully connect to the backend API at `http://13.215.215.232:8000`.

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend API (running in Docker) allows requests from your frontend domain. Check the backend's CORS configuration.

### API Connection Fails
1. Verify the backend is running:
   ```bash
   sudo docker ps
   curl http://localhost:8000/api/v1/health
   ```

2. Check if port 8000 is accessible from outside:
   ```bash
   curl http://13.215.215.232:8000/api/v1/health
   ```

3. Verify the environment variable is being used:
   - Check the browser's Network tab
   - API calls should go to `http://13.215.215.232:8000/api/...`

### Using HTTPS (Recommended for Production)

For production, you should use HTTPS:

1. Get a domain name and point it to your EC2 IP
2. Install Let's Encrypt SSL certificate:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. Update `.env.production`:
   ```
   VITE_API_BASE_URL=https://yourdomain.com:8000
   ```

4. Configure your backend to use HTTPS as well

## Alternative: Using Relative URLs with Nginx Proxy

Instead of hardcoding the EC2 IP, you can use relative URLs and let Nginx proxy the requests:

1. Update `.env.production`:
   ```
   VITE_API_BASE_URL=
   ```
   (Empty string will make API calls relative)

2. Configure Nginx to proxy `/api/*` requests to the backend (see Nginx config above)

3. This approach is more flexible and works better with domain names and HTTPS

## Development vs Production

- **Development** (`npm run dev`): Uses `.env.development` → connects to `http://localhost:8000`
- **Production** (`npm run build`): Uses `.env.production` → connects to `http://13.215.215.232:8000`

## Notes

- The `.env.development` and `.env.production` files are committed to the repository for team consistency
- If you need instance-specific overrides, create `.env.local` (which is gitignored)
- Always rebuild (`npm run build`) after changing environment variables
