import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('[Build Dist] Starting production distribution build for TECHTIS...');

// 0. Regenerate Compliance & E-E-A-T Pages
console.log('[Build Dist] Generating compliance & authority pages (about, privacy, terms, contact)...');
execSync(`node "${path.join(__dirname, 'generate-compliance-pages.js')}"`, { stdio: 'inherit' });

// 0.1 Regenerate SEO Pages across all 60 tools
console.log('[Build Dist] Generating dedicated SEO static pages...');
execSync(`node "${path.join(__dirname, 'build-seo.js')}"`, { stdio: 'inherit' });

// 1. Ensure dist directory exists
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Helper to copy file or folder recursively
function copySync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const item of fs.readdirSync(src)) {
            copySync(path.join(src, item), path.join(dest, item));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// 2. Copy Root HTML & Metadata Files
const rootFiles = [
    'index.html',
    'about.html',
    'contact.html',
    'privacy.html',
    'terms.html',
    'test-runner.html',
    'favicon.png',
    'logo.png',
    'robots.txt',
    'sitemap.xml',
    'ads.txt',
    'favicon.ico',
    'favicon-48x48.png',
    'favicon-96x96.png',
    'favicon-192x192.png',
    'favicon-512x512.png',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'apple-touch-icon.png',
    'site.webmanifest',
    '_headers'
];

for (const file of rootFiles) {
    const src = path.join(rootDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(distDir, file));
    }
}

// 3. Copy Asset Directories
const assetDirs = ['css', 'js', 'vendor', 'assets'];
for (const dir of assetDirs) {
    const src = path.join(rootDir, dir);
    if (fs.existsSync(src)) {
        copySync(src, path.join(distDir, dir));
    }
}

// 4. Copy All 60 Dedicated Tool Folders
const entries = fs.readdirSync(rootDir, { withFileTypes: true });
let toolCount = 0;
for (const entry of entries) {
    if (entry.isDirectory()) {
        const toolDir = entry.name;
        // Check if directory contains index.html and is not node_modules or dist or scripts
        if (!['dist', 'node_modules', 'scripts', '.git', '.github', 'cloudflare-worker', 'css', 'js', 'vendor', 'assets'].includes(toolDir)) {
            const toolIndexPath = path.join(rootDir, toolDir, 'index.html');
            if (fs.existsSync(toolIndexPath)) {
                copySync(path.join(rootDir, toolDir), path.join(distDir, toolDir));
                toolCount++;
            }
        }
    }
}

console.log(`[Build Dist] Copied ${toolCount} dedicated tool directories to dist/!`);

// 5. Create .assetsignore inside dist just in case
fs.writeFileSync(path.join(distDir, '.assetsignore'), '# Clean dist\n*.log\n', 'utf8');

console.log('[Build Dist] Production build completed successfully at dist/!');
