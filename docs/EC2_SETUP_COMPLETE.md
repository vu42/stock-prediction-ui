# EC2 Development Server Setup - Complete Guide

## ✅ Your Setup is Now Fully Configured!

Your stock prediction UI now works perfectly with your EC2 setup where you run `npm run dev` on the instance and access it via `http://13.215.215.232:3000`.

## 🎯 Three Ways to Run the Application

### 1️⃣ **Local Development** (on your machine)
```bash
npm run dev
```
- **Access**: `http://localhost:3000`
- **API calls**: `http://localhost:8000`
- **Use case**: Development on your local machine

### 2️⃣ **EC2 Development Server** (your current setup)
```bash
# SSH to EC2
ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15

# Option A: Use the helper script
./dev-ec2.sh

# Option B: Use npm script
npm run dev:ec2

# Option C: Manual
cp .env.development.ec2 .env.development.local && npm run dev
```
- **Access**: `http://13.215.215.232:3000`
- **API calls**: `http://13.215.215.232:8000`
- **Use case**: Development on EC2, accessible from your browser

### 3️⃣ **Production Build** (for deployment)
```bash
npm run build
# Then deploy to Nginx
```
- **Access**: `http://13.215.215.232/` (port 80)
- **API calls**: `http://13.215.215.232:8000`
- **Use case**: Production deployment

## 📁 Environment Files Explained

| File | Purpose | API URL | Committed to Git? |
|------|---------|---------|-------------------|
| `.env.development` | Local dev on your machine | `http://localhost:8000` | ✅ Yes |
| `.env.development.ec2` | Dev server on EC2 | `http://13.215.215.232:8000` | ✅ Yes |
| `.env.development.local` | Auto-generated override | (varies) | ❌ No (gitignored) |
| `.env.production` | Production builds | `http://13.215.215.232:8000` | ✅ Yes |

## 🚀 Quick Start for EC2 Development

### First Time Setup (on EC2):
```bash
# 1. SSH to EC2
ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15

# 2. Navigate to project
cd /path/to/stock-prediction-ui

# 3. Install dependencies (if not already done)
npm install

# 4. Make scripts executable
chmod +x dev-ec2.sh deploy.sh

# 5. Start dev server
./dev-ec2.sh
```

### Daily Usage:
```bash
# SSH and run
ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15
cd /path/to/stock-prediction-ui
./dev-ec2.sh
```

### Keep Running in Background:
```bash
# Using screen (recommended)
screen -S stock-ui-dev
./dev-ec2.sh
# Press Ctrl+A, then D to detach

# Reattach later
screen -r stock-ui-dev

# Stop the server
screen -X -S stock-ui-dev quit
```

## 🔧 How It Works

### The Problem (Before)
When you ran `npm run dev` on EC2 and accessed `http://13.215.215.232:3000` from your browser:
- Frontend loaded correctly ✅
- API calls tried to go to `http://localhost:8000` ❌
- **Failed** because `localhost` in the browser refers to your local machine, not EC2!

### The Solution (Now)
1. Created `.env.development.ec2` with `VITE_API_BASE_URL=http://13.215.215.232:8000`
2. Created `dev-ec2.sh` script that copies this to `.env.development.local`
3. Vite loads `.env.development.local` which overrides `.env.development`
4. API calls now correctly go to `http://13.215.215.232:8000` ✅

### Environment Loading Order
Vite loads files in this order (later overrides earlier):
```
.env
  ↓
.env.development
  ↓
.env.development.ec2
  ↓
.env.development.local  ← This wins!
```

## 📊 Comparison Table

| Aspect | Local Dev | EC2 Dev Server | Production Build |
|--------|-----------|----------------|------------------|
| **Command** | `npm run dev` | `./dev-ec2.sh` | `npm run build` |
| **Access URL** | `localhost:3000` | `13.215.172.15:3000` | `13.215.172.15` |
| **API URL** | `localhost:8000` | `13.215.172.15:8000` | `13.215.172.15:8000` |
| **Hot Reload** | ✅ Yes | ✅ Yes | ❌ No |
| **Optimized** | ❌ No | ❌ No | ✅ Yes |
| **Port** | 3000 | 3000 | 80 (Nginx) |
| **Use Case** | Local dev | Remote dev | Production |

## 🔍 Verification

After starting the dev server on EC2, verify everything works:

### 1. Check Dev Server is Running
```bash
# On EC2
curl http://localhost:3000
# Should return HTML
```

### 2. Check Backend is Running
```bash
# On EC2
sudo docker ps | grep stock-prediction-api
curl http://localhost:8000/api/v1/health
# Should return health status
```

### 3. Check from Browser
1. Open `http://13.215.215.232:3000`
2. Open DevTools → Network tab
3. Verify API calls go to `http://13.215.215.232:8000/api/v1/...`
4. Check for successful responses (200 status codes)

## 🛠️ Troubleshooting

### Issue: Can't access from browser
**Solution**: Check EC2 security group allows port 3000
```bash
# AWS Console → EC2 → Security Groups
# Inbound rules should have:
# Type: Custom TCP
# Port: 3000
# Source: 0.0.0.0/0 (or your IP)
```

### Issue: API calls still go to localhost
**Solution**: Make sure you used `./dev-ec2.sh` or `npm run dev:ec2`
```bash
# Verify the environment file
cat .env.development.local
# Should show: VITE_API_BASE_URL=http://13.215.215.232:8000
```

### Issue: CORS errors
**Solution**: Update backend CORS settings to allow `http://13.215.215.232:3000`

### Issue: Changes not reflecting
**Solution**: Hard refresh browser
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

## 📚 Documentation Reference

- **Quick Commands**: [docs/QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **EC2 Dev Server Details**: [docs/EC2_DEV_SERVER.md](EC2_DEV_SERVER.md)
- **Production Deployment**: [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- **Complete Summary**: [docs/EC2_DEPLOYMENT_SUMMARY.md](EC2_DEPLOYMENT_SUMMARY.md)

## 🎓 Key Concepts

### Why Different Environment Files?

**Browser vs Server Context:**
- When you access `http://13.215.215.232:3000`, the JavaScript runs **in your browser**
- API calls from the browser need to use the **public IP** (`13.215.172.15:8000`)
- `localhost` in the browser would try to connect to **your local machine**, not EC2!

**Development vs Production:**
- **Development**: Vite dev server with hot reload, source maps, debugging
- **Production**: Optimized, minified, static files served by Nginx

### Vite Configuration

Your `vite.config.ts` is already perfect:
```typescript
server: {
  port: 3000,        // Matches EC2 security group
  host: "0.0.0.0",   // Allows external connections
  open: false,       // Don't auto-open browser on EC2
}
```

## ✨ New Files Created

1. **`.env.development.ec2`** - EC2 development environment
2. **`dev-ec2.sh`** - Helper script for EC2 dev server
3. **`docs/EC2_DEV_SERVER.md`** - Comprehensive EC2 dev guide
4. **`docs/EC2_SETUP_COMPLETE.md`** - This file!

## 🎉 You're All Set!

Your application now supports:
- ✅ Local development on your machine
- ✅ Development server on EC2 (your current workflow)
- ✅ Production builds for deployment

Choose the right command for your use case and you're good to go! 🚀
