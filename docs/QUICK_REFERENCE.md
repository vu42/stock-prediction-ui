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

| Environment | File | API URL |
|------------|------|---------|
| Development | `.env.development` | `http://localhost:8000` |
| Production | `.env.production` | `http://13.215.172.15:8000` |

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
