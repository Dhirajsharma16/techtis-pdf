/**
 * TECHTIS (techtis.in) - Client-Side Image Tools, ID Suite & Universal Form Assistant Workspaces
 * 100% in-browser Canvas, WebAssembly & PDF.js execution. Zero server uploads.
 */

import { ImageEngine } from './image-engine.js';
import { PdfHelpers } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';
import { EdgeAIBridge } from '../edge/ai-bridge.js';

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
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[460px] overflow-hidden bg-slate-900/5 relative">
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

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
            };
            reader.readAsDataURL(currentFile);

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
            previewImg.src = img._dataUrl || img.src;

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
            previewImg.src = img._dataUrl || img.src;
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
                                <div id="crop-overlay-box" class="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none shadow-sm rounded-xs"></div>
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
        let selectedRatio = 'free';
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
            previewImg.src = img._dataUrl || img.src;
            rotationAngle = 0;
            updateRotation();
            dropzone.classList.add('hidden');
            editor.classList.remove('hidden');
            setTimeout(updateCropBox, 60);
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

    // ================= 5. PASSPORT & ID PHOTO MAKER (DRAG-TO-PAN + ROTATE UPGRADES) =================
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
                        <p class="text-xs text-slate-500">Official country presets (India 35x45mm, US 2x2 in, UK/Schengen), interactive drag-to-fit, face framing guide &amp; A4 print sheet.</p>
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
                        <div class="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[380px] max-h-[520px] overflow-hidden bg-slate-900/5 relative select-none">
                            <div class="relative flex items-center justify-center p-2">
                                <canvas id="pass-canvas" class="rounded-lg shadow-md border border-slate-300 max-h-[440px] max-w-full bg-white cursor-grab active:cursor-grabbing"></canvas>
                            </div>
                            <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-mono flex items-center gap-1.5">
                                <i data-lucide="move" class="w-3 h-3 text-red-400"></i>
                                <span>Click &amp; Drag on Photo to Re-Center &bull; Scroll to Zoom</span>
                            </div>
                        </div>

                        <!-- Controls Column -->
                        <div class="lg:col-span-5 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <!-- Preset Selector -->
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

                                <!-- Rotation & Orientation Fix -->
                                <div>
                                    <label class="text-xs font-bold text-slate-800 block mb-1.5">Photo Orientation Fix</label>
                                    <div class="grid grid-cols-3 gap-1.5 text-xs">
                                        <button type="button" id="pass-rot-ccw" class="px-2.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1">
                                            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                            <span>90° Left</span>
                                        </button>
                                        <button type="button" id="pass-rot-cw" class="px-2.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1">
                                            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                                            <span>90° Right</span>
                                        </button>
                                        <button type="button" id="pass-flip-h" class="px-2.5 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1">
                                            <i data-lucide="flip-horizontal" class="w-3.5 h-3.5"></i>
                                            <span>Mirror</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Zoom & Pan Controls -->
                                <div class="space-y-3 pt-2 border-t border-slate-100">
                                    <div>
                                        <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                            <span>Zoom &amp; Fit Face</span>
                                            <span id="pass-zoom-val" class="font-bold text-red-600">100%</span>
                                        </div>
                                        <input type="range" id="pass-zoom-slider" min="30" max="350" value="100" class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                                    </div>

                                    <div class="flex items-center justify-between pt-1">
                                        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                                            <input type="checkbox" id="pass-toggle-guide" checked class="rounded text-red-600 focus:ring-red-500 w-4 h-4">
                                            <span>Show Biometric Face Oval Guide</span>
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

                                <!-- Printing Notice -->
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
        const guideToggle = document.getElementById('pass-toggle-guide');
        const resetBtn = document.getElementById('pass-reset-btn');
        const rotCwBtn = document.getElementById('pass-rot-cw');
        const rotCcwBtn = document.getElementById('pass-rot-ccw');
        const flipHBtn = document.getElementById('pass-flip-h');
        const singleBtn = document.getElementById('btn-download-single-pass');
        const a4Btn = document.getElementById('btn-download-a4-pass');
        const newBtn = document.getElementById('btn-pass-new');

        let currentFile = null;
        let loadedImg = null;
        let zoom = 1.0;
        let panX = 0;
        let panY = 0;
        let rotationAngle = 0;
        let isFlippedH = false;
        let activePreset = ImageEngine.PASSPORT_PRESETS[0];

        // Drag-to-pan states
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;

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
            rotationAngle = 0;
            isFlippedH = false;
            zoomSlider.value = '100';
            zoomVal.textContent = '100%';
        }

        resetBtn?.addEventListener('click', () => {
            resetControls();
            renderPassportCanvas();
        });

        rotCwBtn?.addEventListener('click', () => {
            rotationAngle = (rotationAngle + 90) % 360;
            renderPassportCanvas();
        });

        rotCcwBtn?.addEventListener('click', () => {
            rotationAngle = (rotationAngle - 90 + 360) % 360;
            renderPassportCanvas();
        });

        flipHBtn?.addEventListener('click', () => {
            isFlippedH = !isFlippedH;
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

        // Mouse Wheel Zoom on Canvas
        canvas?.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            zoom = Math.max(0.3, Math.min(3.5, zoom + delta));
            zoomSlider.value = Math.round(zoom * 100);
            zoomVal.textContent = `${Math.round(zoom * 100)}%`;
            renderPassportCanvas();
        }, { passive: false });

        // Direct Mouse Drag-to-Pan on Canvas
        canvas?.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX - panX;
            dragStartY = e.clientY - panY;
            canvas.classList.add('cursor-grabbing');
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - dragStartX;
            panY = e.clientY - dragStartY;
            renderPassportCanvas();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                canvas?.classList.remove('cursor-grabbing');
            }
        });

        // Touch Drag for Mobile / Tablets
        canvas?.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                dragStartX = e.touches[0].clientX - panX;
                dragStartY = e.touches[0].clientY - panY;
            }
        }, { passive: true });

        canvas?.addEventListener('touchmove', (e) => {
            if (!isDragging || e.touches.length !== 1) return;
            panX = e.touches[0].clientX - dragStartX;
            panY = e.touches[0].clientY - dragStartY;
            renderPassportCanvas();
        }, { passive: true });

        canvas?.addEventListener('touchend', () => {
            isDragging = false;
        });

        guideToggle?.addEventListener('change', () => {
            renderPassportCanvas();
        });

        function renderPassportCanvas() {
            if (!loadedImg || !canvas) return;
            const ctx = canvas.getContext('2d');

            const DPI = 300;
            const mmToPx = DPI / 25.4;
            const targetW = Math.round(activePreset.widthMm * mmToPx);
            const targetH = Math.round(activePreset.heightMm * mmToPx);

            canvas.width = targetW;
            canvas.height = targetH;

            // Background
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, targetW, targetH);

            ctx.save();
            // Center of canvas
            ctx.translate((targetW / 2) + panX, (targetH / 2) + panY);
            ctx.rotate((rotationAngle * Math.PI) / 180);
            if (isFlippedH) ctx.scale(-1, 1);

            // Compute scaling
            const isRot90 = (rotationAngle % 180 !== 0);
            const naturalW = isRot90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
            const naturalH = isRot90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

            const scale = Math.max(targetW / naturalW, targetH / naturalH) * zoom;
            const drawW = loadedImg.naturalWidth * scale;
            const drawH = loadedImg.naturalHeight * scale;

            ctx.drawImage(loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();

            // Biometric Guide Overlay
            if (guideToggle.checked) {
                ctx.save();
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.75)';
                ctx.lineWidth = Math.max(2, targetW * 0.006);
                ctx.setLineDash([8, 5]);

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

            ctx.save();
            ctx.translate((targetW / 2) + panX, (targetH / 2) + panY);
            ctx.rotate((rotationAngle * Math.PI) / 180);
            if (isFlippedH) ctx.scale(-1, 1);

            const isRot90 = (rotationAngle % 180 !== 0);
            const naturalW = isRot90 ? loadedImg.naturalHeight : loadedImg.naturalWidth;
            const naturalH = isRot90 ? loadedImg.naturalWidth : loadedImg.naturalHeight;

            const scale = Math.max(targetW / naturalW, targetH / naturalH) * zoom;
            const drawW = loadedImg.naturalWidth * scale;
            const drawH = loadedImg.naturalHeight * scale;

            ctx.drawImage(loadedImg, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();

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

    // ================= 6. PRIVATE DOCUMENT OCR (AADHAAR, PAN, PASSPORT & MORE) =================
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
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Select Document or ID Photo (Image or PDF)</h4>
                        <p class="text-xs text-slate-500">100% In-Browser WebAssembly OCR. Extracts Name, Email, Phone, DOB, ID numbers &amp; Address with 1-click copy.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Document / ID
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Processing Card -->
                <div id="ocr-progress-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                    <div class="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div id="ocr-progress-text" class="text-xs font-bold text-slate-800">Running client-side OCR in WebAssembly memory...</div>
                    <p class="text-[11px] text-slate-500">Strict zero-server privacy: Your document never leaves your browser RAM.</p>
                </div>

                <!-- Active Editor Workspace -->
                <div id="ocr-editor" class="hidden space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Left: Document Preview -->
                        <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] max-h-[480px] overflow-hidden bg-slate-900/5 relative">
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
                                            ID Document
                                        </span>
                                        <span class="text-[11px] text-slate-400">Extracted locally</span>
                                    </div>

                                    <button id="btn-ocr-clear" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                        <span>Clear All Data</span>
                                    </button>
                                </div>

                                <!-- Dynamic Field List -->
                                <div id="ocr-fields-container" class="space-y-3">
                                    <!-- Rendered dynamically with Copy Buttons -->
                                </div>

                                <!-- Actions -->
                                <div class="pt-2">
                                    <button id="btn-ocr-copy-all" class="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2">
                                        <i data-lucide="clipboard-check" class="w-4 h-4"></i>
                                        <span>Copy All Extracted Fields</span>
                                    </button>
                                </div>

                                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-snug">
                                    <strong>OCR Disclaimer:</strong> Optical Character Recognition accuracy depends on scan resolution and lighting. Please verify all extracted details before use.
                                </div>

                                <details class="text-[11px] text-slate-500 pt-1">
                                    <summary class="cursor-pointer font-bold hover:text-slate-800 select-none">View Raw Extracted Text</summary>
                                    <pre id="ocr-raw-text" class="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono whitespace-pre-wrap overflow-x-auto max-h-36 text-slate-700"></pre>
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
        const fieldsContainer = document.getElementById('ocr-fields-container');
        const rawTextEl = document.getElementById('ocr-raw-text');
        const clearBtn = document.getElementById('btn-ocr-clear');
        const copyAllBtn = document.getElementById('btn-ocr-copy-all');

        let currentExtracted = null;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                runOcr(e.target.files[0]);
            }
        });

        async function runOcr(file) {
            dropzone.classList.add('hidden');
            progressCard.classList.remove('hidden');

            let recognizedText = '';

            try {
                if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                    // PDF Document
                    if (progressText) progressText.textContent = 'Rendering PDF and extracting document text layer...';
                    const pdfResult = await EdgeAIBridge.extractTextFromPdf(file);
                    recognizedText = pdfResult.text || '';

                    // Also render first page thumbnail
                    try {
                        const pdfCanvas = await ImageEngine.renderPdfToCanvas(file, 1);
                        docPreview.src = pdfCanvas.dataUrl;

                        // If PDF had very little embedded text, run WASM OCR on rendered canvas!
                        if (recognizedText.trim().length < 20) {
                            if (progressText) progressText.textContent = 'Running WASM OCR on scanned PDF page...';
                            const ocrText = await ImageEngine.performClientOcr(pdfCanvas.canvas);
                            if (ocrText && ocrText.trim()) recognizedText = ocrText;
                        }
                    } catch (e) {
                        console.warn('PDF canvas render note:', e);
                    }
                } else {
                    // Image File
                    const img = await ImageEngine.loadImage(file);
                    docPreview.src = img._dataUrl || img.src;

                    if (progressText) progressText.textContent = 'Analyzing image with client-side WebAssembly OCR...';
                    recognizedText = await ImageEngine.performClientOcr(file, (p) => {
                        if (progressText && p.message) progressText.textContent = p.message;
                    });
                }

                currentExtracted = ImageEngine.extractAllDocumentFields(recognizedText);
                badgeDocType.textContent = currentExtracted.docType;
                rawTextEl.textContent = currentExtracted.rawText || '(No text detected)';

                renderFieldInputs(currentExtracted);

                progressCard.classList.add('hidden');
                editor.classList.remove('hidden');

                StorageManager.logActivity('id-card-ocr', 'Private Document OCR', `Extracted details from ${currentExtracted.docType}`);
                this.updateHistoryCounter();
                this.showToast('Document processed locally in 100% private RAM!', 'success');
            } catch (err) {
                progressCard.classList.add('hidden');
                dropzone.classList.remove('hidden');
                this.showToast(`OCR error: ${err.message}`, 'error');
            }
        }

        function renderFieldInputs(extracted) {
            fieldsContainer.innerHTML = '';

            const fields = [
                { key: 'name', label: 'Full Name', value: extracted.name, placeholder: 'Candidate / Full Name' },
                { key: 'email', label: 'Email Address', value: extracted.email, placeholder: 'name@example.com' },
                { key: 'phone', label: 'Phone / Mobile', value: extracted.phone, placeholder: '9876543210' },
                { key: 'idNumber', label: `${extracted.docType} Number`, value: extracted.idNumber, placeholder: 'Identification Number', isMaskable: true },
                { key: 'dob', label: 'Date of Birth', value: extracted.dob, placeholder: 'DD/MM/YYYY' },
                { key: 'gender', label: 'Gender', value: extracted.gender, placeholder: 'MALE / FEMALE' },
                { key: 'fatherName', label: "Father / Guardian's Name", value: extracted.fatherName, placeholder: 'Father or Guardian name' },
                { key: 'pincode', label: 'PIN / Postal Code', value: extracted.pincode, placeholder: '6-digit PIN' },
                { key: 'address', label: 'Full Address', value: extracted.address, placeholder: 'Street, City, State' }
            ].filter(f => f.value || f.key === 'name' || f.key === 'idNumber');

            fields.forEach(f => {
                const row = document.createElement('div');
                row.className = 'space-y-1';
                row.innerHTML = `
                    <div class="flex items-center justify-between">
                        <label class="text-[11px] font-bold text-slate-700">${f.label}</label>
                        ${f.isMaskable && f.value ? `
                            <button type="button" class="btn-toggle-mask text-[10px] text-red-600 font-bold hover:underline flex items-center gap-1" data-val="${f.value}" data-masked="${extracted.maskedIdNumber}">
                                <i data-lucide="eye" class="w-3 h-3"></i>
                                <span>Reveal</span>
                            </button>
                        ` : ''}
                    </div>
                    <div class="relative">
                        <input type="text" id="field-${f.key}" value="${f.isMaskable ? (extracted.maskedIdNumber || f.value) : f.value}" placeholder="${f.placeholder}"
                               class="w-full pl-3 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-900 bg-white">
                        <button type="button" class="btn-copy-field absolute right-2 top-2 text-slate-400 hover:text-red-600 transition" title="Copy ${f.label}">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                `;

                const copyBtn = row.querySelector('.btn-copy-field');
                const inputEl = row.querySelector('input');
                copyBtn?.addEventListener('click', () => {
                    if (inputEl && inputEl.value) {
                        navigator.clipboard.writeText(inputEl.value);
                        copyBtn.classList.add('text-emerald-600');
                        setTimeout(() => copyBtn.classList.remove('text-emerald-600'), 1500);
                        this.showToast(`Copied ${f.label}!`, 'success');
                    }
                });

                const maskBtn = row.querySelector('.btn-toggle-mask');
                if (maskBtn) {
                    let masked = true;
                    maskBtn.addEventListener('click', () => {
                        masked = !masked;
                        inputEl.value = masked ? maskBtn.dataset.masked : maskBtn.dataset.val;
                        maskBtn.querySelector('span').textContent = masked ? 'Reveal' : 'Mask';
                    });
                }

                fieldsContainer.appendChild(row);
            });

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        copyAllBtn?.addEventListener('click', () => {
            const inputs = fieldsContainer.querySelectorAll('input');
            const lines = [];
            inputs.forEach(inp => {
                if (inp.value && inp.value.trim()) {
                    const label = inp.closest('.space-y-1')?.querySelector('label')?.textContent || 'Field';
                    lines.push(`${label}: ${inp.value.trim()}`);
                }
            });
            navigator.clipboard.writeText(lines.join('\n'));
            this.showToast('All fields copied to clipboard!', 'success');
        });

        clearBtn?.addEventListener('click', () => {
            docPreview.src = '';
            fieldsContainer.innerHTML = '';
            rawTextEl.textContent = '';
            currentExtracted = null;
            input.value = '';
            editor.classList.add('hidden');
            dropzone.classList.remove('hidden');
            this.showToast('All extracted data purged from browser memory!', 'success');
        });

        this.refreshLucideIcons();
    };

    // ================= 7. NEW TOOL: "FILL FORM" (UNIVERSAL OCR ASSISTANT WITH DOCK-TO-SIDE) =================
    AppClass.prototype.renderFillFormWorkspace = function(container) {
        container.innerHTML = `
            <div id="fill-form-main-container" class="space-y-6">
                <!-- Dropzone -->
                <div id="ff-dropzone" class="dropzone p-8 sm:p-12 rounded-3xl text-center cursor-pointer relative group">
                    <input type="file" id="ff-input" accept="image/*,.pdf" class="hidden">
                    <div class="max-w-md mx-auto space-y-3 pointer-events-none">
                        <div class="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                            <i data-lucide="clipboard-paste" class="w-8 h-8"></i>
                        </div>
                        <h4 class="text-base sm:text-lg font-bold text-slate-800">Upload Image or PDF to Fill Any Form</h4>
                        <p class="text-xs text-slate-500">Upload Aadhaar, PAN, Passport, Resume, Marks, or Docs. Extracts all fields with 1-click copy &amp; floating side assistant.</p>
                        <div class="pt-2">
                            <button type="button" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition pointer-events-auto">
                                Select Image or PDF
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Processing Card -->
                <div id="ff-progress-card" class="hidden p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
                    <div class="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div id="ff-progress-text" class="text-xs font-bold text-slate-800">Reading document and parsing all form fields...</div>
                    <p class="text-[11px] text-slate-500">100% In-Browser RAM execution. Zero data leaves your device.</p>
                </div>

                <!-- Active Editor Workspace -->
                <div id="ff-editor" class="hidden space-y-6">
                    <!-- Top Action Bar -->
                    <div class="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                        <div class="flex items-center gap-3">
                            <span id="ff-doc-badge" class="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                <i data-lucide="file-check" class="w-3.5 h-3.5"></i>
                                <span id="ff-doc-type-text">Document</span>
                            </span>
                            <span class="text-xs text-slate-500" id="ff-fields-count">0 fields extracted</span>
                        </div>

                        <div class="flex items-center gap-2 w-full sm:w-auto">
                            <!-- Game-changing Dock-to-Side Button -->
                            <button id="btn-ff-dock" class="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2">
                                <i data-lucide="panel-right" class="w-4 h-4"></i>
                                <span>Dock to Side (Fill Any Form)</span>
                            </button>

                            <button id="btn-ff-copy-all" class="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                                <span>Copy All</span>
                            </button>

                            <button id="btn-ff-reset" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition">
                                New File
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <!-- Left Column: Document Preview -->
                        <div class="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[320px] max-h-[500px] overflow-hidden bg-slate-900/5 relative">
                            <img id="ff-preview-img" src="" alt="Document Preview" class="max-h-[420px] w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200">
                            <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded font-mono flex items-center gap-1">
                                <i data-lucide="shield-check" class="w-3 h-3 text-emerald-400"></i>
                                <span>100% Client-Side Private</span>
                            </div>
                        </div>

                        <!-- Right Column: Extracted Cards & 1-Click Copy -->
                        <div class="lg:col-span-7 space-y-4">
                            <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <i data-lucide="list" class="w-4 h-4 text-red-600"></i>
                                        <span>Extracted Form Fields</span>
                                    </h3>
                                    <span class="text-[11px] text-slate-400">Click icon or value to copy</span>
                                </div>

                                <div id="ff-cards-list" class="space-y-2.5">
                                    <!-- Rendered dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DOCKED SIDEBAR ASSISTANT OVERLAY (ACTIVATES ON "DOCK TO SIDE") -->
                <div id="ff-docked-sidebar" class="hidden fixed top-0 right-0 h-screen w-96 bg-white border-l border-slate-300 shadow-2xl z-50 flex flex-col animate-slide-left">
                    <!-- Dock Header -->
                    <div class="p-3.5 bg-slate-900 text-white flex items-center justify-between shadow-xs">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                                <i data-lucide="clipboard-paste" class="w-3.5 h-3.5"></i>
                            </div>
                            <span class="text-xs font-bold tracking-tight">TECHTIS Form Assistant</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button id="btn-ff-undock" class="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Expand Fullscreen">
                                <i data-lucide="maximize-2" class="w-4 h-4"></i>
                            </button>
                            <button id="btn-ff-close-dock" class="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Close">
                                <i data-lucide="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Search Input inside Dock -->
                    <div class="p-2.5 border-b border-slate-200 bg-slate-50">
                        <div class="relative">
                            <input type="text" id="ff-dock-search" placeholder="Filter fields (e.g. pan, dob, phone)..."
                                   class="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400"></i>
                        </div>
                    </div>

                    <!-- Scrollable Field List with 1-Click Copy -->
                    <div id="ff-dock-fields" class="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                        <!-- Populated dynamically -->
                    </div>

                    <!-- Dock Footer with Portal Quick Links -->
                    <div class="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                        <div class="text-[10px] uppercase font-bold text-slate-500">Open Target Form:</div>
                        <div class="flex flex-wrap gap-1.5 text-[11px]">
                            <a href="https://passportindia.gov.in" target="_blank" rel="noopener" class="px-2 py-0.5 bg-white border border-slate-200 rounded hover:border-red-500 hover:text-red-600 transition">Passport Seva</a>
                            <a href="https://www.incometax.gov.in" target="_blank" rel="noopener" class="px-2 py-0.5 bg-white border border-slate-200 rounded hover:border-red-500 hover:text-red-600 transition">Income Tax</a>
                            <a href="https://unifiedportal-mem.epfindia.gov.in" target="_blank" rel="noopener" class="px-2 py-0.5 bg-white border border-slate-200 rounded hover:border-red-500 hover:text-red-600 transition">EPFO</a>
                            <a href="https://docs.google.com/forms" target="_blank" rel="noopener" class="px-2 py-0.5 bg-white border border-slate-200 rounded hover:border-red-500 hover:text-red-600 transition">Google Forms</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = document.getElementById('ff-dropzone');
        const input = document.getElementById('ff-input');
        const progressCard = document.getElementById('ff-progress-card');
        const progressText = document.getElementById('ff-progress-text');
        const editor = document.getElementById('ff-editor');
        const previewImg = document.getElementById('ff-preview-img');
        const docTypeText = document.getElementById('ff-doc-type-text');
        const fieldsCount = document.getElementById('ff-fields-count');
        const cardsList = document.getElementById('ff-cards-list');
        const dockBtn = document.getElementById('btn-ff-dock');
        const copyAllBtn = document.getElementById('btn-ff-copy-all');
        const resetBtn = document.getElementById('btn-ff-reset');
        const dockedSidebar = document.getElementById('ff-docked-sidebar');
        const undockBtn = document.getElementById('btn-ff-undock');
        const closeDockBtn = document.getElementById('btn-ff-close-dock');
        const dockSearch = document.getElementById('ff-dock-search');
        const dockFieldsList = document.getElementById('ff-dock-fields');

        let currentExtracted = null;

        dropzone?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                runUniversalExtraction(e.target.files[0]);
            }
        });

        async function runUniversalExtraction(file) {
            dropzone.classList.add('hidden');
            progressCard.classList.remove('hidden');

            let extractedText = '';

            try {
                if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
                    if (progressText) progressText.textContent = 'Extracting PDF text layer & rendering page preview...';
                    const pdfRes = await EdgeAIBridge.extractTextFromPdf(file);
                    extractedText = pdfRes.text || '';

                    try {
                        const pdfCanvas = await ImageEngine.renderPdfToCanvas(file, 1);
                        previewImg.src = pdfCanvas.dataUrl;

                        if (extractedText.trim().length < 25) {
                            if (progressText) progressText.textContent = 'Running WASM OCR on scanned PDF pages...';
                            const ocrText = await ImageEngine.performClientOcr(pdfCanvas.canvas);
                            if (ocrText && ocrText.trim()) extractedText = ocrText;
                        }
                    } catch (_) {}
                } else {
                    const img = await ImageEngine.loadImage(file);
                    previewImg.src = img._dataUrl || img.src;

                    if (progressText) progressText.textContent = 'Running client-side WebAssembly OCR...';
                    extractedText = await ImageEngine.performClientOcr(file, (p) => {
                        if (progressText && p.message) progressText.textContent = p.message;
                    });
                }

                currentExtracted = ImageEngine.extractAllDocumentFields(extractedText);
                docTypeText.textContent = currentExtracted.docType;
                fieldsCount.textContent = `${currentExtracted.allFields.length} fields detected`;

                renderCards(currentExtracted);
                renderDockFields(currentExtracted.allFields);

                progressCard.classList.add('hidden');
                editor.classList.remove('hidden');

                StorageManager.logActivity('fill-form', 'Fill Form Assistant', `Extracted ${currentExtracted.allFields.length} fields from ${currentExtracted.docType}`);
                this.updateHistoryCounter();
                this.showToast('All fields extracted! Ready to fill forms.', 'success');
            } catch (err) {
                progressCard.classList.add('hidden');
                dropzone.classList.remove('hidden');
                this.showToast(`Error: ${err.message}`, 'error');
            }
        }

        function renderCards(extracted) {
            cardsList.innerHTML = '';
            const fields = extracted.allFields;

            if (fields.length === 0) {
                cardsList.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">No structured fields detected. Try uploading a clearer document.</div>';
                return;
            }

            fields.forEach(f => {
                const card = document.createElement('div');
                card.className = 'p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition';
                card.innerHTML = `
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <i data-lucide="${f.icon || 'file-text'}" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="text-[10px] uppercase font-bold text-slate-400">${f.label}</div>
                            <input type="text" value="${f.value}" class="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-red-400 rounded px-1 py-0.5 truncate w-full">
                        </div>
                    </div>
                    <button type="button" class="btn-copy-card px-3 py-1.5 bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 rounded-lg text-xs font-semibold text-slate-700 transition flex items-center gap-1 shrink-0">
                        <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        <span>Copy</span>
                    </button>
                `;

                const copyBtn = card.querySelector('.btn-copy-card');
                const inp = card.querySelector('input');
                copyBtn?.addEventListener('click', () => {
                    navigator.clipboard.writeText(inp.value);
                    copyBtn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i><span class="text-emerald-600 font-bold">Copied!</span>';
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>';
                        if (window.lucide) window.lucide.createIcons();
                    }, 1500);
                });

                cardsList.appendChild(card);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        function renderDockFields(fields, filterQuery = '') {
            dockFieldsList.innerHTML = '';
            const filtered = filterQuery 
                ? fields.filter(f => f.label.toLowerCase().includes(filterQuery) || f.value.toLowerCase().includes(filterQuery))
                : fields;

            if (filtered.length === 0) {
                dockFieldsList.innerHTML = '<div class="p-4 text-center text-slate-400">No matching fields</div>';
                return;
            }

            filtered.forEach(f => {
                const item = document.createElement('div');
                item.className = 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-red-400 transition cursor-pointer group';
                item.innerHTML = `
                    <div class="flex items-center justify-between mb-0.5">
                        <span class="text-[10px] font-bold text-slate-500 uppercase">${f.label}</span>
                        <span class="text-[10px] text-red-600 group-hover:underline font-semibold flex items-center gap-0.5">
                            <i data-lucide="copy" class="w-3 h-3"></i> Copy
                        </span>
                    </div>
                    <div class="text-xs font-semibold text-slate-800 break-all select-all">${f.value}</div>
                `;

                item.addEventListener('click', () => {
                    navigator.clipboard.writeText(f.value);
                    const label = item.querySelector('.text-red-600');
                    if (label) {
                        label.innerHTML = '<i data-lucide="check" class="w-3 h-3 text-emerald-600"></i> Copied!';
                        setTimeout(() => {
                            label.innerHTML = '<i data-lucide="copy" class="w-3 h-3"></i> Copy';
                            if (window.lucide) window.lucide.createIcons();
                        }, 1200);
                    }
                });

                dockFieldsList.appendChild(item);
            });

            if (window.lucide) window.lucide.createIcons();
        }

        dockSearch?.addEventListener('input', (e) => {
            if (currentExtracted) {
                renderDockFields(currentExtracted.allFields, e.target.value.toLowerCase().trim());
            }
        });

        // Activate Docked Sidebar Mode
        dockBtn?.addEventListener('click', () => {
            dockedSidebar?.classList.remove('hidden');
            this.showToast('Form Assistant docked to right! You can now browse any site and 1-click copy fields.', 'info');
        });

        undockBtn?.addEventListener('click', () => {
            dockedSidebar?.classList.add('hidden');
        });

        closeDockBtn?.addEventListener('click', () => {
            dockedSidebar?.classList.add('hidden');
        });

        copyAllBtn?.addEventListener('click', () => {
            if (!currentExtracted || !currentExtracted.allFields) return;
            const text = currentExtracted.allFields.map(f => `${f.label}: ${f.value}`).join('\n');
            navigator.clipboard.writeText(text);
            this.showToast('All fields copied to clipboard!', 'success');
        });

        resetBtn?.addEventListener('click', () => {
            currentExtracted = null;
            previewImg.src = '';
            editor.classList.add('hidden');
            dockedSidebar?.classList.add('hidden');
            dropzone.classList.remove('hidden');
            input.value = '';
        });

        this.refreshLucideIcons();
    };
}
