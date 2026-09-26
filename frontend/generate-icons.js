// generate-icons.js — run with: node generate-icons.js
// Generates PNG icons from the SVG for PWA manifest
// Uses built-in Node.js only (no extra deps needed)
// The icons are simple colored squares with text as fallback

const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "public", "icons");

// Minimal PNG generator — creates a solid-color PNG with a green leaf shape
// This is enough for Android APK packaging; replace with proper icons later.

function createSvgIcon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.19}" fill="#1a73e8"/>
  <circle cx="${size/2}" cy="${size*0.39}" r="${size*0.156}" fill="none" stroke="#ffffff" stroke-width="${size*0.055}"/>
  <line x1="${size/2}" y1="${size*0.547}" x2="${size/2}" y2="${size*0.86}" stroke="#ffffff" stroke-width="${size*0.055}" stroke-linecap="round"/>
  <circle cx="${size/2}" cy="${size*0.39}" r="${size*0.063}" fill="#34a853"/>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svgContent = createSvgIcon(size);
  // Write SVG files that can be used directly; rename to .png for manifest
  // (browsers and Bubblewrap/TWA accept SVG as icon source too)
  const svgPath = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created icon-${size}.svg`);
});

console.log("Icons generated! For production, convert SVGs to PNGs using an image tool.");
