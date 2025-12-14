# EC2 Deployment Configuration - Summary

## Problem
The frontend application was unable to connect to the backend API running in Docker containers on the EC2 instance because all API calls were hardcoded to `http://localhost:8000`.

## Solution
Implemented environment-based configuration using Vite's environment variables to support different API URLs for development and production environments.

## Changes Made

### 1. Environment Configuration Files

#### `.env.development`
```env
VITE_API_BASE_URL=http://localhost:8000
```
- Used during development (`npm run dev`)
- Connects to local backend

#### `.env.production`
```env
VITE_API_BASE_URL=http://13.215.215.232:8000
```
- Used during production build (`npm run build`)
- Connects to EC2 backend at the public IP address

### 2. TypeScript Type Definitions

#### `src/vite-env.d.ts` (New File)
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```
- Provides TypeScript type safety for environment variables
- Enables IDE autocomplete and type checking

### 3. API Client Updates

Updated all API client files to use the environment variable:

- `src/api/authApi.ts`
- `src/api/trainingApi.ts`
- `src/api/modelsApi.ts`
- `src/api/stocksApi.ts`
- `src/api/pipelinesApi.ts`

**Before:**
```typescript
const BASE_URL = 'http://localhost:8000';
```

**After:**
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

### 4. Documentation

#### `docs/DEPLOYMENT.md` (New File)
Comprehensive deployment guide covering:
- Problem overview and solution
- Step-by-step deployment instructions
- Nginx configuration
- Security group setup
- Troubleshooting guide
- HTTPS setup recommendations

#### `README.md` (Updated)
Added sections for:
- Development and production build instructions
- Environment configuration explanation
- Project structure overview

### 5. Deployment Script

#### `deploy.sh` (New File)
Automated deployment script that:
- Builds the production bundle
- Provides step-by-step deployment instructions
- Includes commands for SCP, Nginx setup, etc.

## How It Works

### Development Mode
```bash
npm run dev
```
1. Vite loads `.env.development`
2. Sets `VITE_API_BASE_URL=http://localhost:8000`
3. All API calls go to `http://localhost:8000/api/v1/...`
4. Works with local Docker backend

### Production Build
```bash
npm run build
```
1. Vite loads `.env.production`
2. Sets `VITE_API_BASE_URL=http://13.215.215.232:8000`
3. Bundles the application with this URL hardcoded
4. Output in `build/` directory is ready for deployment
5. All API calls will go to `http://13.215.215.232:8000/api/v1/...`

## Deployment Workflow

1. **Build locally or on EC2:**
   ```bash
   npm run build
   ```

2. **Transfer to EC2 (if built locally):**
   ```bash
   scp -r build/* ubuntu@13.215.215.232:/tmp/stock-ui/
   ```

3. **Deploy on EC2:**
   ```bash
   sudo cp -r /tmp/stock-ui/* /var/www/html/
   sudo systemctl restart nginx
   ```

4. **Access the application:**
   ```
   http://13.215.215.232/
   ```

## Backend Requirements

Ensure your backend Docker containers are:
1. Running and healthy (verified with `docker ps`)
2. Accessible on port 8000
3. Configured to allow CORS from the frontend domain
4. Exposed in EC2 security group (port 8000 open)

## Current Backend Status (from user)
```
CONTAINER ID   IMAGE                              PORTS
a3d96d5edd1e   docker-api                         0.0.0.0:8000->8000/tcp
4323ffadd470   docker-worker                      (internal)
e43b5905181a   apache/airflow:2.10.4-python3.11   0.0.0.0:8080->8080/tcp
ed74ea0d1d13   redis:7-alpine                     0.0.0.0:6379->6379/tcp
eb1808ac83f5   postgres:15-alpine                 0.0.0.0:5432->5432/tcp
e0db28f09c8d   minio/minio:latest                 0.0.0.0:9000-9001->9000-9001/tcp
```

✅ API container is running and exposed on port 8000

## Testing

After deployment, verify:

1. **Frontend loads:**
   ```
   http://13.215.215.232/
   ```

2. **API connectivity:**
   - Open browser DevTools → Network tab
   - Verify API calls go to `http://13.215.215.232:8000/api/v1/...`
   - Check for successful responses (200 status codes)

3. **Backend health:**
   ```bash
   curl http://13.215.215.232:8000/api/v1/health
   ```

## Future Improvements

1. **Use a domain name** instead of IP address
2. **Enable HTTPS** with Let's Encrypt SSL certificate
3. **Use Nginx proxy** for relative URLs (more flexible)
4. **Add environment-specific features** (e.g., debug mode in development)
5. **Implement CI/CD** for automated deployments

## Troubleshooting

### Issue: API calls still go to localhost
- **Cause:** Using development server instead of production build
- **Solution:** Run `npm run build` and deploy the `build/` directory

### Issue: CORS errors
- **Cause:** Backend not configured to allow frontend origin
- **Solution:** Update backend CORS settings to allow `http://13.215.215.232`

### Issue: 404 on page refresh
- **Cause:** Nginx not configured for SPA routing
- **Solution:** Add `try_files $uri $uri/ /index.html;` to Nginx config

### Issue: Cannot connect to API
- **Cause:** Port 8000 not accessible or backend not running
- **Solution:** 
  - Check EC2 security group allows port 8000
  - Verify backend container is running: `docker ps`
  - Test locally on EC2: `curl http://localhost:8000/api/v1/health`

## Files Modified Summary

**New Files:**
- `.env.development`
- `.env.production`
- `src/vite-env.d.ts`
- `docs/DEPLOYMENT.md`
- `deploy.sh`

**Modified Files:**
- `src/api/authApi.ts`
- `src/api/trainingApi.ts`
- `src/api/modelsApi.ts`
- `src/api/stocksApi.ts`
- `src/api/pipelinesApi.ts`
- `README.md`

**No changes needed:**
- `.gitignore` (already configured correctly)
- `vite.config.ts` (proxy only used in dev mode)
