#!/bin/bash

# Development server script for EC2
# This script runs the Vite dev server on EC2 with the correct environment

set -e

echo "========================================="
echo "Starting Development Server on EC2"
echo "========================================="
echo ""
echo "This will start the dev server accessible at:"
echo "  http://13.215.172.15:3000"
echo ""
echo "API calls will go to:"
echo "  http://13.215.172.15:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================="
echo ""

# Copy EC2 development environment to .env.development.local
# .local files take precedence over regular .env files
cp .env.development.ec2 .env.development.local

# Start the dev server
npm run dev
