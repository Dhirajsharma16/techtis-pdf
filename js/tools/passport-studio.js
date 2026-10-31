/**
 * TECHTIS (techtis.in) - Professional Passport Photo Maker & A4 Print Studio
 * 100% Client-Side Engine for Photo Studios, Cyber Cafes, CSC Centres & Students
 * Features:
 * - Multi-image upload queue with individual copy counts (Photo A: 4, Photo B: 6, etc.)
 * - Verified presets (India 35x45mm, US 2x2", UK/Schengen, PAN 25x35mm, Exams) + Custom DPI
 * - Interactive Canvas framing (Drag-to-Pan, Zoom, 90° Rotate, Mirror)
 * - Biometric face oval & eye level framing guide
 * - Studio background replacement (Pure White, Studio Blue, Light Gray)
 * - Optional 1px photo border for scissors cutting
 * - A4 Portrait / Landscape and 4x6" Photo Paper layouts with Auto-Fit calculations
 * - Scissor cutting lines / guides
 * - Live realistic paper preview with multi-page navigation
 * - Exact physical measurement PDF generation (pdf-lib at 300 DPI)
 * - 100% Actual-Size printing system with print instructions modal
 */

import { PdfHelpers, ensurePdfLib } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export const PASSPORT_PRESETS = [
    {
        id: 'in-passport',
        country: 'India',
        purpose: 'Passport / OCI / Visa',
        widthMm: 35,
        heightMm: 45,
        unit: 'mm',
        desc: '35 × 45 mm (3.5 × 4.5 cm) color photo with light background',
        badge: 'Official Seva',
        headPercent: '70–80%'
    },
    {
        id: 'in-pan',
        country: 'India',
        purpose: 'PAN Card / Stamp Size',
        widthMm: 25,
        heightMm: 35,
        unit: 'mm',
        desc: '25 × 35 mm (2.5 × 3.5 cm) stamp size for PAN, DL & banking',
        badge: 'PAN / Stamp',
        headPercent: '70%'
    },
    {
        id: 'in-exams',
        country: 'India',
        purpose: 'Govt Exams (UPSC, SSC, Railway, State PSC)',
        widthMm: 35,
        heightMm: 45,
        unit: 'mm',
        desc: '35 × 45 mm official application photo with clear white background',
        badge: 'Govt Exams',
        headPercent: '75%'
    },
    {
        id: 'us-passport',
        country: 'United States',
        purpose: 'US Visa & Passport / Green Card',
        widthMm: 50.8,
        heightMm: 50.8,
        unit: 'inch',
        desc: '2 × 2 inches (51 × 51 mm) square photo with plain white background',
        badge: '2 × 2 in',
        headPercent: '50–69%'
    },
    {
        id: 'uk-schengen',
        country: 'UK / Europe',
        purpose: 'Schengen & UK Passport / Visa',
        widthMm: 35,
        heightMm: 45,
        unit: 'mm',
        desc: '35 × 45 mm biometric portrait, chin-to-crown height 32–36 mm',
        badge: 'Schengen',
        headPercent: '70–80%'
    },
    {
        id: 'ca-passport',
        country: 'Canada',
        purpose: 'Canada Passport & Visa',
        widthMm: 50,
        heightMm: 70,
        unit: 'mm',
        desc: '50 × 70 mm portrait with neutral facial expression',
        badge: 'Canada',
        headPercent: '60%'
    },
    {
        id: 'au-passport',
        country: 'Australia / NZ',
        purpose: 'Australia & New Zealand Passport',
        widthMm: 35,
        heightMm: 45,
        unit: 'mm',
        desc: '35 × 45 mm biometric portrait with clear frontal lighting',
        badge: 'Aus / NZ',
        headPercent: '75%'
    },
    {
        id: 'biometric-35',
        country: 'Universal',
        purpose: 'Square Biometric (Dubai / GCC / Malaysia)',
        widthMm: 35,
        heightMm: 35,
        unit: 'mm',
        desc: '35 × 35 mm square portrait format',
        badge: '35 × 35 mm',
        headPercent: '70%'
    },
    {
        id: 'student-id',
        country: 'Universal',
        purpose: 'Student & Employee ID Badge',
        widthMm: 30,
        heightMm: 40,
        unit: 'mm',
        desc: '30 × 40 mm portrait format for university and corporate IDs',
        badge: 'ID Card',
        headPercent: '70%'
    },
    {
        id: 'custom',
        country: 'Custom',
        purpose: 'Custom Dimensions & DPI',
        widthMm: 35,
        heightMm: 45,
        unit: 'mm',
        desc: 'Specify custom width, height, measurement unit and DPI',
        badge: 'Custom',
        headPercent: 'Flexible'
    }
];

export const PAPER_FORMATS = [
    {
        id: 'a4-portrait',
        name: 'A4 Portrait (210 × 297 mm)',
        widthMm: 210,
        heightMm: 297,
        label: 'A4 Portrait &bull; Standard Printing',
        isA4: true
    },
    {
        id: 'a4-landscape',
        name: 'A4 Landscape (297 × 210 mm)',
        widthMm: 297,
        heightMm: 210,
        label: 'A4 Landscape &bull; Wide Paper',
        isA4: true
    },
    {
        id: '4x6-portrait',
        name: '4 × 6 in Photo Paper Portrait (102 × 152 mm)',
        widthMm: 101.6,
        heightMm: 152.4,
        label: '4 × 6" Glossy Paper Portrait',
        isA4: false
    },
    {
        id: '4x6-landscape',
        name: '4 × 6 in Photo Paper Landscape (152 × 102 mm)',
        widthMm: 152.4,
        heightMm: 101.6,
        label: '4 × 6" Glossy Paper Landscape',
        isA4: false
    }
];

export class PassportStudio {
    constructor(container, appInstance) {
        this.container = container;
        this.app = appInstance;

        // State Machine
        this.state = {
            photos: [], // Array of { id, name, sizeStr, dimStr, file, img, copies, zoom, panX, panY, rotation, isFlippedH, bgColor, hasBorder }
            activePhotoId: null,
            presetId: 'in-passport',
            custom: {
                width: 35,
                height: 45,
                unit: 'mm',
                dpi: 300
            },
            paperId: 'a4-portrait',
            margins: { top: 10, bottom: 10, left: 10, right: 10 },
            gapX: 3,
            gapY: 4,
            autoFit: true,
            manualCols: 5,
            manualRows: 5,
            showCutLines: true,
            showFaceGuide: true,
            activePage: 1
        };

        // Canvas dragging state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.init();
    }

    init() {
        this.renderUI();
        this.bindEvents();
        this.updateDimensionsInfo();
    }

