#!/bin/bash

echo "🧹 Cleaning Moodify project..."

# Remove main directories
echo "Removing node_modules..."
rm -rf node_modules

echo "Removing android build..."
rm -rf android

echo "Removing ios build..."
rm -rf ios

echo "Removing expo cache..."
rm -rf .expo

echo "Removing build outputs..."
rm -rf dist web-build build outputs

echo "Removing cache directories..."
rm -rf .cache .parcel-cache .npm .eslintcache

echo "Removing coverage..."
rm -rf coverage .nyc_output

echo "Removing temporary files..."
rm -rf tmp temp

echo "Removing OS files..."
find . -name ".DS_Store" -delete 2>/dev/null || true
find . -name "Thumbs.db" -delete 2>/dev/null || true
find . -name "._*" -delete 2>/dev/null || true

echo "Removing log files..."
find . -name "*.log" -delete 2>/dev/null || true
rm -rf logs

echo "Removing Metro cache..."
rm -rf .metro-health-check* 2>/dev/null || true

echo "Removing bundle artifacts..."
rm -f *.jsbundle

echo "Removing package manager files..."
rm -f *.tgz .yarn-integrity

echo "Removing runtime files..."
rm -f *.pid *.seed *.pid.lock

echo "✅ Project cleaned successfully!"
echo ""
echo "To reinstall dependencies, run:"
echo "npm install"
echo ""
echo "To rebuild Android:"
echo "npx expo run:android"
