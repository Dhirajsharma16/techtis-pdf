import fs from 'fs';
import path from 'path';

const rootDir = 'C:/Users/PEL/.gemini/antigravity/scratch/zerocost-pdf-suite';

function cleanString(str) {
    // 1. Replace all corrupted UTF-8 mojibake variants
    let cleaned = str
        .replace(/ - /g, ' - ')
        .replace(/ - /g, ' - ')
        .replace(/â€[“"”]/g, ' - ')
        .replace(/\u00E2\u20AC\u201D/g, ' - ')
        .replace(/\u00E2\u20AC\u201C/g, ' - ')
        .replace(/\u00E2\u20AC\u2013/g, ' - ')
        .replace(/\u00E2\u20AC\u2014/g, ' - ')
        .replace(/\uFFFD/g, ' - ')
        .replace(/\u2014/g, ' - ')  // em-dash - .replace(/\u2013/g, ' - '); // en-dash - // Clean up any double spaces around hyphens e.g. " - " -> " - "
    cleaned = cleaned.replace(/\s+-\s+/g, ' - ');
    return cleaned;
}

let modifiedFiles = 0;
let totalReplacements = 0;

function processFile(filePath) {
    const original = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanString(original);
    if (cleaned !== original) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        modifiedFiles++;
        console.log(`Cleaned: ${path.relative(rootDir, filePath)}`);
    }
}

function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['.git', 'node_modules', 'scratch'].includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath);
        } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js') || entry.name.endsWith('.json') || entry.name.endsWith('.xml')) {
            if (!entry.name.includes('LICENSES') && !entry.name.includes('.min.js')) {
                processFile(fullPath);
            }
        }
    }
}

console.log('[Fix Mojibake] Scanning and sanitizing all title tags, meta tags, and strings...');
walkDir(rootDir);
console.log(`[Fix Mojibake] Completed! Sanitized ${modifiedFiles} files.`);
