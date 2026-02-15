#!/usr/bin/env node

/**
 * Performance Testing Script
 * Runs Lighthouse audits and generates performance reports
 * 
 * Usage: node scripts/performance-test.js [url]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const url = process.argv[2] || 'http://localhost:3000';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = path.join(__dirname, '../performance-reports');

console.log('🚀 Performance Testing Script');
console.log('================================\n');
console.log(`Testing URL: ${url}`);
console.log(`Timestamp: ${timestamp}\n`);

// Create reports directory
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
  console.log('📁 Created reports directory\n');
}

// Check if lighthouse is installed
try {
  execSync('lighthouse --version', { stdio: 'ignore' });
  console.log('✅ Lighthouse is installed\n');
} catch (e) {
  console.log('❌ Lighthouse is not installed');
  console.log('📦 Install with: npm install -g lighthouse\n');
  process.exit(1);
}

// Run Lighthouse audit
console.log('🔍 Running Lighthouse audit...\n');

const reportPath = path.join(reportDir, `lighthouse-${timestamp}.html`);
const jsonPath = path.join(reportDir, `lighthouse-${timestamp}.json`);

try {
  execSync(
    `lighthouse ${url} --output=html --output=json --output-path=${reportPath.replace('.html', '')} --chrome-flags="--headless"`,
    { stdio: 'inherit' }
  );

  console.log('\n✅ Lighthouse audit complete!\n');
  console.log(`📊 HTML Report: ${reportPath}`);
  console.log(`📄 JSON Report: ${jsonPath}\n`);

  // Parse and display key metrics
  if (fs.existsSync(jsonPath)) {
    const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const categories = report.categories;

    console.log('================================');
    console.log('📈 Performance Scores');
    console.log('================================\n');

    Object.entries(categories).forEach(([key, category]) => {
      const score = Math.round(category.score * 100);
      const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
      console.log(`${emoji} ${category.title}: ${score}/100`);
    });

    console.log('\n================================');
    console.log('⚡ Core Web Vitals');
    console.log('================================\n');

    const audits = report.audits;
    const metrics = {
      'First Contentful Paint': audits['first-contentful-paint'],
      'Largest Contentful Paint': audits['largest-contentful-paint'],
      'Total Blocking Time': audits['total-blocking-time'],
      'Cumulative Layout Shift': audits['cumulative-layout-shift'],
      'Speed Index': audits['speed-index'],
    };

    Object.entries(metrics).forEach(([name, audit]) => {
      if (audit) {
        console.log(`${name}: ${audit.displayValue}`);
      }
    });

    console.log('\n✅ Performance test complete!\n');
  }
} catch (error) {
  console.error('❌ Error running Lighthouse:', error.message);
  process.exit(1);
}
