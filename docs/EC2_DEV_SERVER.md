# Running Development Server on EC2

## Overview

This guide explains how to run the Vite development server (`npm run dev`) directly on your EC2 instance and access it from your browser.

## Your Current Setup

- **EC2 IP**: `13.215.172.15`
- **Frontend Port**: `3000` (exposed in security group)
- **Backend Port**: `8000` (Docker container)
- **SSH Command**: `ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15`

## Quick Start

### Option 1: Using the Helper Script (Recommended)

1. SSH to your EC2 instance:
   ```bash
   ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15
   ```

2. Navigate to the project directory:
   ```bash
   cd /path/to/stock-prediction-ui
   ```

3. Run the EC2 development script:
   ```bash
   ./dev-ec2.sh
   ```

4. Access the application in your browser:
   ```
   http://13.215.172.15:3000
   ```

### Option 2: Manual Setup

1. SSH to EC2:
   ```bash
   ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15
   ```

2. Copy the EC2 environment file:
   ```bash
   cp .env.development.ec2 .env.development.local
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Access at `http://13.215.172.15:3000`

## How It Works

### Environment Files Priority

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Base environment
2. `.env.development` - Development defaults
3. `.env.development.ec2` - EC2-specific settings (committed to repo)
4. `.env.development.local` - Local overrides (gitignored, created by script)

### Configuration Breakdown

| Scenario | Environment File | API URL | Access URL |
|----------|-----------------|---------|------------|
| **Local Development** | `.env.development` | `http://localhost:8000` | `http://localhost:3000` |
| **EC2 Development** | `.env.development.ec2` | `http://13.215.172.15:8000` | `http://13.215.172.15:3000` |
| **Production Build** | `.env.production` | `http://13.215.172.15:8000` | `http://13.215.172.15/` |

### Why We Need Different Configs

**Local Development (`localhost:8000`):**
- Both frontend and backend run on your local machine
- API calls to `localhost:8000` work because it's the same machine

**EC2 Development (`13.215.172.15:8000`):**
- Frontend runs on EC2, accessed from your browser
- Your browser needs to call `http://13.215.172.15:8000` (not `localhost`)
- `localhost` in the browser would refer to your local machine, not EC2!

## Vite Configuration

Your `vite.config.ts` is already configured correctly:

```typescript
server: {
  port: 3000,           // Matches your EC2 security group
  open: false,          // Don't auto-open browser on EC2
  host: "0.0.0.0",      // Allow external connections
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

**Note**: The proxy is only used if you make API calls to `/api` (relative URL). Since we're using the full URL from `VITE_API_BASE_URL`, the proxy isn't used in this setup.

## Running in Background (Optional)

To keep the dev server running after you disconnect from SSH:

### Using `screen`:

```bash
# Start a new screen session
screen -S stock-ui-dev

# Run the dev server
./dev-ec2.sh

# Detach from screen: Press Ctrl+A, then D

# Reattach later
screen -r stock-ui-dev

# Kill the session
screen -X -S stock-ui-dev quit
```

### Using `tmux`:

```bash
# Start a new tmux session
tmux new -s stock-ui-dev

# Run the dev server
./dev-ec2.sh

# Detach from tmux: Press Ctrl+B, then D

# Reattach later
tmux attach -t stock-ui-dev

# Kill the session
tmux kill-session -t stock-ui-dev
```

### Using `nohup`:

```bash
# Run in background
nohup npm run dev > dev-server.log 2>&1 &

# Check the process
ps aux | grep vite

# View logs
tail -f dev-server.log

