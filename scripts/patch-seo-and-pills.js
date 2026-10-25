import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Patch index.html to remove the secondary filter pills
const indexPath = path.join(ROOT_DIR, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const pillsBlock = `                <!-- Secondary Architecture Filter Pills -->
                <div class="flex flex-wrap items-center gap-1.5">
                    <button class="cat-pill active px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white transition shadow-xs" data-category="all">
                        All (32)
                    </button>
                    <button class="cat-pill px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition" data-category="popular">
                        Popular
                    </button>
                    <button class="cat-pill px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition" data-category="group-a">
                        Client-Side RAM
                    </button>
                    <button class="cat-pill px-3 py-1 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition" data-category="group-b">
                        Edge AI
                    </button>
                </div>`;

if (indexHtml.includes(pillsBlock)) {
    indexHtml = indexHtml.replace(pillsBlock, '');
    console.log('[Patch] Removed pill filter bar from index.html');
} else {
    // Try matching with regex in case of slight whitespace variance
    const regex = /<!-- Secondary Architecture Filter Pills -->[\s\S]*?<\/div>/;
    if (regex.test(indexHtml)) {
        indexHtml = indexHtml.replace(regex, '');
        console.log('[Patch] Removed pill filter bar from index.html via regex');
    } else {
        console.warn('[Patch] Could not find pillsBlock in index.html');
    }
}
fs.writeFileSync(indexPath, indexHtml, 'utf8');

// 2. Patch js/app.js to:
// - Redirect any hash links (/#merge-pdf) to clean dedicated URLs (/merge-pdf/)
// - Ensure tool cards navigate directly to /${tool.id}/ so users land on dedicated pages
// - Remove cat-pill listeners
const appJsPath = path.join(ROOT_DIR, 'js/app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');

// Hash redirect
const oldHashCheck = `        // Support both dedicated tool pages (/merge-pdf/) and hash deep links (#merge-pdf)
        const dedicatedToolId = document.body?.dataset?.toolId;
        if (this.isDedicatedPage && dedicatedToolId && TOOLS.some(t => t.id === dedicatedToolId)) {
            this.openToolWorkspace(dedicatedToolId, { isDedicatedPage: true });
        } else {
            const initialHash = window.location.hash.replace(/^#/, '');
            if (initialHash && TOOLS.some(t => t.id === initialHash)) {
                this.openToolWorkspace(initialHash);
            }
        }`;

const newHashCheck = `        // If page has a data-tool-id, mount tool on dedicated page
        const dedicatedToolId = document.body?.dataset?.toolId;
        if (this.isDedicatedPage && dedicatedToolId && TOOLS.some(t => t.id === dedicatedToolId)) {
            this.openToolWorkspace(dedicatedToolId, { isDedicatedPage: true });
        } else {
            // Automatically redirect legacy /#merge-pdf to canonical dedicated URL /merge-pdf/
            const initialHash = window.location.hash.replace(/^#/, '');
            if (initialHash && TOOLS.some(t => t.id === initialHash)) {
                window.location.replace(\`\${initialHash}/\`);
                return;
            }
        }`;

if (appJs.includes(oldHashCheck)) {
    appJs = appJs.replace(oldHashCheck, newHashCheck);
    console.log('[Patch] Added automatic redirect from /#tool-id to /tool-id/');
}

// Remove click interception on tool cards so clicking navigates directly to /${tool.id}/
const oldCardClick = `        // Attach click listeners to cards (smooth SPA transition with fall-through for cmd/ctrl click)
        grid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                const toolId = card.getAttribute('data-tool-id');
                this.openToolWorkspace(toolId);
            });
        });`;

const newCardClick = `        // Cards navigate directly to their dedicated SEO page (/tool-id/)
        // Native <a href="\${tool.id}/"> handles navigation with zero hash fragments`;

if (appJs.includes(oldCardClick)) {
    appJs = appJs.replace(oldCardClick, newCardClick);
    console.log('[Patch] Enabled direct navigation to dedicated tool pages');
}

// Also update openToolWorkspace to push clean URL if ever invoked
appJs = appJs.replace(
    "history.pushState(null, '', `#${tool.id}`);",
    "history.pushState(null, '', `${tool.id}/`);"
);

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('[Patch] Successfully updated js/app.js');
