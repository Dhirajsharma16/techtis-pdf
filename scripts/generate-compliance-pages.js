import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS, FUNCTIONAL_CATEGORIES } from '../js/tools/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const categoriesWithTools = FUNCTIONAL_CATEGORIES
    .filter(cat => cat.id !== 'all')
    .map(cat => ({
        ...cat,
        tools: TOOLS.filter(t => t.functionalCategory === cat.id)
    }));

function renderRootCategorizedFooter() {
    return categoriesWithTools.map(cat => `
        <div class="space-y-1.5">
            <div class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-1">
                <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-red-600"></i>
                <span>${escapeHtml(cat.name)} (${cat.tools.length})</span>
            </div>
            <div class="flex flex-col gap-1 text-[11px]">
                ${cat.tools.map(t => `
                    <a href="${t.id}/" class="text-slate-600 hover:text-red-600 hover:bg-slate-50 px-1.5 py-0.5 rounded transition truncate" title="Free ${escapeHtml(t.name)} Online">${escapeHtml(t.name)}</a>
                `).join('')}
            </div>
        </div>
    `).join('');
}

const headerHtml = `    <!-- Unified Header with TechTis Official Logo & Suite Navigation -->
    <header class="header-glass sticky top-0 z-40 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 border-b border-slate-200">
        <a href="./" class="flex items-center gap-2.5 shrink-0 group" id="brand-logo-btn" title="TechTis - Free Online PDF, Image &amp; Developer Tools">
            <img src="assets/images/logo.png" alt="TechTis Logo" width="69" height="40" fetchpriority="high" class="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform">
            <div>
                <div class="leading-none">
                    <span class="text-base sm:text-lg font-black tracking-tight text-[#002244]">Tech<span class="text-[#EA1D2C]">Tis</span></span>
                </div>
                <p class="text-[9px] font-semibold text-slate-500 mt-0.5 leading-none">Free <span class="text-[#EA1D2C] font-bold">PDF</span>, <span class="text-[#EA1D2C] font-bold">Image</span> &amp; Dev Tools</p>
            </div>
        </a>

        <!-- Fast Navigation Links Across All Suites -->
        <nav class="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <a href="./#organize" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Organize</a>
            <a href="./#edit-sign" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Edit &amp; Sign</a>
            <a href="./#security" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Security</a>
            <a href="./#convert" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Convert</a>
            <a href="./#ai-smart" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">AI &amp; Edge</a>
            <a href="./#image" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Images</a>
            <a href="./#developer" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Dev Tools</a>
            <a href="./#design" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">CSS Design</a>
            <a href="./#text" class="px-2 py-1 rounded-md hover:text-red-600 hover:bg-red-50 transition">Text</a>
        </nav>

        <div class="flex items-center gap-2">
            <a href="./" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-red-400 hover:text-red-600 shadow-2xs transition">
                <i data-lucide="grid" class="w-3.5 h-3.5"></i>
                <span>All 60 Free Tools</span>
            </a>
        </div>
    </header>`;

function getFooterHtml(activePage) {
    return `    <!-- Comprehensive Categorized Mesh Footer (PageRank & Google Crawling Booster) -->
    <footer class="bg-white border-t border-slate-200 mt-12 text-slate-500 text-xs py-8 px-4 lg:px-8">
        <div class="max-w-6xl mx-auto space-y-8">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5 border-b border-slate-200">
                <div class="flex items-center space-x-2.5">
                    <img src="assets/images/logo.png" alt="TechTis Logo" width="69" height="40" class="h-8 w-auto object-contain">
                    <span class="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">TECH<span class="text-red-600">TIS</span></span>
                    <span class="text-[10px] text-slate-400">&bull; 100% In-Browser Private Utility Platform</span>
                </div>
                <div class="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <a href="./" class="hover:text-red-600 transition">Home</a>
                    <a href="about.html" class="${activePage === 'about' ? 'text-red-600 font-bold' : 'hover:text-red-600'} transition">About</a>
                    <a href="privacy.html" class="${activePage === 'privacy' ? 'text-red-600 font-bold' : 'hover:text-red-600'} transition">Privacy</a>
                    <a href="terms.html" class="${activePage === 'terms' ? 'text-red-600 font-bold' : 'hover:text-red-600'} transition">Terms</a>
                    <a href="contact.html" class="${activePage === 'contact' ? 'text-red-600 font-bold' : 'hover:text-red-600'} transition">Contact</a>
                </div>
            </div>

            <!-- Complete 9-Category 60-Tool Footer Directory Mesh -->
            <div class="space-y-4">
                <div class="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Explore All 60 Free Online Tools by Suite</span>
                    <span class="text-[10px] text-emerald-600 font-semibold normal-case">100% Client-Side &bull; No Server Uploads</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${renderRootCategorizedFooter()}
                </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 pt-4 border-t border-slate-100">
                <div>&copy; 2026 TECHTIS (techtis.in). All rights reserved. 100% Client-Side Privacy Guarantee.</div>
                <div>Sub-100ms In-Browser Engine &bull; Zero Server Uploads &bull; Free Forever</div>
            </div>
        </div>
    </footer>

    <script>
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    </script>`;
}

