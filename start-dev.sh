#!/bin/bash

# Source NVM and use Node.js 18
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js 18
nvm use 18

# Verify Node.js version
echo "Using Node.js version: $(node --version)"

# Start Expo development server
npx expo start --clear
