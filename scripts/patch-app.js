import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, '../js/app.js');

let content = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add isDedicatedPage in constructor
if (!content.includes('this.isDedicatedPage')) {
    content = content.replace(
        "this.hubActiveCat = 'organize'; // Default hub action category",
        "this.hubActiveCat = 'organize'; // Default hub action category\n        this.isDedicatedPage = typeof document !== 'undefined' && !!document.body?.dataset?.toolId;"
    );
}

// 2. Update init() to support dedicated pages
const oldInitRoute = `        // Deep-linking routing based on URL hash (e.g. #form-filler, #merge-pdf)
        const initialHash = window.location.hash.replace(/^#/, '');
        if (initialHash && TOOLS.some(t => t.id === initialHash)) {
            this.openToolWorkspace(initialHash);
        }`;

const newInitRoute = `        // Support both dedicated tool pages (/merge-pdf/) and hash deep links (#merge-pdf)
        const dedicatedToolId = document.body?.dataset?.toolId;
        if (this.isDedicatedPage && dedicatedToolId && TOOLS.some(t => t.id === dedicatedToolId)) {
            this.openToolWorkspace(dedicatedToolId, { isDedicatedPage: true });
        } else {
            const initialHash = window.location.hash.replace(/^#/, '');
            if (initialHash && TOOLS.some(t => t.id === initialHash)) {
                this.openToolWorkspace(initialHash);
            }
        }`;

if (content.includes(oldInitRoute)) {
    content = content.replace(oldInitRoute, newInitRoute);
    console.log('Patched init route');
} else {
    console.warn('Could not find oldInitRoute');
}

// 3. Update brand logo and back button listeners
const oldLogoClick = `        // Logo click -> go to catalog
        document.getElementById('brand-logo-btn')?.addEventListener('click', () => {
            this.showCatalogView();
        });

        // Back to catalog
        document.getElementById('btn-back-to-catalog')?.addEventListener('click', () => {
            this.showCatalogView();
        });`;

const newLogoClick = `        // Logo click -> go to catalog
        document.getElementById('brand-logo-btn')?.addEventListener('click', (e) => {
            if (this.isDedicatedPage) return; // Allow native <a href="../"> link navigation
            e.preventDefault();
            this.showCatalogView();
        });

        // Back to catalog
        document.getElementById('btn-back-to-catalog')?.addEventListener('click', (e) => {
            if (this.isDedicatedPage) return; // Allow native <a href="../"> link navigation
            e.preventDefault();
            this.showCatalogView();
        });`;

if (content.includes(oldLogoClick)) {
    content = content.replace(oldLogoClick, newLogoClick);
    console.log('Patched logo and back button');
} else {
    console.warn('Could not find oldLogoClick');
}

// 4. Update openToolWorkspace signature and logic
const oldOpenWorkspace = `    openToolWorkspace(toolId) {
        const tool = TOOLS.find(t => t.id === toolId);
        if (!tool) return;

        this.currentTool = tool;
        this.uploadedFiles = [];
        this.selectedPages.clear();
        this.pagesToRemove.clear();
        this.pagesToExtract.clear();

        document.getElementById('catalog-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');

        // Set Workspace Headers
        const titleEl = document.getElementById('workspace-title');
        const descEl = document.getElementById('workspace-description');
        const iconEl = document.getElementById('workspace-icon');
        const badgeEl = document.getElementById('workspace-badge-text');

        if (titleEl) titleEl.textContent = tool.name;
        if (descEl) descEl.textContent = tool.description;
        if (iconEl) iconEl.setAttribute('data-lucide', tool.icon);
        if (badgeEl) badgeEl.textContent = tool.group === 'group-a' ? '100% Client-Side RAM Processing' : tool.badge;

        // Dynamic SEO Update for this tool
        document.title = \`\${tool.name} Free Online — 100% Private PDF Tool | TECHTIS\`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', \`\${tool.name} online free: \${tool.tagline}. \${tool.description} 100% in-browser private execution, zero file uploads, unlimited free access.\`);
        }
        if (window.location.hash !== \`#\${tool.id}\`) {
            history.pushState(null, '', \`#\${tool.id}\`);
        }

        this.renderToolWorkspaceBody(tool);
        this.appendToolSeoGuide(tool);
        this.refreshLucideIcons();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }`;

const newOpenWorkspace = `    openToolWorkspace(toolId, options = {}) {
        const tool = TOOLS.find(t => t.id === toolId);
        if (!tool) return;

        this.currentTool = tool;
        this.uploadedFiles = [];
        this.selectedPages.clear();
        this.pagesToRemove.clear();
        this.pagesToExtract.clear();

        document.getElementById('catalog-view')?.classList.add('hidden');
        document.getElementById('workspace-view')?.classList.remove('hidden');

        // Set Workspace Headers
        const titleEl = document.getElementById('workspace-title');
        const descEl = document.getElementById('workspace-description');
        const iconEl = document.getElementById('workspace-icon');
        const badgeEl = document.getElementById('workspace-badge-text');

        if (titleEl && !options.isDedicatedPage) titleEl.textContent = tool.name;
        if (descEl && !options.isDedicatedPage) descEl.textContent = tool.description;
        if (iconEl) iconEl.setAttribute('data-lucide', tool.icon);
        if (badgeEl) badgeEl.textContent = tool.group === 'group-a' ? '100% Client-Side RAM Processing' : tool.badge;

        // Dynamic SEO Update for this tool in SPA mode
        if (!options.isDedicatedPage) {
            document.title = \`\${tool.name} Free Online — 100% Private PDF Tool | TECHTIS\`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', \`\${tool.name} online free: \${tool.tagline}. \${tool.description} 100% in-browser private execution, zero file uploads, unlimited free access.\`);
            }
            if (window.location.hash !== \`#\${tool.id}\`) {
                history.pushState(null, '', \`#\${tool.id}\`);
            }
        }

        this.renderToolWorkspaceBody(tool);
        if (!options.isDedicatedPage) {
            this.appendToolSeoGuide(tool);
        }
        this.refreshLucideIcons();
        if (!options.isDedicatedPage) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }`;

if (content.includes(oldOpenWorkspace)) {
    content = content.replace(oldOpenWorkspace, newOpenWorkspace);
    console.log('Patched openToolWorkspace');
} else {
    console.warn('Could not find oldOpenWorkspace');
}

// 5. Update renderCatalog card HTML and click listeners
const oldCardHtml = `                <div class="tool-card p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-red-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group" data-tool-id="\${tool.id}">`;
const newCardHtml = `                <a href="\${tool.id}/" class="tool-card p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-red-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group" data-tool-id="\${tool.id}">`;

if (content.includes(oldCardHtml)) {
    content = content.replace(oldCardHtml, newCardHtml);
    content = content.replace(
        '                </div>\n            `;\n        }).join(\'\');',
        '                </a>\n            `;\n        }).join(\'\');'
    );
    console.log('Patched catalog card HTML');
}

const oldCardClick = `        // Attach click listeners to cards
        grid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.getAttribute('data-tool-id');
                this.openToolWorkspace(toolId);
            });
        });`;

const newCardClick = `        // Attach click listeners to cards (smooth SPA transition with fall-through for cmd/ctrl click)
        grid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                const toolId = card.getAttribute('data-tool-id');
                this.openToolWorkspace(toolId);
            });
        });`;

if (content.includes(oldCardClick)) {
    content = content.replace(oldCardClick, newCardClick);
    console.log('Patched card click listeners');
}

fs.writeFileSync(appJsPath, content, 'utf8');
console.log('[Patch] Successfully finished updating js/app.js');
