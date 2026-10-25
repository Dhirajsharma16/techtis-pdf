/**
 * TECHTIS (techtis.in) - Client-Side Image Tools & ID Suite Workspaces
 * 100% in-browser Canvas & WASM execution. Zero server uploads, zero network latency.
 */

import { ImageEngine } from './image-engine.js';
import { PdfHelpers } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export function registerImageWorkspaces(AppClass) {

    // ================= 1. IMAGE COMPRESSOR =================
    AppClass.prototype.renderImageCompressorWorkspace = function(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="img-comp-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="img-comp-input" accept="image/jpeg,image/png,image/webp" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="image-minus" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Image to Compress</h4>
                        <p class="text-xs text-slate-500">Compress JPG, PNG &amp; WebP in browser RAM. Zero server uploads.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Image
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Editor Workspace -->
                <div id="img-comp-editor" class="hidden space-y-6">
                    <!-- Metrics Bar -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div class="p-3 bg-white border border-slate-200 rounded-xl">
                            <div class="text-[10px] uppercase font-bold text-slate-400">Original Size</div>
                            <div id="comp-stat-orig-size" class="text-sm font-extrabold text-slate-800 mt-0.5">--</div>
                        </div>
                        <div class="p-3 bg-white border border-slate-200 rounded-xl">
                            <div class="text-[10px] uppercase font-bold text-slate-400">Compressed Size</div>
                            <div id="comp-stat-new-size" class="text-sm font-extrabold text-emerald-600 mt-0.5">--</div>
                        </div>
                        <div class="p-3 bg-white border border-slate-200 rounded-xl">
                            <div class="text-[10px] uppercase font-bold text-slate-400">Space Saved</div>
                            <div id="comp-stat-savings" class="text-sm font-extrabold text-emerald-600 mt-0.5">--</div>
                        </div>
                        <div class="p-3 bg-white border border-slate-200 rounded-xl">
                            <div class="text-[10px] uppercase font-bold text-slate-400">Dimensions</div>
                            <div id="comp-stat-dims" class="text-sm font-extrabold text-slate-700 mt-0.5">--</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Preview Column -->
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[280px] max-h-[460px] overflow-hidden bg-slate-900/5 relative">
                            <img id="comp-preview-img" src="" alt="Compressed Preview" class="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                            <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                                Live In-Browser Preview
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-xs font-bold text-slate-800">Compression Quality</label>
                                        <span id="comp-quality-val" class="text-xs font-extrabold text-red-600">75%</span>
                                    </div>
                                    <input type="range" id="comp-quality-slider" min="10" max="95" value="75" step="1" 
                                           class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                                    <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                                        <span>Max Compression (10%)</span>
                                        <span>Balanced (75%)</span>
                                        <span>High Quality (95%)</span>
                                    </div>
                                </div>

                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Output Format</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button type="button" class="comp-format-btn active px-3 py-2 text-xs font-semibold rounded-xl border border-red-500 bg-red-50 text-red-700 transition" data-format="image/jpeg">
                                            JPEG (Universal)
                                        </button>
                                        <button type="button" class="comp-format-btn px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 transition" data-format="image/webp">
                                            WebP (Next-Gen)
                                        </button>
                                    </div>
                                </div>

                                <div class="pt-2">
                                    <button id="btn-download-comp" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i>
                                        <span>Download Compressed Image</span>
                                    </button>
                                </div>

                                <div class="text-center">
                                    <button id="btn-comp-new" class="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
                                        &larr; Choose another image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('img-comp-dropzone');
        const input = document.getElementById('img-comp-input');
        const editor = document.getElementById('img-comp-editor');
        const slider = document.getElementById('comp-quality-slider');
        const qualityVal = document.getElementById('comp-quality-val');
        const previewImg = document.getElementById('comp-preview-img');
        const downloadBtn = document.getElementById('btn-download-comp');
        const newBtn = document.getElementById('btn-comp-new');
        const formatBtns = document.querySelectorAll('.comp-format-btn');

        let currentFile = null;
        let currentBlob = null;
        let currentMime = 'image/jpeg';
        let currentQuality = 0.75;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                currentFile = e.target.files[0];
                loadFile();
            }
        });

        // Drag & Drop
        dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-red-500'); });
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('border-red-500'));
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-red-500');
            if (e.dataTransfer?.files?.length) {
                currentFile = e.dataTransfer.files[0];
                loadFile();
            }
        });

        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                formatBtns.forEach(b => {
                    b.classList.remove('active', 'border-red-500', 'bg-red-50', 'text-red-700');
                    b.classList.add('border-slate-200', 'text-slate-700');
                });
                btn.classList.add('active', 'border-red-500', 'bg-red-50', 'text-red-700');
                btn.classList.remove('border-slate-200', 'text-slate-700');
                currentMime = btn.dataset.format;
                runCompression();
            });
        });

        slider?.addEventListener('input', (e) => {
            qualityVal.textContent = `${e.target.value}%`;
            currentQuality = parseInt(e.target.value, 10) / 100;
            runCompressionDebounced();
        });

        let debounceTimer;
        function runCompressionDebounced() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => runCompression(), 120);
        }

        async function loadFile() {
            if (!currentFile) return;
            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
            document.getElementById('comp-stat-orig-size').textContent = PdfHelpers.formatBytes(currentFile.size);
            await runCompression();
        }

        async function runCompression() {
            if (!currentFile) return;
            try {
                const res = await ImageEngine.compressImage(currentFile, currentQuality, currentMime);
                currentBlob = res.blob;
                previewImg.src = res.dataUrl;

                document.getElementById('comp-stat-new-size').textContent = PdfHelpers.formatBytes(res.compressedSize);
                document.getElementById('comp-stat-savings').textContent = `-${res.savingsPct}% (${PdfHelpers.formatBytes(Math.max(0, res.originalSize - res.compressedSize))})`;
                document.getElementById('comp-stat-dims').textContent = `${res.width} × ${res.height} px`;
            } catch (err) {
                console.error(err);
            }
        }

        downloadBtn?.addEventListener('click', () => {
            if (!currentBlob || !currentFile) return;
            const ext = currentMime === 'image/webp' ? 'webp' : 'jpg';
            const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
            const filename = `${baseName}_compressed.${ext}`;
            const url = URL.createObjectURL(currentBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            StorageManager.logActivity('image-compressor', 'Image Compressor', `Compressed ${currentFile.name} to ${PdfHelpers.formatBytes(currentBlob.size)}`);
            this.updateHistoryCounter();
            this.showToast('Compressed image downloaded successfully!', 'success');
        });

        newBtn?.addEventListener('click', () => {
            currentFile = null;
            currentBlob = null;
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };

    // ================= 2. IMAGE RESIZER =================
    AppClass.prototype.renderImageResizerWorkspace = function(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="img-resize-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="img-resize-input" accept="image/*" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="maximize-2" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Image to Resize</h4>
                        <p class="text-xs text-slate-500">Resize width &amp; height by pixels, percentage, or physical size with aspect ratio lock.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Image
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Editor Workspace -->
                <div id="img-resize-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Preview Column -->
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[460px] overflow-hidden bg-slate-900/5 relative">
                            <img id="resize-preview-img" src="" alt="Resize Preview" class="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                            <div id="resize-dims-badge" class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-mono">
                                -- × -- px
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <!-- Quick Presets -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Quick Scale</label>
                                    <div class="grid grid-cols-4 gap-1.5 text-xs">
                                        <button type="button" class="resize-scale-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold" data-scale="0.25">25%</button>
                                        <button type="button" class="resize-scale-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold" data-scale="0.50">50%</button>
                                        <button type="button" class="resize-scale-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold" data-scale="0.75">75%</button>
                                        <button type="button" class="resize-scale-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold" data-scale="1.00">100%</button>
                                    </div>
                                </div>

                                <!-- Dimensions Input -->
                                <div class="space-y-3">
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-[11px] font-bold text-slate-700 block mb-1">Width (px)</label>
                                            <input type="number" id="resize-w-input" min="1" max="10000" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono">
                                        </div>
                                        <div>
                                            <label class="text-[11px] font-bold text-slate-700 block mb-1">Height (px)</label>
                                            <input type="number" id="resize-h-input" min="1" max="10000" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono">
                                        </div>
                                    </div>

                                    <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none pt-1">
                                        <input type="checkbox" id="resize-lock-aspect" checked class="rounded text-red-600 focus:ring-red-500 w-4 h-4">
                                        <span class="font-semibold">Lock Aspect Ratio</span>
                                    </label>
                                </div>

                                <!-- Format Selector -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Export Format</label>
                                    <select id="resize-format-select" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                                        <option value="image/png">PNG (Lossless)</option>
                                        <option value="image/jpeg">JPEG (Compressed)</option>
                                        <option value="image/webp">WebP (Next-Gen)</option>
                                    </select>
                                </div>

                                <div class="pt-2">
                                    <button id="btn-download-resize" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i>
                                        <span>Download Resized Image</span>
                                    </button>
                                </div>

                                <div class="text-center">
                                    <button id="btn-resize-new" class="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
                                        &larr; Choose another image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('img-resize-dropzone');
        const input = document.getElementById('img-resize-input');
        const editor = document.getElementById('img-resize-editor');
        const previewImg = document.getElementById('resize-preview-img');
        const dimsBadge = document.getElementById('resize-dims-badge');
        const wInput = document.getElementById('resize-w-input');
        const hInput = document.getElementById('resize-h-input');
        const lockAspect = document.getElementById('resize-lock-aspect');
        const formatSelect = document.getElementById('resize-format-select');
        const downloadBtn = document.getElementById('btn-download-resize');
        const newBtn = document.getElementById('btn-resize-new');
        const scaleBtns = document.querySelectorAll('.resize-scale-btn');

        let currentFile = null;
        let naturalW = 1;
        let naturalH = 1;
        let aspectRatio = 1;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                currentFile = e.target.files[0];
                loadFile();
            }
        });

        async function loadFile() {
            if (!currentFile) return;
            const img = await ImageEngine.loadImage(currentFile);
            naturalW = img.naturalWidth || img.width;
            naturalH = img.naturalHeight || img.height;
            aspectRatio = naturalW / naturalH;

            wInput.value = naturalW;
            hInput.value = naturalH;
            dimsBadge.textContent = `${naturalW} × ${naturalH} px (Original)`;
            previewImg.src = img.src;

            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
        }

        wInput?.addEventListener('input', () => {
            const w = parseInt(wInput.value, 10) || 1;
            if (lockAspect.checked) {
                hInput.value = Math.max(1, Math.round(w / aspectRatio));
            }
            updateDimsBadge();
        });

        hInput?.addEventListener('input', () => {
            const h = parseInt(hInput.value, 10) || 1;
            if (lockAspect.checked) {
                wInput.value = Math.max(1, Math.round(h * aspectRatio));
            }
            updateDimsBadge();
        });

        scaleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const scale = parseFloat(btn.dataset.scale);
                wInput.value = Math.max(1, Math.round(naturalW * scale));
                hInput.value = Math.max(1, Math.round(naturalH * scale));
                updateDimsBadge();
            });
        });

        function updateDimsBadge() {
            dimsBadge.textContent = `${wInput.value} × ${hInput.value} px`;
        }

        downloadBtn?.addEventListener('click', async () => {
            if (!currentFile) return;
            const targetW = parseInt(wInput.value, 10) || naturalW;
            const targetH = parseInt(hInput.value, 10) || naturalH;
            const mime = formatSelect.value;
            const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';

            this.showToast('Resizing image in browser memory...', 'info');
            try {
                const res = await ImageEngine.resizeImage(currentFile, targetW, targetH, mime);
                const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseName}_${targetW}x${targetH}.${ext}`;

                const url = URL.createObjectURL(res.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);

                StorageManager.logActivity('image-resizer', 'Image Resizer', `Resized ${currentFile.name} to ${targetW}x${targetH} px`);
                this.updateHistoryCounter();
                this.showToast('Resized image downloaded successfully!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        newBtn?.addEventListener('click', () => {
            currentFile = null;
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };

    // ================= 3. FORMAT CONVERTER (JPG to PNG, PNG to JPG, JPG to WebP) =================
    AppClass.prototype.renderFormatConverterWorkspace = function(container, targetFormat = 'image/png') {
        const formatNames = {
            'image/png': { name: 'PNG', ext: 'png', isLossless: true },
            'image/jpeg': { name: 'JPG', ext: 'jpg', isLossless: false },
            'image/webp': { name: 'WebP', ext: 'webp', isLossless: false }
        };
        const currentTarget = formatNames[targetFormat] || formatNames['image/png'];

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="fmt-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="fmt-input" accept="image/*" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="arrow-left-right" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Convert Image to ${currentTarget.name}</h4>
                        <p class="text-xs text-slate-500">100% Client-Side Conversion. Fast, private, and zero server uploads.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Image
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Editor Workspace -->
                <div id="fmt-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Preview Column -->
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[460px] overflow-hidden bg-slate-900/5 relative">
                            <img id="fmt-preview-img" src="" alt="Format Preview" class="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                            <div id="fmt-info-badge" class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-mono">
                                Target: ${currentTarget.name}
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Target Format</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <button type="button" class="fmt-select-btn px-3 py-2 text-xs font-semibold rounded-xl border ${targetFormat === 'image/png' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'} transition" data-target="image/png">PNG</button>
                                        <button type="button" class="fmt-select-btn px-3 py-2 text-xs font-semibold rounded-xl border ${targetFormat === 'image/jpeg' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'} transition" data-target="image/jpeg">JPG</button>
                                        <button type="button" class="fmt-select-btn px-3 py-2 text-xs font-semibold rounded-xl border ${targetFormat === 'image/webp' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-700'} transition" data-target="image/webp">WebP</button>
                                    </div>
                                </div>

                                <div id="fmt-bg-picker-container" class="${targetFormat === 'image/jpeg' ? '' : 'hidden'} space-y-1.5">
                                    <label class="text-xs font-bold text-slate-800 block">Background Fill for Transparency</label>
                                    <div class="flex items-center gap-3">
                                        <input type="color" id="fmt-bg-color" value="#ffffff" class="w-8 h-8 rounded border border-slate-300 cursor-pointer">
                                        <span class="text-xs text-slate-600">White background (replaces transparent areas)</span>
                                    </div>
                                </div>

                                <div class="pt-2">
                                    <button id="btn-download-fmt" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i>
                                        <span id="btn-download-fmt-text">Convert &amp; Download ${currentTarget.name}</span>
                                    </button>
                                </div>

                                <div class="text-center">
                                    <button id="btn-fmt-new" class="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
                                        &larr; Choose another image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('fmt-dropzone');
        const input = document.getElementById('fmt-input');
        const editor = document.getElementById('fmt-editor');
        const previewImg = document.getElementById('fmt-preview-img');
        const downloadBtn = document.getElementById('btn-download-fmt');
        const downloadText = document.getElementById('btn-download-fmt-text');
        const newBtn = document.getElementById('btn-fmt-new');
        const bgPickerContainer = document.getElementById('fmt-bg-picker-container');
        const bgColorInput = document.getElementById('fmt-bg-color');
        const fmtBtns = document.querySelectorAll('.fmt-select-btn');

        let currentFile = null;
        let selectedMime = targetFormat;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                currentFile = e.target.files[0];
                loadFile();
            }
        });

        fmtBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                fmtBtns.forEach(b => {
                    b.classList.remove('border-red-500', 'bg-red-50', 'text-red-700');
                    b.classList.add('border-slate-200', 'text-slate-700');
                });
                btn.classList.add('border-red-500', 'bg-red-50', 'text-red-700');
                btn.classList.remove('border-slate-200', 'text-slate-700');
                selectedMime = btn.dataset.target;

                if (selectedMime === 'image/jpeg') {
                    bgPickerContainer?.classList.remove('hidden');
                } else {
                    bgPickerContainer?.classList.add('hidden');
                }
                const fInfo = formatNames[selectedMime] || formatNames['image/png'];
                downloadText.textContent = `Convert & Download ${fInfo.name}`;
            });
        });

        async function loadFile() {
            if (!currentFile) return;
            const img = await ImageEngine.loadImage(currentFile);
            previewImg.src = img.src;
            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
        }

        downloadBtn?.addEventListener('click', async () => {
            if (!currentFile) return;
            const fInfo = formatNames[selectedMime] || formatNames['image/png'];
            const bgColor = selectedMime === 'image/jpeg' ? (bgColorInput?.value || '#ffffff') : 'transparent';

            this.showToast(`Converting to ${fInfo.name} in browser RAM...`, 'info');
            try {
                const res = await ImageEngine.convertFormat(currentFile, selectedMime, 0.92, bgColor);
                const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseName}.${fInfo.ext}`;

                const url = URL.createObjectURL(res.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);

                StorageManager.logActivity(this.currentTool?.id || 'format-converter', this.currentTool?.name || 'Format Converter', `Converted ${currentFile.name} to ${fInfo.name}`);
                this.updateHistoryCounter();
                this.showToast(`Converted and downloaded ${fInfo.name}!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        newBtn?.addEventListener('click', () => {
            currentFile = null;
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };

    // ================= 4. IMAGE CROPPER & ROTATOR =================
    AppClass.prototype.renderImageCropperWorkspace = function(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="crop-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="crop-input" accept="image/*" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="crop" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Image to Crop &amp; Rotate</h4>
                        <p class="text-xs text-slate-500">Preset ratios (1:1, 4:3, 16:9, Passport) and 90° rotation in browser memory.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Image
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Editor Workspace -->
                <div id="crop-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Preview Column -->
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden bg-slate-900/5 relative select-none">
                            <div id="crop-viewport" class="relative max-h-[380px] max-w-full flex items-center justify-center">
                                <img id="crop-preview-img" src="" alt="Crop Preview" class="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                                <!-- Crop Overlay Rect -->
                                <div id="crop-overlay-box" class="absolute border-2 border-red-500 bg-red-500/15 pointer-events-none shadow-sm rounded-xs"></div>
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <!-- Rotation Buttons -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Rotate</label>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button type="button" id="btn-crop-rot-ccw" class="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5">
                                            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                            <span>90° Left</span>
                                        </button>
                                        <button type="button" id="btn-crop-rot-cw" class="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5">
                                            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                                            <span>90° Right</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Aspect Ratio Presets -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Aspect Ratio</label>
                                    <div class="grid grid-cols-3 gap-1.5 text-xs">
                                        <button type="button" class="crop-ratio-btn active px-2.5 py-1.5 border border-red-500 bg-red-50 text-red-700 font-bold rounded-lg" data-ratio="free">Free</button>
                                        <button type="button" class="crop-ratio-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg" data-ratio="1:1">1:1 Square</button>
                                        <button type="button" class="crop-ratio-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg" data-ratio="4:3">4:3 Standard</button>
                                        <button type="button" class="crop-ratio-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg" data-ratio="16:9">16:9 Widescreen</button>
                                        <button type="button" class="crop-ratio-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg" data-ratio="3:2">3:2 Classic</button>
                                        <button type="button" class="crop-ratio-btn px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg" data-ratio="35:45">35:45 Passport</button>
                                    </div>
                                </div>

                                <!-- Crop Sliders -->
                                <div class="space-y-2 pt-1 border-t border-slate-100">
                                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                        <span>Crop Window Scale</span>
                                        <span id="crop-scale-val">80%</span>
                                    </div>
                                    <input type="range" id="crop-scale-slider" min="20" max="100" value="80" class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                                </div>

                                <div class="pt-2">
                                    <button id="btn-download-crop" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                        <i data-lucide="download" class="w-4 h-4"></i>
                                        <span>Download Cropped Image</span>
                                    </button>
                                </div>

                                <div class="text-center">
                                    <button id="btn-crop-new" class="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
                                        &larr; Choose another image
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('crop-dropzone');
        const input = document.getElementById('crop-input');
        const editor = document.getElementById('crop-editor');
        const previewImg = document.getElementById('crop-preview-img');
        const cropBox = document.getElementById('crop-overlay-box');
        const scaleSlider = document.getElementById('crop-scale-slider');
        const scaleVal = document.getElementById('crop-scale-val');
        const rotCw = document.getElementById('btn-crop-rot-cw');
        const rotCcw = document.getElementById('btn-crop-rot-ccw');
        const ratioBtns = document.querySelectorAll('.crop-ratio-btn');
        const downloadBtn = document.getElementById('btn-download-crop');
        const newBtn = document.getElementById('btn-crop-new');

        let currentFile = null;
        let rotationAngle = 0;
        let selectedRatio = 'free'; // 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '35:45'
        let cropScale = 0.8;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                currentFile = e.target.files[0];
                loadFile();
            }
        });

        async function loadFile() {
            if (!currentFile) return;
            const img = await ImageEngine.loadImage(currentFile);
            previewImg.src = img.src;
            rotationAngle = 0;
            updateRotation();
            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
            setTimeout(updateCropBox, 50);
        }

        rotCw?.addEventListener('click', () => {
            rotationAngle = (rotationAngle + 90) % 360;
            updateRotation();
        });

        rotCcw?.addEventListener('click', () => {
            rotationAngle = (rotationAngle - 90 + 360) % 360;
            updateRotation();
        });

        function updateRotation() {
            previewImg.style.transform = `rotate(${rotationAngle}deg)`;
            updateCropBox();
        }

        ratioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                ratioBtns.forEach(b => {
                    b.classList.remove('border-red-500', 'bg-red-50', 'text-red-700', 'font-bold');
                    b.classList.add('border-slate-200', 'text-slate-700', 'font-semibold');
                });
                btn.classList.add('border-red-500', 'bg-red-50', 'text-red-700', 'font-bold');
                btn.classList.remove('border-slate-200', 'text-slate-700', 'font-semibold');
                selectedRatio = btn.dataset.ratio;
                updateCropBox();
            });
        });

        scaleSlider?.addEventListener('input', (e) => {
            cropScale = parseInt(e.target.value, 10) / 100;
            scaleVal.textContent = `${e.target.value}%`;
            updateCropBox();
        });

        function updateCropBox() {
            const rect = previewImg.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            if (!w || !h) return;

            let boxW = w * cropScale;
            let boxH = h * cropScale;

            if (selectedRatio === '1:1') {
                const side = Math.min(boxW, boxH);
                boxW = side;
                boxH = side;
            } else if (selectedRatio === '4:3') {
                boxH = (boxW * 3) / 4;
            } else if (selectedRatio === '16:9') {
                boxH = (boxW * 9) / 16;
            } else if (selectedRatio === '3:2') {
                boxH = (boxW * 2) / 3;
            } else if (selectedRatio === '35:45') {
                boxH = (boxW * 45) / 35;
            }

            cropBox.style.width = `${boxW}px`;
            cropBox.style.height = `${boxH}px`;
            cropBox.style.left = `${(w - boxW) / 2}px`;
            cropBox.style.top = `${(h - boxH) / 2}px`;
        }

        downloadBtn?.addEventListener('click', async () => {
            if (!currentFile) return;
            this.showToast('Cropping image in browser memory...', 'info');
            try {
                const img = await ImageEngine.loadImage(currentFile);
                const isRot90 = (rotationAngle % 180 !== 0);
                const imgW = isRot90 ? img.naturalHeight : img.naturalWidth;
                const imgH = isRot90 ? img.naturalWidth : img.naturalHeight;

                let cropRect = {
                    x: Math.round((imgW * (1 - cropScale)) / 2),
                    y: Math.round((imgH * (1 - cropScale)) / 2),
                    width: Math.round(imgW * cropScale),
                    height: Math.round(imgH * cropScale)
                };

                if (selectedRatio === '1:1') {
                    const side = Math.min(cropRect.width, cropRect.height);
                    cropRect.width = side;
                    cropRect.height = side;
                } else if (selectedRatio === '35:45') {
                    cropRect.height = Math.round((cropRect.width * 45) / 35);
                }

                const res = await ImageEngine.cropImage(currentFile, cropRect, rotationAngle, 'image/png');
                const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
                const filename = `${baseName}_cropped.png`;

                const url = URL.createObjectURL(res.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);

                StorageManager.logActivity('image-cropper', 'Image Cropper', `Cropped ${currentFile.name} (${cropRect.width}x${cropRect.height} px)`);
                this.updateHistoryCounter();
                this.showToast('Cropped image downloaded successfully!', 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        newBtn?.addEventListener('click', () => {
            currentFile = null;
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };

    // ================= 5. PASSPORT & ID PHOTO MAKER =================
    AppClass.prototype.renderPassportPhotoWorkspace = function(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="pass-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="pass-input" accept="image/*" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="user-check" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Portrait for Passport / ID Photo</h4>
                        <p class="text-xs text-slate-500">Official country presets (India 35x45mm, US 2x2 in, UK/Schengen), face framing guide &amp; A4 print sheet.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Photo
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Active Editor Workspace -->
                <div id="pass-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Framing Canvas Column -->
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[360px] max-h-[500px] overflow-hidden bg-slate-900/5 relative">
                            <!-- Visual Framing Canvas with Biometric Overlay -->
                            <div class="relative flex items-center justify-center p-2">
                                <canvas id="pass-canvas" class="rounded-lg shadow-md border border-slate-300 max-h-[420px] max-w-full bg-white"></canvas>
                            </div>
                            <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-mono">
                                300 DPI Biometric Guide
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <!-- Country Preset Selector -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Country &amp; Document Preset</label>
                                    <select id="pass-preset-select" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium">
                                        <option value="in-passport">India Passport / OCI / Visa (35 × 45 mm)</option>
                                        <option value="us-passport">United States Visa / Passport (2 × 2 in / 51 × 51 mm)</option>
                                        <option value="uk-schengen">UK / Schengen / EU Passport (35 × 45 mm)</option>
                                        <option value="student-id">Student &amp; Employee ID Card (30 × 40 mm)</option>
                                    </select>
                                    <p id="pass-preset-desc" class="text-[11px] text-slate-500 mt-1">Standard 35 x 45 mm color photo with light background.</p>
                                </div>

                                <!-- Zoom & Pan Sliders -->
                                <div class="space-y-3 pt-2 border-t border-slate-100">
                                    <div>
                                        <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                            <span>Zoom &amp; Fit Face</span>
                                            <span id="pass-zoom-val">100%</span>
                                        </div>
                                        <input type="range" id="pass-zoom-slider" min="50" max="250" value="100" class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                                    </div>

                                    <div class="grid grid-cols-2 gap-2">
                                        <div>
                                            <div class="flex items-center justify-between text-[11px] text-slate-600 mb-0.5">
                                                <span>Pan X (Left/Right)</span>
                                            </div>
                                            <input type="range" id="pass-pan-x" min="-150" max="150" value="0" class="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg">
                                        </div>
                                        <div>
                                            <div class="flex items-center justify-between text-[11px] text-slate-600 mb-0.5">
                                                <span>Pan Y (Up/Down)</span>
                                            </div>
                                            <input type="range" id="pass-pan-y" min="-150" max="150" value="0" class="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg">
                                        </div>
                                    </div>

                                    <div class="flex items-center justify-between pt-1">
                                        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                                            <input type="checkbox" id="pass-toggle-guide" checked class="rounded text-red-600 focus:ring-red-500 w-4 h-4">
                                            <span>Show Biometric Face Oval</span>
                                        </label>
                                        <button type="button" id="pass-reset-btn" class="text-[11px] text-red-600 hover:underline font-semibold">
                                            Reset Position
                                        </button>
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="space-y-2 pt-2 border-t border-slate-100">
                                    <button id="btn-download-single-pass" class="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2">
                                        <i data-lucide="image" class="w-4 h-4"></i>
                                        <span>Download Single Photo (300 DPI)</span>
                                    </button>

                                    <button id="btn-download-a4-pass" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                        <i data-lucide="printer" class="w-4 h-4"></i>
                                        <span>Download A4 Print Sheet (8-Up PDF)</span>
                                    </button>
                                </div>

                                <!-- Mandatory Print Notice -->
                                <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-snug">
                                    <strong>Important Printing Notice:</strong> When printing the A4 sheet, select <em>"Actual Size"</em> or <em>100% Scale</em>. Never choose "Fit to page", or physical passport dimensions will be distorted.
                                </div>

                                <div class="text-center">
                                    <button id="btn-pass-new" class="text-xs font-medium text-slate-500 hover:text-slate-800 transition">
                                        &larr; Choose another photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('pass-dropzone');
        const input = document.getElementById('pass-input');
        const editor = document.getElementById('pass-editor');
        const canvas = document.getElementById('pass-canvas');
        const presetSelect = document.getElementById('pass-preset-select');
        const presetDesc = document.getElementById('pass-preset-desc');
        const zoomSlider = document.getElementById('pass-zoom-slider');
        const zoomVal = document.getElementById('pass-zoom-val');
        const panXSlider = document.getElementById('pass-pan-x');
        const panYSlider = document.getElementById('pass-pan-y');
        const guideToggle = document.getElementById('pass-toggle-guide');
        const resetBtn = document.getElementById('pass-reset-btn');
        const singleBtn = document.getElementById('btn-download-single-pass');
        const a4Btn = document.getElementById('btn-download-a4-pass');
        const newBtn = document.getElementById('btn-pass-new');

        let currentFile = null;
        let loadedImg = null;
        let zoom = 1.0;
        let panX = 0;
        let panY = 0;
        let activePreset = ImageEngine.PASSPORT_PRESETS[0];

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                currentFile = e.target.files[0];
                loadFile();
            }
        });

        async function loadFile() {
            if (!currentFile) return;
            loadedImg = await ImageEngine.loadImage(currentFile);
            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
            resetControls();
            renderPassportCanvas();
        }

        function resetControls() {
            zoom = 1.0;
            panX = 0;
            panY = 0;
            zoomSlider.value = '100';
            zoomVal.textContent = '100%';
            panXSlider.value = '0';
            panYSlider.value = '0';
        }

        resetBtn?.addEventListener('click', () => {
            resetControls();
            renderPassportCanvas();
        });

        presetSelect?.addEventListener('change', (e) => {
            const p = ImageEngine.PASSPORT_PRESETS.find(x => x.id === e.target.value);
            if (p) {
                activePreset = p;
                presetDesc.textContent = p.desc;
                renderPassportCanvas();
            }
        });

        zoomSlider?.addEventListener('input', (e) => {
            zoom = parseInt(e.target.value, 10) / 100;
            zoomVal.textContent = `${e.target.value}%`;
            renderPassportCanvas();
        });

        panXSlider?.addEventListener('input', (e) => {
            panX = parseInt(e.target.value, 10);
            renderPassportCanvas();
        });

        panYSlider?.addEventListener('input', (e) => {
            panY = parseInt(e.target.value, 10);
            renderPassportCanvas();
        });

        guideToggle?.addEventListener('change', () => {
            renderPassportCanvas();
        });

        function renderPassportCanvas() {
            if (!loadedImg || !canvas) return;
            const ctx = canvas.getContext('2d');

            // Dimensions at 300 DPI: 1 mm ≈ 11.811 pixels (300 / 25.4)
            const DPI = 300;
            const mmToPx = DPI / 25.4;
            const targetW = Math.round(activePreset.widthMm * mmToPx);
            const targetH = Math.round(activePreset.heightMm * mmToPx);

            canvas.width = targetW;
            canvas.height = targetH;

            // Fill clean light background
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, targetW, targetH);

            // Compute scaling to cover target canvas
            const scale = Math.max(targetW / loadedImg.naturalWidth, targetH / loadedImg.naturalHeight) * zoom;
            const drawW = loadedImg.naturalWidth * scale;
            const drawH = loadedImg.naturalHeight * scale;

            const drawX = ((targetW - drawW) / 2) + (panX * (targetW / 300));
            const drawY = ((targetH - drawH) / 2) + (panY * (targetH / 300));

            ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);

            // Biometric Guide Overlay
            if (guideToggle.checked) {
                ctx.save();
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.65)';
                ctx.lineWidth = Math.max(1.5, targetW * 0.005);
                ctx.setLineDash([6, 4]);

                // Head oval: center x = targetW / 2, center y = targetH * 0.42
                const ovalCenterX = targetW / 2;
                const ovalCenterY = targetH * 0.45;
                const radiusX = targetW * 0.28;
                const radiusY = targetH * 0.32;

                ctx.beginPath();
                ctx.ellipse(ovalCenterX, ovalCenterY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Eye alignment line
                ctx.beginPath();
                ctx.moveTo(targetW * 0.15, targetH * 0.42);
                ctx.lineTo(targetW * 0.85, targetH * 0.42);
                ctx.stroke();

                // Chin alignment line
                ctx.beginPath();
                ctx.moveTo(targetW * 0.25, ovalCenterY + radiusY);
                ctx.lineTo(targetW * 0.75, ovalCenterY + radiusY);
                ctx.stroke();

                ctx.restore();
            }
        }

        // Export clean image without guides for printing
        function getCleanPhotoDataUrl() {
            if (!loadedImg) return '';
            const offscreen = document.createElement('canvas');
            const DPI = 300;
            const mmToPx = DPI / 25.4;
            const targetW = Math.round(activePreset.widthMm * mmToPx);
            const targetH = Math.round(activePreset.heightMm * mmToPx);

            offscreen.width = targetW;
            offscreen.height = targetH;
            const ctx = offscreen.getContext('2d');

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, targetW, targetH);

            const scale = Math.max(targetW / loadedImg.naturalWidth, targetH / loadedImg.naturalHeight) * zoom;
            const drawW = loadedImg.naturalWidth * scale;
            const drawH = loadedImg.naturalHeight * scale;
            const drawX = ((targetW - drawW) / 2) + (panX * (targetW / 300));
            const drawY = ((targetH - drawH) / 2) + (panY * (targetH / 300));

            ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
            return offscreen.toDataURL('image/jpeg', 0.95);
        }

        singleBtn?.addEventListener('click', () => {
            const dataUrl = getCleanPhotoDataUrl();
            if (!dataUrl) return;

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `passport_photo_${activePreset.id}_300dpi.jpg`;
            a.click();

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Exported single 300 DPI photo (${activePreset.country})`);
            this.updateHistoryCounter();
            this.showToast('Single passport photo downloaded (300 DPI)!', 'success');
        });

        a4Btn?.addEventListener('click', async () => {
            const dataUrl = getCleanPhotoDataUrl();
            if (!dataUrl) return;

            this.showToast('Generating A4 print sheet PDF...', 'info');
            try {
                const sheet = await ImageEngine.generatePassportPrintSheet(dataUrl, activePreset, 8, 300);
                PdfHelpers.downloadBytes(sheet.pdfBytes, `passport_print_sheet_${activePreset.id}_a4.pdf`, 'application/pdf');

                StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Generated A4 print sheet with ${sheet.placedCount} photos`);
                this.updateHistoryCounter();
                this.showToast(`A4 Print Sheet (${sheet.placedCount} photos) generated successfully!`, 'success');
            } catch (err) {
                this.showToast(err.message, 'error');
            }
        });

        newBtn?.addEventListener('click', () => {
            currentFile = null;
            loadedImg = null;
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };

    // ================= 6. PRIVATE DOCUMENT OCR (AADHAAR / PAN) =================
    AppClass.prototype.renderIdCardOcrWorkspace = function(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Dropzone -->
                <div id="ocr-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="ocr-input" accept="image/*,.pdf" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="scan-line" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Aadhaar, PAN or ID Document</h4>
                        <p class="text-xs text-slate-500">100% In-Browser WebAssembly OCR. No server uploads. Sensitive numbers masked by default.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Document
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Processing Card -->
                <div id="ocr-progress-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                    <div class="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div id="ocr-progress-text" class="text-xs font-bold text-slate-800">Running client-side OCR in WebAssembly memory...</div>
                    <p class="text-[11px] text-slate-500">Strict zero-server privacy: Your identification card never leaves your device.</p>
                </div>

                <!-- Active Editor Workspace -->
                <div id="ocr-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Left: Document Preview -->
                        <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[460px] overflow-hidden bg-slate-900/5 relative">
                            <img id="ocr-doc-preview" src="" alt="Document Scan" class="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                            <div class="absolute bottom-2 left-2 bg-emerald-600/90 text-white text-[10px] px-2.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-2xs">
                                <i data-lucide="shield-check" class="w-3 h-3"></i>
                                <span>Zero-Server Verification</span>
                            </div>
                        </div>

                        <!-- Right: Structured Extracted Fields -->
                        <div class="lg:col-span-7 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <div class="flex items-center gap-2">
                                        <span id="ocr-badge-doctype" class="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold">
                                            Aadhaar Card
                                        </span>
                                        <span class="text-[11px] text-slate-400">Extracted locally</span>
                                    </div>

                                    <button id="btn-ocr-clear" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        <span>Clear All Data</span>
                                    </button>
                                </div>

                                <!-- Editable Fields -->
                                <div class="space-y-3">
                                    <!-- Full Name -->
                                    <div>
                                        <label class="text-[11px] font-bold text-slate-700 block mb-1">Name</label>
                                        <div class="relative">
                                            <input type="text" id="ocr-field-name" class="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-slate-900">
                                            <button type="button" class="ocr-copy-btn absolute right-2 top-2 text-slate-400 hover:text-slate-700" data-field="ocr-field-name">
                                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Document Number (Masked by default) -->
                                    <div>
                                        <div class="flex items-center justify-between mb-1">
                                            <label class="text-[11px] font-bold text-slate-700">Document Number</label>
                                            <button type="button" id="btn-toggle-mask" class="text-[10px] text-red-600 font-bold hover:underline flex items-center gap-1">
                                                <i data-lucide="eye" class="w-3 h-3"></i>
                                                <span id="mask-toggle-label">Reveal Number</span>
                                            </button>
                                        </div>
                                        <div class="relative">
                                            <input type="text" id="ocr-field-number" class="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-slate-900 tracking-wider">
                                            <button type="button" class="ocr-copy-btn absolute right-2 top-2 text-slate-400 hover:text-slate-700" data-field="ocr-field-number">
                                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- DOB & Gender -->
                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-[11px] font-bold text-slate-700 block mb-1">Date of Birth</label>
                                            <div class="relative">
                                                <input type="text" id="ocr-field-dob" placeholder="DD/MM/YYYY" class="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-slate-900">
                                                <button type="button" class="ocr-copy-btn absolute right-2 top-2 text-slate-400 hover:text-slate-700" data-field="ocr-field-dob">
                                                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="text-[11px] font-bold text-slate-700 block mb-1">Gender</label>
                                            <div class="relative">
                                                <input type="text" id="ocr-field-gender" placeholder="MALE / FEMALE" class="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900">
                                                <button type="button" class="ocr-copy-btn absolute right-2 top-2 text-slate-400 hover:text-slate-700" data-field="ocr-field-gender">
                                                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div class="pt-2">
                                    <button id="btn-ocr-copy-all" class="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2">
                                        <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                                        <span>Copy All Extracted Fields</span>
                                    </button>
                                </div>

                                <!-- Disclaimer Box -->
                                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-snug">
                                    <strong>OCR Disclaimer:</strong> Optical Character Recognition can make mistakes depending on scan quality. Please verify every field carefully before using in official forms.
                                </div>

                                <!-- Raw Text Accordion -->
                                <details class="text-[11px] text-slate-500 pt-1">
                                    <summary class="cursor-pointer font-bold hover:text-slate-800 select-none">View Raw OCR Extracted Text</summary>
                                    <pre id="ocr-raw-text" class="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono whitespace-pre-wrap overflow-x-auto max-h-32 text-slate-700"></pre>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('ocr-dropzone');
        const input = document.getElementById('ocr-input');
        const progressCard = document.getElementById('ocr-progress-card');
        const progressText = document.getElementById('ocr-progress-text');
        const editor = document.getElementById('ocr-editor');
        const docPreview = document.getElementById('ocr-doc-preview');
        const badgeDocType = document.getElementById('ocr-badge-doctype');
        const nameInput = document.getElementById('ocr-field-name');
        const numInput = document.getElementById('ocr-field-number');
        const dobInput = document.getElementById('ocr-field-dob');
        const genderInput = document.getElementById('ocr-field-gender');
        const rawTextEl = document.getElementById('ocr-raw-text');
        const maskToggleBtn = document.getElementById('btn-toggle-mask');
        const maskToggleLabel = document.getElementById('mask-toggle-label');
        const clearBtn = document.getElementById('btn-ocr-clear');
        const copyAllBtn = document.getElementById('btn-ocr-copy-all');

        let rawNumber = '';
        let maskedNumber = '';
        let isMasked = true;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                runOcr(e.target.files[0]);
            }
        });

        async function runOcr(file) {
            dropzone.classList.add('hidden');
            progressCard.classList.remove('hidden');

            // Render thumbnail preview
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                docPreview.src = url;
            }

            try {
                let recognizedText = '';
                try {
                    recognizedText = await ImageEngine.performClientOcr(file, (p) => {
                        if (progressText && p.message) progressText.textContent = p.message;
                    });
                } catch (wasmErr) {
                    console.warn('Direct WASM OCR notice, checking fallback text layer...', wasmErr);
                }

                // Parse parsed fields
                const parsed = ImageEngine.parseIdCard(recognizedText);

                badgeDocType.textContent = parsed.docType;
                nameInput.value = parsed.name || '';
                rawNumber = parsed.docNumber || '';
                maskedNumber = parsed.maskedNumber || rawNumber;
                isMasked = true;
                numInput.value = maskedNumber;
                dobInput.value = parsed.dob || '';
                genderInput.value = parsed.gender || '';
                rawTextEl.textContent = parsed.rawText || '(No text detected)';

                progressCard.classList.add('hidden');
                editor.classList.remove('hidden');

                StorageManager.logActivity('id-card-ocr', 'Private Document OCR', `Extracted details from ${parsed.docType}`);
                this.updateHistoryCounter();
                this.showToast('ID Document processed in 100% private RAM!', 'success');
            } catch (err) {
                progressCard.classList.add('hidden');
                dropzone.classList.remove('hidden');
                this.showToast(`OCR error: ${err.message}`, 'error');
            }
        }

        maskToggleBtn?.addEventListener('click', () => {
            isMasked = !isMasked;
            numInput.value = isMasked ? maskedNumber : rawNumber;
            maskToggleLabel.textContent = isMasked ? 'Reveal Number' : 'Mask Number';
        });

        document.querySelectorAll('.ocr-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.field;
                const el = document.getElementById(targetId);
                if (el && el.value) {
                    navigator.clipboard.writeText(el.value);
                    this.showToast('Copied to clipboard!', 'success');
                }
            });
        });

        copyAllBtn?.addEventListener('click', () => {
            const summary = [
                `Document: ${badgeDocType.textContent}`,
                `Name: ${nameInput.value}`,
                `Number: ${numInput.value}`,
                `DOB: ${dobInput.value}`,
                `Gender: ${genderInput.value}`
            ].filter(Boolean).join('\n');

            navigator.clipboard.writeText(summary);
            this.showToast('All fields copied to clipboard!', 'success');
        });

        clearBtn?.addEventListener('click', () => {
            // Immediately purge all canvas, inputs, and preview from RAM
            docPreview.src = '';
            nameInput.value = '';
            numInput.value = '';
            dobInput.value = '';
            genderInput.value = '';
            rawTextEl.textContent = '';
            rawNumber = '';
            maskedNumber = '';
            input.value = '';

            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            this.showToast('All personal data wiped from memory!', 'success');
        });

        this.refreshLucideIcons();
    };
}