    // ================= UI RENDERING =================
    renderUI() {
        this.container.innerHTML = `
            <div id="passport-studio-root" class="space-y-4">
                <!-- Studio Header Bar -->
                <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#002244] to-[#ea1d2c] text-white flex items-center justify-center shadow-sm shrink-0">
                            <i data-lucide="camera" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="text-base sm:text-lg font-black text-slate-900 tracking-tight">Passport Photo Maker &amp; A4 Print Studio</h3>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">CSC &amp; Studio Pro</span>
                            </div>
                            <p class="text-xs text-slate-500">Auto-align multi-photo batches on A4 or 4×6 photo paper with 100% exact physical millimeter printing.</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button type="button" id="ps-btn-add-more" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                            <i data-lucide="plus-circle" class="w-3.5 h-3.5 text-red-600"></i>
                            <span>Add Photo</span>
                        </button>
                        <button type="button" id="ps-btn-reset-all" class="px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                            <span>Reset All</span>
                        </button>
                    </div>
                </div>

                <!-- Main 3-Column Studio Workspace -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    
                    <!-- COLUMN 1: Upload, Photo Queue & Size Configuration (4 cols) -->
                    <div class="lg:col-span-4 space-y-4">
                        
                        <!-- Upload Dropzone -->
                        <div id="ps-dropzone" class="border-2 border-dashed border-slate-300 hover:border-red-500 bg-white hover:bg-red-50/20 rounded-2xl p-5 text-center cursor-pointer transition group">
                            <input type="file" id="ps-file-input" accept="image/jpeg,image/png,image/webp" multiple class="hidden">
                            <div class="space-y-2 pointer-events-none">
                                <div class="w-12 h-12 mx-auto rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition shadow-2xs">
                                    <i data-lucide="upload-cloud" class="w-6 h-6"></i>
                                </div>
                                <h4 class="text-xs sm:text-sm font-bold text-slate-800">Drop Portrait Photos Here</h4>
                                <p class="text-[11px] text-slate-500">JPG, PNG, WebP &bull; Select single or multiple photos</p>
                                <button type="button" class="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold shadow-2xs pointer-events-auto">Browse Device</button>
                            </div>
                        </div>

                        <!-- Photo Queue & Quantity Manager -->
                        <div id="ps-queue-card" class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="layers" class="w-4 h-4 text-red-600"></i>
                                    <span>Photo Queue</span>
                                    <span id="ps-queue-badge" class="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">0</span>
                                </div>
                                <span class="text-[11px] text-slate-400 font-medium">Click photo to crop</span>
                            </div>

                            <div id="ps-queue-list" class="space-y-2 max-h-56 overflow-y-auto pr-1">
                                <!-- Populated dynamically -->
                                <div class="text-center py-6 text-xs text-slate-400 italic">No photos uploaded yet. Upload one above.</div>
                            </div>
                        </div>

                        <!-- Passport Size & Preset Settings -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="crop" class="w-4 h-4 text-blue-600"></i>
                                    <span>Document Size Preset</span>
                                </div>
                                <span id="ps-target-px-pill" class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                    413 × 531 px @ 300 DPI
                                </span>
                            </div>

                            <!-- Preset Dropdown -->
                            <div>
                                <label class="text-[11px] font-bold text-slate-700 block mb-1">Standard Presets</label>
                                <select id="ps-preset-select" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium">
                                    ${PASSPORT_PRESETS.map(p => `
                                        <option value="${p.id}" ${p.id === 'in-passport' ? 'selected' : ''}>
                                            ${p.country}: ${p.purpose} (${p.widthMm} × ${p.heightMm} mm)
                                        </option>
                                    `).join('')}
                                </select>
                                <p id="ps-preset-desc" class="text-[11px] text-slate-500 mt-1 font-medium">Standard 35 × 45 mm color photo with light background.</p>
                            </div>

                            <!-- Custom Dimension Drawer (Hidden unless 'custom' selected) -->
                            <div id="ps-custom-dim-drawer" class="hidden p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Width</label>
                                        <input type="number" id="ps-cust-w" value="35" min="10" max="300" step="0.5" class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold">
                                    </div>
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Height</label>
                                        <input type="number" id="ps-cust-h" value="45" min="10" max="300" step="0.5" class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Unit</label>
                                        <select id="ps-cust-unit" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold">
                                            <option value="mm" selected>Millimeters (mm)</option>
                                            <option value="cm">Centimeters (cm)</option>
                                            <option value="inch">Inches (in)</option>
                                            <option value="px">Pixels (px)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">DPI Resolution</label>
                                        <select id="ps-cust-dpi" class="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold">
                                            <option value="300" selected>300 DPI (High Print)</option>
                                            <option value="600">600 DPI (Ultra Sharp)</option>
                                            <option value="200">200 DPI (Standard)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- Studio Styling: Background Color & Cut Border -->
                            <div class="pt-2 border-t border-slate-100 space-y-2">
                                <label class="text-[11px] font-bold text-slate-700 block">Studio Background &amp; Cut Border</label>
                                
                                <div class="flex items-center gap-1.5 text-xs">
                                    <button type="button" class="ps-bg-btn active px-2.5 py-1 rounded-lg border border-slate-300 font-semibold text-[11px] flex items-center gap-1.5 bg-white shadow-2xs" data-color="#ffffff">
                                        <span class="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                                        <span>White</span>
                                    </button>
                                    <button type="button" class="ps-bg-btn px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[11px] flex items-center gap-1.5 bg-slate-50 hover:bg-white" data-color="#dbeafe">
                                        <span class="w-3 h-3 rounded-full bg-blue-100 border border-blue-300"></span>
                                        <span>Light Blue</span>
                                    </button>
                                    <button type="button" class="ps-bg-btn px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-[11px] flex items-center gap-1.5 bg-slate-50 hover:bg-white" data-color="#f1f5f9">
                                        <span class="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
                                        <span>Light Gray</span>
                                    </button>
                                </div>

                                <div class="pt-1 flex items-center justify-between text-xs text-slate-700 select-none">
                                    <label class="flex items-center gap-2 cursor-pointer font-medium">
                                        <input type="checkbox" id="ps-toggle-border" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                        <span>Add 1px subtle cutting border</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- COLUMN 2: Interactive Crop & Biometric Framing (4 cols) -->
                    <div class="lg:col-span-4 space-y-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xs min-h-[500px]">
                            
                            <!-- Card Header -->
                            <div class="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="move" class="w-4 h-4 text-red-600"></i>
                                    <span>Interactive Crop &amp; Framing</span>
                                </div>
                                <span id="ps-active-photo-name" class="text-[11px] font-mono text-slate-500 max-w-[150px] truncate">No photo</span>
                            </div>

                            <!-- Canvas Container with Visual Framing Box -->
                            <div class="relative w-full flex-1 flex items-center justify-center p-3 my-2 bg-slate-900/5 rounded-xl border border-slate-200/80 overflow-hidden select-none">
                                <canvas id="ps-crop-canvas" class="rounded-lg shadow-md border border-slate-300 max-h-[360px] max-w-full bg-white cursor-grab active:cursor-grabbing transition-transform duration-75"></canvas>
                                
                                <div id="ps-crop-tip" class="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 pointer-events-none">
                                    <i data-lucide="move" class="w-3 h-3 text-red-400"></i>
                                    <span>Drag photo to center &bull; Scroll to zoom</span>
                                </div>
                            </div>

                            <!-- Rotation & Orientation Controls -->
                            <div class="w-full space-y-3 pt-2 border-t border-slate-100">
                                <div class="grid grid-cols-3 gap-1.5 text-xs">
                                    <button type="button" id="ps-btn-rot-ccw" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer">
                                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-slate-500"></i>
                                        <span>90° Left</span>
                                    </button>
                                    <button type="button" id="ps-btn-rot-cw" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer">
                                        <i data-lucide="rotate-cw" class="w-3.5 h-3.5 text-slate-500"></i>
                                        <span>90° Right</span>
                                    </button>
                                    <button type="button" id="ps-btn-flip-h" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer">
                                        <i data-lucide="flip-horizontal" class="w-3.5 h-3.5 text-slate-500"></i>
                                        <span>Mirror</span>
                                    </button>
                                </div>

                                <!-- Zoom Slider -->
                                <div>
                                    <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                        <span>Face Scale &amp; Zoom</span>
                                        <span id="ps-zoom-text" class="font-bold text-red-600 font-mono">100%</span>
                                    </div>
                                    <input type="range" id="ps-zoom-range" min="30" max="350" value="100" class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                                </div>

                                <!-- Biometric Oval Guide Toggle & Reset -->
                                <div class="flex items-center justify-between text-xs pt-1 select-none">
                                    <label class="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                                        <input type="checkbox" id="ps-toggle-guide" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                        <span>Biometric Face Oval Guide</span>
                                    </label>
                                    <button type="button" id="ps-btn-recenter" class="text-[11px] text-red-600 hover:underline font-bold cursor-pointer">
                                        Re-Center
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- COLUMN 3: A4 Sheet Generator & Live Preview (4 cols) -->
                    <div class="lg:col-span-4 space-y-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs min-h-[500px]">
                            
                            <!-- Card Header -->
                            <div class="w-full flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="printer" class="w-4 h-4 text-emerald-600"></i>
                                    <span>Print Sheet Layout</span>
                                </div>
                                <span id="ps-sheet-stats-chip" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    0 Copies &bull; 1 Page
                                </span>
                            </div>

                            <!-- Paper Format & Grid Controls -->
                            <div class="w-full space-y-2 pt-2">
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Paper Format</label>
                                        <select id="ps-paper-select" class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold">
                                            ${PAPER_FORMATS.map(f => `
                                                <option value="${f.id}" ${f.id === 'a4-portrait' ? 'selected' : ''}>${f.name}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Layout Mode</label>
                                        <select id="ps-autofit-select" class="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold">
                                            <option value="auto" selected>Auto-Fit (Recommended)</option>
                                            <option value="manual">Manual Grid Spacing</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Manual Grid Adjustments (Hidden unless 'manual' selected) -->
                                <div id="ps-manual-grid-drawer" class="hidden p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                                    <div class="grid grid-cols-2 gap-2">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Photos per Row (Cols)</label>
                                            <input type="number" id="ps-manual-cols" value="5" min="1" max="15" class="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-semibold">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Number of Rows</label>
                                            <input type="number" id="ps-manual-rows" value="5" min="1" max="15" class="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-semibold">
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Gap X (mm)</label>
                                            <input type="number" id="ps-gap-x" value="3" min="0" max="25" class="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-semibold">
                                        </div>
                                        <div>
                                            <label class="text-[10px] font-bold text-slate-600 block mb-0.5">Gap Y (mm)</label>
                                            <input type="number" id="ps-gap-y" value="4" min="0" max="25" class="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-semibold">
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center justify-between text-xs text-slate-700 select-none pt-1">
                                    <label class="flex items-center gap-2 cursor-pointer font-medium">
                                        <input type="checkbox" id="ps-toggle-cutlines" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                        <span>Show scissor cutting lines</span>
                                    </label>
                                    <span id="ps-max-fit-text" class="text-[10px] font-mono text-slate-400">Fits max 25 / page</span>
                                </div>
                            </div>

                            <!-- Live Sheet Canvas Preview -->
                            <div class="relative w-full flex-1 flex flex-col items-center justify-center p-3 my-2 bg-slate-900/5 rounded-xl border border-slate-200/80 overflow-hidden select-none">
                                <canvas id="ps-sheet-canvas" class="rounded shadow-md border border-slate-300 max-h-[300px] max-w-full bg-white"></canvas>

                                <!-- Multi-page pagination -->
                                <div id="ps-pagination-bar" class="hidden items-center justify-center gap-2 mt-2 pt-1 border-t border-slate-200/60 w-full">
                                    <button type="button" id="ps-btn-prev-page" class="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50">&larr; Prev</button>
                                    <span id="ps-page-label" class="text-[11px] font-bold text-slate-700">Page 1 of 1</span>
                                    <button type="button" id="ps-btn-next-page" class="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50">Next &rarr;</button>
                                </div>
                            </div>

                            <!-- Helpful Actual-Size Print Badge -->
                            <div class="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-snug flex items-start gap-2">
                                <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                                <div>
                                    <strong>Studio Print Tip:</strong> In printer settings, always choose <strong>"Actual Size" / 100% scale</strong>. Never select "Fit to page" or physical millimeter dimensions will be distorted.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- BOTTOM EXPORT & PRINT ACTION BAR -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="flex items-center gap-2 text-xs text-slate-600">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                            <span>100% In-Browser Privacy &bull; Zero Server Uploads</span>
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                        <!-- Download Single Photo -->
                        <button type="button" id="ps-btn-dl-single" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                            <i data-lucide="image" class="w-4 h-4 text-slate-600"></i>
                            <span>Single Photo (300 DPI)</span>
                        </button>

                        <!-- Download High-Res Sheet Image -->
                        <button type="button" id="ps-btn-dl-sheet-img" class="px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                            <i data-lucide="file-image" class="w-4 h-4 text-slate-300"></i>
                            <span>Download Sheet (JPG)</span>
                        </button>

                        <!-- Download Print-Ready PDF -->
                        <button type="button" id="ps-btn-dl-pdf" class="px-4 py-2 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer">
                            <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
                            <span>Download PDF (Exact mm)</span>
                        </button>

                        <!-- Direct Actual-Size Print Button -->
                        <button type="button" id="ps-btn-print" class="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer">
                            <i data-lucide="printer" class="w-4 h-4"></i>
                            <span>PRINT SHEET (100% SCALE)</span>
                        </button>
                    </div>
                </div>

                <!-- Print Instructions & Confirmation Modal -->
                <div id="ps-print-modal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div class="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
                        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div class="flex items-center gap-2.5">
                                <div class="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-2xs">
                                    <i data-lucide="printer" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <h4 class="text-base font-bold text-slate-900">100% Actual-Size Print Ready</h4>
                                    <p class="text-[11px] text-slate-500">Physical measurement accuracy guide</p>
                                </div>
                            </div>
                            <button id="ps-btn-close-print-modal" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                                <i data-lucide="x" class="w-5 h-5"></i>
                            </button>
                        </div>

                        <div class="space-y-3 text-xs text-slate-700">
                            <p class="font-medium text-slate-800">In the upcoming browser print dialog, make sure your printer options match:</p>
                            
                            <div class="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-slate-700">1. Paper Size:</span>
                                    <span id="ps-print-modal-paper" class="font-mono text-red-600 font-bold">A4</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-slate-700">2. Margins:</span>
                                    <span class="font-mono text-slate-900 font-bold">None / Minimum</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-slate-700">3. Scale:</span>
                                    <span class="font-mono text-emerald-700 font-bold">Actual Size (100%)</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-slate-700">4. Fit to Page:</span>
                                    <span class="font-mono text-red-600 font-bold">OFF / Unchecked</span>
                                </div>
                            </div>

                            <p class="text-[11px] text-slate-500 italic">This ensures a 35 × 45 mm photo is printed at exactly 35 × 45 mm on paper without any millimeter scaling distortion.</p>
                        </div>

                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button id="ps-btn-cancel-print" class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                            <button id="ps-btn-confirm-print" class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-1.5">
                                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                                <span>Open Print Dialog</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Hidden Mount for Actual-Size Print Media -->
                <div id="passport-print-mount" style="display: none;"></div>
            </div>
        `;

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    // ================= EVENT BINDINGS =================
    bindEvents() {
        const dropzone = document.getElementById('ps-dropzone');
        const fileInput = document.getElementById('ps-file-input');
        const addMoreBtn = document.getElementById('ps-btn-add-more');
        const resetAllBtn = document.getElementById('ps-btn-reset-all');

        // File upload triggers
        dropzone?.addEventListener('click', () => fileInput?.click());
        addMoreBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.loadFiles(Array.from(e.target.files));
                fileInput.value = '';
            }
        });

        // Preset selector
        const presetSelect = document.getElementById('ps-preset-select');
        const presetDesc = document.getElementById('ps-preset-desc');
        const customDrawer = document.getElementById('ps-custom-dim-drawer');

        presetSelect?.addEventListener('change', (e) => {
            this.state.presetId = e.target.value;
            const p = PASSPORT_PRESETS.find(x => x.id === e.target.value);
            if (p) {
                presetDesc.textContent = p.desc;
                if (p.id === 'custom') {
                    customDrawer?.classList.remove('hidden');
                } else {
                    customDrawer?.classList.add('hidden');
                }
                this.updateDimensionsInfo();
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        // Custom dimension inputs
        ['ps-cust-w', 'ps-cust-h', 'ps-cust-unit', 'ps-cust-dpi'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.state.custom.width = parseFloat(document.getElementById('ps-cust-w')?.value) || 35;
                this.state.custom.height = parseFloat(document.getElementById('ps-cust-h')?.value) || 45;
                this.state.custom.unit = document.getElementById('ps-cust-unit')?.value || 'mm';
                this.state.custom.dpi = parseInt(document.getElementById('ps-cust-dpi')?.value, 10) || 300;
                this.updateDimensionsInfo();
                this.renderCropCanvas();
                this.renderSheetPreview();
            });
        });

        // Background color buttons
        document.querySelectorAll('.ps-bg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ps-bg-btn').forEach(b => {
                    b.classList.remove('active', 'border-slate-300', 'shadow-2xs');
                    b.classList.add('border-slate-200');
                });
                btn.classList.add('active', 'border-slate-300', 'shadow-2xs');
                const color = btn.getAttribute('data-color') || '#ffffff';
                const activePhoto = this.getActivePhoto();
                if (activePhoto) {
                    activePhoto.bgColor = color;
                    this.renderCropCanvas();
                    this.renderSheetPreview();
                }
            });
        });

        // Cutting border toggle
        document.getElementById('ps-toggle-border')?.addEventListener('change', (e) => {
            const activePhoto = this.getActivePhoto();
            if (activePhoto) {
                activePhoto.hasBorder = e.target.checked;
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        // Framing canvas events (Pan, Zoom, Drag)
        const cropCanvas = document.getElementById('ps-crop-canvas');
        const zoomRange = document.getElementById('ps-zoom-range');
        const zoomText = document.getElementById('ps-zoom-text');

        zoomRange?.addEventListener('input', (e) => {
            const activePhoto = this.getActivePhoto();
            if (!activePhoto) return;
            activePhoto.zoom = parseInt(e.target.value, 10) / 100;
            if (zoomText) zoomText.textContent = `${e.target.value}%`;
            this.renderCropCanvas();
            this.renderSheetPreview();
        });

        // Mouse Wheel Zoom
        cropCanvas?.addEventListener('wheel', (e) => {
            e.preventDefault();
            const activePhoto = this.getActivePhoto();
            if (!activePhoto) return;
            const delta = e.deltaY > 0 ? -0.08 : 0.08;
            activePhoto.zoom = Math.max(0.3, Math.min(3.5, activePhoto.zoom + delta));
            if (zoomRange) zoomRange.value = Math.round(activePhoto.zoom * 100);
            if (zoomText) zoomText.textContent = `${Math.round(activePhoto.zoom * 100)}%`;
            this.renderCropCanvas();
            this.renderSheetPreview();
        }, { passive: false });

        // Mouse Drag on Canvas
        cropCanvas?.addEventListener('mousedown', (e) => {
            const activePhoto = this.getActivePhoto();
            if (!activePhoto) return;
            this.isDragging = true;
            this.dragStartX = e.clientX - activePhoto.panX;
            this.dragStartY = e.clientY - activePhoto.panY;
            cropCanvas.classList.add('cursor-grabbing');
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const activePhoto = this.getActivePhoto();
            if (!activePhoto) return;
            activePhoto.panX = e.clientX - this.dragStartX;
            activePhoto.panY = e.clientY - this.dragStartY;
            this.renderCropCanvas();
        });

        window.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                cropCanvas?.classList.remove('cursor-grabbing');
                this.renderSheetPreview();
            }
        });

        // Touch Drag for Mobile / Tablets
        cropCanvas?.addEventListener('touchstart', (e) => {
            const activePhoto = this.getActivePhoto();
            if (!activePhoto || e.touches.length !== 1) return;
            this.isDragging = true;
            this.dragStartX = e.touches[0].clientX - activePhoto.panX;
            this.dragStartY = e.touches[0].clientY - activePhoto.panY;
        }, { passive: true });

        cropCanvas?.addEventListener('touchmove', (e) => {
            if (!this.isDragging || e.touches.length !== 1) return;
            const activePhoto = this.getActivePhoto();
            if (!activePhoto) return;
            activePhoto.panX = e.touches[0].clientX - this.dragStartX;
            activePhoto.panY = e.touches[0].clientY - this.dragStartY;
            this.renderCropCanvas();
        }, { passive: true });

        cropCanvas?.addEventListener('touchend', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.renderSheetPreview();
            }
        });

        // Rotation & Orientation buttons
        document.getElementById('ps-btn-rot-cw')?.addEventListener('click', () => {
            const p = this.getActivePhoto();
            if (p) {
                p.rotation = (p.rotation + 90) % 360;
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        document.getElementById('ps-btn-rot-ccw')?.addEventListener('click', () => {
            const p = this.getActivePhoto();
            if (p) {
                p.rotation = (p.rotation - 90 + 360) % 360;
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        document.getElementById('ps-btn-flip-h')?.addEventListener('click', () => {
            const p = this.getActivePhoto();
            if (p) {
                p.isFlippedH = !p.isFlippedH;
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        document.getElementById('ps-btn-recenter')?.addEventListener('click', () => {
            const p = this.getActivePhoto();
            if (p) {
                p.panX = 0;
                p.panY = 0;
                p.zoom = 1.0;
                p.rotation = 0;
                p.isFlippedH = false;
                if (zoomRange) zoomRange.value = '100';
                if (zoomText) zoomText.textContent = '100%';
                this.renderCropCanvas();
                this.renderSheetPreview();
            }
        });

        document.getElementById('ps-toggle-guide')?.addEventListener('change', (e) => {
            this.state.showFaceGuide = e.target.checked;
            this.renderCropCanvas();
        });

        // Paper & Sheet Layout Controls
        document.getElementById('ps-paper-select')?.addEventListener('change', (e) => {
            this.state.paperId = e.target.value;
            this.renderSheetPreview();
        });

        const autoFitSelect = document.getElementById('ps-autofit-select');
        const manualGridDrawer = document.getElementById('ps-manual-grid-drawer');
        autoFitSelect?.addEventListener('change', (e) => {
            this.state.autoFit = (e.target.value === 'auto');
            if (this.state.autoFit) {
                manualGridDrawer?.classList.add('hidden');
            } else {
                manualGridDrawer?.classList.remove('hidden');
            }
            this.renderSheetPreview();
        });

        ['ps-manual-cols', 'ps-manual-rows', 'ps-gap-x', 'ps-gap-y'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.state.manualCols = parseInt(document.getElementById('ps-manual-cols')?.value, 10) || 5;
                this.state.manualRows = parseInt(document.getElementById('ps-manual-rows')?.value, 10) || 5;
                this.state.gapX = parseFloat(document.getElementById('ps-gap-x')?.value) || 3;
                this.state.gapY = parseFloat(document.getElementById('ps-gap-y')?.value) || 4;
                this.renderSheetPreview();
            });
        });

        document.getElementById('ps-toggle-cutlines')?.addEventListener('change', (e) => {
            this.state.showCutLines = e.target.checked;
            this.renderSheetPreview();
        });

        // Sheet Pagination
        document.getElementById('ps-btn-prev-page')?.addEventListener('click', () => {
            if (this.state.activePage > 1) {
                this.state.activePage--;
                this.renderSheetPreview();
            }
        });

        document.getElementById('ps-btn-next-page')?.addEventListener('click', () => {
            const layout = this.calculateSheetLayout();
            if (this.state.activePage < layout.totalPages) {
                this.state.activePage++;
                this.renderSheetPreview();
            }
        });

        // Action Buttons
        document.getElementById('ps-btn-dl-single')?.addEventListener('click', () => this.downloadSinglePhoto('jpeg'));
        document.getElementById('ps-btn-dl-sheet-img')?.addEventListener('click', () => this.downloadSheetImage('jpeg'));
        document.getElementById('ps-btn-dl-pdf')?.addEventListener('click', () => this.downloadSheetPdf());

        // Print Flow
        const printModal = document.getElementById('ps-print-modal');
        document.getElementById('ps-btn-print')?.addEventListener('click', () => {
            if (this.state.photos.length === 0) {
                this.app.showToast('Please upload at least one photo before printing.', 'error');
                return;
            }
            const paper = this.getSelectedPaper();
            const modalPaper = document.getElementById('ps-print-modal-paper');
            if (modalPaper) modalPaper.textContent = paper.isA4 ? 'A4' : '4 × 6 inches';
            printModal?.classList.remove('hidden');
        });

        document.getElementById('ps-btn-close-print-modal')?.addEventListener('click', () => printModal?.classList.add('hidden'));
        document.getElementById('ps-btn-cancel-print')?.addEventListener('click', () => printModal?.classList.add('hidden'));
        document.getElementById('ps-btn-confirm-print')?.addEventListener('click', () => {
            printModal?.classList.add('hidden');
            this.executeBrowserPrint();
        });

        resetAllBtn?.addEventListener('click', () => {
            if (confirm('Clear all uploaded photos and start fresh?')) {
                this.state.photos = [];
                this.state.activePhotoId = null;
                this.state.activePage = 1;
                this.updateQueueUI();
                this.renderCropCanvas();
                this.renderSheetPreview();
                this.app.showToast('Studio reset. Upload new photos to begin.', 'info');
            }
        });
    }

    // ================= FILE LOADING & QUEUE MANAGEMENT =================
    async loadFiles(fileList) {
        if (!fileList || fileList.length === 0) return;

        let loadedCount = 0;
        for (const file of fileList) {
            if (!file.type.startsWith('image/')) continue;

            const id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const dataUrl = await this.readFileAsDataUrl(file);
            const img = await this.loadImageElement(dataUrl);

            const sizeStr = (file.size / 1024).toFixed(0) + ' KB';
            const dimStr = `${img.naturalWidth} × ${img.naturalHeight}`;

            this.state.photos.push({
                id,
                name: file.name,
                sizeStr,
                dimStr,
                dataUrl,
                img,
                copies: 6, // Default CSC/studio standard 6 copies
                zoom: 1.0,
                panX: 0,
                panY: 0,
                rotation: 0,
                isFlippedH: false,
                bgColor: '#ffffff',
                hasBorder: true
            });

            if (!this.state.activePhotoId) {
                this.state.activePhotoId = id;
            }
            loadedCount++;
        }

        if (loadedCount > 0) {
            this.updateQueueUI();
            this.renderCropCanvas();
            this.renderSheetPreview();
            this.app.showToast(`Loaded ${loadedCount} photo(s) into Passport Studio!`, 'success');
        }
    }

    readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    loadImageElement(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    getActivePhoto() {
        if (!this.state.activePhotoId && this.state.photos.length > 0) {
            this.state.activePhotoId = this.state.photos[0].id;
        }
        return this.state.photos.find(p => p.id === this.state.activePhotoId) || null;
    }

    updateQueueUI() {
        const queueList = document.getElementById('ps-queue-list');
        const queueBadge = document.getElementById('ps-queue-badge');
        const activePhotoName = document.getElementById('ps-active-photo-name');

        if (queueBadge) queueBadge.textContent = this.state.photos.length;

        const activePhoto = this.getActivePhoto();
        if (activePhotoName) {
            activePhotoName.textContent = activePhoto ? activePhoto.name : 'No photo';
        }

        if (!queueList) return;

        if (this.state.photos.length === 0) {
            queueList.innerHTML = `<div class="text-center py-6 text-xs text-slate-400 italic">No photos uploaded yet. Drop photos above.</div>`;
            return;
        }

        queueList.innerHTML = this.state.photos.map(p => {
            const isActive = p.id === this.state.activePhotoId;
            return `
                <div class="ps-queue-item flex items-center justify-between p-2 rounded-xl border ${isActive ? 'bg-red-50/40 border-red-300 ring-1 ring-red-400/20' : 'bg-slate-50 border-slate-200'} transition cursor-pointer" data-id="${p.id}">
                    <div class="flex items-center gap-2 min-w-0">
                        <img src="${p.dataUrl}" alt="${p.name}" class="w-9 h-11 object-cover rounded border border-slate-300 bg-white shrink-0">
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-slate-800 truncate leading-snug">${p.name}</p>
                            <p class="text-[10px] text-slate-400">${p.dimStr} &bull; ${p.sizeStr}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0" onclick="event.stopPropagation()">
                        <!-- Copies Counter -->
                        <div class="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                            <button type="button" class="ps-btn-dec px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold" data-id="${p.id}">-</button>
                            <span class="px-2 py-0.5 text-xs font-bold text-slate-900 font-mono">${p.copies}</span>
                            <button type="button" class="ps-btn-inc px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold" data-id="${p.id}">+</button>
                        </div>

                        <!-- Duplicate Photo -->
                        <button type="button" class="ps-btn-dup p-1 text-slate-400 hover:text-blue-600 rounded transition" title="Duplicate Photo" data-id="${p.id}">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>

                        <!-- Remove Photo -->
                        <button type="button" class="ps-btn-del p-1 text-slate-400 hover:text-red-600 rounded transition" title="Remove Photo" data-id="${p.id}">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Queue item click -> select photo for framing
        queueList.querySelectorAll('.ps-queue-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.getAttribute('data-id');
                this.state.activePhotoId = id;
                this.updateQueueUI();
                this.syncActivePhotoControls();
                this.renderCropCanvas();
            });
        });

        // Stepper: Increment copies
        queueList.querySelectorAll('.ps-btn-inc').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const p = this.state.photos.find(x => x.id === id);
                if (p) {
                    p.copies = Math.min(100, p.copies + 1);
                    this.updateQueueUI();
                    this.renderSheetPreview();
                }
            });
        });

        // Stepper: Decrement copies
        queueList.querySelectorAll('.ps-btn-dec').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const p = this.state.photos.find(x => x.id === id);
                if (p) {
                    p.copies = Math.max(1, p.copies - 1);
                    this.updateQueueUI();
                    this.renderSheetPreview();
                }
            });
        });

        // Duplicate
        queueList.querySelectorAll('.ps-btn-dup').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const p = this.state.photos.find(x => x.id === id);
                if (p) {
                    const newId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                    this.state.photos.push({
                        ...p,
                        id: newId,
                        name: p.name.replace(/\.[^/.]+$/, '') + ' (Copy)' + (p.name.match(/\.[^/.]+$/)?.[0] || '')
                    });
                    this.updateQueueUI();
                    this.renderSheetPreview();
                }
            });
        });

        // Delete
        queueList.querySelectorAll('.ps-btn-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.state.photos = this.state.photos.filter(x => x.id !== id);
                if (this.state.activePhotoId === id) {
                    this.state.activePhotoId = this.state.photos[0]?.id || null;
                }
                this.updateQueueUI();
                this.syncActivePhotoControls();
                this.renderCropCanvas();
                this.renderSheetPreview();
            });
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    syncActivePhotoControls() {
        const p = this.getActivePhoto();
        if (!p) return;

        const zoomRange = document.getElementById('ps-zoom-range');
        const zoomText = document.getElementById('ps-zoom-text');
        if (zoomRange) zoomRange.value = Math.round(p.zoom * 100);
        if (zoomText) zoomText.textContent = `${Math.round(p.zoom * 100)}%`;

        const borderToggle = document.getElementById('ps-toggle-border');
        if (borderToggle) borderToggle.checked = p.hasBorder;

        // Background color buttons
        document.querySelectorAll('.ps-bg-btn').forEach(b => {
            const color = b.getAttribute('data-color');
            if (color === p.bgColor) {
                b.classList.add('active', 'border-slate-300', 'shadow-2xs');
            } else {
                b.classList.remove('active', 'border-slate-300', 'shadow-2xs');
            }
        });
    }

    // ================= PHYSICAL DIMENSIONS & SPEC CALCULATIONS =================
    getPhotoDimensionsMm() {
        if (this.state.presetId === 'custom') {
            const c = this.state.custom;
            let wMm = c.width;
            let hMm = c.height;

            if (c.unit === 'cm') {
                wMm = c.width * 10;
                hMm = c.height * 10;
            } else if (c.unit === 'inch') {
                wMm = c.width * 25.4;
                hMm = c.height * 25.4;
            } else if (c.unit === 'px') {
                const dpi = c.dpi || 300;
                wMm = (c.width * 25.4) / dpi;
                hMm = (c.height * 25.4) / dpi;
            }

            return {
                widthMm: parseFloat(wMm.toFixed(2)),
                heightMm: parseFloat(hMm.toFixed(2)),
                dpi: c.dpi || 300
            };
        }

        const preset = PASSPORT_PRESETS.find(x => x.id === this.state.presetId) || PASSPORT_PRESETS[0];
        return {
            widthMm: preset.widthMm,
            heightMm: preset.heightMm,
            dpi: 300
        };
    }

    getSelectedPaper() {
        return PAPER_FORMATS.find(x => x.id === this.state.paperId) || PAPER_FORMATS[0];
    }

    updateDimensionsInfo() {
        const dim = this.getPhotoDimensionsMm();
        const pxW = Math.round((dim.widthMm * dim.dpi) / 25.4);
        const pxH = Math.round((dim.heightMm * dim.dpi) / 25.4);

        const pill = document.getElementById('ps-target-px-pill');
        if (pill) {
            pill.textContent = `${dim.widthMm} × ${dim.heightMm} mm (${pxW} × ${pxH} px @ ${dim.dpi} DPI)`;
        }
    }

    // ================= INTERACTIVE CROP CANVAS RENDERING =================
    renderCropCanvas() {
        const canvas = document.getElementById('ps-crop-canvas');
        if (!canvas) return;

        const photo = this.getActivePhoto();
        const ctx = canvas.getContext('2d');
        const dim = this.getPhotoDimensionsMm();

        // Calculate 300 DPI target resolution for canvas buffer
        const targetW = Math.round((dim.widthMm * 300) / 25.4);
        const targetH = Math.round((dim.heightMm * 300) / 25.4);

        canvas.width = targetW;
        canvas.height = targetH;

        if (!photo || !photo.img) {
            // Draw placeholder
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(8, 8, targetW - 16, targetH - 16);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Select or Upload a Photo', targetW / 2, targetH / 2);
            return;
        }

        // 1. Fill Chosen Background Color
        ctx.fillStyle = photo.bgColor || '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);

        // 2. Transform & Draw Cropped Image
        ctx.save();
        ctx.translate((targetW / 2) + photo.panX, (targetH / 2) + photo.panY);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        if (photo.isFlippedH) ctx.scale(-1, 1);

        const isRot90 = (photo.rotation % 180 !== 0);
        const naturalW = isRot90 ? photo.img.naturalHeight : photo.img.naturalWidth;
        const naturalH = isRot90 ? photo.img.naturalWidth : photo.img.naturalHeight;

        const baseScale = Math.max(targetW / naturalW, targetH / naturalH);
        const scale = baseScale * photo.zoom;
        const drawW = photo.img.naturalWidth * scale;
        const drawH = photo.img.naturalHeight * scale;

        ctx.drawImage(photo.img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 3. Optional 1px Subtle Border for clean cutting
        if (photo.hasBorder) {
            ctx.save();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = Math.max(1, Math.round(targetW * 0.003));
            ctx.strokeRect(0, 0, targetW, targetH);
            ctx.restore();
        }

        // 4. Biometric Face Oval & Eye Level Guide Overlay
        if (this.state.showFaceGuide) {
            ctx.save();
            ctx.strokeStyle = 'rgba(234, 29, 44, 0.85)';
            ctx.lineWidth = Math.max(2, targetW * 0.006);
            ctx.setLineDash([8, 6]);

            const ovalCenterX = targetW / 2;
            const ovalCenterY = targetH * 0.46;
            const radiusX = targetW * 0.28;
            const radiusY = targetH * 0.33;

            // Face Oval
            ctx.beginPath();
            ctx.ellipse(ovalCenterX, ovalCenterY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Eye Level Line
            ctx.beginPath();
            ctx.moveTo(targetW * 0.18, targetH * 0.43);
            ctx.lineTo(targetW * 0.82, targetH * 0.43);
            ctx.stroke();

            // Chin Line
            ctx.beginPath();
            ctx.moveTo(targetW * 0.28, ovalCenterY + radiusY);
            ctx.lineTo(targetW * 0.72, ovalCenterY + radiusY);
            ctx.stroke();

            // Top Crown Boundary
            ctx.beginPath();
            ctx.moveTo(targetW * 0.35, ovalCenterY - radiusY);
            ctx.lineTo(targetW * 0.65, ovalCenterY - radiusY);
            ctx.stroke();

            ctx.restore();
        }
    }

    // ================= HIGH-RES PHOTO CANVASES =================
    generateCleanPhotoCanvas(photo, dpi = 300) {
        if (!photo || !photo.img) return null;

        const dim = this.getPhotoDimensionsMm();
        const targetW = Math.round((dim.widthMm * dpi) / 25.4);
        const targetH = Math.round((dim.heightMm * dpi) / 25.4);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = photo.bgColor || '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);

        // Transform
        ctx.save();
        ctx.translate((targetW / 2) + photo.panX, (targetH / 2) + photo.panY);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        if (photo.isFlippedH) ctx.scale(-1, 1);

        const isRot90 = (photo.rotation % 180 !== 0);
        const naturalW = isRot90 ? photo.img.naturalHeight : photo.img.naturalWidth;
        const naturalH = isRot90 ? photo.img.naturalWidth : photo.img.naturalHeight;

        const baseScale = Math.max(targetW / naturalW, targetH / naturalH);
        const scale = baseScale * photo.zoom;
        const drawW = photo.img.naturalWidth * scale;
        const drawH = photo.img.naturalHeight * scale;

        ctx.drawImage(photo.img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 1px Border
        if (photo.hasBorder) {
            ctx.save();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = Math.max(1, Math.round(targetW * 0.003));
            ctx.strokeRect(0, 0, targetW, targetH);
            ctx.restore();
        }

        return canvas;
    }

    // ================= A4 & 4x6 SHEET LAYOUT ALGORITHM =================
    calculateSheetLayout() {
        const paper = this.getSelectedPaper();
        const photo = this.getPhotoDimensionsMm();

        const marginL = Number(this.state.margins.left);
        const marginR = Number(this.state.margins.right);
        const marginT = Number(this.state.margins.top);
        const marginB = Number(this.state.margins.bottom);

        const gapX = Number(this.state.gapX);
        const gapY = Number(this.state.gapY);

        const printableW = Math.max(0, paper.widthMm - marginL - marginR);
        const printableH = Math.max(0, paper.heightMm - marginT - marginB);

        // Optimal physical packing
        const maxCols = Math.max(1, Math.floor((printableW + gapX) / (photo.widthMm + gapX)));
        const maxRows = Math.max(1, Math.floor((printableH + gapY) / (photo.heightMm + gapY)));

        const cols = this.state.autoFit ? maxCols : Math.min(Number(this.state.manualCols) || maxCols, maxCols);
        const rows = this.state.autoFit ? maxRows : Math.min(Number(this.state.manualRows) || maxRows, maxRows);

        const photosPerSheet = cols * rows;

        // Build flat array of photo copies according to queue quantities
        const queueItems = [];
        this.state.photos.forEach(p => {
            const qty = Number(p.copies) || 1;
            for (let i = 0; i < qty; i++) {
                queueItems.push(p);
            }
        });

        const totalCopies = queueItems.length;
        const totalPages = Math.max(1, Math.ceil(totalCopies / photosPerSheet));

        // Group into pages
        const pages = [];
        for (let pg = 0; pg < totalPages; pg++) {
            const pagePhotos = queueItems.slice(pg * photosPerSheet, (pg + 1) * photosPerSheet);
            pages.push(pagePhotos);
        }

        return {
            paper,
            photo,
            printableW,
            printableH,
            cols,
            rows,
            maxCols,
            maxRows,
            photosPerSheet,
            totalCopies,
            totalPages,
            marginL,
            marginR,
            marginT,
            marginB,
            gapX,
            gapY,
            pages
        };
    }

    // ================= LIVE SHEET PREVIEW =================
    renderSheetPreview() {
        const canvas = document.getElementById('ps-sheet-canvas');
        if (!canvas) return;

        const layout = this.calculateSheetLayout();
        const ctx = canvas.getContext('2d');

        // Update UI info chips
        const maxFitText = document.getElementById('ps-max-fit-text');
        if (maxFitText) {
            maxFitText.textContent = `Fits max ${layout.photosPerSheet} / page (${layout.cols} × ${layout.rows} grid)`;
        }

        const statsChip = document.getElementById('ps-sheet-stats-chip');
        if (statsChip) {
            statsChip.textContent = `${layout.totalCopies} Copies &bull; ${layout.totalPages} ${layout.totalPages > 1 ? 'Pages' : 'Page'}`;
        }

        // Pagination controls
        const paginationBar = document.getElementById('ps-pagination-bar');
        const pageLabel = document.getElementById('ps-page-label');
        if (paginationBar) {
            if (layout.totalPages > 1) {
                paginationBar.classList.remove('hidden');
                paginationBar.classList.add('flex');
                if (pageLabel) pageLabel.textContent = `Page ${this.state.activePage} of ${layout.totalPages}`;
            } else {
                paginationBar.classList.add('hidden');
                paginationBar.classList.remove('flex');
            }
        }

        // Clamp active page
        if (this.state.activePage > layout.totalPages) {
            this.state.activePage = layout.totalPages;
        }

        // Preview resolution (proportional scaling)
        const PREVIEW_DPI = 72; // Screen resolution preview
        const mmToPx = PREVIEW_DPI / 25.4;
        const sheetW = Math.round(layout.paper.widthMm * mmToPx);
        const sheetH = Math.round(layout.paper.heightMm * mmToPx);

        canvas.width = sheetW;
        canvas.height = sheetH;

        // Paper Surface (White with crisp edge)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        // Printable Margins boundary guide (subtle dashed)
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        const mLPx = layout.marginL * mmToPx;
        const mTPx = layout.marginT * mmToPx;
        const mRPx = layout.marginR * mmToPx;
        const mBPx = layout.marginB * mmToPx;
        ctx.strokeRect(mLPx, mTPx, sheetW - mLPx - mRPx, sheetH - mTPx - mBPx);

        // Render current page photos
        const currentPageIndex = this.state.activePage - 1;
        const currentPhotos = layout.pages[currentPageIndex] || [];

        const photoWPx = layout.photo.widthMm * mmToPx;
        const photoHPx = layout.photo.heightMm * mmToPx;
        const gapXPx = layout.gapX * mmToPx;
        const gapYPx = layout.gapY * mmToPx;

        // Draw slots grid
        let photoIndex = 0;
        for (let r = 0; r < layout.rows; r++) {
            for (let c = 0; c < layout.cols; c++) {
                const x = mLPx + (c * (photoWPx + gapXPx));
                const y = mTPx + (r * (photoHPx + gapYPx));

                if (photoIndex < currentPhotos.length) {
                    const photo = currentPhotos[photoIndex];
                    const cleanCanvas = this.generateCleanPhotoCanvas(photo, 150);
                    if (cleanCanvas) {
                        ctx.drawImage(cleanCanvas, x, y, photoWPx, photoHPx);
                    }
                } else {
                    // Empty slot
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(x, y, photoWPx, photoHPx);
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.setLineDash([3, 3]);
                    ctx.strokeRect(x, y, photoWPx, photoHPx);
                }

                photoIndex++;
            }
        }

        // Draw Scissor Cutting Lines
        if (this.state.showCutLines && layout.totalCopies > 0) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.75;
            ctx.setLineDash([3, 3]);

            // Vertical cutting lines between cols
            for (let c = 1; c < layout.cols; c++) {
                const lineX = mLPx + (c * (photoWPx + gapXPx)) - (gapXPx / 2);
                const startY = mTPx - 4;
                const endY = mTPx + (layout.rows * (photoHPx + gapYPx)) - gapYPx + 4;
                ctx.beginPath();
                ctx.moveTo(lineX, startY);
                ctx.lineTo(lineX, endY);
                ctx.stroke();
            }

            // Horizontal cutting lines between rows
            for (let r = 1; r < layout.rows; r++) {
                const lineY = mTPx + (r * (photoHPx + gapYPx)) - (gapYPx / 2);
                const startX = mLPx - 4;
                const endX = mLPx + (layout.cols * (photoWPx + gapXPx)) - gapXPx + 4;
                ctx.beginPath();
                ctx.moveTo(startX, lineY);
                ctx.lineTo(endX, lineY);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Header info watermark on sheet preview
        ctx.fillStyle = '#64748b';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`TECHTIS Print Studio &bull; ${layout.photo.widthMm} × ${layout.photo.heightMm} mm &bull; Scale: 100% Actual Size`, mLPx, mTPx - 4);
    }

    // ================= FULL 300 DPI HIGH-RES SHEET CANVAS =================
    generateHighResSheetCanvas(pageIndex = 0, dpi = 300) {
        const layout = this.calculateSheetLayout();
        const mmToPx = dpi / 25.4;
        const sheetW = Math.round(layout.paper.widthMm * mmToPx);
        const sheetH = Math.round(layout.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = sheetW;
        canvas.height = sheetH;
        const ctx = canvas.getContext('2d');

        // Pure white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        const mLPx = layout.marginL * mmToPx;
        const mTPx = layout.marginT * mmToPx;
        const photoWPx = layout.photo.widthMm * mmToPx;
        const photoHPx = layout.photo.heightMm * mmToPx;
        const gapXPx = layout.gapX * mmToPx;
        const gapYPx = layout.gapY * mmToPx;

        const currentPhotos = layout.pages[pageIndex] || [];
        let photoIndex = 0;

        for (let r = 0; r < layout.rows; r++) {
            for (let c = 0; c < layout.cols; c++) {
                if (photoIndex < currentPhotos.length) {
                    const photo = currentPhotos[photoIndex];
                    const cleanCanvas = this.generateCleanPhotoCanvas(photo, dpi);
                    if (cleanCanvas) {
                        const x = mLPx + (c * (photoWPx + gapXPx));
                        const y = mTPx + (r * (photoHPx + gapYPx));
                        ctx.drawImage(cleanCanvas, x, y, photoWPx, photoHPx);
                    }
                    photoIndex++;
                }
            }
        }

        // Cutting lines
        if (this.state.showCutLines && currentPhotos.length > 0) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = Math.max(1, Math.round(sheetW * 0.0008));
            ctx.setLineDash([8, 8]);

            for (let c = 1; c < layout.cols; c++) {
                const lineX = mLPx + (c * (photoWPx + gapXPx)) - (gapXPx / 2);
                ctx.beginPath();
                ctx.moveTo(lineX, mTPx - (6 * mmToPx));
                ctx.lineTo(lineX, mTPx + (layout.rows * (photoHPx + gapYPx)) - gapYPx + (6 * mmToPx));
                ctx.stroke();
            }

            for (let r = 1; r < layout.rows; r++) {
                const lineY = mTPx + (r * (photoHPx + gapYPx)) - (gapYPx / 2);
                ctx.beginPath();
                ctx.moveTo(mLPx - (6 * mmToPx), lineY);
                ctx.lineTo(mLPx + (layout.cols * (photoWPx + gapXPx)) - gapXPx + (6 * mmToPx), lineY);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Footer Metadata Note
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.round(9 * (dpi / 72))}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`TECHTIS Passport Photo Studio (${layout.paper.name}) &bull; Photo: ${layout.photo.widthMm} × ${layout.photo.heightMm} mm &bull; 100% Actual Size Print`, mLPx, sheetH - (mTPx / 2));

        return canvas;
    }

    // ================= DOWNLOAD HANDLERS =================
    downloadSinglePhoto(format = 'jpeg') {
        const photo = this.getActivePhoto();
        if (!photo) {
            this.app.showToast('Please upload a photo first.', 'error');
            return;
        }

        const canvas = this.generateCleanPhotoCanvas(photo, 300);
        if (!canvas) return;

        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';
        const filename = `passport_photo_${Date.now()}.${ext}`;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Exported single 300 DPI photo (${filename})`);
            this.app.updateHistoryCounter();
            this.app.showToast('Single passport photo downloaded at 300 DPI!', 'success');
        }, mime, 0.96);
    }

    downloadSheetImage(format = 'jpeg') {
        if (this.state.photos.length === 0) {
            this.app.showToast('Please upload photos first.', 'error');
            return;
        }

        const pageIdx = this.state.activePage - 1;
        const canvas = this.generateHighResSheetCanvas(pageIdx, 300);
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';
        const filename = `passport_sheet_page_${this.state.activePage}_300dpi.${ext}`;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Exported high-res 300 DPI sheet (${filename})`);
            this.app.updateHistoryCounter();
            this.app.showToast(`Sheet Page ${this.state.activePage} downloaded at 300 DPI!`, 'success');
        }, mime, 0.96);
    }

    // ================= MULTI-PAGE PRINT-READY PDF GENERATOR =================
    async downloadSheetPdf() {
        if (this.state.photos.length === 0) {
            this.app.showToast('Please upload photos first.', 'error');
            return;
        }

        this.app.showToast('Generating exact physical millimeter PDF...', 'info');

        try {
            await ensurePdfLib();
            const pdfDoc = await window.PDFLib.PDFDocument.create();

            const layout = this.calculateSheetLayout();
            const MM_TO_PT = 72 / 25.4;

            const paperW_pt = layout.paper.widthMm * MM_TO_PT;
            const paperH_pt = layout.paper.heightMm * MM_TO_PT;
            const photoW_pt = layout.photo.widthMm * MM_TO_PT;
            const photoH_pt = layout.photo.heightMm * MM_TO_PT;

            const marginL_pt = layout.marginL * MM_TO_PT;
            const marginT_pt = layout.marginT * MM_TO_PT;
            const gapX_pt = layout.gapX * MM_TO_PT;
            const gapY_pt = layout.gapY * MM_TO_PT;

            const font = await pdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);
            const fontBold = await pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);

            // Pre-render and embed unique photos at 300 DPI
            const embeddedMap = new Map();
            for (const p of this.state.photos) {
                const highResCanvas = this.generateCleanPhotoCanvas(p, 300);
                const dataUrl = highResCanvas.toDataURL('image/jpeg', 0.95);
                const bytes = await fetch(dataUrl).then(r => r.arrayBuffer());
                const embedded = await pdfDoc.embedJpg(bytes);
                embeddedMap.set(p.id, embedded);
            }

            // Generate each page in the layout
            for (let pg = 0; pg < layout.totalPages; pg++) {
                const page = pdfDoc.addPage([paperW_pt, paperH_pt]);
                const pagePhotos = layout.pages[pg] || [];

                // Page Header note
                page.drawText(`TECHTIS Studio: ${layout.photo.widthMm} × ${layout.photo.heightMm} mm &bull; Page ${pg + 1} of ${layout.totalPages}`, {
                    x: marginL_pt,
                    y: paperH_pt - (marginT_pt / 2) - 4,
                    size: 8,
                    font: fontBold,
                    color: window.PDFLib.rgb(0.1, 0.15, 0.25)
                });

                page.drawText('IMPORTANT: Print at "Actual Size" or 100% scale. Do NOT select "Fit to printable area".', {
                    x: marginL_pt,
                    y: paperH_pt - (marginT_pt / 2) - 14,
                    size: 7,
                    font: font,
                    color: window.PDFLib.rgb(0.85, 0.15, 0.15)
                });

                let photoIdx = 0;
                for (let r = 0; r < layout.rows; r++) {
                    for (let c = 0; c < layout.cols; c++) {
                        if (photoIdx < pagePhotos.length) {
                            const p = pagePhotos[photoIdx];
                            const embedded = embeddedMap.get(p.id);

                            // PDF origin (0,0) is bottom-left
                            const x = marginL_pt + (c * (photoW_pt + gapX_pt));
                            const y = paperH_pt - marginT_pt - 20 - ((r + 1) * photoH_pt) - (r * gapY_pt);

                            if (embedded) {
                                page.drawImage(embedded, {
                                    x,
                                    y,
                                    width: photoW_pt,
                                    height: photoH_pt
                                });

                                if (p.hasBorder) {
                                    page.drawRectangle({
                                        x,
                                        y,
                                        width: photoW_pt,
                                        height: photoH_pt,
                                        borderColor: window.PDFLib.rgb(0.8, 0.85, 0.9),
                                        borderWidth: 0.5
                                    });
                                }
                            }
                            photoIdx++;
                        }
                    }
                }

                // Cutting lines
                if (this.state.showCutLines && pagePhotos.length > 0) {
                    for (let c = 1; c < layout.cols; c++) {
                        const lineX = marginL_pt + (c * (photoW_pt + gapX_pt)) - (gapX_pt / 2);
                        page.drawLine({
                            start: { x: lineX, y: paperH_pt - marginT_pt - 10 },
                            end: { x: lineX, y: paperH_pt - marginT_pt - 20 - (layout.rows * (photoH_pt + gapY_pt)) + gapY_pt - 10 },
                            color: window.PDFLib.rgb(0.65, 0.7, 0.75),
                            thickness: 0.5,
                            dashArray: [2, 2]
                        });
                    }

                    for (let r = 1; r < layout.rows; r++) {
                        const lineY = paperH_pt - marginT_pt - 20 - (r * (photoH_pt + gapY_pt)) + (gapY_pt / 2);
                        page.drawLine({
                            start: { x: marginL_pt - 10, y: lineY },
                            end: { x: marginL_pt + (layout.cols * (photoW_pt + gapX_pt)) - gapX_pt + 10, y: lineY },
                            color: window.PDFLib.rgb(0.65, 0.7, 0.75),
                            thickness: 0.5,
                            dashArray: [2, 2]
                        });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const filename = `techtis_passport_print_sheet_${Date.now()}.pdf`;
            PdfHelpers.downloadBytes(pdfBytes, filename, 'application/pdf');

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Generated ${layout.totalPages}-page print sheet (${layout.totalCopies} photos)`);
            this.app.updateHistoryCounter();
            this.app.showToast(`Print-Ready PDF with ${layout.totalCopies} photos generated!`, 'success');
        } catch (err) {
            console.error('PDF sheet error:', err);
            this.app.showToast(`PDF generation error: ${err.message}`, 'error');
        }
    }

    // ================= 100% ACTUAL-SIZE DIRECT PRINT SYSTEM =================
    executeBrowserPrint() {
        const mount = document.getElementById('passport-print-mount');
        if (!mount) return;

        mount.innerHTML = '';
        const layout = this.calculateSheetLayout();

        // Generate full 300 DPI high-res sheet canvas for each page
        for (let pg = 0; pg < layout.totalPages; pg++) {
            const sheetCanvas = this.generateHighResSheetCanvas(pg, 300);
            const pageDiv = document.createElement('div');
            pageDiv.className = 'passport-print-page';

            const img = document.createElement('img');
            img.className = 'passport-print-img';
            img.src = sheetCanvas.toDataURL('image/png');

            pageDiv.appendChild(img);
            mount.appendChild(pageDiv);
        }

        // Brief delay for high-res images to decode before window.print()
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                mount.innerHTML = '';
            }, 1000);
        }, 300);
    }
}
