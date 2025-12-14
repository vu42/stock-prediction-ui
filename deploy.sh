#!/bin/bash

# Deployment script for EC2
# This script builds the production bundle and provides instructions for deployment

set -e  # Exit on error

echo "========================================="
echo "Stock Prediction UI - Production Build"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Build the production bundle
echo "Building production bundle..."
npm run build

echo ""
echo "✅ Build completed successfully!"
echo ""
echo "Build output is in the 'build/' directory"
echo ""
echo "========================================="
echo "Next Steps for EC2 Deployment:"
echo "========================================="
echo ""
echo "1. Copy the build directory to your EC2 instance:"
echo "   scp -r build/* ubuntu@13.215.172.15:/tmp/stock-ui/"
echo ""
echo "2. SSH into your EC2 instance:"
echo "   ssh ubuntu@13.215.172.15"
echo ""
echo "3. On EC2, install Nginx (if not already installed):"
echo "   sudo apt update && sudo apt install nginx -y"
echo ""
echo "4. Copy files to Nginx web root:"
echo "   sudo cp -r /tmp/stock-ui/* /var/www/html/"
echo ""
echo "5. Restart Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
echo "6. Access your application at:"
echo "   http://13.215.215.232/"
echo ""
echo "========================================="
echo "For detailed instructions, see docs/DEPLOYMENT.md"
echo "========================================="
