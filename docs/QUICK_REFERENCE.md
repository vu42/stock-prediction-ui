# Quick Deployment Reference

## 🚀 Quick Deploy to EC2

### On Your Local Machine:
```bash
# 1. Build production bundle
npm run build

# 2. Transfer to EC2
scp -r build/* ubuntu@13.215.172.15:/tmp/stock-ui/
```

### On EC2 Instance:
```bash
# 3. Install Nginx (first time only)
sudo apt update && sudo apt install nginx -y

# 4. Deploy files
sudo cp -r /tmp/stock-ui/* /var/www/html/

# 5. Restart Nginx
sudo systemctl restart nginx
```

### Access Application:
```
http://13.215.172.15/
```

---

## 📋 Environment Variables

| Environment | File | API URL | Use Case |
|------------|------|---------|----------|
| Local Development | `.env.development` | `http://localhost:8000` | Local dev on your machine |
| EC2 Development | `.env.development.ec2` | `http://13.215.172.15:8000` | Dev server on EC2 |
| Production | `.env.production` | `http://13.215.172.15:8000` | Production build |

---

## 🖥️ Running Dev Server on EC2

### Quick Start:
```bash
# 1. SSH to EC2
ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15

# 2. Run dev server
./dev-ec2.sh

# 3. Access at
# http://13.215.172.15:3000
```

### Keep Running in Background:
```bash
# Using screen
screen -S stock-ui-dev
./dev-ec2.sh
# Press Ctrl+A, then D to detach

# Reattach later
screen -r stock-ui-dev
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev                    # Start dev server (uses .env.development)

# Production
npm run build                  # Build for production (uses .env.production)
./deploy.sh                    # Build and show deployment instructions

# Verify build
grep -o "13\.215\.172\.15:8000" build/assets/*.js  # Should show EC2 IP
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Frontend loads at `http://13.215.172.15/`
- [ ] Login page appears
- [ ] Browser DevTools → Network shows API calls to `http://13.215.172.15:8000/api/v1/...`
- [ ] No CORS errors in console
- [ ] Backend health check works: `curl http://13.215.172.15:8000/api/v1/health`

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| API calls go to localhost | Rebuild with `npm run build` |
| CORS errors | Update backend CORS settings |
| 404 on refresh | Configure Nginx for SPA routing |
| Can't connect to API | Check EC2 security group port 8000 |

---

## 📚 Documentation

- Full deployment guide: [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- Complete summary: [docs/EC2_DEPLOYMENT_SUMMARY.md](EC2_DEPLOYMENT_SUMMARY.md)
