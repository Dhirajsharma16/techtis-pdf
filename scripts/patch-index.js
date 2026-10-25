import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.resolve(__dirname, '../index.html');

let content = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const oldWorkspace = `        <!-- ================= ACTIVE WORKSPACE VIEW ================= -->
        <section id="workspace-view" class="hidden space-y-6">
            <!-- Navigation Back Bar -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                <button id="btn-back-to-catalog" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition group">
                    <i data-lucide="arrow-left" class="w-4 h-4 transition-transform group-hover:-translate-x-1"></i>
                    <span>Back to All Tools</span>
                </button>
                <div id="workspace-badge" class="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                    <span id="workspace-badge-text">100% Client-Side RAM Processing</span>
                </div>
            </div>

            <!-- Tool Header Info -->
            <div class="text-center max-w-2xl mx-auto space-y-2">
                <div id="workspace-icon-wrapper" class="w-14 h-14 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm">
                    <i id="workspace-icon" data-lucide="layers" class="w-7 h-7"></i>
                </div>
                <h2 id="workspace-title" class="text-2xl sm:text-3xl font-extrabold text-slate-900">Merge PDF</h2>
                <p id="workspace-description" class="text-sm text-slate-600">
                    Combine multiple PDF files in any order you choose. Fast, private, and runs entirely in your browser memory.
                </p>
            </div>

            <!-- Workspace Dynamic Body -->
            <div id="workspace-body" class="max-w-4xl mx-auto">
                <!-- Tool-specific UI injected here (Merge, Split, Rotate, AI, etc.) -->
            </div>
        </section>`;

const newWorkspace = `        <!-- ================= ACTIVE WORKSPACE VIEW (Zero-Scroll Above The Fold) ================= -->
        <section id="workspace-view" class="hidden space-y-2.5">
            <!-- Compact Navigation Back Bar -->
            <div class="flex items-center justify-between py-1 px-0.5 border-b border-slate-200/70 text-xs">
                <button id="btn-back-to-catalog" class="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-red-600 transition group">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1"></i>
                    <span>Back to All Tools</span>
                </button>
                <div id="workspace-badge" class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold flex items-center gap-1">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                    <span id="workspace-badge-text">100% In-Browser Privacy</span>
                </div>
            </div>

            <!-- Compact Tool Header Info -->
            <div class="text-center max-w-2xl mx-auto pt-0.5 space-y-0.5">
                <h2 id="workspace-title" class="text-lg sm:text-2xl font-black text-slate-900 tracking-tight inline-flex items-center justify-center gap-2">
                    <span id="workspace-icon-wrapper" class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 text-red-600 inline-flex items-center justify-center shrink-0">
                        <i id="workspace-icon" data-lucide="layers" class="w-4 h-4 sm:w-4.5 sm:h-4.5"></i>
                    </span>
                    <span>Merge PDF</span>
                </h2>
                <p id="workspace-description" class="text-xs text-slate-500 max-w-xl mx-auto line-clamp-1 leading-snug">
                    Combine multiple PDF files in any order you choose. Fast, private, and runs entirely in your browser memory.
                </p>
            </div>

            <!-- Workspace Dynamic Body (Dropzone & Immediate Action Area) -->
            <div id="workspace-body" class="max-w-4xl mx-auto">
                <!-- Tool-specific UI injected here (Merge, Split, Rotate, AI, etc.) -->
            </div>
        </section>`;

if (content.includes(oldWorkspace)) {
    content = content.replace(oldWorkspace, newWorkspace);
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('[Patch] Successfully updated index.html workspace view to zero-scroll layout!');
} else {
    console.warn('[Patch] Could not find oldWorkspace pattern in index.html');
}
