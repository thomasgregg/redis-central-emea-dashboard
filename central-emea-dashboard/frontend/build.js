#!/usr/bin/env node

console.log('Starting build process...');

// Import required modules
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.js');

console.log('Webpack config loaded, starting compilation...');

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