const commonHeadIcons = `    <!-- TechTis Official Brand Icons & Favicons (Google Search & Multi-Browser Compliant) -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
    <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#002244">
    <meta property="og:image" content="https://techtis.in/logo.png">
    <meta name="twitter:image" content="https://techtis.in/logo.png">
    <meta name="twitter:card" content="summary_large_image">`;

// =========================================================================
// 1. GENERATE ABOUT.HTML
// =========================================================================
const aboutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us - Free Online PDF | Image Tools | TECHTIS</title>
    <meta name="description" content="About TECHTIS (techtis.in): our mission is providing 60 free, private, client-side PDF and image tools powered by WebAssembly with zero file uploads.">
    <link rel="canonical" href="https://techtis.in/about.html">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="stylesheet" href="css/tailwind.min.css?v=2.3.0">
    <link rel="stylesheet" href="css/styles.css?v=2.3.0">
    <script defer src="vendor/lucide.min.js"></script>
${commonHeadIcons}
    <!-- Open Graph Metadata -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://techtis.in/about.html">
    <meta property="og:site_name" content="TECHTIS">
    <meta property="og:title" content="About TECHTIS - Free Online PDF | Image Tools">
    <meta property="og:description" content="Learn how TECHTIS provides 60 private, in-browser PDF, Image, Dev, and CSS tools with zero cloud uploads.">

    <!-- Schema.org Structured Data (Organization, AboutPage, BreadcrumbList) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://techtis.in/#organization",
          "name": "TECHTIS",
          "alternateName": ["TechTis", "TECHTIS Document Suite", "techtis.in"],
          "url": "https://techtis.in/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://techtis.in/assets/images/logo.png",
            "caption": "TECHTIS Logo"
          },
          "image": "https://techtis.in/logo.png",
          "description": "TECHTIS is a free online, zero-server client-side PDF, document, and image utilities platform featuring 60 free tools.",
          "foundingDate": "2024",
          "sameAs": [
            "https://github.com/Dhirajsharma16/techtis-pdf"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@techtis.in",
            "contactType": "customer support",
            "url": "https://techtis.in/contact.html"
          }
        },
        {
          "@type": "AboutPage",
          "@id": "https://techtis.in/about.html#webpage",
          "url": "https://techtis.in/about.html",
          "name": "About TECHTIS - Zero-Server Client-Side Document Platform",
          "description": "Discover the vision, architecture, and technology behind TECHTIS 60 free private online tools.",
          "publisher": { "@id": "https://techtis.in/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://techtis.in/" },
              { "@type": "ListItem", "position": 2, "name": "About Us", "item": "https://techtis.in/about.html" }
            ]
          }
        }
      ]
    }
    </script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">

