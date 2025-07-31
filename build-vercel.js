#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // Change to frontend directory
  process.chdir(path.join(__dirname, 'frontend'));
  console.log('📁 Changed to frontend directory');

  // Install dependencies with legacy peer deps to avoid conflicts
  console.log('📦 Installing dependencies...');
  execSync('npm ci --legacy-peer-deps', { stdio: 'inherit' });

  // Set environment variables for production build
  process.env.NODE_ENV = 'production';
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.CI = 'false'; // Disable treating warnings as errors

  // Build the project
  console.log('🔨 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}