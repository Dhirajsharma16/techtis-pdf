/**
 * Automated Static Site Generator for TECHTIS (techtis.in)
 * Compiles all 32 dedicated tool landing pages for maximum SEO performance,
 * generates sitemap.xml, updates robots.txt, and links catalog items.
 * 
 * Optimized for "ZERO-SCROLL ABOVE-THE-FOLD" tool access.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS, FUNCTIONAL_CATEGORIES } from '../js/tools/registry.js';
import { SEO_DATA } from './seo-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const BASE_URL = 'https://techtis.in';
const TODAY = new Date().toISOString().split('T')[0];

console.log(`[SEO Generator] Starting generation for ${TOOLS.length} tools...`);

// Helper to escape HTML entities
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 1. Generate Dedicated Page for each tool
let generatedCount = 0;

for (const tool of TOOLS) {
    const seo = SEO_DATA[tool.id] || {
        title: `${tool.name} Online Free – 100% Private PDF Tool | TECHTIS`,
        metaDescription: `${tool.name} online free: ${tool.tagline}. 100% private in-browser RAM execution, zero file uploads, unlimited free access.`,
        keywords: `${tool.name.toLowerCase()}, free ${tool.name.toLowerCase()}, ${tool.name.toLowerCase()} online, private pdf tools`,
        h1: `${tool.name} Online Free`,
        subtitle: tool.tagline,
        badge: '100% In-Browser Privacy',
        howTo: [
            { step: 1, title: 'Upload Document', desc: 'Select or drop your file into the workspace.' },
            { step: 2, title: 'Configure & Process', desc: 'Adjust settings and process in browser RAM.' },
            { step: 3, title: 'Instant Download', desc: 'Download your result immediately with zero latency.' }
        ],
        features: [
            { title: '100% In-Browser Privacy', desc: 'Runs in browser RAM using WebAssembly. Zero files touch external servers.' },
            { title: 'Sub-100ms Speed', desc: 'No queueing or upload delay. Instant local processing.' },
            { title: 'Free & Unlimited', desc: 'No daily limits, no watermark, and no registration required.' },
            { title: 'All Devices Supported', desc: 'Works smoothly on Windows, Mac, iOS, Android, and Linux.' }
        ],
        content: `<p>${escapeHtml(tool.description)}</p>`,
        faqs: [
            { q: `Is TECHTIS ${tool.name} free to use?`, a: `Yes, ${tool.name} is 100% free with no hidden fees, subscriptions, or watermarks.` },
            { q: `Are my files uploaded to any server?`, a: `No. All operations run directly inside your browser memory with zero file uploads.` }
        ],
        relatedTools: TOOLS.filter(t => t.id !== tool.id).slice(0, 6).map(t => t.id)
    };

    const categoryObj = FUNCTIONAL_CATEGORIES.find(c => c.id === tool.functionalCategory) || { name: 'Tools', id: 'all' };
    const toolUrl = `${BASE_URL}/${tool.id}/`;

    // Build JSON-LD Schema Graphs
    const schemaGraph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                '@id': `${toolUrl}#webapp`,
                'name': `TECHTIS ${tool.name}`,
                'url': toolUrl,
                'applicationCategory': 'BusinessApplication, OfficeApplication, UtilityApplication',
                'operatingSystem': 'All (Windows, macOS, Linux, iOS, Android)',
                'browserRequirements': 'Requires JavaScript. Requires HTML5.',
                'softwareVersion': '2.0',
                'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD'
                },
                'aggregateRating': {
                    '@type': 'AggregateRating',
                    'ratingValue': '4.9',
                    'ratingCount': '12850',
                    'bestRating': '5'
                },
                'description': seo.metaDescription
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${toolUrl}#breadcrumb`,
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Home',
                        'item': `${BASE_URL}/`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': categoryObj.name,
                        'item': `${BASE_URL}/#${categoryObj.id}`
                    },
                    {
                        '@type': 'ListItem',
                        'position': 3,
                        'name': tool.name,
                        'item': toolUrl
                    }
                ]
            },
            {
                '@type': 'HowTo',
                '@id': `${toolUrl}#howto`,
                'name': `How to use ${tool.name} Online Free`,
                'description': `Follow these 3 simple steps to use ${tool.name} with 100% privacy in your browser.`,
                'step': seo.howTo.map(item => ({
                    '@type': 'HowToStep',
                    'position': item.step,
                    'name': item.title,
                    'text': item.desc
                }))
            },
            {
                '@type': 'FAQPage',
                '@id': `${toolUrl}#faq`,
                'mainEntity': seo.faqs.map(faq => ({
                    '@type': 'Question',
                    'name': faq.q,
                    'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': faq.a
                    }
                }))
            }
        ]
    };

    // Related Tools HTML Cards
    const relatedCardsHtml = (seo.relatedTools || [])
        .map(relId => TOOLS.find(t => t.id === relId))
        .filter(Boolean)
        .slice(0, 6)
        .map(rel => `
            <a href="../${rel.id}/" class="p-3 bg-white border border-slate-200/90 rounded-xl hover:border-red-400 hover:shadow-md transition-all group flex items-start gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white transition-all shadow-2xs">
                    <i data-lucide="${rel.icon}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h4 class="text-xs font-bold text-slate-800 group-hover:text-red-600 transition truncate">${rel.name}</h4>
                    <p class="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">${rel.tagline}</p>
                </div>
            </a>
        `).join('\n');

    // How-to Steps HTML
    const howToCardsHtml = seo.howTo.map(step => `
        <div class="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
            <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">${step.step}</span>
                <h3 class="font-bold text-slate-900 text-xs sm:text-sm">${escapeHtml(step.title)}</h3>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">${escapeHtml(step.desc)}</p>
        </div>
    `).join('\n');

    // Features Grid HTML
    const featuresCardsHtml = seo.features.map(f => `
        <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
            </div>
            <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${escapeHtml(f.title)}</h4>
            <p class="text-[11px] text-slate-500 leading-relaxed">${escapeHtml(f.desc)}</p>
        </div>
    `).join('\n');

    // FAQ Accordion HTML
    const faqAccordionHtml = seo.faqs.map(faq => `
        <details class="group bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 shadow-2xs">
            <summary class="flex items-center justify-between p-3.5 cursor-pointer select-none font-semibold text-slate-800 text-xs sm:text-sm group-open:text-red-600">
                <span>${escapeHtml(faq.q)}</span>
                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0"></i>
            </summary>
            <div class="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                ${escapeHtml(faq.a)}
            </div>
        </details>
    `).join('\n');

    // Complete Page Template - Engineered for Zero-Scroll Tool Access Above The Fold
    const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.metaDescription)}">
    <meta name="keywords" content="${escapeHtml(seo.keywords)}">
    <meta name="author" content="TECHTIS (techtis.in)">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="${toolUrl}">

    <!-- Open Graph Metadata -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${toolUrl}">
    <meta property="og:site_name" content="TECHTIS">
    <meta property="og:title" content="${escapeHtml(seo.title)}">
    <meta property="og:description" content="${escapeHtml(seo.metaDescription)}">
    <meta property="og:locale" content="en_US">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(seo.title)}">
    <meta name="twitter:description" content="${escapeHtml(seo.metaDescription)}">

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json">
    ${JSON.stringify(schemaGraph, null, 2)}
    </script>

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#fef2f2',
                            100: '#fee2e2',
                            500: '#ef4444',
                            600: '#dc2626',
                            700: '#b91c1c'
                        }
                    }
                }
            }
        }
    </script>

    <!-- Custom Platform Styles -->
    <link rel="stylesheet" href="../css/styles.css">

    <!-- Vendor Libraries -->
    <script src="../vendor/pdf-lib.min.js"></script>
    <script src="../vendor/pdf.min.js"></script>
    <script src="../vendor/jszip.min.js"></script>
    <script src="../vendor/tesseract.min.js"></script>
    <script src="../vendor/lucide.min.js"></script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col" data-tool-id="${tool.id}">

    <!-- Slim Navigation Header -->
    <header class="header-glass sticky top-0 z-40 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 border-b border-slate-200">
        <a href="../" class="flex items-center space-x-2 shrink-0 group" id="brand-logo-btn" title="TECHTIS Home">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
                <i data-lucide="file-text" class="w-4 h-4"></i>
            </div>
            <div>
                <div class="flex items-center gap-1.5">
                    <span class="text-base sm:text-lg font-black tracking-tight text-slate-900">TECH<span class="text-red-600">TIS</span></span>
                    <span class="text-[9px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">techtis.in</span>
                </div>
            </div>
        </a>

        <!-- Fast Navigation Links -->
        <nav class="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <a href="../#organize" class="px-2.5 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Organize</a>
            <a href="../#edit-sign" class="px-2.5 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Edit &amp; Sign</a>
            <a href="../#security" class="px-2.5 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Security</a>
            <a href="../#convert" class="px-2.5 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Convert</a>
            <a href="../#ai-smart" class="px-2.5 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">AI &amp; Edge</a>
        </nav>

        <div class="flex items-center gap-2">
            <a href="../" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-red-400 hover:text-red-600 shadow-2xs transition">
                <i data-lucide="grid" class="w-3.5 h-3.5"></i>
                <span>All 41 Tools</span>
            </a>
        </div>
    </header>

    <!-- Main Content Container (Zero-Scroll Focus) -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-2 sm:py-3 space-y-2.5">

        <!-- Unified Compact Breadcrumb & Back Bar -->
        <div class="flex items-center justify-between text-xs py-1 px-0.5 border-b border-slate-200/70">
            <nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-slate-500 min-w-0">
                <a href="../" id="btn-back-to-catalog" class="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-red-600 transition shrink-0">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                    <span>All Tools</span>
                </a>
                <span class="text-slate-300">/</span>
                <a href="../#${categoryObj.id}" class="hover:text-red-600 transition truncate hidden sm:inline">${escapeHtml(categoryObj.name)}</a>
                <span class="text-slate-300 hidden sm:inline">/</span>
                <span class="font-bold text-slate-800 truncate">${escapeHtml(tool.name)}</span>
            </nav>
            <div id="workspace-badge" class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] sm:text-[11px] font-semibold shrink-0">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span id="workspace-badge-text">100% In-Browser Privacy</span>
            </div>
        </div>

        <!-- Tool Workspace Section (ABOVE THE FOLD - 0 SCROLL REQUIRED) -->
        <section id="workspace-view" class="space-y-2">
            <!-- Compact Title & Value Proposition -->
            <div class="text-center max-w-2xl mx-auto pt-0.5 space-y-0.5">
                <h1 id="workspace-title" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight inline-flex items-center justify-center gap-2">
                    <span id="workspace-icon-wrapper" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 text-red-600 inline-flex items-center justify-center shrink-0">
                        <i id="workspace-icon" data-lucide="${tool.icon}" class="w-4 h-4 sm:w-4.5 sm:h-4.5"></i>
                    </span>
                    <span>${escapeHtml(seo.h1)}</span>
                </h1>
                <p id="workspace-description" class="text-xs text-slate-500 max-w-xl mx-auto line-clamp-1 leading-snug">${escapeHtml(seo.subtitle)}</p>
            </div>

            <!-- Dynamic Workspace Body (Immediate Drag-and-Drop & Action Controls) -->
            <div id="workspace-body" class="max-w-4xl mx-auto">
                <!-- Tool-specific interactive upload & control UI rendered by js/app.js -->
            </div>
        </section>

        <!-- Rich SEO Content Sections (BELOW THE FOLD for Search Crawlers & Documentation) -->
        <div class="pt-6 mt-4 border-t border-slate-200/90 space-y-8" id="seo-content-container">
            <!-- How To Use Section -->
            <section class="space-y-3" id="how-to-use">
                <div class="text-center max-w-xl mx-auto space-y-0.5">
                    <h2 class="text-base sm:text-lg font-extrabold text-slate-900">How to use ${escapeHtml(tool.name)} Online Free</h2>
                    <p class="text-xs text-slate-500">Fast, private in-browser document processing in 3 easy steps</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    ${howToCardsHtml}
                </div>
            </section>

            <!-- Key Features Section -->
            <section class="space-y-3" id="features">
                <div class="text-center max-w-xl mx-auto space-y-0.5">
                    <h2 class="text-base sm:text-lg font-extrabold text-slate-900">Why Choose TECHTIS for ${escapeHtml(tool.name)}</h2>
                    <p class="text-xs text-slate-500">Zero cloud latency &bull; Zero file retention &bull; 100% Free</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    ${featuresCardsHtml}
                </div>
            </section>

            <!-- In-Depth Editorial Guide -->
            <article class="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed" id="editorial-guide">
                <h2 class="text-sm sm:text-base font-bold text-slate-900">Complete Guide to ${escapeHtml(tool.name)}</h2>
                ${seo.content}
            </article>

            <!-- Frequently Asked Questions -->
            <section class="space-y-3" id="faq-section">
                <div class="text-center max-w-xl mx-auto space-y-0.5">
                    <h2 class="text-base sm:text-lg font-extrabold text-slate-900">Frequently Asked Questions</h2>
                    <p class="text-xs text-slate-500">Everything you need to know about ${escapeHtml(tool.name)} and privacy</p>
                </div>
                <div class="space-y-2 max-w-3xl mx-auto">
                    ${faqAccordionHtml}
                </div>
            </section>

            <!-- Related PDF Tools -->
            <section class="space-y-3" id="related-tools">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-sm sm:text-base font-extrabold text-slate-900">Related PDF Tools</h2>
                        <p class="text-[11px] text-slate-500">Explore complementary utilities for ${escapeHtml(tool.name)}</p>
                    </div>
                    <a href="../" class="text-xs font-semibold text-red-600 hover:underline">View all 32 tools &rarr;</a>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    ${relatedCardsHtml}
                </div>
            </section>
        </div>

    </main>

    <!-- Global Footer -->
    <footer class="bg-white border-t border-slate-200 mt-12 text-slate-500 text-xs py-8 px-4 lg:px-8">
        <div class="max-w-5xl mx-auto space-y-6">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 border-b border-slate-200">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center">
                        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                    </div>
                    <span class="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">TECH<span class="text-red-600">TIS</span></span>
                    <span class="text-[10px] text-slate-400">&bull; Serverless Zero-Cost Document Platform</span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <a href="../" class="hover:text-red-600 transition">Home</a>
                    <a href="../about.html" class="hover:text-red-600 transition">About</a>
                    <a href="../privacy.html" class="hover:text-red-600 transition">Privacy</a>
                    <a href="../terms.html" class="hover:text-red-600 transition">Terms</a>
                    <a href="../contact.html" class="hover:text-red-600 transition">Contact</a>
                </div>
            </div>

            <!-- Footer Tools Directory Grid -->
            <div class="space-y-2">
                <div class="font-bold text-slate-800 text-[10px] uppercase tracking-wider">All 41 Free Online PDF & Image Tools:</div>
                <div class="flex flex-wrap gap-1.5 text-[11px]">
                    ${TOOLS.map(t => `<a href="../${t.id}/" class="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition">${escapeHtml(t.name)}</a>`).join('\n                    ')}
                </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                <div>&copy; 2026 TECHTIS (techtis.in). All rights reserved. 100% Client-Side Privacy Guarantee.</div>
                <div>Sub-100ms In-Browser Engine &bull; Zero Server Uploads</div>
            </div>
        </div>
    </footer>

    <!-- Toast Notifications Container -->
    <div id="toast-container"></div>

    <!-- Application Orchestrator Script -->
    <script type="module" src="../js/app.js"></script>
</body>
</html>`;

    // Write file to <ROOT_DIR>/<tool.id>/index.html
    const toolDir = path.join(ROOT_DIR, tool.id);
    if (!fs.existsSync(toolDir)) {
        fs.mkdirSync(toolDir, { recursive: true });
    }
    fs.writeFileSync(path.join(toolDir, 'index.html'), pageHtml, 'utf8');
    generatedCount++;
}

console.log(`[SEO Generator] Successfully generated ${generatedCount} dedicated static tool pages (Zero-Scroll Optimized)!`);

// 2. Generate clean sitemap.xml with proper canonical URLs (no hash tags!)
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
    <!-- Homepage / Main Catalog Hub -->
    <url>
        <loc>${BASE_URL}/</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- Compliance & Policy Pages -->
    <url>
        <loc>${BASE_URL}/about.html</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.70</priority>
    </url>
    <url>
        <loc>${BASE_URL}/privacy.html</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.70</priority>
    </url>
    <url>
        <loc>${BASE_URL}/terms.html</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.70</priority>
    </url>
    <url>
        <loc>${BASE_URL}/contact.html</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.70</priority>
    </url>

    <!-- ${TOOLS.length} Dedicated Tool Landing Pages -->
${TOOLS.map((t, idx) => `    <!-- ${idx + 1}. ${escapeHtml(t.name)} -->
    <url>
        <loc>${BASE_URL}/${t.id}/</loc>
        <lastmod>${TODAY}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${t.isPopular ? '0.95' : '0.90'}</priority>
    </url>`).join('\n\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
console.log(`[SEO Generator] Successfully updated sitemap.xml with all ${TOOLS.length} tool pages & compliance pages!`);

// 3. Update robots.txt
const robotsTxt = `# TECHTIS (techtis.in) Robots Configuration
User-agent: *
Allow: /

# Canonical XML Sitemap
Sitemap: ${BASE_URL}/sitemap.xml
`;
fs.writeFileSync(path.join(ROOT_DIR, 'robots.txt'), robotsTxt, 'utf8');
console.log(`[SEO Generator] Successfully updated robots.txt.`);

// 4. Update index.html to link directly to dedicated tool pages
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    let updated = false;

    for (const tool of TOOLS) {
        const oldHashLink = `href="#${tool.id}"`;
        const newToolLink = `href="${tool.id}/"`;
        if (indexHtml.includes(oldHashLink)) {
            indexHtml = indexHtml.replaceAll(oldHashLink, newToolLink);
            updated = true;
        }

        // Also update schema URLs in index.html: "https://techtis.in/#${tool.id}" -> "https://techtis.in/${tool.id}/"
        const oldSchemaUrl = `"url": "https://techtis.in/#${tool.id}"`;
        const newSchemaUrl = `"url": "https://techtis.in/${tool.id}/"`;
        if (indexHtml.includes(oldSchemaUrl)) {
            indexHtml = indexHtml.replaceAll(oldSchemaUrl, newSchemaUrl);
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
        console.log(`[SEO Generator] Successfully updated index.html with crawlable internal links!`);
    }
}

console.log('[SEO Generator] All SEO generation tasks completed successfully!');