${headerHtml}

    <!-- Main Content -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <!-- Hero Header -->
        <div class="space-y-3 text-center sm:text-left">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-red-600"></i>
                <span>Our Mission &amp; Technology</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">About TECHTIS</h1>
            <p class="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">The world's fastest, 100% private client-side document &amp; utility suite &bull; 60 professional online tools with zero cloud uploads.</p>
        </div>

        <!-- Vision Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                    <i data-lucide="zap" class="w-5 h-5"></i>
                </div>
                <h3 class="text-base font-bold text-slate-900">Sub-100ms Speed</h3>
                <p class="text-xs text-slate-500 leading-relaxed">No upload waiting times or remote server queues. Operations run directly inside your computer or phone RAM using WebAssembly.</p>
            </div>
            <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <i data-lucide="shield-check" class="w-5 h-5"></i>
                </div>
                <h3 class="text-base font-bold text-slate-900">Radical Privacy</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Your files never touch external servers or cloud databases. Personal contracts, medical records, and ID scans remain on your device.</p>
            </div>
            <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2.5">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <i data-lucide="gift" class="w-5 h-5"></i>
                </div>
                <h3 class="text-base font-bold text-slate-900">100% Free Forever</h3>
                <p class="text-xs text-slate-500 leading-relaxed">No hidden paywalls, artificial page limits, or forced registration. All 60 tools are unlimited and accessible worldwide.</p>
            </div>
        </div>

        <!-- Deep Dive Sections -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 text-sm text-slate-700 leading-relaxed shadow-xs">
            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="code" class="w-5 h-5 text-red-600"></i>
                    <span>Why We Built TECHTIS</span>
                </h2>
                <p>
                    Every day, millions of students, legal professionals, accountants, engineers, and everyday users need to perform essential document tasks: fill out a scanned government form, merge financial statements, crop a passport photo, convert images, or compress a PDF for an application portal.
                </p>
                <p>
                    Historically, online document converters have operated on expensive, insecure cloud architectures: you upload your confidential documents to unknown commercial servers, wait in processing queues, and download a copy, hoping your sensitive data is genuinely deleted.
                </p>
                <p>
                    <strong>TECHTIS (<a href="https://techtis.in/" class="text-red-600 font-semibold hover:underline">techtis.in</a>) changes that paradigm forever.</strong> Modern browsers are astonishingly powerful computing engines. By harnessing client-side WebAssembly, HTML5 Canvas, and modern Web Workers, TECHTIS delivers 60 professional-grade document, image, developer, and CSS utilities that execute entirely in your browser memory.
                </p>
            </section>

            <!-- 9 Functional Suites Breakdown -->
            <section class="space-y-4 pt-4 border-t border-slate-100">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="layers" class="w-5 h-5 text-red-600"></i>
                    <span>60 Professional Tools Across 9 Functional Suites</span>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="files" class="w-4 h-4 text-red-600"></i>
                            <span>1. PDF Core &amp; Organize</span>
                        </div>
                        <p class="text-slate-500">Merge PDF, Split PDF, Rotate PDF, Remove Pages, Extract Pages, and Organize Pages.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="pen-tool" class="w-4 h-4 text-red-600"></i>
                            <span>2. Edit, Fill &amp; Sign</span>
                        </div>
                        <p class="text-slate-500">PDF Form Filler (Aadhaar &amp; PAN click-to-type), Sign PDF, Edit PDF, Watermark, and Page Numbers.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="shield" class="w-4 h-4 text-red-600"></i>
                            <span>3. Security &amp; Optimization</span>
                        </div>
                        <p class="text-slate-500">Compress PDF, Protect PDF (AES-256), Unlock PDF, Flatten PDF, Grayscale, Crop, and Repair PDF.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="refresh-cw" class="w-4 h-4 text-red-600"></i>
                            <span>4. Convert &amp; Interop</span>
                        </div>
                        <p class="text-slate-500">PDF to JPG, JPG to PDF, Word to PDF, Excel to PDF, PowerPoint to PDF, Text to PDF, and Markdown to PDF.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="cpu" class="w-4 h-4 text-red-600"></i>
                            <span>5. AI &amp; Smart Edge</span>
                        </div>
                        <p class="text-slate-500">OCR Scanned PDF, Document Compare, AI Summarizer, AI Translator, and Form Blank Detector.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="image" class="w-4 h-4 text-red-600"></i>
                            <span>6. Image Processing Suite</span>
                        </div>
                        <p class="text-slate-500">Image Compressor, Resizer, Image Cropper, Passport Photo Maker, JPG/PNG/WebP/SVG converters.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="terminal" class="w-4 h-4 text-red-600"></i>
                            <span>7. Developer Utilities</span>
                        </div>
                        <p class="text-slate-500">QR Code Generator, JSON Formatter, Base64 Encoder, URL Encoder, Hash Generator, and Password Generator.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="palette" class="w-4 h-4 text-red-600"></i>
                            <span>8. CSS Design Suite</span>
                        </div>
                        <p class="text-slate-500">Glassmorphism Generator, Box Shadow Designer, Gradient Generator, Neumorphism, and Color Converter.</p>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <i data-lucide="file-text" class="w-4 h-4 text-red-600"></i>
                            <span>9. Text Tools</span>
                        </div>
                        <p class="text-slate-500">Word Counter, Case Converter, Lorem Ipsum Generator, and Markdown to HTML Converter.</p>
                    </div>
                </div>
            </section>

            <!-- Technology Stack -->
            <section class="space-y-3 pt-4 border-t border-slate-100">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="cpu" class="w-5 h-5 text-red-600"></i>
                    <span>The Client-Side Technology Stack</span>
                </h2>
                <p>
                    Our architecture relies exclusively on modern browser standards and high-performance WebAssembly engines:
                </p>
                <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
                    <li><strong>PDF Parsing &amp; Composition:</strong> In-browser <code>pdf-lib</code> and <code>PDF.js</code> for vector stream reconstruction, font embedding, encryption, and direct visual rendering without server overhead.</li>
                    <li><strong>High-DPI Canvas Resampling:</strong> Hardware-accelerated HTML5 Canvas with bicubic scaling algorithms for sub-pixel image cropping, passport photo tiling, and real-time color space transformations.</li>
                    <li><strong>Sandboxed Web Workers:</strong> Long-running tasks execute in asynchronous background threads, ensuring the user interface remains completely responsive at 60 FPS even when handling multi-hundred-page files.</li>
                    <li><strong>Global Edge Delivery:</strong> Static assets are precompiled and distributed globally via Cloudflare Edge network with HTTP/3 and Brotli compression, providing sub-50ms Time-to-First-Byte worldwide.</li>
                </ul>
            </section>
        </div>
    </main>

