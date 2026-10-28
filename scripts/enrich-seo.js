/**
 * Merges all 9 SEO clusters into scripts/seo-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEO_DATA } from './seo-data.js';

import { ORGANIZE_CLUSTERS } from './seo-clusters/organize.js';
import { EDIT_SIGN_CLUSTERS } from './seo-clusters/edit-sign.js';
import { SECURITY_CLUSTERS } from './seo-clusters/security.js';
import { CONVERT_CLUSTERS } from './seo-clusters/convert.js';
import { AI_SMART_CLUSTERS } from './seo-clusters/ai-smart.js';
import { IMAGE_CLUSTERS } from './seo-clusters/image.js';
import { DEVELOPER_CLUSTERS } from './seo-clusters/developer.js';
import { DESIGN_CLUSTERS } from './seo-clusters/design.js';
import { TEXT_CLUSTERS } from './seo-clusters/text.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEO_DATA_PATH = path.join(__dirname, 'seo-data.js');

const ALL_CLUSTERS = {
    ...ORGANIZE_CLUSTERS,
    ...EDIT_SIGN_CLUSTERS,
    ...SECURITY_CLUSTERS,
    ...CONVERT_CLUSTERS,
    ...AI_SMART_CLUSTERS,
    ...IMAGE_CLUSTERS,
    ...DEVELOPER_CLUSTERS,
    ...DESIGN_CLUSTERS,
    ...TEXT_CLUSTERS
};

console.log(`[Enrich SEO] Merging clusters into ${Object.keys(SEO_DATA).length} tools...`);

let enrichedCount = 0;

for (const [toolId, toolSeo] of Object.entries(SEO_DATA)) {
    const cluster = ALL_CLUSTERS[toolId];
    if (cluster) {
        // 1. Assign long-tail keywords list
        toolSeo.longTailKeywords = cluster.longTailKeywords;

        // 2. Assign step-by-step practical use cases
        toolSeo.useCases = cluster.useCases;

        // 3. Assign expanded FAQs
        toolSeo.faqs = cluster.faqs;

        // 4. Update meta keywords string to include all long-tail phrases
        const existingKw = (toolSeo.keywords || '').split(',').map(s => s.trim()).filter(Boolean);
        const combinedKw = [...new Set([...cluster.longTailKeywords, ...existingKw])];
        toolSeo.keywords = combinedKw.join(', ');

        enrichedCount++;
    } else {
        console.warn(`[Enrich SEO] Warning: No cluster found for tool ${toolId}`);
    }
}

// Generate the new content for seo-data.js
const fileHeader = `/**
 * TECHTIS SEO Knowledge Base & Structured Data Dictionary
 * Exhaustive on-page metadata, semantic content, FAQs, HowTo steps, and LSI keywords
 * for all 60 PDF, Image & Developer utilities.
 * 
 * Auto-enriched with 20+ long-tail keyword clusters, real-world use cases,
 * and high-intent FAQs per tool.
 */

export const SEO_DATA = `;

const updatedFileContent = fileHeader + JSON.stringify(SEO_DATA, null, 4) + ';\n';

fs.writeFileSync(SEO_DATA_PATH, updatedFileContent, 'utf8');

console.log(`[Enrich SEO] Successfully enriched and wrote ${enrichedCount} tools to ${SEO_DATA_PATH}!`);
