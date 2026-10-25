/**
 * TECHTIS (techtis.in) Application Orchestrator
 * High-performance, zero-server-cost PDF & AI suite
 * 100% Client-Side Engine for all 32 PDF and AI utilities
 */

import { TOOLS, TOOL_CATEGORIES, FUNCTIONAL_CATEGORIES } from './tools/registry.js';
import { StorageManager } from './utils/storage.js';
import { PdfHelpers } from './utils/pdf-helpers.js';
import { MergeTool } from './tools/merge.js';
import { SplitTool } from './tools/split.js';
import { RotateTool } from './tools/rotate.js';
import { EdgeAIBridge } from './edge/ai-bridge.js';
import { AllToolsEngine } from './tools/all-tools-engine.js';

class App {
    constructor() {
        this.currentTool = null;
        this.activeCategory = TOOL_CATEGORIES.ALL;
        this.functionalCategory = 'all'; // 'all' | 'organize' | 'edit-sign' | 'security' | 'convert' | 'ai-smart'
        this.searchQuery = '';
        this.uploadedFiles = [];
        this.selectedPages = new Set();
        this.pagesToRemove = new Set();
        this.pagesToExtract = new Set();
        this.splitMode = 'custom-range'; // 'custom-range' | 'extract-all' | 'fixed-chunks'

        // Universal Document Hub State
        this.hubDocFile = null;
        this.hubDocBuffer = null;
        this.hubDocNumPages = 1;
        this.hubActiveCat = 'organize';
        this.isDedicatedPage = typeof document !== 'undefined' && !!document.body?.dataset?.toolId; // Default hub action category

        this.init();
    }

    init() {
        this.bindGlobalEvents();
        this.bindHubEvents();
        this.renderCatalog();
        this.updateHistoryCounter();
        this.refreshLucideIcons();

        // Support both dedicated tool pages (/merge-pdf/) and hash deep links (#merge-pdf)
        const dedicatedToolId = document.body?.dataset?.toolId;
        if (this.isDedicatedPage && dedicatedToolId && TOOLS.some(t => t.id === dedicatedToolId)) {
            this.openToolWorkspace(dedicatedToolId, { isDedicatedPage: true });
        } else {
            const initialHash = window.location.hash.replace(/^#/, '');
            if (initialHash && TOOLS.some(t => t.id === initialHash)) {
                this.openToolWorkspace(initialHash);
            }
        }

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace(/^#/, '');
            if (h && TOOLS.some(t => t.id === h)) {
                if (this.currentTool?.id !== h) {
                    this.openToolWorkspace(h);
                }
            } else if (!h) {
                this.showCatalogView();
            }
        });
    }

    refreshLucideIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // ================= GLOBAL EVENT LISTENERS =================
    bindGlobalEvents() {
        // Logo click -> go to catalog
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
        });

        // Search bar
        const searchInput = document.getElementById('tool-search-input');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            if (this.searchQuery) {
                document.getElementById('workspace-view')?.classList.add('hidden');
                document.getElementById('catalog-view')?.classList.remove('hidden');
            }
            this.renderCatalog();
        });

        // Keyboard shortcut "/" to focus search
        window.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== searchInput) {
                e.preventDefault();
                searchInput?.focus();
            }
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Upper Category Navigation Bar
        document.querySelectorAll('.top-nav-cat').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.top-nav-cat').forEach(b => {
                    b.classList.remove('active', 'bg-red-50', 'text-red-700', 'border-red-200');
                    b.classList.add('text-slate-600', 'border-transparent');
                });
                btn.classList.add('active', 'bg-red-50', 'text-red-700', 'border-red-200');
                btn.classList.remove('text-slate-600', 'border-transparent');

                const fcat = btn.getAttribute('data-fcat');
                this.functionalCategory = fcat;

                // Sync with Universal Hub if document is loaded
                if (this.hubDocFile && fcat !== 'all') {
                    this.hubActiveCat = fcat;
                    this.renderHubActions();
                }

                this.renderCatalog();
                this.refreshLucideIcons();
            });
        });

        // Secondary Category Architecture Pills (All, Group A, Group B, Popular)
        document.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-pill').forEach(p => {
                    p.classList.remove('active', 'bg-red-600', 'text-white');
                    p.classList.add('bg-white', 'text-slate-600');
                });
                btn.classList.add('active', 'bg-red-600', 'text-white');
                btn.classList.remove('bg-white', 'text-slate-600');

                this.activeCategory = btn.getAttribute('data-category');
                this.renderCatalog();
            });
        });

        // History Modal
        document.getElementById('btn-open-history')?.addEventListener('click', () => this.openHistoryModal());
        document.getElementById('btn-close-history')?.addEventListener('click', () => this.closeHistoryModal());
        document.getElementById('btn-close-history-footer')?.addEventListener('click', () => this.closeHistoryModal());
        document.getElementById('btn-clear-history')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your local activity history?')) {
                StorageManager.clearHistory();
                this.renderHistoryList();
                this.updateHistoryCounter();
                this.showToast('Local history cleared successfully', 'success');
            }
        });

        // Settings Modal
        document.getElementById('btn-open-settings')?.addEventListener('click', () => this.openSettingsModal());
        document.getElementById('btn-close-settings')?.addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('btn-cancel-settings')?.addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('btn-save-settings')?.addEventListener('click', () => this.saveSettings());

        // Update history badge whenever an operation completes
        window.addEventListener('techtis:history-updated', () => this.updateHistoryCounter());
    }

    // ================= UNIVERSAL DOCUMENT HUB =================
    bindHubEvents() {
        const hubDropzone = document.getElementById('hub-dropzone');
        const hubFileInput = document.getElementById('hub-file-input');
        const changeDocBtn = document.getElementById('btn-hub-change-file');

        hubDropzone?.addEventListener('click', () => hubFileInput?.click());
        changeDocBtn?.addEventListener('click', () => hubFileInput?.click());

        ['dragenter', 'dragover'].forEach(name => {
            hubDropzone?.addEventListener(name, (e) => {
                e.preventDefault();
                hubDropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            hubDropzone?.addEventListener(name, (e) => {
                e.preventDefault();
                hubDropzone.classList.remove('drag-active');
            });
        });

        hubDropzone?.addEventListener('drop', (e) => {
            if (e.dataTransfer?.files?.length) {
                this.handleHubDocUpload(e.dataTransfer.files[0]);
            }
        });

        hubFileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.handleHubDocUpload(e.target.files[0]);
                hubFileInput.value = '';
            }
        });

        // Hub category selector tabs
        document.querySelectorAll('.hub-cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.hubActiveCat = tab.getAttribute('data-fcat');
                this.renderHubActions();
            });
        });
    }

    async handleHubDocUpload(file) {
        if (!file) return;
        this.hubDocFile = file;

        const emptyState = document.getElementById('hub-empty-state');
        const activeState = document.getElementById('hub-active-state');
        const docNameEl = document.getElementById('hub-active-doc-name');
        const docPagesEl = document.getElementById('hub-active-doc-pages');
        const docMetaEl = document.getElementById('hub-active-doc-meta');
        const previewBox = document.getElementById('hub-doc-preview-box');

        emptyState?.classList.add('hidden');
        activeState?.classList.remove('hidden');

        if (docNameEl) docNameEl.textContent = file.name;
        if (docMetaEl) docMetaEl.innerHTML = `${PdfHelpers.formatBytes(file.size)} &bull; Loading in browser RAM...`;

        try {
            const buffer = await PdfHelpers.fileToArrayBuffer(file);
            this.hubDocBuffer = buffer;

            if (file.name.toLowerCase().endsWith('.pdf')) {
                const count = await PdfHelpers.getPdfPageCount(buffer);
                this.hubDocNumPages = count;
                if (docPagesEl) docPagesEl.textContent = `${count} ${count === 1 ? 'Page' : 'Pages'}`;
                if (docMetaEl) docMetaEl.innerHTML = `${PdfHelpers.formatBytes(file.size)} &bull; <strong>${count} Pages</strong> &bull; Read in browser RAM`;

                // Render page 1 thumbnail
                PdfHelpers.renderPageThumbnail(buffer, 1, 140).then(dataUrl => {
                    if (previewBox && dataUrl) {
                        previewBox.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain" alt="${file.name}"/>`;
                    }
                });
            } else {
                if (docPagesEl) docPagesEl.textContent = 'Document';
                if (docMetaEl) docMetaEl.innerHTML = `${PdfHelpers.formatBytes(file.size)} &bull; Read in local browser RAM`;
            }

            this.renderHubActions();
            this.showToast(`Document "${file.name}" loaded! Select an action below.`, 'success');
        } catch (err) {
            console.error('Hub load error:', err);
            this.showToast('Could not inspect document structure.', 'error');
        }
    }

    renderHubActions() {
        const grid = document.getElementById('hub-actions-grid');
        const catCountEl = document.getElementById('hub-active-cat-count');
        if (!grid) return;

        // Update active hub tab styles
        document.querySelectorAll('.hub-cat-tab').forEach(tab => {
            const fcat = tab.getAttribute('data-fcat');
            if (fcat === this.hubActiveCat) {
                tab.classList.add('active', 'bg-slate-900', 'text-white');
                tab.classList.remove('bg-white', 'text-slate-700');
            } else {
                tab.classList.remove('active', 'bg-slate-900', 'text-white');
                tab.classList.add('bg-white', 'text-slate-700');
            }
        });

        // Filter tools for this category
        const matchingTools = TOOLS.filter(t => t.functionalCategory === this.hubActiveCat);
        if (catCountEl) catCountEl.textContent = `${matchingTools.length} actions available`;

        grid.innerHTML = matchingTools.map(tool => `
            <div class="hub-action-card p-4 rounded-2xl cursor-pointer flex flex-col justify-between group" data-action-id="${tool.id}">
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <div class="hub-action-icon w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200 transition">
                            <i data-lucide="${tool.icon}" class="w-4 h-4"></i>
                        </div>
                        <span class="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                            ${tool.badge}
                        </span>
                    </div>
                    <h4 class="text-sm font-bold text-slate-900 group-hover:text-red-600 transition flex items-center gap-1.5">
                        ${tool.name}
                    </h4>
                    <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                        ${tool.actionPrompt || tool.tagline}
                    </p>
                </div>
                <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span class="text-[11px] font-medium text-slate-400">0ms server latency</span>
                    <button class="font-bold text-red-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        <span>Run Action</span>
                        <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>
        `).join('');

        // Wire action card clicks to launch with this file
        grid.querySelectorAll('.hub-action-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolId = card.getAttribute('data-action-id');
                this.launchToolWithDocument(toolId, this.hubDocFile);
            });
        });

        this.refreshLucideIcons();
    }

    launchToolWithDocument(toolId, file) {
        if (!file) return;

        this.openToolWorkspace(toolId);

        // Pre-load document according to tool type
        if (toolId === 'merge-pdf') {
            this.handleMergeFilesAdded([file]);
            this.showToast(`"${file.name}" added as #1 in Merge queue. Add more files to combine!`, 'info');
        } else if (toolId === 'split-pdf') {
            this.handleSplitFile(file);
        } else if (toolId === 'rotate-pdf') {
            this.uploadedFiles = [file];
            document.getElementById('rotate-dropzone')?.classList.add('hidden');
            document.getElementById('rotate-editor')?.classList.remove('hidden');
            document.getElementById('rotate-filename').textContent = file.name;
        } else if (toolId === 'remove-pages') {
            this.handleRemovePagesFile(file);
        } else if (toolId === 'extract-pages') {
            this.handleExtractPagesFile(file);
        } else if (toolId === 'organize-pages') {
            this.handleOrganizePagesFile(file);
        } else if (toolId === 'add-watermark') {
            this.handleWatermarkFile(file);
        } else if (toolId === 'add-page-numbers') {
            this.handlePageNumbersFile(file);
        } else if (toolId === 'sign-pdf') {
            this.handleSignPdfFile(file);
        } else if (toolId === 'pdf-to-jpg') {
            this.handlePdfToJpgFile(file);
        } else if (toolId === 'compress-pdf') {
            this.handleCompressFile(file);
        } else if (toolId === 'grayscale-pdf') {
            this.handleGrayscaleFile(file);
        } else if (toolId === 'metadata-editor') {
            this.handleMetadataFile(file);
        } else if (toolId === 'ai-summarizer') {
            this.handleSummarizerFile(file);
        } else if (toolId === 'ocr-pdf') {
            this.handleOcrFile(file);
        } else if (toolId === 'flatten-pdf') {
            this.handleFlattenFile(file);
        } else if (toolId === 'form-filler') {
            this.handleFormFillerFile(file);
        } else if (toolId === 'crop-pdf') {
            this.handleCropFile(file);
        } else if (toolId === 'repair-pdf') {
            this.handleRepairFile(file);
        } else if (toolId === 'word-to-pdf') {
            this.handleWordFile(file);
        } else if (toolId === 'excel-to-pdf') {
            this.handleExcelFile(file);
        } else if (toolId === 'form-blank-detector') {
            this.handleBlankDetectorFile(file);
        } else if (toolId === 'ai-translator') {
            this.handleTranslatorFile(file);
        } else if (toolId === 'edit-pdf') {
            this.handleEditPdfFile(file);
        } else if (toolId === 'protect-pdf') {
            this.handleProtectFile(file);
        } else if (toolId === 'unlock-pdf') {
            this.handleUnlockFile(file);
        } else if (toolId === 'ppt-to-pdf') {
            this.handlePptFile(file);
        } else {
            this.uploadedFiles = [file];
            this.showToast(`"${file.name}" ready for ${this.currentTool?.name}.`, 'success');
        }
    }

    // ================= CATALOG VIEW =================
    renderCatalog() {
        const grid = document.getElementById('tools-grid');
        const titleEl = document.getElementById('catalog-section-title');
        if (!grid) return;

        let filtered = TOOLS.filter(tool => {
            // Functional Category filter
            if (this.functionalCategory !== 'all' && tool.functionalCategory !== this.functionalCategory) {
                return false;
            }

            // Secondary Architecture filter
            if (this.activeCategory === 'popular' && !tool.isPopular) return false;
            if (this.activeCategory === 'group-a' && tool.group !== 'group-a') return false;
            if (this.activeCategory === 'group-b' && tool.group !== 'group-b') return false;
            if (this.activeCategory === 'group-c' && tool.group !== 'group-c') return false;

            // Search filter
            if (this.searchQuery) {
                const matchName = tool.name.toLowerCase().includes(this.searchQuery);
                const matchTag = tool.tagline.toLowerCase().includes(this.searchQuery);
                const matchDesc = tool.description.toLowerCase().includes(this.searchQuery);
                const matchId = tool.id.toLowerCase().includes(this.searchQuery);
                return matchName || matchTag || matchDesc || matchId;
            }
            return true;
        });

        if (titleEl) {
            const catObj = FUNCTIONAL_CATEGORIES.find(c => c.id === this.functionalCategory);
            titleEl.textContent = catObj ? `${catObj.name} (${filtered.length})` : `All Tools (${filtered.length})`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-12 text-center text-slate-500">
                    <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-400 mb-2"></i>
                    <p class="font-medium">No tools found matching your criteria</p>
                    <p class="text-xs text-slate-400 mt-1">Try switching categories or clearing search keywords</p>
                </div>
            `;
            this.refreshLucideIcons();
            return;
        }

        grid.innerHTML = filtered.map(tool => {
            return `
                <a href="${tool.id}/" class="tool-card p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-red-400 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 group" data-tool-id="${tool.id}">
                    <div class="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-red-600 group-hover:text-white transition-all shadow-2xs">
                        <i data-lucide="${tool.icon}" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-1">
                            <h3 class="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-red-600 transition truncate">${tool.name}</h3>
                            ${tool.isPopular ? '<span class="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">Popular</span>' : ''}
                        </div>
                        <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">${tool.tagline}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click listeners to cards (smooth SPA transition with fall-through for cmd/ctrl click)
        grid.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                e.preventDefault();
                const toolId = card.getAttribute('data-tool-id');
                this.openToolWorkspace(toolId);
            });
        });

        this.refreshLucideIcons();
    }

    // ================= NAVIGATION =================
    showCatalogView() {
        document.getElementById('catalog-view')?.classList.remove('hidden');
        document.getElementById('workspace-view')?.classList.add('hidden');
        this.currentTool = null;
        this.uploadedFiles = [];

        // Reset document title & meta for homepage SEO
        document.title = 'TECHTIS — 100% Private, Free Online PDF Tools & Document Suite | techtis.in';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', 'TECHTIS (techtis.in) is the world\'s most private and fastest free online PDF platform. 32 professional tools: Form Filler, Merge PDF, Compress PDF, Sign PDF, Split, OCR, Convert to Word/JPG, Protect & Unlock. 100% in-browser RAM execution, zero file uploads, zero server latency, unlimited free use across all countries.');
        }

        if (window.location.hash) {
            history.pushState(null, '', window.location.pathname + window.location.search);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    openToolWorkspace(toolId, options = {}) {
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
            document.title = `${tool.name} Free Online — 100% Private PDF Tool | TECHTIS`;
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', `${tool.name} online free: ${tool.tagline}. ${tool.description} 100% in-browser private execution, zero file uploads, unlimited free access.`);
            }
            if (window.location.hash !== `#${tool.id}`) {
                history.pushState(null, '', `#${tool.id}`);
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
    }

    appendToolSeoGuide(tool) {
        const container = document.getElementById('workspace-body');
        if (!container) return;

        const seoGuide = document.createElement('div');
        seoGuide.className = 'mt-10 pt-6 border-t border-slate-200 text-slate-600 space-y-6';
        seoGuide.innerHTML = `
            <div class="space-y-3">
                <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-red-600"></i>
                    <span>How to use ${tool.name} Online Free</span>
                </h3>
                <p class="text-xs text-slate-500 leading-relaxed">
                    ${tool.description} All document processing takes place strictly inside your browser's local RAM memory. No files are uploaded to our servers, ensuring 100% privacy and confidentiality for personal documents, business agreements, and government forms.
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">1</span>
                            <span>Select Document</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Drop your file into the upload zone or choose it from your computer or phone.</p>
                    </div>
                    <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">2</span>
                            <span>Customize &amp; Process</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Use the interactive controls to configure settings, fill fields, or edit content in real time.</p>
                    </div>
                    <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                        <div class="font-bold text-slate-900 flex items-center gap-1.5">
                            <span class="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">3</span>
                            <span>Instant Download</span>
                        </div>
                        <p class="text-[11px] text-slate-500">Click download to save your new PDF instantly with 0ms server latency.</p>
                    </div>
                </div>
            </div>

            <div class="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                <div>
                    <strong>Privacy Guarantee:</strong>
                    <span>Your documents are processed in local WebAssembly memory and never touch remote servers or databases. Zero file retention.</span>
                </div>
            </div>
        `;
        container.appendChild(seoGuide);
    }

    // ================= WORKSPACE ROUTER =================
    renderToolWorkspaceBody(tool) {
        const container = document.getElementById('workspace-body');
        if (!container) return;

        // Route to dedicated, functional implementations
        switch (tool.id) {
            case 'merge-pdf':
                this.renderMergeWorkspace(container);
                break;
            case 'split-pdf':
                this.renderSplitWorkspace(container);
                break;
            case 'rotate-pdf':
                this.renderRotateWorkspace(container);
                break;
            case 'remove-pages':
                this.renderRemovePagesWorkspace(container);
                break;
            case 'extract-pages':
                this.renderExtractPagesWorkspace(container);
                break;
            case 'organize-pages':
                this.renderOrganizePagesWorkspace(container);
                break;
            case 'add-watermark':
                this.renderWatermarkWorkspace(container);
                break;
            case 'add-page-numbers':
                this.renderPageNumbersWorkspace(container);
                break;
            case 'sign-pdf':
                this.renderSignWorkspace(container);
                break;
            case 'pdf-to-jpg':
                this.renderPdfToJpgWorkspace(container);
                break;
            case 'jpg-to-pdf':
                this.renderJpgToPdfWorkspace(container);
                break;
            case 'compress-pdf':
                this.renderCompressWorkspace(container);
                break;
            case 'grayscale-pdf':
                this.renderGrayscaleWorkspace(container);
                break;
            case 'metadata-editor':
                this.renderMetadataWorkspace(container);
                break;
            case 'text-to-pdf':
                this.renderTextToPdfWorkspace(container);
                break;
            case 'ocr-pdf':
                this.renderOcrWorkspace(container);
                break;
            case 'ai-summarizer':
                this.renderSummarizerWorkspace(container);
                break;
            case 'flatten-pdf':
                this.renderFlattenWorkspace(container);
                break;
            case 'form-filler':
                this.renderFormFillerWorkspace(container);
                break;
            case 'crop-pdf':
                this.renderCropWorkspace(container);
                break;
            case 'repair-pdf':
                this.renderRepairWorkspace(container);
                break;
            case 'markdown-to-pdf':
                this.renderMarkdownWorkspace(container);
                break;
            case 'document-compare':
                this.renderCompareWorkspace(container);
                break;
            case 'scan-to-pdf':
                this.renderCameraScanWorkspace(container);
                break;
            case 'word-to-pdf':
                this.renderWordToPdfWorkspace(container);
                break;
            case 'excel-to-pdf':
                this.renderExcelToPdfWorkspace(container);
                break;
            case 'form-blank-detector':
                this.renderBlankDetectorWorkspace(container);
                break;
            case 'ai-translator':
                this.renderTranslatorWorkspace(container);
                break;
            case 'edit-pdf':
                this.renderEditPdfWorkspace(container);
                break;
            case 'protect-pdf':
                this.renderProtectWorkspace(container);
                break;
            case 'unlock-pdf':
                this.renderUnlockWorkspace(container);
                break;
            case 'ppt-to-pdf':
                this.renderPptToPdfWorkspace(container);
                break;
            default:
                this.renderGenericWorkspace(container, tool);
                break;
        }
    }

    // ================= 1. MERGE PDF =================
    renderMergeWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="merge-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="merge-file-input" accept=".pdf" multiple class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="layers" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select 2 or more PDF files to merge</h4>
                        <p class="text-xs text-slate-500">Processed locally in browser memory. 0ms network latency.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select PDF Files
                            </button>
                        </div>
                    </div>
                </div>

                <div id="merge-queue-container" class="hidden space-y-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <h4 class="text-sm font-bold text-slate-800">Files to Merge (<span id="merge-file-count">0</span>)</h4>
                            <span class="text-xs text-slate-400">&bull; Use arrows to reorder</span>
                        </div>
                        <button id="btn-merge-add-more" class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add More Files
                        </button>
                    </div>

                    <div id="merge-file-list" class="space-y-2"></div>

                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                        <div class="w-full sm:w-auto flex-1 max-w-sm">
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Output File Name</label>
                            <input type="text" id="merge-output-name" value="merged_document.pdf" 
                                   class="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                        </div>
                        <button id="btn-execute-merge" class="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/25 transition flex items-center justify-center gap-2">
                            <i data-lucide="layers" class="w-4 h-4"></i>
                            <span>Merge PDFs Now (Client-Side)</span>
                        </button>
                    </div>
                </div>

                <div id="merge-progress-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-md">
                    <div class="flex items-center justify-between text-xs font-semibold">
                        <span id="merge-status-msg" class="text-slate-700 flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                            <span>Processing document locally in RAM...</span>
                        </span>
                        <span id="merge-percent-badge" class="text-red-600 font-bold">0%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div id="merge-progress-bar" class="progress-bar-fill bg-gradient-to-r from-red-600 to-rose-500 h-full w-0"></div>
                    </div>
                </div>

                <div id="merge-success-card" class="hidden p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <i data-lucide="check-circle" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-emerald-950">PDFs Successfully Merged!</h4>
                            <p id="merge-success-metrics" class="text-xs text-emerald-700 mt-0.5">Direct download triggered.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindMergeEvents();
        this.refreshLucideIcons();
    }

    bindMergeEvents() {
        const dropzone = document.getElementById('merge-dropzone');
        const fileInput = document.getElementById('merge-file-input');
        const addMoreBtn = document.getElementById('btn-merge-add-more');

        dropzone?.addEventListener('click', () => fileInput?.click());
        addMoreBtn?.addEventListener('click', () => fileInput?.click());

        ['dragenter', 'dragover'].forEach(name => {
            dropzone?.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-active');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropzone?.addEventListener(name, (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-active');
            });
        });

        dropzone?.addEventListener('drop', (e) => {
            if (e.dataTransfer?.files?.length) {
                this.handleMergeFilesAdded(Array.from(e.dataTransfer.files));
            }
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.handleMergeFilesAdded(Array.from(e.target.files));
                fileInput.value = '';
            }
        });

        document.getElementById('btn-execute-merge')?.addEventListener('click', () => {
            this.executeMerge();
        });
    }

    async handleMergeFilesAdded(files) {
        const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) {
            this.showToast('Please select valid PDF documents.', 'error');
            return;
        }

        this.uploadedFiles.push(...pdfFiles);
        this.updateMergeQueueUI();
    }

    async updateMergeQueueUI() {
        const queueContainer = document.getElementById('merge-queue-container');
        const fileCountEl = document.getElementById('merge-file-count');
        const listEl = document.getElementById('merge-file-list');
        if (!queueContainer || !listEl) return;

        if (this.uploadedFiles.length === 0) {
            queueContainer.classList.add('hidden');
            return;
        }

        queueContainer.classList.remove('hidden');
        if (fileCountEl) fileCountEl.textContent = this.uploadedFiles.length;

        listEl.innerHTML = this.uploadedFiles.map((file, idx) => `
            <div class="file-item-card p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-sm" data-index="${idx}">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                        ${idx + 1}
                    </div>
                    <div class="min-w-0">
                        <p class="text-xs font-bold text-slate-800 truncate">${file.name}</p>
                        <p class="text-[11px] text-slate-400">${PdfHelpers.formatBytes(file.size)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button class="btn-move-up p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Move Up" ${idx === 0 ? 'disabled' : ''}>
                        <i data-lucide="chevron-up" class="w-4 h-4"></i>
                    </button>
                    <button class="btn-move-down p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition" title="Move Down" ${idx === this.uploadedFiles.length - 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                    <button class="btn-delete-file p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition" title="Remove File">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');

        listEl.querySelectorAll('.btn-move-up').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                if (idx > 0) {
                    [this.uploadedFiles[idx], this.uploadedFiles[idx - 1]] = [this.uploadedFiles[idx - 1], this.uploadedFiles[idx]];
                    this.updateMergeQueueUI();
                }
            });
        });

        listEl.querySelectorAll('.btn-move-down').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                if (idx < this.uploadedFiles.length - 1) {
                    [this.uploadedFiles[idx], this.uploadedFiles[idx + 1]] = [this.uploadedFiles[idx + 1], this.uploadedFiles[idx]];
                    this.updateMergeQueueUI();
                }
            });
        });

        listEl.querySelectorAll('.btn-delete-file').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                this.uploadedFiles.splice(idx, 1);
                this.updateMergeQueueUI();
            });
        });

        this.refreshLucideIcons();
    }

    async executeMerge() {
        if (this.uploadedFiles.length < 2) {
            this.showToast('Please add at least 2 PDF files to merge.', 'error');
            return;
        }

        const outputName = document.getElementById('merge-output-name')?.value || 'merged_document.pdf';
        const progressCard = document.getElementById('merge-progress-card');
        const progressBar = document.getElementById('merge-progress-bar');
        const statusMsg = document.getElementById('merge-status-msg');
        const percentBadge = document.getElementById('merge-percent-badge');
        const successCard = document.getElementById('merge-success-card');

        progressCard?.classList.remove('hidden');
        successCard?.classList.add('hidden');

        try {
            const result = await MergeTool.execute(this.uploadedFiles, { outputName }, (progress) => {
                if (progressBar) progressBar.style.width = `${progress.percent}%`;
                if (percentBadge) percentBadge.textContent = `${progress.percent}%`;
                if (statusMsg) statusMsg.textContent = progress.message;
            });

            progressCard?.classList.add('hidden');
            successCard?.classList.remove('hidden');
            document.getElementById('merge-success-metrics').textContent = `Merged ${result.totalMergedPages} pages into ${PdfHelpers.formatBytes(result.outputSize)} in ${result.durationMs}ms!`;
            this.updateHistoryCounter();
            this.showToast('Merged successfully!', 'success');
        } catch (err) {
            progressCard?.classList.add('hidden');
            this.showToast(err.message, 'error');
        }
    }

    // ================= 2. SPLIT PDF =================
    renderSplitWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="split-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="split-file-input" accept=".pdf" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="scissors" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select a PDF file to split</h4>
                        <p class="text-xs text-slate-500">Extract ranges, split into chunks, or separate all pages.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select PDF File
                            </button>
                        </div>
                    </div>
                </div>

                <div id="split-editor-container" class="hidden space-y-6">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                                <i data-lucide="file" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <h4 id="split-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                                <p id="split-filesize" class="text-xs text-slate-500">0 MB &bull; 0 Pages</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">Choose Split Mode</label>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label class="split-mode-card p-3 border-2 border-red-600 bg-red-50/50 rounded-xl cursor-pointer" data-mode="custom-range">
                                <span class="text-xs font-bold text-slate-900 block mb-1">Custom Range</span>
                                <span class="text-[11px] text-slate-500">Extract chosen pages (e.g. 1-3, 5)</span>
                            </label>
                            <label class="split-mode-card p-3 border-2 border-slate-200 rounded-xl cursor-pointer" data-mode="extract-all">
                                <span class="text-xs font-bold text-slate-900 block mb-1">Extract Every Page</span>
                                <span class="text-[11px] text-slate-500">Separate every page into ZIP</span>
                            </label>
                            <label class="split-mode-card p-3 border-2 border-slate-200 rounded-xl cursor-pointer" data-mode="fixed-chunks">
                                <span class="text-xs font-bold text-slate-900 block mb-1">Fixed Chunks</span>
                                <span class="text-[11px] text-slate-500">Split every N pages</span>
                            </label>
                        </div>

                        <div id="ctrl-custom-range" class="space-y-2 pt-2 border-t border-slate-100">
                            <label class="text-xs font-semibold text-slate-700">Enter Page Ranges</label>
                            <input type="text" id="split-range-input" value="1" placeholder="e.g. 1-3, 5" 
                                   class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                        </div>

                        <button id="btn-execute-split" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg transition">
                            Split PDF Now
                        </button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                        <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Page Thumbnails (Click to toggle)</h4>
                        <div id="split-thumbnails-grid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3"></div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('split-dropzone');
        const fileInput = document.getElementById('split-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleSplitFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-split')?.addEventListener('click', () => this.executeSplit());
        this.refreshLucideIcons();
    }

    async handleSplitFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('split-dropzone')?.classList.add('hidden');
        document.getElementById('split-editor-container')?.classList.remove('hidden');
        document.getElementById('split-filename').textContent = file.name;

        const info = await SplitTool.inspect(file);
        this.currentPdfTotalPages = info.numPages;
        document.getElementById('split-filesize').innerHTML = `${PdfHelpers.formatBytes(file.size)} &bull; <strong>${info.numPages}</strong> Pages`;
        document.getElementById('split-range-input').value = `1-${Math.min(info.numPages, 3)}`;

        // Render thumbnails
        const grid = document.getElementById('split-thumbnails-grid');
        if (grid) {
            grid.innerHTML = Array.from({ length: Math.min(info.numPages, 18) }, (_, i) => `
                <div class="page-thumbnail-tile p-2 bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer" data-page="${i + 1}">
                    <div class="w-full aspect-[3/4] bg-white rounded-lg flex items-center justify-center text-xs text-slate-400 overflow-hidden" id="split-thumb-${i + 1}">P.${i + 1}</div>
                    <span class="text-[10px] font-semibold text-slate-600 block mt-1">Page ${i + 1}</span>
                </div>
            `).join('');

            for (let p = 1; p <= Math.min(info.numPages, 18); p++) {
                PdfHelpers.renderPageThumbnail(info.buffer, p, 120).then(dataUrl => {
                    const el = document.getElementById(`split-thumb-${p}`);
                    if (el && dataUrl) el.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain"/>`;
                });
            }

            grid.querySelectorAll('.page-thumbnail-tile').forEach(tile => {
                tile.addEventListener('click', () => {
                    const num = tile.getAttribute('data-page');
                    const inp = document.getElementById('split-range-input');
                    if (inp) inp.value = inp.value ? `${inp.value}, ${num}` : num;
                });
            });
        }
    }

    async executeSplit() {
        if (!this.uploadedFiles.length) return;
        try {
            this.showToast('Splitting PDF in browser memory...', 'info');
            const range = document.getElementById('split-range-input')?.value || '1';
            await SplitTool.execute(this.uploadedFiles[0], { mode: 'custom-range', range });
            this.updateHistoryCounter();
            this.showToast('PDF split and downloaded successfully!', 'success');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    // ================= 3. ROTATE PDF =================
    renderRotateWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="rotate-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="rotate-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="rotate-cw" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Rotate</h4>
                    </div>
                </div>

                <div id="rotate-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <div class="flex items-center justify-between">
                        <h4 id="rotate-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        <div class="flex items-center gap-2">
                            <button class="btn-rot px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold" data-angle="90">+90° Clockwise</button>
                            <button class="btn-rot px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold" data-angle="180">180° Flip</button>
                            <button class="btn-rot px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold" data-angle="270">270° (90° CCW)</button>
                        </div>
                    </div>
                    <button id="btn-execute-rotate" class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold">Apply &amp; Download</button>
                </div>
            </div>
        `;

        let angle = 90;
        const dropzone = document.getElementById('rotate-dropzone');
        const fileInput = document.getElementById('rotate-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.uploadedFiles = [e.target.files[0]];
                dropzone.classList.add('hidden');
                document.getElementById('rotate-editor').classList.remove('hidden');
                document.getElementById('rotate-filename').textContent = e.target.files[0].name;
            }
        });

        document.querySelectorAll('.btn-rot').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-rot').forEach(b => b.classList.replace('bg-red-50', 'bg-white'));
                btn.classList.replace('bg-white', 'bg-red-50');
                angle = parseInt(btn.getAttribute('data-angle'), 10);
            });
        });

        document.getElementById('btn-execute-rotate')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Rotating PDF pages...', 'info');
                await RotateTool.execute(this.uploadedFiles[0], { rotationDegrees: angle });
                this.updateHistoryCounter();
                this.showToast('Rotated and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 4. REMOVE PAGES =================
    renderRemovePagesWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="remove-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="remove-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="trash-2" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Remove Pages</h4>
                        <p class="text-xs text-slate-500">Click any page thumbnail to mark for removal, then download.</p>
                    </div>
                </div>

                <div id="remove-editor" class="hidden space-y-4">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                            <h4 id="remove-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                            <p id="remove-counter" class="text-xs text-red-600 font-semibold mt-0.5">0 pages marked for deletion</p>
                        </div>
                        <button id="btn-execute-remove" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50" disabled>
                            Delete Selected Pages &amp; Download
                        </button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <p class="text-xs text-slate-400">Click on any page tile below to mark/unmark for deletion:</p>
                        <div id="remove-thumbnails-grid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3"></div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('remove-dropzone');
        const fileInput = document.getElementById('remove-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleRemovePagesFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-remove')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length || this.pagesToRemove.size === 0) return;
            try {
                this.showToast('Removing pages in browser RAM...', 'info');
                const result = await AllToolsEngine.removePages(this.uploadedFiles[0], Array.from(this.pagesToRemove));
                PdfHelpers.downloadBytes(result.pdfBytes, `removed_pages_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast(`Pages removed! Remaining: ${result.remainingPages} pages`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    async handleRemovePagesFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        this.pagesToRemove.clear();
        document.getElementById('remove-dropzone')?.classList.add('hidden');
        document.getElementById('remove-editor')?.classList.remove('hidden');
        document.getElementById('remove-filename').textContent = file.name;

        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const count = await PdfHelpers.getPdfPageCount(buffer);
        const grid = document.getElementById('remove-thumbnails-grid');
        const counterEl = document.getElementById('remove-counter');
        const executeBtn = document.getElementById('btn-execute-remove');

        if (grid) {
            grid.innerHTML = Array.from({ length: count }, (_, i) => `
                <div class="page-thumbnail-tile p-2 bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer" data-page-idx="${i}">
                    <div class="w-full aspect-[3/4] bg-white rounded-lg flex items-center justify-center text-xs text-slate-400 overflow-hidden" id="remove-thumb-${i}">P.${i + 1}</div>
                    <span class="text-[10px] font-semibold text-slate-600 block mt-1">Page ${i + 1}</span>
                </div>
            `).join('');

            for (let p = 1; p <= count; p++) {
                PdfHelpers.renderPageThumbnail(buffer, p, 120).then(dataUrl => {
                    const el = document.getElementById(`remove-thumb-${p - 1}`);
                    if (el && dataUrl) el.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain"/>`;
                });
            }

            grid.querySelectorAll('.page-thumbnail-tile').forEach(tile => {
                tile.addEventListener('click', () => {
                    const idx = parseInt(tile.getAttribute('data-page-idx'), 10);
                    if (this.pagesToRemove.has(idx)) {
                        this.pagesToRemove.delete(idx);
                        tile.classList.remove('marked-for-removal');
                    } else {
                        this.pagesToRemove.add(idx);
                        tile.classList.add('marked-for-removal');
                    }
                    if (counterEl) counterEl.textContent = `${this.pagesToRemove.size} page(s) marked for deletion`;
                    if (executeBtn) executeBtn.disabled = this.pagesToRemove.size === 0;
                });
            });
        }
    }

    // ================= 5. EXTRACT PAGES =================
    renderExtractPagesWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="extract-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="extract-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="external-link" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Extract Pages</h4>
                        <p class="text-xs text-slate-500">Click specific pages to compile them into a new document.</p>
                    </div>
                </div>

                <div id="extract-editor" class="hidden space-y-4">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                            <h4 id="extract-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                            <p id="extract-counter" class="text-xs text-blue-600 font-semibold mt-0.5">0 pages selected</p>
                        </div>
                        <button id="btn-execute-extract" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50" disabled>
                            Extract Pages &amp; Download
                        </button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                        <p class="text-xs text-slate-400">Click page tiles to select which pages to include in your new PDF:</p>
                        <div id="extract-thumbnails-grid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3"></div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('extract-dropzone');
        const fileInput = document.getElementById('extract-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleExtractPagesFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-extract')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length || this.pagesToExtract.size === 0) return;
            try {
                this.showToast('Extracting pages in browser RAM...', 'info');
                const result = await AllToolsEngine.extractPages(this.uploadedFiles[0], Array.from(this.pagesToExtract));
                PdfHelpers.downloadBytes(result.pdfBytes, `extracted_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast(`Extracted ${result.pageCount} pages!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    async handleExtractPagesFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        this.pagesToExtract.clear();
        document.getElementById('extract-dropzone')?.classList.add('hidden');
        document.getElementById('extract-editor')?.classList.remove('hidden');
        document.getElementById('extract-filename').textContent = file.name;

        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const count = await PdfHelpers.getPdfPageCount(buffer);
        const grid = document.getElementById('extract-thumbnails-grid');
        const counterEl = document.getElementById('extract-counter');
        const executeBtn = document.getElementById('btn-execute-extract');

        if (grid) {
            grid.innerHTML = Array.from({ length: count }, (_, i) => `
                <div class="page-thumbnail-tile p-2 bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer" data-page-idx="${i}">
                    <div class="w-full aspect-[3/4] bg-white rounded-lg flex items-center justify-center text-xs text-slate-400 overflow-hidden" id="extract-thumb-${i}">P.${i + 1}</div>
                    <span class="text-[10px] font-semibold text-slate-600 block mt-1">Page ${i + 1}</span>
                </div>
            `).join('');

            for (let p = 1; p <= count; p++) {
                PdfHelpers.renderPageThumbnail(buffer, p, 120).then(dataUrl => {
                    const el = document.getElementById(`extract-thumb-${p - 1}`);
                    if (el && dataUrl) el.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain"/>`;
                });
            }

            grid.querySelectorAll('.page-thumbnail-tile').forEach(tile => {
                tile.addEventListener('click', () => {
                    const idx = parseInt(tile.getAttribute('data-page-idx'), 10);
                    if (this.pagesToExtract.has(idx)) {
                        this.pagesToExtract.delete(idx);
                        tile.classList.remove('selected-for-extract');
                    } else {
                        this.pagesToExtract.add(idx);
                        tile.classList.add('selected-for-extract');
                    }
                    if (counterEl) counterEl.textContent = `${this.pagesToExtract.size} page(s) selected for extraction`;
                    if (executeBtn) executeBtn.disabled = this.pagesToExtract.size === 0;
                });
            });
        }
    }

    // ================= 6. ORGANIZE / REORDER PAGES =================
    renderOrganizePagesWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="organize-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="organize-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="grid" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Reorder Pages</h4>
                        <p class="text-xs text-slate-500">Rearrange and organize pages visually.</p>
                    </div>
                </div>

                <div id="organize-editor" class="hidden space-y-4">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <h4 id="organize-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        <button id="btn-execute-organize" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Save Reordered PDF &amp; Download
                        </button>
                    </div>

                    <div id="organize-thumbnails-grid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-white border border-slate-200 rounded-2xl"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('organize-dropzone');
        const fileInput = document.getElementById('organize-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleOrganizePagesFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-organize')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length || !this.pageOrderArray) return;
            try {
                this.showToast('Reordering pages in browser RAM...', 'info');
                const result = await AllToolsEngine.reorderPages(this.uploadedFiles[0], this.pageOrderArray);
                PdfHelpers.downloadBytes(result.pdfBytes, `reordered_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Reordered PDF saved and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    async handleOrganizePagesFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('organize-dropzone')?.classList.add('hidden');
        document.getElementById('organize-editor')?.classList.remove('hidden');
        document.getElementById('organize-filename').textContent = file.name;

        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const count = await PdfHelpers.getPdfPageCount(buffer);
        this.pageOrderArray = Array.from({ length: count }, (_, i) => i);
        this.renderOrganizeGrid(buffer);
    }

    renderOrganizeGrid(buffer) {
        const grid = document.getElementById('organize-thumbnails-grid');
        if (!grid) return;

        grid.innerHTML = this.pageOrderArray.map((origIdx, pos) => `
            <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center shadow-xs">
                <div class="w-full aspect-[3/4] bg-white rounded-lg flex items-center justify-center text-xs text-slate-400 overflow-hidden" id="org-thumb-${origIdx}">P.${origIdx + 1}</div>
                <div class="text-[10px] font-bold text-slate-700 mt-1">Page ${origIdx + 1}</div>
                <div class="flex items-center justify-center gap-1 mt-1">
                    <button class="btn-org-left p-1 text-slate-500 hover:bg-slate-200 rounded text-[10px]" data-pos="${pos}" ${pos === 0 ? 'disabled' : ''}>◀</button>
                    <button class="btn-org-right p-1 text-slate-500 hover:bg-slate-200 rounded text-[10px]" data-pos="${pos}" ${pos === this.pageOrderArray.length - 1 ? 'disabled' : ''}>▶</button>
                </div>
            </div>
        `).join('');

        this.pageOrderArray.forEach(origIdx => {
            PdfHelpers.renderPageThumbnail(buffer, origIdx + 1, 120).then(dataUrl => {
                const el = document.getElementById(`org-thumb-${origIdx}`);
                if (el && dataUrl) el.innerHTML = `<img src="${dataUrl}" class="w-full h-full object-contain"/>`;
            });
        });

        grid.querySelectorAll('.btn-org-left').forEach(btn => {
            btn.addEventListener('click', () => {
                const pos = parseInt(btn.getAttribute('data-pos'), 10);
                if (pos > 0) {
                    [this.pageOrderArray[pos], this.pageOrderArray[pos - 1]] = [this.pageOrderArray[pos - 1], this.pageOrderArray[pos]];
                    this.renderOrganizeGrid(buffer);
                }
            });
        });

        grid.querySelectorAll('.btn-org-right').forEach(btn => {
            btn.addEventListener('click', () => {
                const pos = parseInt(btn.getAttribute('data-pos'), 10);
                if (pos < this.pageOrderArray.length - 1) {
                    [this.pageOrderArray[pos], this.pageOrderArray[pos + 1]] = [this.pageOrderArray[pos + 1], this.pageOrderArray[pos]];
                    this.renderOrganizeGrid(buffer);
                }
            });
        });
    }

    // ================= 7. ADD WATERMARK =================
    renderWatermarkWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="watermark-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="watermark-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="stamp" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Add Watermark</h4>
                        <p class="text-xs text-slate-500">Stamp confidential marks, copyright stamps, or custom text.</p>
                    </div>
                </div>

                <div id="watermark-editor" class="hidden space-y-4">
                    <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                        <h4 id="watermark-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Watermark Text</label>
                                <input type="text" id="wm-text" value="CONFIDENTIAL" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                                <select id="wm-color" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                                    <option value="#ef4444">Red Stamp</option>
                                    <option value="#64748b">Slate Gray</option>
                                    <option value="#2563eb">Blue</option>
                                    <option value="#059669">Green</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Opacity</label>
                                <input type="range" id="wm-opacity" min="0.1" max="0.8" step="0.05" value="0.3" class="w-full">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Font Size</label>
                                <input type="number" id="wm-size" min="16" max="96" value="48" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                            </div>
                        </div>

                        <button id="btn-execute-watermark" class="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Apply Watermark &amp; Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('watermark-dropzone');
        const fileInput = document.getElementById('watermark-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleWatermarkFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-watermark')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Applying watermark in browser RAM...', 'info');
                const text = document.getElementById('wm-text')?.value || 'CONFIDENTIAL';
                const opacity = document.getElementById('wm-opacity')?.value || 0.3;
                const fontSize = document.getElementById('wm-size')?.value || 48;
                const color = document.getElementById('wm-color')?.value || '#ef4444';

                const result = await AllToolsEngine.addWatermark(this.uploadedFiles[0], { text, opacity, fontSize, color });
                PdfHelpers.downloadBytes(result.pdfBytes, `watermarked_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Watermark applied and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleWatermarkFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('watermark-dropzone')?.classList.add('hidden');
        document.getElementById('watermark-editor')?.classList.remove('hidden');
        document.getElementById('watermark-filename').textContent = file.name;
    }

    // ================= 8. ADD PAGE NUMBERS =================
    renderPageNumbersWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="numbers-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="numbers-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="hash" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Add Page Numbers</h4>
                        <p class="text-xs text-slate-500">Insert custom numbered footers or headers.</p>
                    </div>
                </div>

                <div id="numbers-editor" class="hidden space-y-4">
                    <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                        <h4 id="numbers-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Format</label>
                                <select id="pn-format" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                                    <option value="page_of_total">Page 1 of N</option>
                                    <option value="simple">1 / N</option>
                                    <option value="page_only">Page 1</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Position</label>
                                <select id="pn-position" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="top-center">Top Center</option>
                                </select>
                            </div>
                        </div>

                        <button id="btn-execute-numbers" class="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Stamp Numbers &amp; Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('numbers-dropzone');
        const fileInput = document.getElementById('numbers-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handlePageNumbersFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-numbers')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Numbering pages in browser RAM...', 'info');
                const format = document.getElementById('pn-format')?.value;
                const position = document.getElementById('pn-position')?.value;
                const result = await AllToolsEngine.addPageNumbers(this.uploadedFiles[0], { format, position });
                PdfHelpers.downloadBytes(result.pdfBytes, `numbered_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Page numbers stamped and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handlePageNumbersFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('numbers-dropzone')?.classList.add('hidden');
        document.getElementById('numbers-editor')?.classList.remove('hidden');
        document.getElementById('numbers-filename').textContent = file.name;
    }

    // ================= 9. SIGN PDF (CANVAS DRAWING) =================
    renderSignWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="sign-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="sign-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="edit-3" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Sign</h4>
                        <p class="text-xs text-slate-500">Draw signature with mouse/touch and stamp onto any page.</p>
                    </div>
                </div>

                <div id="sign-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Canvas Signature Pad -->
                        <div class="p-5 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
                            <div class="flex items-center justify-between">
                                <label class="text-xs font-bold text-slate-800 uppercase tracking-wider">Draw Your Signature</label>
                                <button id="btn-clear-sig" class="text-xs font-semibold text-red-600 hover:underline">Clear Canvas</button>
                            </div>
                            <div class="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                                <canvas id="signature-pad-canvas" width="450" height="180" class="w-full h-40"></canvas>
                            </div>
                            <p class="text-[11px] text-slate-400">Sign with mouse, trackpad, or finger on touch screens.</p>
                        </div>

                        <!-- Placement Controls -->
                        <div class="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 id="sign-filename" class="text-sm font-bold text-slate-800 mb-3">document.pdf</h4>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-700 mb-1">Target Page</label>
                                        <input type="number" id="sign-page-num" min="1" value="1" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-semibold text-slate-700 mb-1">Position on Page</label>
                                        <select id="sign-pos-preset" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                                            <option value="bottom-right">Bottom Right (Default)</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="center">Center</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button id="btn-execute-sign" class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                                Stamp Signature &amp; Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('sign-dropzone');
        const fileInput = document.getElementById('sign-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleSignPdfFile(e.target.files[0]);
        });

        this.initSignatureCanvas();

        document.getElementById('btn-execute-sign')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const canvas = document.getElementById('signature-pad-canvas');
            const dataUrl = canvas.toDataURL('image/png');
            const pageNum = parseInt(document.getElementById('sign-page-num')?.value || 1, 10);
            const preset = document.getElementById('sign-pos-preset')?.value || 'bottom-right';

            let xPercent = 70;
            let yPercent = 15;
            if (preset === 'bottom-left') { xPercent = 25; yPercent = 15; }
            else if (preset === 'center') { xPercent = 50; yPercent = 50; }

            try {
                this.showToast('Embedding signature into document...', 'info');
                const result = await AllToolsEngine.signPdf(this.uploadedFiles[0], {
                    signatureDataUrl: dataUrl,
                    pageNumber: pageNum,
                    xPercent,
                    yPercent
                });
                PdfHelpers.downloadBytes(result.pdfBytes, `signed_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Document signed and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    initSignatureCanvas() {
        const canvas = document.getElementById('signature-pad-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        const startDraw = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stopDraw = () => { isDrawing = false; };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDraw);

        document.getElementById('btn-clear-sig')?.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    handleSignPdfFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('sign-dropzone')?.classList.add('hidden');
        document.getElementById('sign-editor')?.classList.remove('hidden');
        document.getElementById('sign-filename').textContent = file.name;
        this.initSignatureCanvas();
    }

    // ================= 10. PDF TO JPG =================
    renderPdfToJpgWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="p2j-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="p2j-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="image" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Convert to JPG</h4>
                        <p class="text-xs text-slate-500">Render each page into crisp high-resolution images.</p>
                    </div>
                </div>

                <div id="p2j-editor" class="hidden space-y-4">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <h4 id="p2j-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        <button id="btn-download-all-jpg" class="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Download All Pages as ZIP
                        </button>
                    </div>

                    <div id="p2j-gallery" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('p2j-dropzone');
        const fileInput = document.getElementById('p2j-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handlePdfToJpgFile(e.target.files[0]);
        });

        this.refreshLucideIcons();
    }

    async handlePdfToJpgFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('p2j-dropzone')?.classList.add('hidden');
        document.getElementById('p2j-editor')?.classList.remove('hidden');
        document.getElementById('p2j-filename').textContent = file.name;

        const gallery = document.getElementById('p2j-gallery');
        gallery.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-slate-500">Rendering high-resolution images in browser RAM...</div>`;

        try {
            const { renderedImages } = await AllToolsEngine.pdfToJpg(file);
            gallery.innerHTML = renderedImages.map(img => `
                <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
                    <div class="w-full aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden border border-slate-100 flex items-center justify-center">
                        <img src="${img.dataUrl}" class="w-full h-full object-contain" alt="Page ${img.pageNumber}"/>
                    </div>
                    <div class="flex items-center justify-between text-xs pt-1">
                        <span class="font-bold text-slate-700">Page ${img.pageNumber}</span>
                        <a href="${img.dataUrl}" download="${file.name.replace(/\.[^/.]+$/, '')}_page_${img.pageNumber}.jpg" 
                           class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition">
                            Download JPG
                        </a>
                    </div>
                </div>
            `).join('');

            document.getElementById('btn-download-all-jpg')?.addEventListener('click', async () => {
                const zipFiles = renderedImages.map(img => ({ name: img.name, bytes: img.bytes }));
                await PdfHelpers.downloadAsZip(zipFiles, `${file.name.replace(/\.[^/.]+$/, '')}_images.zip`);
            });

            this.updateHistoryCounter();
            this.showToast('All pages rendered as JPG!', 'success');
        } catch (err) {
            gallery.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-red-500">${err.message}</div>`;
        }
    }

    // ================= 11. JPG TO PDF =================
    renderJpgToPdfWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="j2p-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="j2p-file-input" accept="image/*" multiple class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="file-image" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Images (JPG, PNG, WebP)</h4>
                        <p class="text-xs text-slate-500">Combine multiple photos and graphics into a multi-page PDF.</p>
                    </div>
                </div>

                <div id="j2p-editor" class="hidden space-y-4">
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <h4 id="j2p-count" class="text-sm font-bold text-slate-800">0 Images Selected</h4>
                        <button id="btn-execute-j2p" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Convert to PDF &amp; Download
                        </button>
                    </div>
                    <div id="j2p-list" class="space-y-2"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('j2p-dropzone');
        const fileInput = document.getElementById('j2p-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.uploadedFiles = Array.from(e.target.files);
                dropzone.classList.add('hidden');
                document.getElementById('j2p-editor').classList.remove('hidden');
                document.getElementById('j2p-count').textContent = `${this.uploadedFiles.length} Images Selected`;
                document.getElementById('j2p-list').innerHTML = this.uploadedFiles.map((f, i) => `
                    <div class="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <span class="font-semibold text-slate-800">${i + 1}. ${f.name}</span>
                        <span class="text-slate-400">${PdfHelpers.formatBytes(f.size)}</span>
                    </div>
                `).join('');
            }
        });

        document.getElementById('btn-execute-j2p')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Compiling images into PDF...', 'info');
                const result = await AllToolsEngine.jpgToPdf(this.uploadedFiles);
                PdfHelpers.downloadBytes(result.pdfBytes, `images_converted_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Images converted to PDF and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 12. COMPRESS PDF =================
    renderCompressWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="comp-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="comp-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="minimize-2" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Compress</h4>
                        <p class="text-xs text-slate-500">Optimizes internal streams and strips redundant objects.</p>
                    </div>
                </div>

                <div id="comp-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="comp-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <p id="comp-meta" class="text-xs text-slate-500">Original Size: 0 MB</p>
                    <button id="btn-execute-comp" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Compress PDF Now (Browser RAM)
                    </button>
                    <div id="comp-result" class="hidden p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('comp-dropzone');
        const fileInput = document.getElementById('comp-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleCompressFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-comp')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Optimizing PDF streams...', 'info');
                const result = await AllToolsEngine.compressPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `compressed_${Date.now()}.pdf`, 'application/pdf');
                const resEl = document.getElementById('comp-result');
                resEl?.classList.remove('hidden');
                resEl.innerHTML = `<strong>Compression Complete:</strong> Reduced from ${PdfHelpers.formatBytes(result.originalSize)} to ${PdfHelpers.formatBytes(result.newSize)} (${result.percentReduced}% saved) in ${result.durationMs}ms.`;
                this.updateHistoryCounter();
                this.showToast('Compressed and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleCompressFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('comp-dropzone')?.classList.add('hidden');
        document.getElementById('comp-editor')?.classList.remove('hidden');
        document.getElementById('comp-filename').textContent = file.name;
        document.getElementById('comp-meta').textContent = `Original Size: ${PdfHelpers.formatBytes(file.size)}`;
    }

    // ================= 13. GRAYSCALE PDF =================
    renderGrayscaleWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="gray-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="gray-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                            <i data-lucide="circle" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Convert to Grayscale</h4>
                        <p class="text-xs text-slate-500">Converts color documents to clean black &amp; white to save ink.</p>
                    </div>
                </div>

                <div id="gray-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="gray-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <button id="btn-execute-gray" class="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-md transition">
                        Convert to Monochrome &amp; Download
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('gray-dropzone');
        const fileInput = document.getElementById('gray-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleGrayscaleFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-gray')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Converting pages to monochrome...', 'info');
                const result = await AllToolsEngine.grayscalePdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `grayscale_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Converted to grayscale and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleGrayscaleFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('gray-dropzone')?.classList.add('hidden');
        document.getElementById('gray-editor')?.classList.remove('hidden');
        document.getElementById('gray-filename').textContent = file.name;
    }

    // ================= 14. PDF METADATA EDITOR =================
    renderMetadataWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="meta-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="meta-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="tag" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Edit Metadata</h4>
                        <p class="text-xs text-slate-500">Inspect and sanitize Title, Author, Subject, and Keywords.</p>
                    </div>
                </div>

                <div id="meta-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="meta-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                            <input type="text" id="meta-title" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Author</label>
                            <input type="text" id="meta-author" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                            <input type="text" id="meta-subject" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Keywords (comma separated)</label>
                            <input type="text" id="meta-keywords" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                    </div>
                    <button id="btn-execute-meta" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Save Metadata &amp; Download PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('meta-dropzone');
        const fileInput = document.getElementById('meta-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleMetadataFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-meta')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Updating metadata...', 'info');
                const title = document.getElementById('meta-title')?.value;
                const author = document.getElementById('meta-author')?.value;
                const subject = document.getElementById('meta-subject')?.value;
                const keywords = document.getElementById('meta-keywords')?.value;

                const result = await AllToolsEngine.editMetadata(this.uploadedFiles[0], { title, author, subject, keywords });
                PdfHelpers.downloadBytes(result.pdfBytes, `metadata_updated_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Metadata updated and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    async handleMetadataFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('meta-dropzone')?.classList.add('hidden');
        document.getElementById('meta-editor')?.classList.remove('hidden');
        document.getElementById('meta-filename').textContent = file.name;

        const meta = await AllToolsEngine.readMetadata(file);
        document.getElementById('meta-title').value = meta.title;
        document.getElementById('meta-author').value = meta.author;
        document.getElementById('meta-subject').value = meta.subject;
        document.getElementById('meta-keywords').value = meta.keywords;
    }

    // ================= 15. TEXT TO PDF =================
    renderTextToPdfWorkspace(container) {
        container.innerHTML = `
            <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-800">Paste or Type Text to Generate PDF</h4>
                    <select id="txt-font" class="px-3 py-1.5 text-xs border border-slate-300 rounded-lg">
                        <option value="proportional">Standard Font (Helvetica)</option>
                        <option value="monospace">Code Font (Monospace Courier)</option>
                    </select>
                </div>
                <textarea id="txt-content" rows="12" placeholder="Paste your text, code, notes, or logs here..." 
                          class="w-full p-4 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
                <button id="btn-execute-txt" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                    Compile to PDF &amp; Download
                </button>
            </div>
        `;

        document.getElementById('btn-execute-txt')?.addEventListener('click', async () => {
            const text = document.getElementById('txt-content')?.value || '';
            if (!text.trim()) {
                this.showToast('Please enter text to convert.', 'error');
                return;
            }
            try {
                this.showToast('Compiling text into PDF...', 'info');
                const font = document.getElementById('txt-font')?.value;
                const result = await AllToolsEngine.textToPdf(text, { font });
                PdfHelpers.downloadBytes(result.pdfBytes, `text_document_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast(`Compiled into ${result.pageCount} page(s) and downloaded!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 16. OCR PDF =================
    renderOcrWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="ocr-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="ocr-file-input" accept=".pdf,image/*" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i data-lucide="scan-text" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Scanned Document or Image</h4>
                        <p class="text-xs text-slate-500">Extracts selectable and searchable text from scanned PDFs & images.</p>
                    </div>
                </div>

                <div id="ocr-output-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-bold text-slate-800">Recognized Text Output</h4>
                        <div class="flex items-center gap-2">
                            <button id="btn-copy-ocr" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">Copy Text</button>
                            <button id="btn-dl-ocr" class="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold">Download .TXT</button>
                        </div>
                    </div>
                    <textarea id="ocr-text-result" rows="10" class="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"></textarea>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('ocr-dropzone');
        const fileInput = document.getElementById('ocr-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleOcrFile(e.target.files[0]);
        });

        document.getElementById('btn-copy-ocr')?.addEventListener('click', () => {
            const val = document.getElementById('ocr-text-result')?.value;
            if (val) {
                navigator.clipboard.writeText(val);
                this.showToast('Copied to clipboard!', 'success');
            }
        });

        document.getElementById('btn-dl-ocr')?.addEventListener('click', () => {
            const val = document.getElementById('ocr-text-result')?.value;
            if (val) {
                const blob = new Blob([val], { type: 'text/plain' });
                PdfHelpers.downloadBytes(new Uint8Array(blob), `ocr_extracted_${Date.now()}.txt`, 'text/plain');
            }
        });

        this.refreshLucideIcons();
    }

    async handleOcrFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('ocr-dropzone')?.classList.add('hidden');
        this.showToast('Extracting text via Free Edge OCR...', 'info');
        try {
            const text = await EdgeAIBridge.performOcr(file);
            document.getElementById('ocr-output-card')?.classList.remove('hidden');
            document.getElementById('ocr-text-result').value = text;
            this.showToast('OCR completed successfully!', 'success');
        } catch (err) {
            document.getElementById('ocr-dropzone')?.classList.remove('hidden');
            this.showToast(err.message || 'OCR parsing failed.', 'error');
        }
    }

    // ================= 17. AI SUMMARIZER =================
    renderSummarizerWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="ai-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="ai-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="sparkles" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF for AI Summarization</h4>
                        <p class="text-xs text-slate-500">Extracts key bullet points, executive summaries, and action items.</p>
                    </div>
                </div>

                <div id="ai-output-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-bold text-slate-800">Executive AI Summary</h4>
                        <button id="btn-copy-ai" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">Copy Summary</button>
                    </div>
                    <div id="ai-summary-result" class="p-4 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed whitespace-pre-line font-sans"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('ai-dropzone');
        const fileInput = document.getElementById('ai-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleSummarizerFile(e.target.files[0]);
        });

        document.getElementById('btn-copy-ai')?.addEventListener('click', () => {
            const val = document.getElementById('ai-summary-result')?.textContent;
            if (val) {
                navigator.clipboard.writeText(val);
                this.showToast('Copied to clipboard!', 'success');
            }
        });

        this.refreshLucideIcons();
    }

    async handleSummarizerFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('ai-dropzone')?.classList.add('hidden');
        this.showToast('Extracting text locally in browser RAM...', 'info');
        try {
            const { text } = await EdgeAIBridge.extractTextFromPdf(file);
            this.showToast('Analyzing content with AI...', 'info');
            const summary = await EdgeAIBridge.summarizeDocument(text);
            document.getElementById('ai-output-card')?.classList.remove('hidden');
            document.getElementById('ai-summary-result').textContent = summary;
            this.showToast('Summary generated successfully!', 'success');
        } catch (err) {
            document.getElementById('ai-dropzone')?.classList.remove('hidden');
            this.showToast(err.message, 'error');
        }
    }

    // ================= 18. FLATTEN PDF FORMS =================
    renderFlattenWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="flatten-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="flatten-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i data-lucide="shield-check" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Flatten Form Fields</h4>
                        <p class="text-xs text-slate-500">Bakes fillable inputs, checkboxes, and signatures into permanent vector graphics.</p>
                    </div>
                </div>

                <div id="flatten-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="flatten-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <p class="text-xs text-slate-500">Flattening locks all interactive text fields so they cannot be modified or tampered with.</p>
                    <button id="btn-execute-flatten" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Flatten Form Fields &amp; Download PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('flatten-dropzone');
        const fileInput = document.getElementById('flatten-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleFlattenFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-flatten')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Flattening form fields in browser RAM...', 'info');
                const result = await AllToolsEngine.flattenPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `flattened_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Document flattened and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleFlattenFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('flatten-dropzone')?.classList.add('hidden');
        document.getElementById('flatten-editor')?.classList.remove('hidden');
        document.getElementById('flatten-filename').textContent = file.name;
    }

    // ================= 19. FORM FILLER =================
    renderFormFillerWorkspace(container) {
        // Reset state
        this.fillerPdfDoc = null;
        this.fillerPageCount = 1;
        this.fillerCurrentPage = 1;
        this.fillerMode = 'text'; // 'text', 'check', 'cross', 'date'
        this.fillerFontSize = 11;
        this.fillerColor = 'black'; // 'black', 'blue', 'red'
        this.fillerItems = []; // [{ id, pageNumber, xPct, yPct, text, isCheck, fontSize, color }]
        this.fillerAcroFields = [];

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Dropzone State -->
                <div id="filler-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="filler-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                            <i data-lucide="check-square" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select PDF Form to Fill</h4>
                        <p class="text-xs text-slate-500 max-w-md mx-auto">
                            Fill any government form (Aadhaar, PAN, applications) or interactive digital AcroForms. Click anywhere on the form to type, add checkmarks, and sign.
                        </p>
                        <div class="pt-2">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Works on Flat &amp; Scanned Forms
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Active Editor State -->
                <div id="filler-editor" class="hidden space-y-3">
                    <!-- Top Action Bar -->
                    <div class="p-3 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                        <div class="flex items-center gap-2.5">
                            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <i data-lucide="file-text" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 id="filler-filename" class="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">form.pdf</h4>
                                <div class="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span id="filler-page-badge" class="font-semibold text-blue-600">1 Page</span>
                                    <span>&bull;</span>
                                    <span>100% In-Browser Private</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button id="btn-filler-change-file" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1">
                                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                                <span>Change PDF</span>
                            </button>
                            <button id="btn-filler-clear-all" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1" title="Clear all typed text on this document">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5 text-slate-500"></i>
                                <span>Clear</span>
                            </button>
                            <button id="btn-execute-fill" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5">
                                <i data-lucide="download" class="w-4 h-4"></i>
                                <span>Save &amp; Download PDF</span>
                            </button>
                        </div>
                    </div>

                    <!-- Interactive Form Filler Toolbar -->
                    <div class="p-2.5 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-sm text-xs">
                        <!-- Mode Selector -->
                        <div class="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                            <button class="filler-mode-btn active px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white transition flex items-center gap-1" data-mode="text">
                                <i data-lucide="type" class="w-3.5 h-3.5"></i>
                                <span>Text</span>
                            </button>
                            <button class="filler-mode-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1" data-mode="check">
                                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                                <span>Check (✓)</span>
                            </button>
                            <button class="filler-mode-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1" data-mode="cross">
                                <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                <span>Cross (✗)</span>
                            </button>
                            <button class="filler-mode-btn px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1" data-mode="date">
                                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                                <span>Date</span>
                            </button>
                        </div>

                        <!-- Font Size & Color Controls -->
                        <div class="flex items-center gap-2">
                            <div class="flex items-center gap-1">
                                <span class="text-[11px] text-slate-400">Size:</span>
                                <select id="filler-font-size" class="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                                    <option value="9">9 pt</option>
                                    <option value="11" selected>11 pt</option>
                                    <option value="14">14 pt</option>
                                    <option value="18">18 pt</option>
                                </select>
                            </div>

                            <div class="flex items-center gap-1">
                                <span class="text-[11px] text-slate-400">Ink:</span>
                                <div class="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                                    <button class="filler-color-btn active w-6 h-6 rounded-md bg-slate-950 border border-slate-600 flex items-center justify-center text-[10px]" data-color="black" title="Black Ink">
                                        <span class="w-3 h-3 rounded-full bg-slate-900 border border-white"></span>
                                    </button>
                                    <button class="filler-color-btn w-6 h-6 rounded-md flex items-center justify-center text-[10px]" data-color="blue" title="Pen Blue Ink">
                                        <span class="w-3 h-3 rounded-full bg-blue-600"></span>
                                    </button>
                                    <button class="filler-color-btn w-6 h-6 rounded-md flex items-center justify-center text-[10px]" data-color="red" title="Red Ink">
                                        <span class="w-3 h-3 rounded-full bg-red-600"></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Page Navigation -->
                        <div class="flex items-center gap-1.5">
                            <button id="btn-filler-prev-page" class="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none" title="Previous Page">
                                <i data-lucide="chevron-left" class="w-4 h-4"></i>
                            </button>
                            <span id="filler-page-indicator" class="text-xs font-semibold px-1 text-slate-200">Page 1 / 1</span>
                            <button id="btn-filler-next-page" class="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-30 disabled:pointer-events-none" title="Next Page">
                                <i data-lucide="chevron-right" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Digital AcroForm Fields Collapsible Container (shown if digital fields exist) -->
                    <div id="filler-acro-container" class="hidden p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                        <div class="flex items-center justify-between cursor-pointer" id="btn-toggle-acro-fields">
                            <div class="flex items-center gap-2">
                                <i data-lucide="sliders" class="w-4 h-4 text-blue-700"></i>
                                <span class="text-xs font-bold text-blue-900" id="acro-fields-title">Interactive AcroForm Fields Detected</span>
                            </div>
                            <span class="text-[11px] font-semibold text-blue-600 underline">Toggle Fields</span>
                        </div>
                        <div id="acro-fields-list" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 max-h-48 overflow-y-auto"></div>
                    </div>

                    <!-- Instructions Banner -->
                    <div class="px-3 py-1.5 bg-amber-50/80 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs text-amber-900">
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="mouse-pointer" class="w-3.5 h-3.5 text-amber-600"></i>
                            <span><strong>Click anywhere on the form</strong> to type text or place checkmarks. Drag any text box to reposition, or click &times; to delete.</span>
                        </div>
                        <span id="filler-placed-count" class="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">0 items placed</span>
                    </div>

                    <!-- Visual Canvas + Click-to-Fill Overlay Container -->
                    <div class="relative overflow-auto max-h-[75vh] p-2 sm:p-4 bg-slate-200/80 rounded-2xl border border-slate-300 flex justify-center shadow-inner">
                        <div id="filler-page-container" class="relative bg-white shadow-2xl rounded overflow-hidden select-none">
                            <canvas id="filler-canvas" class="block"></canvas>
                            <div id="filler-overlay" class="absolute inset-0 cursor-crosshair"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindFormFillerEvents();
        this.refreshLucideIcons();
    }

    bindFormFillerEvents() {
        const dropzone = document.getElementById('filler-dropzone');
        const fileInput = document.getElementById('filler-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleFormFillerFile(e.target.files[0]);
        });

        // Change PDF
        document.getElementById('btn-filler-change-file')?.addEventListener('click', () => {
            document.getElementById('filler-editor')?.classList.add('hidden');
            document.getElementById('filler-dropzone')?.classList.remove('hidden');
            this.uploadedFiles = [];
            this.fillerItems = [];
        });

        // Clear all
        document.getElementById('btn-filler-clear-all')?.addEventListener('click', () => {
            if (this.fillerItems.length === 0) return;
            if (confirm('Clear all placed inputs and checkmarks?')) {
                this.fillerItems = [];
                this.renderFillerOverlayItems();
                this.updateFillerCount();
            }
        });

        // Tool Mode Buttons
        document.querySelectorAll('.filler-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filler-mode-btn').forEach(b => {
                    b.classList.remove('active', 'bg-blue-600', 'text-white');
                    b.classList.add('text-slate-300');
                });
                btn.classList.add('active', 'bg-blue-600', 'text-white');
                btn.classList.remove('text-slate-300');
                this.fillerMode = btn.getAttribute('data-mode') || 'text';
            });
        });

        // Font Size
        document.getElementById('filler-font-size')?.addEventListener('change', (e) => {
            this.fillerFontSize = parseInt(e.target.value, 10) || 11;
        });

        // Color Buttons
        document.querySelectorAll('.filler-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filler-color-btn').forEach(b => b.classList.remove('active', 'ring-2', 'ring-white'));
                btn.classList.add('active', 'ring-2', 'ring-white');
                this.fillerColor = btn.getAttribute('data-color') || 'black';
            });
        });

        // Prev Page
        document.getElementById('btn-filler-prev-page')?.addEventListener('click', () => {
            if (this.fillerCurrentPage > 1) {
                this.renderFormPage(this.fillerCurrentPage - 1);
            }
        });

        // Next Page
        document.getElementById('btn-filler-next-page')?.addEventListener('click', () => {
            if (this.fillerCurrentPage < this.fillerPageCount) {
                this.renderFormPage(this.fillerCurrentPage + 1);
            }
        });

        // AcroFields Accordion Toggle
        document.getElementById('btn-toggle-acro-fields')?.addEventListener('click', () => {
            document.getElementById('acro-fields-list')?.classList.toggle('hidden');
        });

        // Overlay Click to add text / marks
        const overlay = document.getElementById('filler-overlay');
        overlay?.addEventListener('click', (e) => {
            if (e.target.closest('.filler-item')) return;
            const rect = overlay.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const xPct = Math.max(0.01, Math.min(0.98, (e.clientX - rect.left) / rect.width));
            const yPct = Math.max(0.01, Math.min(0.98, (e.clientY - rect.top) / rect.height));

            const itemId = 'fi_' + Date.now();
            let newItem;

            if (this.fillerMode === 'check') {
                newItem = {
                    id: itemId,
                    pageNumber: this.fillerCurrentPage,
                    xPct,
                    yPct,
                    text: 'X',
                    isCheck: true,
                    fontSize: this.fillerFontSize + 2,
                    color: this.fillerColor
                };
            } else if (this.fillerMode === 'cross') {
                newItem = {
                    id: itemId,
                    pageNumber: this.fillerCurrentPage,
                    xPct,
                    yPct,
                    text: 'X',
                    isCheck: false,
                    fontSize: this.fillerFontSize + 2,
                    color: this.fillerColor
                };
            } else if (this.fillerMode === 'date') {
                const d = new Date();
                const dStr = String(d.getDate()).padStart(2, '0') + '/' +
                             String(d.getMonth() + 1).padStart(2, '0') + '/' +
                             d.getFullYear();
                newItem = {
                    id: itemId,
                    pageNumber: this.fillerCurrentPage,
                    xPct,
                    yPct,
                    text: dStr,
                    isCheck: false,
                    fontSize: this.fillerFontSize,
                    color: this.fillerColor
                };
            } else {
                newItem = {
                    id: itemId,
                    pageNumber: this.fillerCurrentPage,
                    xPct,
                    yPct,
                    text: '',
                    isCheck: false,
                    fontSize: this.fillerFontSize,
                    color: this.fillerColor
                };
            }

            this.fillerItems.push(newItem);
            this.renderFillerOverlayItems(itemId);
            this.updateFillerCount();
        });

        // Save & Download
        document.getElementById('btn-execute-fill')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const saveBtn = document.getElementById('btn-execute-fill');
            try {
                saveBtn.disabled = true;
                saveBtn.innerHTML = `<span>⏳ Saving...</span>`;
                this.showToast('Generating filled PDF...', 'info');

                const arrayBuffer = await PdfHelpers.fileToArrayBuffer(this.uploadedFiles[0]);
                const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                const pages = pdfDoc.getPages();

                const visualOverlays = this.fillerItems
                    .filter(item => item.text && item.text.trim().length > 0)
                    .map(item => {
                        const pageIdx = Math.max(0, Math.min(item.pageNumber - 1, pages.length - 1));
                        const page = pages[pageIdx];
                        const { width: pWidth, height: pHeight } = page.getSize();
                        const x = item.xPct * pWidth;
                        const y = pHeight - (item.yPct * pHeight) - (item.fontSize * 0.75);

                        return {
                            pageNumber: item.pageNumber,
                            x: Math.round(x * 10) / 10,
                            y: Math.round(y * 10) / 10,
                            text: item.text.trim(),
                            isCheck: item.isCheck || false,
                            fontSize: item.fontSize || 11,
                            color: item.color || 'black',
                            bold: false
                        };
                    });

                const acroValues = {};
                document.querySelectorAll('.acro-input-field').forEach(input => {
                    const name = input.getAttribute('data-field-name');
                    if (name) acroValues[name] = input.value;
                });

                const result = await AllToolsEngine.fillFormFields(this.uploadedFiles[0], acroValues, visualOverlays);
                const originalName = this.uploadedFiles[0].name.replace(/\.pdf$/i, '');
                PdfHelpers.downloadBytes(result.pdfBytes, `filled_${originalName}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Filled PDF downloaded successfully!', 'success');
            } catch (err) {
                console.error('Save fill error:', err);
                this.showToast(`Error: ${err.message}`, 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = `<i data-lucide="download" class="w-4 h-4 mr-1.5"></i> Save &amp; Download PDF`;
                this.refreshLucideIcons();
            }
        });
    }

    async handleFormFillerFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        this.fillerItems = [];

        document.getElementById('filler-dropzone')?.classList.add('hidden');
        document.getElementById('filler-editor')?.classList.remove('hidden');
        document.getElementById('filler-filename').textContent = file.name;

        try {
            this.showToast('Loading PDF form in browser RAM...', 'info');
            const arrayBuffer = await PdfHelpers.fileToArrayBuffer(file);
            const copy = arrayBuffer.slice(0);
            const loadingTask = window.pdfjsLib.getDocument({ data: copy });
            this.fillerPdfDoc = await loadingTask.promise;
            this.fillerPageCount = this.fillerPdfDoc.numPages;
            this.fillerCurrentPage = 1;

            document.getElementById('filler-page-badge').textContent = `${this.fillerPageCount} ${this.fillerPageCount === 1 ? 'Page' : 'Pages'}`;

            // Check if AcroForm interactive fields exist
            try {
                this.fillerAcroFields = await AllToolsEngine.getFormFields(file);
                const acroContainer = document.getElementById('filler-acro-container');
                const acroList = document.getElementById('acro-fields-list');
                const acroTitle = document.getElementById('acro-fields-title');

                if (this.fillerAcroFields && this.fillerAcroFields.length > 0) {
                    acroContainer?.classList.remove('hidden');
                    if (acroTitle) acroTitle.textContent = `Interactive AcroForm Fields Detected (${this.fillerAcroFields.length})`;
                    if (acroList) {
                        acroList.innerHTML = this.fillerAcroFields.map(f => `
                            <div class="space-y-0.5">
                                <label class="block text-[11px] font-semibold text-slate-700 truncate" title="${f.name}">${f.name}</label>
                                <input type="text" data-field-name="${f.name}" value="${f.value}" class="acro-input-field w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white">
                            </div>
                        `).join('');
                    }
                } else {
                    acroContainer?.classList.add('hidden');
                }
            } catch (_) {}

            await this.renderFormPage(1);
            this.updateFillerCount();
        } catch (err) {
            console.error('Error opening form in filler:', err);
            this.showToast(`Error opening PDF: ${err.message}`, 'error');
        }
    }

    async renderFormPage(pageNum) {
        if (!this.fillerPdfDoc) return;
        this.fillerCurrentPage = pageNum;
        const page = await this.fillerPdfDoc.getPage(pageNum);

        const viewport1 = page.getViewport({ scale: 1.0 });
        this.fillerPagePdfWidth = viewport1.width;
        this.fillerPagePdfHeight = viewport1.height;

        const maxWidth = Math.min(window.innerWidth - 64, 900);
        const scale = Math.max(1.0, Math.min(2.0, maxWidth / viewport1.width));
        const viewport = page.getViewport({ scale });

        const canvas = document.getElementById('filler-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const container = document.getElementById('filler-page-container');
        if (container) {
            container.style.width = `${viewport.width}px`;
            container.style.height = `${viewport.height}px`;
        }

        await page.render({ canvasContext: ctx, viewport }).promise;

        const indicator = document.getElementById('filler-page-indicator');
        if (indicator) indicator.textContent = `Page ${pageNum} / ${this.fillerPageCount}`;

        const prevBtn = document.getElementById('btn-filler-prev-page');
        const nextBtn = document.getElementById('btn-filler-next-page');
        if (prevBtn) prevBtn.disabled = pageNum <= 1;
        if (nextBtn) nextBtn.disabled = pageNum >= this.fillerPageCount;

        this.renderFillerOverlayItems();
    }

    renderFillerOverlayItems(focusItemId = null) {
        const overlay = document.getElementById('filler-overlay');
        if (!overlay) return;
        overlay.innerHTML = '';

        const pageItems = this.fillerItems.filter(item => item.pageNumber === this.fillerCurrentPage);
        const overlayWidth = overlay.clientWidth || 800;
        const scaleRatio = overlayWidth / (this.fillerPagePdfWidth || 595.28);

        pageItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'filler-item group absolute flex items-center select-none';
            el.style.left = `${item.xPct * 100}%`;
            el.style.top = `${item.yPct * 100}%`;
            el.style.transform = 'translate(0, -50%)';

            const screenFontSize = Math.max(10, Math.round(item.fontSize * scaleRatio));
            const textColor = item.color === 'blue' ? '#0833a2' : (item.color === 'red' ? '#dc2626' : '#0f172a');

            if (item.isCheck || item.text === 'X') {
                el.innerHTML = `
                    <div class="relative px-1 py-0.5 font-bold cursor-move flex items-center border border-dashed border-transparent hover:border-blue-400 rounded bg-white/75"
                         style="font-size: ${screenFontSize + 2}px; color: ${textColor}; line-height: 1;">
                        <span>X</span>
                        <button class="btn-del-item hidden group-hover:flex absolute -top-2.5 -right-2.5 w-4 h-4 bg-red-600 text-white rounded-full items-center justify-center text-[10px] shadow" title="Delete">×</button>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <div class="relative flex items-center cursor-move border border-dashed border-transparent hover:border-blue-400 rounded bg-white/70 focus-within:border-blue-500 focus-within:bg-white shadow-2xs">
                        <input type="text" value="${item.text.replace(/"/g, '&quot;')}" placeholder="Type here..."
                               class="filler-text-input px-1 py-0.5 bg-transparent outline-none font-sans"
                               style="font-size: ${screenFontSize}px; color: ${textColor}; min-width: 60px; width: ${Math.max(60, (item.text.length + 2) * (screenFontSize * 0.6))}px;">
                        <button class="btn-del-item hidden group-hover:flex absolute -top-2.5 -right-2.5 w-4 h-4 bg-red-600 text-white rounded-full items-center justify-center text-[10px] shadow" title="Delete">×</button>
                    </div>
                `;
            }

            const input = el.querySelector('.filler-text-input');
            if (input) {
                input.addEventListener('input', (ev) => {
                    item.text = ev.target.value;
                    input.style.width = `${Math.max(60, (item.text.length + 2) * (screenFontSize * 0.6))}px`;
                    this.updateFillerCount();
                });
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') input.blur();
                });
            }

            el.querySelector('.btn-del-item')?.addEventListener('click', (ev) => {
                ev.stopPropagation();
                this.fillerItems = this.fillerItems.filter(i => i.id !== item.id);
                this.renderFillerOverlayItems();
                this.updateFillerCount();
            });

            this.makeFillerItemDraggable(el, item, overlay);
            overlay.appendChild(el);

            if (focusItemId && item.id === focusItemId && input) {
                setTimeout(() => input.focus(), 50);
            }
        });
    }

    makeFillerItemDraggable(el, item, overlay) {
        let isDragging = false;
        let startX = 0, startY = 0;
        let initialXPct = item.xPct, initialYPct = item.yPct;

        const onMouseDown = (e) => {
            if (e.target.tagName === 'INPUT' && document.activeElement === e.target) return;
            if (e.target.classList.contains('btn-del-item')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialXPct = item.xPct;
            initialYPct = item.yPct;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const rect = overlay.getBoundingClientRect();
            const deltaXPct = (e.clientX - startX) / rect.width;
            const deltaYPct = (e.clientY - startY) / rect.height;
            item.xPct = Math.max(0.01, Math.min(0.98, initialXPct + deltaXPct));
            item.yPct = Math.max(0.01, Math.min(0.98, initialYPct + deltaYPct));
            el.style.left = `${item.xPct * 100}%`;
            el.style.top = `${item.yPct * 100}%`;
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        el.addEventListener('mousedown', onMouseDown);
    }

    updateFillerCount() {
        const count = this.fillerItems.filter(i => i.text && i.text.trim().length > 0).length;
        const countEl = document.getElementById('filler-placed-count');
        if (countEl) {
            countEl.textContent = `${count} ${count === 1 ? 'item' : 'items'} placed`;
        }
    }

    // ================= 20. CROP PDF =================
    renderCropWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="crop-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="crop-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <i data-lucide="crop" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Crop Margins</h4>
                        <p class="text-xs text-slate-500">Trim excessive whitespace borders from document pages.</p>
                    </div>
                </div>

                <div id="crop-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="crop-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <div class="space-y-2">
                        <label class="block text-xs font-semibold text-slate-700">Margin Trim Percentage: <span id="crop-val-label">10%</span></label>
                        <input type="range" id="crop-slider" min="2" max="30" value="10" class="w-full">
                    </div>
                    <button id="btn-execute-crop" class="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Trim Margins &amp; Download PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('crop-dropzone');
        const fileInput = document.getElementById('crop-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleCropFile(e.target.files[0]);
        });

        const slider = document.getElementById('crop-slider');
        slider?.addEventListener('input', (e) => {
            document.getElementById('crop-val-label').textContent = `${e.target.value}%`;
        });

        document.getElementById('btn-execute-crop')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const pct = parseInt(document.getElementById('crop-slider')?.value || 10, 10);
            try {
                this.showToast('Trimming margins in browser RAM...', 'info');
                const result = await AllToolsEngine.cropPdf(this.uploadedFiles[0], pct);
                PdfHelpers.downloadBytes(result.pdfBytes, `cropped_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Margins cropped and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleCropFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('crop-dropzone')?.classList.add('hidden');
        document.getElementById('crop-editor')?.classList.remove('hidden');
        document.getElementById('crop-filename').textContent = file.name;
    }

    // ================= 21. REPAIR PDF =================
    renderRepairWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="repair-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="repair-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i data-lucide="wrench" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Damaged PDF to Repair</h4>
                        <p class="text-xs text-slate-500">Reconstructs corrupt XREF tables and restores unreadable page trees.</p>
                    </div>
                </div>

                <div id="repair-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="repair-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <p class="text-xs text-slate-500">Client-side parser reads valid byte sequences and generates a reconstructed, valid PDF stream.</p>
                    <button id="btn-execute-repair" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Reconstruct PDF &amp; Download
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('repair-dropzone');
        const fileInput = document.getElementById('repair-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleRepairFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-repair')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Reconstructing PDF tree in browser RAM...', 'info');
                const result = await AllToolsEngine.repairPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `repaired_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast(`PDF recovered (${result.pageCount} pages)!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleRepairFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('repair-dropzone')?.classList.add('hidden');
        document.getElementById('repair-editor')?.classList.remove('hidden');
        document.getElementById('repair-filename').textContent = file.name;
    }

    // ================= 22. MARKDOWN TO PDF =================
    renderMarkdownWorkspace(container) {
        container.innerHTML = `
            <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-sm font-bold text-slate-800">Markdown to PDF Studio</h4>
                        <p class="text-xs text-slate-400">Supports # Headers, - Lists, > Quotes, and \`Code\`</p>
                    </div>
                    <button id="btn-execute-md" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Compile to PDF &amp; Download
                    </button>
                </div>
                <textarea id="md-editor-text" rows="14" class="w-full p-4 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"># Project Roadmap &amp; Overview

## 1. Executive Summary
This document was compiled directly in your browser using zero-cost serverless PDF rendering.

- High performance: Sub-100ms in-memory processing
- 100% Private: Bytes never leave your device
- $0 Server footprint: Unlimited free scale

> Note: All layout and rendering operations run inside client RAM.

### 2. Next Milestones
- [x] Complete 32-tool routing suite
- [x] Integrate PDF.js and pdf-lib
- [x] Edge AI integration for summaries and OCR</textarea>
            </div>
        `;

        document.getElementById('btn-execute-md')?.addEventListener('click', async () => {
            const md = document.getElementById('md-editor-text')?.value || '';
            try {
                this.showToast('Compiling Markdown into PDF...', 'info');
                const result = await AllToolsEngine.markdownToPdf(md);
                PdfHelpers.downloadBytes(result.pdfBytes, `markdown_${Date.now()}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Markdown compiled to PDF and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 23. DOCUMENT COMPARE =================
    renderCompareWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div id="cmp-drop-a" class="dropzone p-6 rounded-2xl text-center cursor-pointer">
                        <input type="file" id="cmp-file-a" accept=".pdf" class="hidden">
                        <i data-lucide="file" class="w-8 h-8 mx-auto text-slate-400 mb-2"></i>
                        <h4 class="text-xs font-bold text-slate-700" id="cmp-label-a">Upload Document Version A (Original)</h4>
                    </div>
                    <div id="cmp-drop-b" class="dropzone p-6 rounded-2xl text-center cursor-pointer">
                        <input type="file" id="cmp-file-b" accept=".pdf" class="hidden">
                        <i data-lucide="file" class="w-8 h-8 mx-auto text-slate-400 mb-2"></i>
                        <h4 class="text-xs font-bold text-slate-700" id="cmp-label-b">Upload Document Version B (Revised)</h4>
                    </div>
                </div>

                <div class="text-center">
                    <button id="btn-execute-cmp" class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Compare Documents (Side-by-Side Diff)
                    </button>
                </div>

                <div id="cmp-results" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white border border-slate-200 rounded-2xl">
                    <div class="space-y-2">
                        <h5 class="text-xs font-bold text-red-600 uppercase">Removed from Document A</h5>
                        <div id="cmp-diff-a" class="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-mono space-y-1 max-h-60 overflow-y-auto"></div>
                    </div>
                    <div class="space-y-2">
                        <h5 class="text-xs font-bold text-emerald-600 uppercase">Added to Document B</h5>
                        <div id="cmp-diff-b" class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono space-y-1 max-h-60 overflow-y-auto"></div>
                    </div>
                </div>
            </div>
        `;

        let fileA = null;
        let fileB = null;

        const dropA = document.getElementById('cmp-drop-a');
        const inpA = document.getElementById('cmp-file-a');
        dropA?.addEventListener('click', () => inpA?.click());
        inpA?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                fileA = e.target.files[0];
                document.getElementById('cmp-label-a').textContent = `Doc A: ${fileA.name}`;
            }
        });

        const dropB = document.getElementById('cmp-drop-b');
        const inpB = document.getElementById('cmp-file-b');
        dropB?.addEventListener('click', () => inpB?.click());
        inpB?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                fileB = e.target.files[0];
                document.getElementById('cmp-label-b').textContent = `Doc B: ${fileB.name}`;
            }
        });

        document.getElementById('btn-execute-cmp')?.addEventListener('click', async () => {
            if (!fileA || !fileB) {
                this.showToast('Please upload both documents to compare.', 'error');
                return;
            }
            try {
                this.showToast('Extracting text and comparing revisions...', 'info');
                const diff = await AllToolsEngine.compareDocuments(fileA, fileB);
                const resultsEl = document.getElementById('cmp-results');
                resultsEl?.classList.remove('hidden');

                const diffAEl = document.getElementById('cmp-diff-a');
                const diffBEl = document.getElementById('cmp-diff-b');

                diffAEl.innerHTML = diff.docAOnly.length ? diff.docAOnly.map(l => `<div class="text-red-700">- ${l}</div>`).join('') : '<div class="text-slate-400">No removed lines</div>';
                diffBEl.innerHTML = diff.docBOnly.length ? diff.docBOnly.map(l => `<div class="text-emerald-700">+ ${l}</div>`).join('') : '<div class="text-slate-400">No added lines</div>';

                this.showToast(`Comparison complete! Found ${diff.docAOnly.length} removals and ${diff.docBOnly.length} additions.`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 24. SCAN TO PDF (CAMERA) =================
    renderCameraScanWorkspace(container) {
        container.innerHTML = `
            <div class="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm text-center">
                <div class="max-w-md mx-auto aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border border-slate-300">
                    <video id="scan-cam-video" autoplay playsinline class="w-full h-full object-cover"></video>
                    <canvas id="scan-cam-canvas" class="hidden"></canvas>
                </div>

                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button id="btn-start-cam" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold transition">Start Camera</button>
                    <button id="btn-capture-cam" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition" disabled>Capture Page</button>
                    <button id="btn-export-scanned" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition" disabled>Export PDF (<span id="scan-count">0</span> Pages)</button>
                </div>
            </div>
        `;

        const video = document.getElementById('scan-cam-video');
        const canvas = document.getElementById('scan-cam-canvas');
        const capturedBlobs = [];
        let stream = null;

        document.getElementById('btn-start-cam')?.addEventListener('click', async () => {
            try {
                stream = await EdgeAIBridge.initCameraStream(video);
                document.getElementById('btn-capture-cam').disabled = false;
                this.showToast('Camera active! Point at paper and click Capture.', 'info');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        document.getElementById('btn-capture-cam')?.addEventListener('click', async () => {
            if (!video.videoWidth) return;
            const dataUrl = EdgeAIBridge.captureAndFilterFrame(video, canvas);
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `scan_page_${capturedBlobs.length + 1}.jpg`, { type: 'image/jpeg' });
            capturedBlobs.push(file);

            document.getElementById('scan-count').textContent = capturedBlobs.length;
            document.getElementById('btn-export-scanned').disabled = false;
            this.showToast(`Captured Page ${capturedBlobs.length}!`, 'success');
        });

        document.getElementById('btn-export-scanned')?.addEventListener('click', async () => {
            if (!capturedBlobs.length) return;
            try {
                this.showToast('Compiling scanned document...', 'info');
                const result = await AllToolsEngine.jpgToPdf(capturedBlobs);
                PdfHelpers.downloadBytes(result.pdfBytes, `scanned_document_${Date.now()}.pdf`, 'application/pdf');
                if (stream) stream.getTracks().forEach(t => t.stop());
                this.updateHistoryCounter();
                this.showToast('Scanned PDF exported successfully!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= 25. WORD TO PDF =================
    renderWordToPdfWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="word-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="word-file-input" accept=".docx" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="file-text" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Word Document (.DOCX)</h4>
                        <p class="text-xs text-slate-500">Unzips XML structure client-side and renders into clean PDF.</p>
                    </div>
                </div>

                <div id="word-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="word-filename" class="text-sm font-bold text-slate-800">document.docx</h4>
                    <button id="btn-execute-word" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Parse XML &amp; Download PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('word-dropzone');
        const fileInput = document.getElementById('word-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleWordFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-word')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Extracting Word document structure...', 'info');
                const result = await AllToolsEngine.wordToPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `${this.uploadedFiles[0].name.replace(/\.[^/.]+$/, '')}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Word converted to PDF and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleWordFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('word-dropzone')?.classList.add('hidden');
        document.getElementById('word-editor')?.classList.remove('hidden');
        document.getElementById('word-filename').textContent = file.name;
    }

    // ================= 26. EXCEL TO PDF =================
    renderExcelToPdfWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="excel-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="excel-file-input" accept=".xlsx,.csv" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i data-lucide="table" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Spreadsheet (.XLSX, .CSV)</h4>
                        <p class="text-xs text-slate-500">Extracts sheet cells and compiles printable PDF tables.</p>
                    </div>
                </div>

                <div id="excel-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="excel-filename" class="text-sm font-bold text-slate-800">workbook.xlsx</h4>
                    <button id="btn-execute-excel" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Convert Table to PDF &amp; Download
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('excel-dropzone');
        const fileInput = document.getElementById('excel-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleExcelFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-excel')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Parsing spreadsheet structure...', 'info');
                const result = await AllToolsEngine.excelToPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `${this.uploadedFiles[0].name.replace(/\.[^/.]+$/, '')}.pdf`, 'application/pdf');
                this.updateHistoryCounter();
                this.showToast('Spreadsheet converted to PDF!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleExcelFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('excel-dropzone')?.classList.add('hidden');
        document.getElementById('excel-editor')?.classList.remove('hidden');
        document.getElementById('excel-filename').textContent = file.name;
    }

    // ================= 27. FORM BLANK DETECTOR =================
    renderBlankDetectorWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="blank-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="blank-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select Contract or Form to Scan</h4>
                        <p class="text-xs text-slate-500">Detects unsigned signature blocks, blank date fields, and unfilled inputs.</p>
                    </div>
                </div>

                <div id="blank-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="blank-filename" class="text-sm font-bold text-slate-800">contract.pdf</h4>
                    <div id="blank-results-list" class="space-y-2"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('blank-dropzone');
        const fileInput = document.getElementById('blank-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleBlankDetectorFile(e.target.files[0]);
        });

        this.refreshLucideIcons();
    }

    async handleBlankDetectorFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('blank-dropzone')?.classList.add('hidden');
        document.getElementById('blank-editor')?.classList.remove('hidden');
        document.getElementById('blank-filename').textContent = file.name;

        const listEl = document.getElementById('blank-results-list');
        listEl.innerHTML = `<div class="text-xs text-slate-400 py-4 text-center">Scanning document for missing entries...</div>`;

        try {
            const findings = await AllToolsEngine.detectFormBlanks(file);
            if (findings.length === 0) {
                listEl.innerHTML = `
                    <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
                        <span>No obvious missing signatures or unfilled fields detected. Document looks complete!</span>
                    </div>
                `;
            } else {
                listEl.innerHTML = findings.map(item => `
                    <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900">
                        <div class="flex items-center gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
                            <span>${item.label}</span>
                        </div>
                        <span class="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">${item.type}</span>
                    </div>
                `).join('');
            }
            this.refreshLucideIcons();
        } catch (err) {
            listEl.innerHTML = `<div class="text-xs text-red-500 py-4">${err.message}</div>`;
        }
    }

    // ================= 28. AI TRANSLATOR =================
    renderTranslatorWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="trans-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="trans-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i data-lucide="languages" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Translate</h4>
                        <p class="text-xs text-slate-500">Extracts text in browser RAM and queries Gemini Edge for translation.</p>
                    </div>
                </div>

                <div id="trans-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h4 id="trans-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        <div class="flex items-center gap-2">
                            <select id="trans-target-lang" class="px-3 py-1.5 text-xs border border-slate-300 rounded-lg">
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Chinese">Chinese</option>
                                <option value="Japanese">Japanese</option>
                                <option value="Arabic">Arabic</option>
                            </select>
                            <button id="btn-execute-trans" class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold">
                                Translate Document
                            </button>
                        </div>
                    </div>
                    <div id="trans-output" class="hidden p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs whitespace-pre-line max-h-80 overflow-y-auto font-sans"></div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('trans-dropzone');
        const fileInput = document.getElementById('trans-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleTranslatorFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-trans')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const lang = document.getElementById('trans-target-lang')?.value || 'Spanish';
            try {
                this.showToast(`Translating text to ${lang}...`, 'info');
                const { text } = await EdgeAIBridge.extractTextFromPdf(this.uploadedFiles[0]);
                const outEl = document.getElementById('trans-output');
                outEl?.classList.remove('hidden');

                const translated = await EdgeAIBridge.translateDocument(text, lang);
                outEl.textContent = translated;
                this.showToast('Translation ready!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleTranslatorFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('trans-dropzone')?.classList.add('hidden');
        document.getElementById('trans-editor')?.classList.remove('hidden');
        document.getElementById('trans-filename').textContent = file.name;
    }

    // ================= 29. EDIT PDF =================
    renderEditPdfWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="editpdf-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="editpdf-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                            <i data-lucide="pen-tool" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Annotate &amp; Edit</h4>
                        <p class="text-xs text-slate-500">Overlay text notes, review stamps, and geometric highlights onto any page.</p>
                    </div>
                </div>

                <div id="editpdf-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-sm">
                    <div class="flex items-center justify-between border-b pb-3">
                        <h4 id="editpdf-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                        <span class="text-xs text-emerald-600 font-semibold">100% In-Browser Engine</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Annotation Text</label>
                            <input type="text" id="editpdf-text" placeholder="e.g. APPROVED / CONFIDENTIAL" value="APPROVED"
                                   class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                        <div class="grid grid-cols-3 gap-2">
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Page #</label>
                                <input type="number" id="editpdf-page" value="1" min="1"
                                       class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Font Size</label>
                                <select id="editpdf-size" class="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg">
                                    <option value="12">12 pt</option>
                                    <option value="16" selected>16 pt</option>
                                    <option value="20">20 pt</option>
                                    <option value="28">28 pt</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Color</label>
                                <select id="editpdf-color" class="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg">
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                    <option value="green">Green</option>
                                    <option value="black">Black</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <span class="text-xs text-slate-400">Position: Stamps at top-left margin (X: 50, Y: Top - 60).</span>
                        <button id="btn-execute-editpdf" class="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                            Apply Annotations &amp; Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('editpdf-dropzone');
        const fileInput = document.getElementById('editpdf-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleEditPdfFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-editpdf')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const text = document.getElementById('editpdf-text')?.value || 'APPROVED';
            const pageNumber = parseInt(document.getElementById('editpdf-page')?.value, 10) || 1;
            const size = parseInt(document.getElementById('editpdf-size')?.value, 10) || 16;
            const colorName = document.getElementById('editpdf-color')?.value || 'red';

            const { rgb } = window.PDFLib;
            let color = rgb(0.85, 0.15, 0.15);
            if (colorName === 'blue') color = rgb(0.15, 0.35, 0.85);
            else if (colorName === 'green') color = rgb(0.1, 0.6, 0.2);
            else if (colorName === 'black') color = rgb(0.1, 0.1, 0.1);

            try {
                this.showToast('Applying annotations locally...', 'info');
                const result = await AllToolsEngine.editPdf(this.uploadedFiles[0], [
                    { type: 'text', text, pageNumber, size, color, x: 50, y: undefined }
                ]);
                PdfHelpers.downloadBytes(result.pdfBytes, `annotated_${Date.now()}.pdf`, 'application/pdf');
                this.showToast('Annotated PDF downloaded successfully!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleEditPdfFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('editpdf-dropzone')?.classList.add('hidden');
        document.getElementById('editpdf-editor')?.classList.remove('hidden');
        document.getElementById('editpdf-filename').textContent = file.name;
    }

    // ================= 30. PROTECT PDF =================
    renderProtectWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="protect-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="protect-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="lock" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Password Protect</h4>
                        <p class="text-xs text-slate-500">Encrypt document metadata and apply confidential access safeguards.</p>
                    </div>
                </div>

                <div id="protect-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="protect-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <div class="max-w-sm space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1">Set Document Password</label>
                            <input type="password" id="protect-pass" placeholder="Enter password (e.g. MySecret123)"
                                   class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                        </div>
                    </div>
                    <button id="btn-execute-protect" class="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Lock &amp; Download Protected PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('protect-dropzone');
        const fileInput = document.getElementById('protect-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleProtectFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-protect')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const pass = document.getElementById('protect-pass')?.value || 'protected';
            try {
                this.showToast('Securing document in browser RAM...', 'info');
                const result = await AllToolsEngine.protectPdf(this.uploadedFiles[0], pass);
                PdfHelpers.downloadBytes(result.pdfBytes, `protected_${Date.now()}.pdf`, 'application/pdf');
                this.showToast('Protected PDF secured and downloaded!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleProtectFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('protect-dropzone')?.classList.add('hidden');
        document.getElementById('protect-editor')?.classList.remove('hidden');
        document.getElementById('protect-filename').textContent = file.name;
    }

    // ================= 31. UNLOCK PDF =================
    renderUnlockWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="unlock-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="unlock-file-input" accept=".pdf" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i data-lucide="unlock" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PDF to Unlock</h4>
                        <p class="text-xs text-slate-500">Strip owner restrictions, print blocks, and permission locks locally.</p>
                    </div>
                </div>

                <div id="unlock-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="unlock-filename" class="text-sm font-bold text-slate-800">document.pdf</h4>
                    <div class="max-w-sm space-y-2">
                        <label class="block text-xs font-semibold text-slate-700">Password (Only if document has open-password)</label>
                        <input type="password" id="unlock-pass" placeholder="Leave empty for owner/permission locks"
                               class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                    </div>
                    <button id="btn-execute-unlock" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Strip Restrictions &amp; Download PDF
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('unlock-dropzone');
        const fileInput = document.getElementById('unlock-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handleUnlockFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-unlock')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            const pass = document.getElementById('unlock-pass')?.value || '';
            try {
                this.showToast('Unlocking PDF in browser memory...', 'info');
                const result = await AllToolsEngine.unlockPdf(this.uploadedFiles[0], pass);
                PdfHelpers.downloadBytes(result.pdfBytes, `unlocked_${Date.now()}.pdf`, 'application/pdf');
                this.showToast('Restrictions removed! Downloaded clean PDF.', 'success');
            } catch (err) {
                this.showToast('Unlock failed: Check if password is correct.', 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handleUnlockFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('unlock-dropzone')?.classList.add('hidden');
        document.getElementById('unlock-editor')?.classList.remove('hidden');
        document.getElementById('unlock-filename').textContent = file.name;
    }

    // ================= 32. PPT TO PDF =================
    renderPptToPdfWorkspace(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div id="ppt-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer">
                    <input type="file" id="ppt-file-input" accept=".pptx" class="hidden">
                    <div class="space-y-3 pointer-events-none">
                        <div class="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i data-lucide="presentation" class="w-7 h-7"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-800">Select PowerPoint (.pptx) Presentation</h4>
                        <p class="text-xs text-slate-500">Unzips XML slide text and compiles into a 16:9 presentation PDF.</p>
                    </div>
                </div>

                <div id="ppt-editor" class="hidden p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                    <h4 id="ppt-filename" class="text-sm font-bold text-slate-800">presentation.pptx</h4>
                    <p class="text-xs text-slate-500">Parses slide XML structures directly in browser RAM (0ms server latency).</p>
                    <button id="btn-execute-ppt" class="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition">
                        Convert Slides to PDF &amp; Download
                    </button>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('ppt-dropzone');
        const fileInput = document.getElementById('ppt-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) this.handlePptFile(e.target.files[0]);
        });

        document.getElementById('btn-execute-ppt')?.addEventListener('click', async () => {
            if (!this.uploadedFiles.length) return;
            try {
                this.showToast('Unzipping and parsing PowerPoint slides...', 'info');
                const result = await AllToolsEngine.pptToPdf(this.uploadedFiles[0]);
                PdfHelpers.downloadBytes(result.pdfBytes, `${this.uploadedFiles[0].name.replace(/\.[^/.]+$/, '')}.pdf`, 'application/pdf');
                this.showToast(`Converted ${result.slideCount} slides to PDF!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        this.refreshLucideIcons();
    }

    handlePptFile(file) {
        if (!file) return;
        this.uploadedFiles = [file];
        document.getElementById('ppt-dropzone')?.classList.add('hidden');
        document.getElementById('ppt-editor')?.classList.remove('hidden');
        document.getElementById('ppt-filename').textContent = file.name;
    }

    // ================= GENERIC FALLBACK =================
    renderGenericWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i data-lucide="info" class="w-4 h-4 text-slate-500"></i>
                        <span>${tool.description}</span>
                    </div>
                </div>

                <div id="generic-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="generic-file-input" accept="${tool.accept || '.pdf'}" ${tool.multiple ? 'multiple' : ''} class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="${tool.icon}" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select file for ${tool.name}</h4>
                        <p class="text-xs text-slate-500">Processed locally inside your browser memory. No server upload.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select File
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('generic-dropzone');
        const fileInput = document.getElementById('generic-file-input');
        dropzone?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.showToast(`${tool.name} ready for "${e.target.files[0].name}".`, 'success');
            }
        });

        this.refreshLucideIcons();
    }

    // ================= HISTORY MODAL =================
    openHistoryModal() {
        document.getElementById('modal-history')?.classList.remove('hidden');
        this.renderHistoryList();
    }

    closeHistoryModal() {
        document.getElementById('modal-history')?.classList.add('hidden');
    }

    renderHistoryList() {
        const listEl = document.getElementById('history-list');
        const totalOpsEl = document.getElementById('stat-total-ops');
        const bytesSavedEl = document.getElementById('stat-bytes-saved');

        const history = StorageManager.getHistory();
        const stats = StorageManager.getStats();

        if (totalOpsEl) totalOpsEl.textContent = stats.totalOperations || 0;
        if (bytesSavedEl) bytesSavedEl.textContent = PdfHelpers.formatBytes(stats.totalBytesSaved || 0);

        if (!listEl) return;
        if (history.length === 0) {
            listEl.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">No operations recorded yet.</div>`;
            return;
        }

        listEl.innerHTML = history.map(item => `
            <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                    <div class="font-bold text-slate-800">${item.toolName}</div>
                    <div class="text-[11px] text-slate-500">${item.summary || 'Processed locally'}</div>
                </div>
                <div class="text-right">
                    <span class="font-semibold text-emerald-600">${PdfHelpers.formatDuration(item.durationMs)}</span>
                    <div class="text-[10px] text-slate-400">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `).join('');
    }

    updateHistoryCounter() {
        const badge = document.getElementById('history-counter-badge');
        const history = StorageManager.getHistory();
        if (badge) badge.textContent = history.length;
    }

    // ================= SETTINGS MODAL =================
    openSettingsModal() {
        document.getElementById('modal-settings')?.classList.remove('hidden');
        const settings = StorageManager.getSettings();
        const geminiInput = document.getElementById('input-gemini-key');
        const groqInput = document.getElementById('input-groq-key');
        const ocrInput = document.getElementById('input-ocr-key');
        const workerInput = document.getElementById('input-worker-url');

        if (geminiInput) geminiInput.value = settings.geminiApiKey || '';
        if (groqInput) groqInput.value = settings.groqApiKey || '';
        if (ocrInput) ocrInput.value = settings.ocrSpaceApiKey || '';
        if (workerInput) workerInput.value = settings.cloudflareWorkerUrl || '';
    }

    closeSettingsModal() {
        document.getElementById('modal-settings')?.classList.add('hidden');
    }

    saveSettings() {
        const geminiApiKey = document.getElementById('input-gemini-key')?.value.trim() || '';
        const groqApiKey = document.getElementById('input-groq-key')?.value.trim() || '';
        const ocrSpaceApiKey = document.getElementById('input-ocr-key')?.value.trim() || '';
        const cloudflareWorkerUrl = document.getElementById('input-worker-url')?.value.trim() || '';

        StorageManager.saveSettings({ geminiApiKey, groqApiKey, ocrSpaceApiKey, cloudflareWorkerUrl });
        this.closeSettingsModal();
        this.showToast('Settings saved to browser localStorage', 'success');
    }

    closeAllModals() {
        this.closeHistoryModal();
        this.closeSettingsModal();
    }

    // ================= TOAST NOTIFICATIONS =================
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
        toast.innerHTML = `<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3500);
    }
}

// Instantiate application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.TECHTISApp = new App();
    window.PDFPulseApp = window.TECHTISApp; // backward compatibility
});
