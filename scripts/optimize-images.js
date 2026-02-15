#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts images to WebP and AVIF formats for better performance
 * 
 * Usage: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  Image Optimization Script');
console.log('================================\n');

// Check if sharp is installed
try {
  require.resolve('sharp');
  console.log('✅ Sharp is installed');
} catch (e) {
  console.log('❌ Sharp is not installed');
  console.log('📦 Installing sharp...\n');
  console.log('Run: npm install sharp --save-dev\n');
  process.exit(1);
}

const sharp = require('sharp');

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];
const QUALITY = {
  webp: 80,
  avif: 60,
};

// Find all images in public directory
function findImages(dir) {
  const images = [];
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      images.push(...findImages(filePath));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        images.push(filePath);
      }
    }
  });

  return images;
}

// Optimize single image
async function optimizeImage(imagePath) {
  const ext = path.extname(imagePath);
  const baseName = path.basename(imagePath, ext);
  const dir = path.dirname(imagePath);

  const webpPath = path.join(dir, `${baseName}.webp`);
  const avifPath = path.join(dir, `${baseName}.avif`);

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    console.log(`\n📸 Processing: ${path.relative(PUBLIC_DIR, imagePath)}`);
    console.log(`   Original: ${(metadata.size / 1024).toFixed(2)} KB`);

    // Generate WebP
    await image
      .webp({ quality: QUALITY.webp })
      .toFile(webpPath);
    
    const webpSize = fs.statSync(webpPath).size;
    console.log(`   WebP: ${(webpSize / 1024).toFixed(2)} KB (${((1 - webpSize / metadata.size) * 100).toFixed(1)}% smaller)`);

    // Generate AVIF
    await image
      .avif({ quality: QUALITY.avif })
      .toFile(avifPath);
    
    const avifSize = fs.statSync(avifPath).size;
    console.log(`   AVIF: ${(avifSize / 1024).toFixed(2)} KB (${((1 - avifSize / metadata.size) * 100).toFixed(1)}% smaller)`);

    return {
      original: metadata.size,
      webp: webpSize,
      avif: avifSize,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('🔍 Finding images...\n');
  const images = findImages(PUBLIC_DIR);
  
  if (images.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${images.length} image(s) to optimize\n`);

  let totalOriginal = 0;
  let totalWebp = 0;
  let totalAvif = 0;

  for (const imagePath of images) {
    const result = await optimizeImage(imagePath);
    if (result) {
      totalOriginal += result.original;
      totalWebp += result.webp;
      totalAvif += result.avif;
    }
  }

  console.log('\n================================');
  console.log('📊 Summary');
  console.log('================================');
  console.log(`Total Original: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`Total WebP: ${(totalWebp / 1024).toFixed(2)} KB (${((1 - totalWebp / totalOriginal) * 100).toFixed(1)}% smaller)`);
  console.log(`Total AVIF: ${(totalAvif / 1024).toFixed(2)} KB (${((1 - totalAvif / totalOriginal) * 100).toFixed(1)}% smaller)`);
  console.log('\n✅ Optimization complete!\n');
}

main().catch(console.error);
