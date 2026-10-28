import fs from 'fs';
import path from 'path';
import { TOOLS } from '../js/tools/registry.js';

let toolPagesChecked = 0;
let errors = 0;

for (const t of TOOLS) {
    const p = path.join(t.id, 'index.html');
    if (!fs.existsSync(p)) {
        console.error('Missing tool page:', p);
        errors++;
        continue;
    }
    const html = fs.readFileSync(p, 'utf8');
    const hasCanonical = html.includes('rel="canonical"');
    const hasUseCases = html.includes('id="use-cases"');
    const hasTopics = html.includes('id="popular-topics"');
    const hasFaqSchema = html.includes('"@type": "FAQPage"');
    const hasWebAppSchema = html.includes('"@type": "WebApplication"');
    if (!hasCanonical || !hasUseCases || !hasTopics || !hasFaqSchema || !hasWebAppSchema) {
        console.error('Incomplete SEO on:', t.id);
        errors++;
    } else {
        toolPagesChecked++;
    }
}

const rootFiles = ['index.html', 'about.html', 'privacy.html', 'terms.html', 'contact.html'];
let rootFilesChecked = 0;
for (const f of rootFiles) {
    const html = fs.readFileSync(f, 'utf8');
    const hasCanonical = html.includes('rel="canonical"');
    const hasSchema = html.includes('application/ld+json');
    if (hasCanonical && hasSchema) rootFilesChecked++;
    else console.error('Root file missing SEO:', f);
}

console.log(`Tool Pages Fully SEO-Optimized: ${toolPagesChecked} / ${TOOLS.length}`);
console.log(`Root & Compliance Pages SEO-Optimized: ${rootFilesChecked} / ${rootFiles.length}`);
console.log(`Total Pages Verified: ${toolPagesChecked + rootFilesChecked} / ${TOOLS.length + rootFiles.length}`);
console.log(`Total Errors: ${errors}`);