${getFooterHtml('about')}
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'about.html'), aboutHtml, 'utf8');
console.log('Successfully written about.html with unified logo header and categorized footer!');

// =========================================================================
// 2. GENERATE PRIVACY.HTML
// =========================================================================
const privacyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Client-Side Security | TECHTIS</title>
    <meta name="description" content="TECHTIS Privacy Policy. Learn how our client-side WebAssembly architecture ensures zero file uploads, zero data retention, and total document privacy.">
    <link rel="canonical" href="https://techtis.in/privacy.html">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="stylesheet" href="css/tailwind.min.css?v=2.3.0">
    <link rel="stylesheet" href="css/styles.css?v=2.3.0">
    <script defer src="vendor/lucide.min.js"></script>
${commonHeadIcons}
    <!-- Open Graph Metadata -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://techtis.in/privacy.html">
    <meta property="og:site_name" content="TECHTIS">
    <meta property="og:title" content="Privacy Policy - Client-Side Security | TECHTIS">
    <meta property="og:description" content="TECHTIS zero-upload privacy architecture. All 60 PDF, Image, Dev, and CSS tools run strictly in your browser memory.">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://techtis.in/#organization",
          "name": "TECHTIS",
          "alternateName": ["TechTis", "TECHTIS Document Suite", "techtis.in"],
          "url": "https://techtis.in/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://techtis.in/assets/images/logo.png",
            "caption": "TECHTIS Logo"
          },
          "image": "https://techtis.in/logo.png"
        },
        {
          "@type": "WebPage",
          "@id": "https://techtis.in/privacy.html#webpage",
          "url": "https://techtis.in/privacy.html",
          "name": "TECHTIS Privacy Policy",
          "description": "TECHTIS Client-Side Privacy Policy. Zero document uploads, zero data retention.",
          "publisher": { "@id": "https://techtis.in/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://techtis.in/" },
              { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://techtis.in/privacy.html" }
            ]
          }
        }
      ]
    }
    </script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">

