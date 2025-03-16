#!/usr/bin/env node

console.log('Starting build process...');

try {
  // Try to require webpack
  let webpack;
  try {
    webpack = require('webpack');
    console.log('Webpack loaded successfully');
  } catch (error) {
    console.error('Error loading webpack:', error.message);
    console.log('Attempting to install webpack...');
    
    // Try to install webpack if it's not found
    const { execSync } = require('child_process');
    execSync('npm install -D webpack webpack-cli', { stdio: 'inherit' });
    
    // Try requiring webpack again
    webpack = require('webpack');
    console.log('Webpack loaded successfully after installation');
  }
  
  // Load webpack config
  let webpackConfig;
  try {
    webpackConfig = require('./webpack.config.js');
    console.log('Webpack config loaded successfully');
  } catch (error) {
    console.error('Error loading webpack config:', error.message);
    process.exit(1);
  }
  
  console.log('Starting webpack compilation...');
  
  // Run webpack
  webpack(webpackConfig, (err, stats) => {
    if (err || stats.hasErrors()) {
      console.error('Build failed:');
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        process.exit(1);
      }
      
      const info = stats.toJson();
      
      if (stats.hasErrors()) {
        console.error('Webpack errors:');
        info.errors.forEach(error => {
          console.error(error);
        });
        process.exit(1);
      }
      
      if (stats.hasWarnings()) {
        console.warn('Webpack warnings:');
        info.warnings.forEach(warning => {
          console.warn(warning);
        });
      }
      
      process.exit(1);
    }
    
    // Log successful build
    const info = stats.toJson();
    console.log(`Build completed successfully in ${info.time}ms!`);
    console.log(`Output saved to ${webpackConfig.output.path}`);
    process.exit(0);
  });
} catch (error) {
  console.error('Unhandled error in build script:', error);
  process.exit(1);
} 