# Stop the server
pkill -f "vite"
```

## Troubleshooting

### Issue: Can't access from browser

**Check 1: Is the dev server running?**
```bash
# On EC2
curl http://localhost:3000
```

**Check 2: Is port 3000 open in security group?**
- Go to AWS Console → EC2 → Security Groups
- Verify inbound rule allows TCP port 3000 from your IP or 0.0.0.0/0

**Check 3: Is the server binding to 0.0.0.0?**
```bash
# Check the output when starting dev server
# Should show: "Local: http://localhost:3000/"
#              "Network: http://13.215.172.15:3000/"
```

### Issue: API calls fail

**Check 1: Is backend running?**
```bash
sudo docker ps | grep stock-prediction-api
curl http://localhost:8000/api/v1/health
```

**Check 2: Is port 8000 accessible?**
```bash
# From your local machine
curl http://13.215.172.15:8000/api/v1/health
```

**Check 3: Check browser console**
- Open DevTools → Network tab
- Verify API calls go to `http://13.215.172.15:8000/api/v1/...`
- Check for CORS errors

### Issue: Changes not reflecting

**Solution 1: Hard refresh**
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

**Solution 2: Clear Vite cache**
```bash
rm -rf node_modules/.vite
npm run dev
```

## Comparison: Dev Server vs Production Build

| Aspect | Dev Server (`npm run dev`) | Production Build (`npm run build`) |
|--------|---------------------------|-----------------------------------|
| **Command** | `./dev-ec2.sh` or `npm run dev` | `npm run build` |
| **Port** | 3000 | 80 (via Nginx) |
| **Hot Reload** | ✅ Yes | ❌ No |
| **Source Maps** | ✅ Yes | ❌ No (minified) |
| **Performance** | Slower (dev mode) | Faster (optimized) |
| **Use Case** | Development & testing | Production deployment |
| **Requires Rebuild** | ❌ No (auto-reload) | ✅ Yes (after changes) |

## Best Practices

### For Development on EC2:

1. **Use `screen` or `tmux`** to keep the server running
2. **Monitor logs** for errors and warnings
3. **Use `.env.development.local`** for personal overrides (gitignored)
4. **Don't commit** `.env.development.local` to git

### For Production:

1. **Always use production build** (`npm run build`)
2. **Use Nginx** to serve static files
3. **Enable HTTPS** with Let's Encrypt
4. **Set up proper monitoring** and logging

## Quick Commands Reference

```bash
# SSH to EC2
ssh -i ~/.ssh/id_ed25519_stock_prediction stock-prediction-vu@13.215.172.15

# Start dev server (quick)
./dev-ec2.sh

# Start dev server (manual)
cp .env.development.ec2 .env.development.local && npm run dev

# Check backend status
sudo docker ps

# Check backend health
curl http://localhost:8000/api/v1/health

# View dev server in background (with screen)
screen -S stock-ui-dev
./dev-ec2.sh
# Ctrl+A, then D to detach

# Reattach to screen
screen -r stock-ui-dev

# Stop dev server
# Press Ctrl+C in the terminal running the server
```

## Security Considerations

### Development Server on Public IP

⚠️ **Warning**: Running a development server on a public IP is convenient but has security implications:

1. **Dev server is not hardened** for production use
2. **Source maps expose** your code structure
3. **Debug information** is available

**Recommendations**:
- Only expose port 3000 to your IP address in the security group
- Use production builds for long-term deployments
- Consider using a VPN or SSH tunnel for sensitive development

### SSH Tunnel Alternative (More Secure)

Instead of exposing port 3000, you can use SSH port forwarding:

```bash
# On your local machine
ssh -i ~/.ssh/id_ed25519_stock_prediction \
    -L 3000:localhost:3000 \
    -L 8000:localhost:8000 \
    stock-prediction-vu@13.215.172.15

# Then on EC2, run dev server with localhost binding
# Modify vite.config.ts temporarily: host: "localhost"
npm run dev

# Access on your local machine
# http://localhost:3000
```

This way, ports 3000 and 8000 don't need to be exposed in the security group!

## Summary

- ✅ **Use `./dev-ec2.sh`** when running dev server on EC2
- ✅ **Access at** `http://13.215.172.15:3000`
- ✅ **API calls go to** `http://13.215.172.15:8000`
- ✅ **Use `screen` or `tmux`** to keep server running
- ✅ **For production**, use `npm run build` and Nginx