${headerHtml}

    <!-- Main Content -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Strict Zero-Upload Architecture</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
            <p class="text-sm text-slate-500">Last updated: October 2026 &bull; Effective immediately for all visitors worldwide</p>
        </div>

        <!-- Privacy Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <i data-lucide="hard-drive" class="w-5 h-5"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-900">100% In-Browser RAM</h3>
                <p class="text-xs text-slate-500 leading-relaxed">PDFs, images, and identity cards are processed strictly inside your device memory via WebAssembly and Canvas.</p>
            </div>
            <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <i data-lucide="cloud-off" class="w-5 h-5"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-900">Zero Server Uploads</h3>
                <p class="text-xs text-slate-500 leading-relaxed">We maintain no file servers or databases. Files are never transmitted over the Internet to TECHTIS.</p>
            </div>
            <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-900">Instant Memory Purge</h3>
                <p class="text-xs text-slate-500 leading-relaxed">Closing your browser tab or clicking reset immediately clears all document buffers from your computer's RAM.</p>
            </div>
        </div>

        <!-- Detailed Legal Policy -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 text-sm text-slate-700 leading-relaxed shadow-xs">
            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="lock" class="w-5 h-5 text-red-600"></i>
                    <span>1. Our Fundamental Privacy Commitment</span>
                </h2>
                <p>
                    At TECHTIS (<a href="https://techtis.in/" class="text-red-600 font-semibold hover:underline">techtis.in</a>), privacy is not an afterthought or an optional toggle—it is the foundational engineering principle of our entire platform.
                </p>
                <p>
                    Most online file conversion services require you to transmit personal documents over the network to remote backend servers. TECHTIS eliminates this privacy vulnerability entirely by conducting 100% of document parsing, image rendering, merging, form filling, compression, and format transcoding directly inside your device's local memory.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="file-check" class="w-5 h-5 text-red-600"></i>
                    <span>2. Document &amp; File Data Handling</span>
                </h2>
                <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
                    <li><strong>No Server Transmission:</strong> When you drag, drop, or select a file in any of our 60 tools, the file is read exclusively into the JavaScript heap memory of your local web browser.</li>
                    <li><strong>No File Logging or Caching:</strong> TECHTIS operates zero file-storage buckets, zero object storage (such as AWS S3 or Cloudflare R2), and zero intermediate processing queues.</li>
                    <li><strong>Immediate Destruction:</strong> When you complete an operation and download your file, or when you refresh/close the webpage, your browser's garbage collector automatically overwrites and reclaims the memory.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="scan" class="w-5 h-5 text-red-600"></i>
                    <span>3. Special Privacy Provisions for Sensitive Tools</span>
                </h2>
                <p>
                    Certain tools in our suite handle exceptionally sensitive personal materials:
                </p>
                <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
                    <li><strong>Aadhaar &amp; PAN Card OCR:</strong> Text extraction from Indian identification cards runs strictly on-device using WebAssembly compiled OCR. No card numbers, names, or photos are ever sent to remote AI services unless the user explicitly toggles a cloud AI option with their own personal API key.</li>
                    <li><strong>Passport Photo Maker:</strong> Camera captures and uploaded portrait photographs are cropped, scaled, and tiled onto printable 4x6 / A4 sheets exclusively within client-side HTML5 Canvas.</li>
                    <li><strong>PDF Form Filler:</strong> Flattened vectors, text stamps, and digital signatures are burned directly into the PDF byte stream using <code>pdf-lib</code> in client RAM.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="database" class="w-5 h-5 text-red-600"></i>
                    <span>4. Browser LocalStorage &amp; Cookies</span>
                </h2>
                <p>
                    TECHTIS utilizes standard browser <code>localStorage</code> strictly for user convenience:
                </p>
                <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
                    <li><strong>Activity Counter:</strong> A local counter of completed operations is saved on your device so you can view your personal productivity history. This data never leaves your device and can be cleared at any time in the Activity Log modal.</li>
                    <li><strong>Custom API Keys:</strong> If you optionally supply personal API keys (such as Google Gemini, Groq, or OCR.space), they are saved exclusively in your browser's local storage and used solely for direct client-to-API requests.</li>
                </ul>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="globe" class="w-5 h-5 text-red-600"></i>
                    <span>5. Advertising &amp; Third-Party Partners</span>
                </h2>
                <p>
                    To keep all 60 document and image utilities 100% free with unlimited usage worldwide, TECHTIS may display non-intrusive advertisements served by Google AdSense and reputable advertising networks:
                </p>
                <ul class="list-disc pl-5 space-y-2 text-xs text-slate-600">
                    <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
                    <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to TECHTIS and/or other sites on the Internet.</li>
                    <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener" class="text-red-600 hover:underline">Google Ads Settings</a> or through <a href="https://www.aboutads.info" target="_blank" rel="noopener" class="text-red-600 hover:underline">aboutads.info</a>.</li>
                    <li><strong>Crucially:</strong> Advertisers and advertising scripts have absolutely NO access to your uploaded documents, images, or extracted text, which remain isolated inside sandboxed client memory.</li>
                </ul>
            </section>

            <section class="space-y-3 pt-4 border-t border-slate-100">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="mail" class="w-5 h-5 text-red-600"></i>
                    <span>6. Privacy Inquiries &amp; Data Rights</span>
                </h2>
                <p>
                    Because TECHTIS does not collect, store, or transmit your personal files or personal identifiers, there is no database of user records to export, modify, or erase under GDPR or CCPA. You retain 100% data sovereignty at all times.
                </p>
                <p>
                    If you have questions, feedback, or concerns regarding our privacy architecture, please contact us at:
                </p>
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800">
                    Email: <a href="mailto:privacy@techtis.in" class="text-red-600 hover:underline font-bold">privacy@techtis.in</a> &bull; Website: <a href="https://techtis.in" class="text-red-600 hover:underline">https://techtis.in</a>
                </div>
            </section>
        </div>
    </main>

${getFooterHtml('privacy')}
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'privacy.html'), privacyHtml, 'utf8');
console.log('Successfully written privacy.html with unified logo header and categorized footer!');

// =========================================================================
// 3. GENERATE TERMS.HTML
// =========================================================================
const termsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Usage Guidelines | TECHTIS</title>
    <meta name="description" content="TECHTIS Terms of Service. Review user guidelines, client-side processing policies, passport photo compliance warnings, and OCR accuracy disclaimers.">
    <link rel="canonical" href="https://techtis.in/terms.html">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="stylesheet" href="css/tailwind.min.css?v=2.3.0">
    <link rel="stylesheet" href="css/styles.css?v=2.3.0">
    <script defer src="vendor/lucide.min.js"></script>
${commonHeadIcons}
    <!-- Open Graph Metadata -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://techtis.in/terms.html">
    <meta property="og:site_name" content="TECHTIS">
    <meta property="og:title" content="Terms of Service - Usage Guidelines &amp; Disclaimers | TECHTIS">
    <meta property="og:description" content="Review user guidelines, client-side processing terms, and disclaimers for TECHTIS 60 free tools.">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://techtis.in/#organization",
          "name": "TECHTIS",
          "alternateName": ["TechTis", "TECHTIS Document Suite", "techtis.in"],
          "url": "https://techtis.in/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://techtis.in/assets/images/logo.png",
            "caption": "TECHTIS Logo"
          },
          "image": "https://techtis.in/logo.png"
        },
        {
          "@type": "WebPage",
          "@id": "https://techtis.in/terms.html#webpage",
          "url": "https://techtis.in/terms.html",
          "name": "TECHTIS Terms of Service",
          "description": "TECHTIS Terms of Service and Free Usage Guidelines.",
          "publisher": { "@id": "https://techtis.in/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://techtis.in/" },
              { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://techtis.in/terms.html" }
            ]
          }
        }
      ]
    }
    </script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">

${headerHtml}

    <!-- Main Content -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                <i data-lucide="scale" class="w-3.5 h-3.5 text-red-600"></i>
                <span>User Agreement</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
            <p class="text-sm text-slate-500">Last updated: October 2026 &bull; Applicable to all tools and services at techtis.in</p>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 text-sm text-slate-700 leading-relaxed shadow-xs">
            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-5 h-5 text-red-600"></i>
                    <span>1. Agreement to Terms</span>
                </h2>
                <p>
                    By accessing or utilizing TECHTIS (<a href="https://techtis.in/" class="text-red-600 font-semibold hover:underline">techtis.in</a>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue using the platform.
                </p>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="cpu" class="w-5 h-5 text-red-600"></i>
                    <span>2. Service Description &amp; Local Execution</span>
                </h2>
                <p>
                    TECHTIS provides a comprehensive suite of 60 client-side PDF, document, image, developer, and CSS utilities. All operations are conducted locally on your computer or mobile device using modern WebAssembly, Canvas, and HTML5 browser capabilities. TECHTIS does not host, upload, inspect, or retain your private files.
                </p>
            </section>

            <section class="space-y-4">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="alert-triangle" class="w-5 h-5 text-amber-600"></i>
                    <span>3. Important Disclaimers for Special Tools</span>
                </h2>
                <div class="space-y-3 text-xs">
                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-950">
                        <div class="font-bold flex items-center gap-1.5">
                            <i data-lucide="camera" class="w-4 h-4 text-amber-700"></i>
                            <span>Passport &amp; Visa Photo Maker:</span>
                        </div>
                        <p class="leading-relaxed">
                            While our presets strictly adhere to published international guidelines (e.g. India Passport Seva 35x45mm, US Department of State 2x2 inch, UK/Schengen ICAO 9303), TECHTIS does not guarantee automatic visa or passport approval by governmental authorities. Embassy guidelines regarding facial expressions, shadows, jewelry, and eye wear must be observed by the applicant. When printing the A4 sheet, users must select <strong>"Actual Size" / 100% scale</strong> in their print dialog.
                        </p>
                    </div>

                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-amber-950">
                        <div class="font-bold flex items-center gap-1.5">
                            <i data-lucide="scan" class="w-4 h-4 text-amber-700"></i>
                            <span>Private Document OCR (Aadhaar &amp; PAN):</span>
                        </div>
                        <p class="leading-relaxed">
                            Optical Character Recognition (OCR) is inherently probabilistic and dependent on input photo resolution, lighting, and camera angle. Users must independently verify all recognized names, identification numbers, and dates of birth before utilizing extracted data in official or legal contexts.
                        </p>
                    </div>
                </div>
            </section>

            <section class="space-y-3">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="shield-alert" class="w-5 h-5 text-red-600"></i>
                    <span>4. Limitation of Liability</span>
                </h2>
                <p>
                    TECHTIS and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including but not limited to loss of data, document corruption, or rejected official applications. The software is provided "AS IS" and "AS AVAILABLE" without warranties of any kind.
                </p>
            </section>

            <section class="space-y-3 pt-4 border-t border-slate-100">
                <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="mail" class="w-5 h-5 text-red-600"></i>
                    <span>5. Inquiries &amp; Legal Notices</span>
                </h2>
                <p>
                    For questions regarding these terms, please contact: <a href="mailto:support@techtis.in" class="text-red-600 font-mono hover:underline font-bold">support@techtis.in</a>.
                </p>
            </section>
        </div>
    </main>

${getFooterHtml('terms')}
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'terms.html'), termsHtml, 'utf8');
console.log('Successfully written terms.html with unified logo header and categorized footer!');

// =========================================================================
// 4. GENERATE CONTACT.HTML
// =========================================================================
const contactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us - Support &amp; Feedback | TECHTIS</title>
    <meta name="description" content="Contact TECHTIS (techtis.in). Reach out for user support, bug reporting, feature suggestions, or business inquiries regarding our 60 free private tools.">
    <link rel="canonical" href="https://techtis.in/contact.html">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="stylesheet" href="css/tailwind.min.css?v=2.3.0">
    <link rel="stylesheet" href="css/styles.css?v=2.3.0">
    <script defer src="vendor/lucide.min.js"></script>
${commonHeadIcons}
    <!-- Open Graph Metadata -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://techtis.in/contact.html">
    <meta property="og:site_name" content="TECHTIS">
    <meta property="og:title" content="Contact Us - Support &amp; Feedback | TECHTIS">
    <meta property="og:description" content="Reach the TECHTIS developer and support team for tool feedback, bug reports, and assistance.">

    <!-- Schema.org Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://techtis.in/#organization",
          "name": "TECHTIS",
          "alternateName": ["TechTis", "TECHTIS Document Suite", "techtis.in"],
          "url": "https://techtis.in/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://techtis.in/assets/images/logo.png",
            "caption": "TECHTIS Logo"
          },
          "image": "https://techtis.in/logo.png",
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "support@techtis.in",
            "contactType": "customer support",
            "url": "https://techtis.in/contact.html"
          }
        },
        {
          "@type": "ContactPage",
          "@id": "https://techtis.in/contact.html#webpage",
          "url": "https://techtis.in/contact.html",
          "name": "Contact TECHTIS",
          "description": "Contact TECHTIS support and developer team.",
          "publisher": { "@id": "https://techtis.in/#organization" },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://techtis.in/" },
              { "@type": "ListItem", "position": 2, "name": "Contact Us", "item": "https://techtis.in/contact.html" }
            ]
          }
        }
      ]
    }
    </script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col">

${headerHtml}

    <!-- Main Content -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                <i data-lucide="mail" class="w-3.5 h-3.5 text-red-600"></i>
                <span>Get in Touch</span>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Contact Us</h1>
            <p class="text-sm text-slate-500">Have questions, feedback, or a tool suggestion? We are here to help.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            <!-- Contact Channels -->
            <div class="md:col-span-5 space-y-4">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                    <h3 class="text-base font-bold text-slate-900">Direct Support Channels</h3>
                    
                    <div class="space-y-3 text-xs text-slate-600">
                        <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <i data-lucide="mail" class="w-5 h-5 text-red-600 mt-0.5 shrink-0"></i>
                            <div>
                                <div class="font-bold text-slate-800">General Support &amp; Feedback</div>
                                <a href="mailto:support@techtis.in" class="text-red-600 hover:underline font-mono">support@techtis.in</a>
                            </div>
                        </div>

                        <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <i data-lucide="shield" class="w-5 h-5 text-emerald-600 mt-0.5 shrink-0"></i>
                            <div>
                                <div class="font-bold text-slate-800">Privacy &amp; Security Officer</div>
                                <a href="mailto:privacy@techtis.in" class="text-emerald-700 hover:underline font-mono">privacy@techtis.in</a>
                            </div>
                        </div>

                        <div class="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <i data-lucide="github" class="w-5 h-5 text-slate-700 mt-0.5 shrink-0"></i>
                            <div>
                                <div class="font-bold text-slate-800">Open-Source Code &amp; Issues</div>
                                <a href="https://github.com/Dhirajsharma16/techtis-pdf" target="_blank" rel="noopener" class="text-blue-600 hover:underline font-mono">github.com/Dhirajsharma16/techtis-pdf</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                    <div class="font-bold flex items-center gap-1.5">
                        <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                        <span>Privacy Reminder</span>
                    </div>
                    <p class="leading-relaxed">
                        Please do not email personal documents or identity cards to our support email. TECHTIS processes files strictly inside your browser RAM, not via email.
                    </p>
                </div>
            </div>

            <!-- Interactive Message Form -->
            <div class="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
                <h3 class="text-base font-bold text-slate-900">Send Us a Direct Message</h3>

                <form id="contact-form" class="space-y-4 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Your Name</label>
                        <input type="text" id="contact-name" required placeholder="Alex Morgan" 
                               class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Your Email</label>
                        <input type="email" id="contact-email" required placeholder="alex@example.com" 
                               class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Subject</label>
                        <select id="contact-subject" class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                            <option value="feedback">General Feedback &amp; Suggestion</option>
                            <option value="bug">Bug Report / Tool Issue</option>
                            <option value="tool-request">Request a New Tool</option>
                            <option value="privacy">Privacy Question</option>
                            <option value="other">Other Inquiry</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Message</label>
                        <textarea id="contact-msg" required rows="4" placeholder="How can we help or improve TECHTIS?" 
                                  class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
                    </div>

                    <div class="pt-1">
                        <button type="submit" class="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer">
                            <i data-lucide="send" class="w-4 h-4"></i>
                            <span>Send Message</span>
                        </button>
                    </div>
                </form>

                <div id="contact-success" class="hidden p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-semibold">
                    Thank you! Your feedback has been received. We will get back to you shortly.
                </div>
            </div>
        </div>
    </main>

${getFooterHtml('contact')}

    <script>
        document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            const name = document.getElementById('contact-name')?.value || '';
            const email = document.getElementById('contact-email')?.value || '';
            const subject = document.getElementById('contact-subject')?.value || '';
            const message = document.getElementById('contact-msg')?.value || '';

            try {
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: 5, toolId: 'contact_' + subject, message: name + ' (' + email + '): ' + message })
                }).catch(() => {});
            } catch (_) {}

            document.getElementById('contact-form').classList.add('hidden');
            document.getElementById('contact-success').classList.remove('hidden');
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(rootDir, 'contact.html'), contactHtml, 'utf8');
console.log('Successfully written contact.html with unified logo header, categorized footer, and direct edge submission!');
