/**
 * TECHTIS (techtis.in) - Professional Passport Photo Maker & A4 Print Studio
 * 100% Client-Side Engine for Photo Studios, Cyber Cafes, CSC Centres & Students
 * 
 * Features:
 * - Direct "Photos per Row" (Columns) & "Number of Rows" controls (e.g. 3 cols × 4 rows = 12 photos)
 * - Quick Studio Grid Presets: 3×4 (12 Photos), 4×4 (16 Photos), 4×5 (20 Photos), 5×5 (25 Photos), 2×4 (8 Photos)
 * - Realistic A4 Paper Preview with 3D stacked sheets mockup effect matching physical studio prints
 * - Verified presets (India 35x45mm, US 2x2", UK/Schengen, PAN 25x35mm, Exams) + Custom DPI
 * - Interactive Canvas framing (Drag-to-Pan, Zoom 30%-350%, 90° Rotate Left/Right, Mirror)
 * - Biometric face oval & eye level framing guide
 * - Studio background colors (Pure White, Studio Blue, Light Gray)
 * - Crisp photo cut borders (0.75-1px dark charcoal/slate border)
 * - Scissor cutting lines / guides
 * - Exact physical millimeter PDF generation (pdf-lib at 300 DPI)
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
        label: 'A4 Portrait',
        isA4: true
    },
    {
        id: 'a4-landscape',
        name: 'A4 Landscape (297 × 210 mm)',
        widthMm: 297,
        heightMm: 210,
        label: 'A4 Landscape',
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
            
            // Grid Configuration (User Requested: Select photos in row and columns)
            cols: 3, // Default 3 columns (matching user's uploaded image!)
            rows: 4, // Default 4 rows (3 x 4 = 12 photos on sheet!)
            
            gapX: 4, // mm between photos
            gapY: 5, // mm between photos
            marginT: 2, // 2mm top margin from top edge of A4 paper (Studio & CSC standard)
            autoCenter: false, // Don't vertically center - start from top 2mm
            showCutLines: true,
            hasBorder: true,
            borderColor: '#334155', // crisp dark photo outline
            bgColor: '#ffffff',
            showFaceGuide: true,
            fillSheet: true, // Automatically repeat active photo across the sheet
            activePage: 1
        };

        // Canvas dragging state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;

        this.init();
    }

    init() {
        this.initDefaultSamplePhoto();
        this.renderUI();
        this.bindEvents();
        this.updateDimensionsInfo();
        this.renderCropCanvas();
        this.renderSheetPreview();
    }

    initDefaultSamplePhoto() {
        // Create an elegant studio portrait placeholder so the A4 sheet is preview-ready immediately
        const c = document.createElement('canvas');
        c.width = 413;
        c.height = 531;
        const ctx = c.getContext('2d');

        // Light gray/blue studio backdrop gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 531);
        grad.addColorStop(0, '#e2e8f0');
        grad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 413, 531);

        // Portrait silhouette body
        ctx.fillStyle = '#1e3a8a'; // Navy blazer
        ctx.beginPath();
        ctx.ellipse(206, 510, 160, 120, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner shirt collar
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(206, 390);
        ctx.lineTo(185, 450);
        ctx.lineTo(227, 450);
        ctx.closePath();
        ctx.fill();

        // Neck
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(186, 330, 40, 70);

        // Head / Face
        ctx.beginPath();
        ctx.ellipse(206, 250, 75, 95, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fde68a';
        ctx.fill();

        // Hair
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(206, 220, 80, Math.PI, 0);
        ctx.lineTo(286, 280);
        ctx.lineTo(260, 240);
        ctx.lineTo(152, 240);
        ctx.lineTo(126, 280);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(176, 245, 6, 0, Math.PI * 2);
        ctx.arc(236, 245, 6, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(206, 280, 22, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();

        const img = new Image();
        img.src = c.toDataURL('image/jpeg', 0.95);

        const sampleId = 'sample_portrait_demo';
        this.state.photos = [{
            id: sampleId,
            name: 'Sample Portrait (Upload your photo)',
            sizeStr: 'Default Demo',
            dimStr: '413 × 531',
            dataUrl: img.src,
            img: img,
            copies: 12,
            zoom: 1.0,
            panX: 0,
            panY: 0,
            rotation: 0,
            isFlippedH: false,
            bgColor: '#ffffff',
            hasBorder: true
        }];
        this.state.activePhotoId = sampleId;
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
                            <p class="text-xs text-slate-500">Pick rows &amp; columns to tile passport photos on A4 sheet with 100% exact millimeter scale.</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button type="button" id="ps-btn-upload-direct" class="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <span>Upload Your Photo</span>
                        </button>
                        <button type="button" id="ps-btn-reset-all" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
                            <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                            <span>Reset</span>
                        </button>
                    </div>
                </div>

                <!-- Main Studio Workspace (Left Controls & Right Live A4 Stage) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    <!-- LEFT COLUMN: Photo Upload, Presets & Framing Controls (5 cols) -->
                    <div class="lg:col-span-5 space-y-4">
                        
                        <!-- Upload Dropzone -->
                        <div id="ps-dropzone" class="border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/20 hover:bg-red-50/40 rounded-2xl p-4 text-center cursor-pointer transition group">
                            <input type="file" id="ps-file-input" accept="image/jpeg,image/png,image/webp" multiple class="hidden">
                            <div class="space-y-1.5 pointer-events-none">
                                <div class="w-10 h-10 mx-auto rounded-xl bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition shadow-2xs">
                                    <i data-lucide="image-plus" class="w-5 h-5"></i>
                                </div>
                                <h4 class="text-xs sm:text-sm font-bold text-slate-800">Drop Portrait Photograph Here</h4>
                                <p class="text-[11px] text-slate-500">Supports JPG, PNG, WebP &bull; High resolution camera photos</p>
                                <button type="button" class="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold shadow-2xs pointer-events-auto">Browse Device</button>
                            </div>
                        </div>

                        <!-- Document Preset Selector -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="crop" class="w-4 h-4 text-blue-600"></i>
                                    <span>Passport &amp; ID Size Preset</span>
                                </div>
                                <span id="ps-target-px-pill" class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                    35 × 45 mm (413 × 531 px)
                                </span>
                            </div>

                            <div>
                                <select id="ps-preset-select" class="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white font-medium">
                                    ${PASSPORT_PRESETS.map(p => `
                                        <option value="${p.id}" ${p.id === 'in-passport' ? 'selected' : ''}>
                                            ${p.country}: ${p.purpose} (${p.widthMm} × ${p.heightMm} mm)
                                        </option>
                                    `).join('')}
                                </select>
                                <p id="ps-preset-desc" class="text-[11px] text-slate-500 mt-1 font-medium">Standard 35 × 45 mm color photo with light background.</p>
                            </div>

                            <!-- Custom Size Drawer -->
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
                        </div>

                        <!-- Interactive Crop, Zoom & Framing Canvas -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                                    <i data-lucide="move" class="w-4 h-4 text-red-600"></i>
                                    <span>Interactive Face Framing</span>
                                </div>
                                <span class="text-[10px] font-mono text-slate-400">Drag to center face</span>
                            </div>

                            <div class="relative w-full flex items-center justify-center p-3 bg-slate-900/5 rounded-xl border border-slate-200/80 overflow-hidden select-none min-h-[220px]">
                                <canvas id="ps-crop-canvas" class="rounded shadow border border-slate-300 max-h-[200px] max-w-full bg-white cursor-grab active:cursor-grabbing"></canvas>
                                
                                <div class="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] px-2 py-0.5 rounded font-mono pointer-events-none">
                                    Drag photo to reposition
                                </div>
                            </div>

                            <!-- Zoom Slider -->
                            <div>
                                <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                                    <span>Face Scale &amp; Zoom</span>
                                    <span id="ps-zoom-text" class="font-bold text-red-600 font-mono">100%</span>
                                </div>
                                <input type="range" id="ps-zoom-range" min="30" max="350" value="100" class="w-full accent-red-600 cursor-pointer h-2 bg-slate-200 rounded-lg">
                            </div>

                            <!-- Rotate, Flip & Recenter -->
                            <div class="grid grid-cols-4 gap-1.5 text-xs">
                                <button type="button" id="ps-btn-rot-ccw" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer" title="Rotate 90 Left">
                                    <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                                    <span>-90°</span>
                                </button>
                                <button type="button" id="ps-btn-rot-cw" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer" title="Rotate 90 Right">
                                    <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
                                    <span>+90°</span>
                                </button>
                                <button type="button" id="ps-btn-flip-h" class="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer" title="Mirror Photo">
                                    <i data-lucide="flip-horizontal" class="w-3.5 h-3.5"></i>
                                    <span>Mirror</span>
                                </button>
                                <button type="button" id="ps-btn-recenter" class="px-2 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold flex items-center justify-center shadow-2xs cursor-pointer" title="Reset Framing">
                                    <span>Reset</span>
                                </button>
                            </div>

                            <!-- Studio Styling: Background Color & Cut Border -->
                            <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[11px] font-bold text-slate-600">BG:</span>
                                    <button type="button" class="ps-bg-btn active px-2 py-0.5 rounded-lg border border-slate-300 font-semibold text-[10px] flex items-center gap-1 bg-white shadow-2xs" data-color="#ffffff">
                                        <span class="w-2.5 h-2.5 rounded-full bg-white border border-slate-300"></span>
                                        <span>White</span>
                                    </button>
                                    <button type="button" class="ps-bg-btn px-2 py-0.5 rounded-lg border border-slate-200 font-semibold text-[10px] flex items-center gap-1 bg-slate-50 hover:bg-white" data-color="#dbeafe">
                                        <span class="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-300"></span>
                                        <span>Blue</span>
                                    </button>
                                    <button type="button" class="ps-bg-btn px-2 py-0.5 rounded-lg border border-slate-200 font-semibold text-[10px] flex items-center gap-1 bg-slate-50 hover:bg-white" data-color="#f1f5f9">
                                        <span class="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></span>
                                        <span>Gray</span>
                                    </button>
                                </div>

                                <label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-medium select-none">
                                    <input type="checkbox" id="ps-toggle-border" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                    <span>Dark border</span>
                                </label>
                            </div>
                        </div>

                    </div>

                    <!-- RIGHT COLUMN: User-Selected Rows/Columns & Realistic A4 Paper Stage (7 cols) -->
                    <div class="lg:col-span-7 space-y-4">
                        
                        <!-- A4 Grid & Layout Selector Bar (User Request: Select photos in row and columns!) -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div class="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                                    <i data-lucide="grid" class="w-4 h-4 text-red-600"></i>
                                    <span>A4 Sheet Grid: Photos Per Row &amp; Columns</span>
                                </div>
                                <span id="ps-live-grid-summary" class="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-black border border-red-200 font-mono">
                                    3 Cols × 4 Rows = 12 Photos
                                </span>
                            </div>

                            <!-- Quick 1-Click Studio Grid Presets -->
                            <div>
                                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quick Studio Grid Presets</label>
                                <div class="flex flex-wrap gap-1.5">
                                    <button type="button" class="ps-grid-preset-btn active px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-700 text-xs font-bold shadow-2xs transition cursor-pointer" data-cols="3" data-rows="4">
                                        ⭐ 3 × 4 (12 Photos)
                                    </button>
                                    <button type="button" class="ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer" data-cols="4" data-rows="4">
                                        4 × 4 (16 Photos)
                                    </button>
                                    <button type="button" class="ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer" data-cols="4" data-rows="5">
                                        4 × 5 (20 Photos)
                                    </button>
                                    <button type="button" class="ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer" data-cols="5" data-rows="5">
                                        5 × 5 (25 Photos)
                                    </button>
                                    <button type="button" class="ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer" data-cols="2" data-rows="4">
                                        2 × 4 (8 Photos - 4×6)
                                    </button>
                                    <button type="button" class="ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer" data-cols="2" data-rows="3">
                                        2 × 3 (6 Photos)
                                    </button>
                                </div>
                            </div>

                            <!-- Interactive Steppers for Exact Rows and Columns -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                
                                <!-- Photos per row (Columns) -->
                                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <div class="flex items-center justify-between mb-1">
                                        <div class="flex items-center gap-1.5">
                                            <span class="text-xs font-bold text-slate-800">Photos per Row (Cols):</span>
                                            <span id="ps-max-cols-badge" class="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded">Max: 5</span>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <button type="button" id="ps-btn-dec-cols" class="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs">-</button>
                                            <span id="ps-val-cols" class="w-8 text-center font-black text-sm text-red-600 font-mono">3</span>
                                            <button type="button" id="ps-btn-inc-cols" class="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs">+</button>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-1 pt-1">
                                        <span class="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                                        <div class="flex items-center gap-1">
                                            <button type="button" class="ps-col-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="2">2</button>
                                            <button type="button" class="ps-col-pill px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold" data-val="3">3</button>
                                            <button type="button" class="ps-col-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="4">4</button>
                                            <button type="button" class="ps-col-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="5">5</button>
                                            <button type="button" class="ps-col-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="6">6</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Number of Rows -->
                                <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-xs font-bold text-slate-800">Number of Rows:</span>
                                        <div class="flex items-center gap-1">
                                            <button type="button" id="ps-btn-dec-rows" class="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs">-</button>
                                            <span id="ps-val-rows" class="w-8 text-center font-black text-sm text-red-600 font-mono">4</span>
                                            <button type="button" id="ps-btn-inc-rows" class="w-6 h-6 rounded-lg bg-white border border-slate-300 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs">+</button>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-1 pt-1">
                                        <span class="text-[10px] text-slate-400 font-medium">Quick Pick:</span>
                                        <div class="flex items-center gap-1">
                                            <button type="button" class="ps-row-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="2">2</button>
                                            <button type="button" class="ps-row-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="3">3</button>
                                            <button type="button" class="ps-row-pill px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold" data-val="4">4</button>
                                            <button type="button" class="ps-row-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="5">5</button>
                                            <button type="button" class="ps-row-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400" data-val="6">6</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Paper Format & Scissor Cutting Lines -->
                            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                                <div class="flex items-center gap-2">
                                    <label class="text-[11px] font-bold text-slate-700">Paper:</label>
                                    <select id="ps-paper-select" class="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-semibold">
                                        ${PAPER_FORMATS.map(f => `
                                            <option value="${f.id}" ${f.id === 'a4-portrait' ? 'selected' : ''}>${f.name}</option>
                                        `).join('')}
                                    </select>
                                </div>

                                <div class="flex items-center gap-3">
                                    <label class="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
                                        <input type="checkbox" id="ps-toggle-cutlines" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                        <span>Scissor cut lines</span>
                                    </label>
                                    <label class="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 select-none">
                                        <input type="checkbox" id="ps-toggle-fill" checked class="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5">
                                        <span>Repeat to fill sheet</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Sheet Margins & Spacing (Top 2mm Studio Standard) -->
                            <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="text-[11px] font-bold text-slate-700">Top Margin:</span>
                                    <div class="flex items-center gap-1">
                                        <button type="button" id="ps-btn-dec-margin" class="w-5 h-5 rounded bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs text-[10px]">-</button>
                                        <input type="number" id="ps-input-margin-top" min="0" max="80" step="1" value="2" class="w-12 px-1 py-0.5 text-xs text-center border border-slate-200 rounded bg-white font-bold text-red-600 font-mono">
                                        <span class="text-[11px] font-semibold text-slate-500">mm</span>
                                        <button type="button" id="ps-btn-inc-margin" class="w-5 h-5 rounded bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs text-[10px]">+</button>
                                    </div>
                                    <span class="text-[10px] text-slate-400 font-medium">(2mm top margin for paper reuse)</span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="text-[11px] font-bold text-slate-700">Photo Gap:</span>
                                    <div class="flex items-center gap-1">
                                        <input type="number" id="ps-input-gap" min="0" max="25" step="1" value="4" class="w-12 px-1 py-0.5 text-xs text-center border border-slate-200 rounded bg-white font-bold text-slate-700 font-mono">
                                        <span class="text-[11px] font-semibold text-slate-500">mm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- REALISTIC A4 PAPER PREVIEW STAGE (Matches User's Uploaded Image!) -->
                        <div class="bg-gradient-to-b from-slate-100 to-slate-200/90 border border-slate-300 rounded-3xl p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                            
                            <!-- Dynamic Overflow Warning Alert (Shows when photos exceed paper width) -->
                            <div id="ps-overflow-warning-box" class="w-full max-w-[480px] mb-3 hidden z-20"></div>

                            <!-- Visual Stacked Sheets Mockup Effect in Background (Just like user's photo!) -->
                            <div class="absolute w-[72%] max-w-[420px] h-[88%] bg-white/70 rounded-md shadow-lg -rotate-6 -translate-x-12 translate-y-4 border border-slate-200 pointer-events-none hidden sm:block"></div>
                            <div class="absolute w-[74%] max-w-[430px] h-[89%] bg-white/85 rounded-md shadow-lg -rotate-3 -translate-x-6 translate-y-2 border border-slate-200 pointer-events-none hidden sm:block"></div>

                            <!-- Main Foreground A4 Paper Sheet (Realistic Drop Shadow & Studio Crispness) -->
                            <div class="relative bg-white rounded-sm overflow-hidden z-10 transition-transform duration-200 hover:scale-[1.01]" 
                                 style="box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08);">
                                
                                <canvas id="ps-sheet-canvas" class="block max-h-[520px] max-w-full bg-white"></canvas>

                            </div>

                            <div class="mt-3 z-10 flex items-center gap-2 text-[11px] font-bold text-slate-600 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span id="ps-sheet-caption">Realistic A4 Paper Preview &bull; 100% Actual Print Size</span>
                            </div>
                        </div>

                        <!-- EXPORT & PRINT ACTION BAR (Prominent & High-Priority) -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div class="flex items-center gap-2">
                                <button type="button" id="ps-btn-dl-single" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer" title="Download single 300 DPI photo">
                                    <i data-lucide="image" class="w-4 h-4 text-slate-600"></i>
                                    <span>Single Photo</span>
                                </button>
                                <button type="button" id="ps-btn-dl-sheet-img" class="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer" title="Download 300 DPI A4 sheet as JPG">
                                    <i data-lucide="file-image" class="w-4 h-4 text-slate-300"></i>
                                    <span>A4 Image (JPG)</span>
                                </button>
                            </div>

                            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <!-- Download Print-Ready PDF -->
                                <button type="button" id="ps-btn-dl-pdf" class="flex-1 sm:flex-initial px-4 py-2.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                                    <i data-lucide="file-text" class="w-4 h-4 text-amber-400"></i>
                                    <span>Download PDF</span>
                                </button>

                                <!-- Direct 100% Actual-Size Print Button -->
                                <button type="button" id="ps-btn-print" class="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer">
                                    <i data-lucide="printer" class="w-4 h-4"></i>
                                    <span>PRINT A4 SHEET</span>
                                </button>
                            </div>
                        </div>

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
                                    <p class="text-[11px] text-slate-500">Physical millimeter measurement accuracy guide</p>
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
                            <button id="ps-btn-cancel-print" class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
                            <button id="ps-btn-confirm-print" class="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer">
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
        const directUploadBtn = document.getElementById('ps-btn-upload-direct');
        const resetAllBtn = document.getElementById('ps-btn-reset-all');

        // File upload triggers
        dropzone?.addEventListener('click', () => fileInput?.click());
        directUploadBtn?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            if (e.target?.files?.length) {
                this.loadFiles(Array.from(e.target.files));
                fileInput.value = '';
            }
        });

        // ================= ROWS & COLUMNS CONTROLS =================
        const valCols = document.getElementById('ps-val-cols');
        const valRows = document.getElementById('ps-val-rows');
        const liveSummary = document.getElementById('ps-live-grid-summary');

        const updateGridUI = () => {
            if (valCols) valCols.textContent = this.state.cols;
            if (valRows) valRows.textContent = this.state.rows;
            const total = this.state.cols * this.state.rows;
            if (liveSummary) {
                liveSummary.textContent = `${this.state.cols} Cols × ${this.state.rows} Rows = ${total} Photos`;
            }

            // Sync quick pick pills
            document.querySelectorAll('.ps-col-pill').forEach(btn => {
                const v = parseInt(btn.getAttribute('data-val'), 10);
                if (v === this.state.cols) {
                    btn.className = 'ps-col-pill px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold';
                } else {
                    btn.className = 'ps-col-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400';
                }
            });

            document.querySelectorAll('.ps-row-pill').forEach(btn => {
                const v = parseInt(btn.getAttribute('data-val'), 10);
                if (v === this.state.rows) {
                    btn.className = 'ps-row-pill px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold';
                } else {
                    btn.className = 'ps-row-pill px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:border-red-400';
                }
            });

            // Sync quick grid preset buttons
            document.querySelectorAll('.ps-grid-preset-btn').forEach(btn => {
                const c = parseInt(btn.getAttribute('data-cols'), 10);
                const r = parseInt(btn.getAttribute('data-rows'), 10);
                if (c === this.state.cols && r === this.state.rows) {
                    btn.className = 'ps-grid-preset-btn active px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-700 text-xs font-bold shadow-2xs transition cursor-pointer';
                } else {
                    btn.className = 'ps-grid-preset-btn px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer';
                }
            });

            // Max columns capacity badge
            const maxColsBadge = document.getElementById('ps-max-cols-badge');
            if (maxColsBadge) {
                const m = this.calculateSheetMetrics();
                if (m.isOverflowX) {
                    maxColsBadge.className = 'text-[10px] text-amber-800 bg-amber-100 font-bold px-1.5 py-0.5 rounded border border-amber-300';
                    maxColsBadge.textContent = `⚠️ Max ${m.maxCols} fit`;
                } else {
                    maxColsBadge.className = 'text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded';
                    maxColsBadge.textContent = `Max: ${m.maxCols}`;
                }
            }

            this.renderSheetPreview();
        };
        this.updateGridUI = updateGridUI;

        // Stepper: Columns
        document.getElementById('ps-btn-dec-cols')?.addEventListener('click', () => {
            if (this.state.cols > 1) {
                this.state.cols--;
                updateGridUI();
            }
        });
        document.getElementById('ps-btn-inc-cols')?.addEventListener('click', () => {
            if (this.state.cols < 10) {
                this.state.cols++;
                updateGridUI();
            }
        });

        // Stepper: Rows
        document.getElementById('ps-btn-dec-rows')?.addEventListener('click', () => {
            if (this.state.rows > 1) {
                this.state.rows--;
                updateGridUI();
            }
        });
        document.getElementById('ps-btn-inc-rows')?.addEventListener('click', () => {
            if (this.state.rows < 12) {
                this.state.rows++;
                updateGridUI();
            }
        });

        // Quick Pick Column Pills
        document.querySelectorAll('.ps-col-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.cols = parseInt(btn.getAttribute('data-val'), 10) || 3;
                updateGridUI();
            });
        });

        // Quick Pick Row Pills
        document.querySelectorAll('.ps-row-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.rows = parseInt(btn.getAttribute('data-val'), 10) || 4;
                updateGridUI();
            });
        });

        // Quick Grid Preset Buttons (e.g. 3x4, 4x4, 5x5)
        document.querySelectorAll('.ps-grid-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.cols = parseInt(btn.getAttribute('data-cols'), 10) || 3;
                this.state.rows = parseInt(btn.getAttribute('data-rows'), 10) || 4;
                updateGridUI();
            });
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
                this.state.bgColor = color;
                const activePhoto = this.getActivePhoto();
                if (activePhoto) {
                    activePhoto.bgColor = color;
                }
                this.renderCropCanvas();
                this.renderSheetPreview();
            });
        });

        // Cutting border toggle
        document.getElementById('ps-toggle-border')?.addEventListener('change', (e) => {
            this.state.hasBorder = e.target.checked;
            const activePhoto = this.getActivePhoto();
            if (activePhoto) {
                activePhoto.hasBorder = e.target.checked;
            }
            this.renderCropCanvas();
            this.renderSheetPreview();
        });

        // Scissor cutting lines toggle
        document.getElementById('ps-toggle-cutlines')?.addEventListener('change', (e) => {
            this.state.showCutLines = e.target.checked;
            this.renderSheetPreview();
        });

        // Repeat to fill sheet toggle
        document.getElementById('ps-toggle-fill')?.addEventListener('change', (e) => {
            this.state.fillSheet = e.target.checked;
            this.renderSheetPreview();
        });

        // Paper format selector
        document.getElementById('ps-paper-select')?.addEventListener('change', (e) => {
            this.state.paperId = e.target.value;
            this.renderSheetPreview();
        });

        // Top Margin controls (Studio standard 2mm)
        const marginInput = document.getElementById('ps-input-margin-top');
        marginInput?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state.marginT = !isNaN(val) && val >= 0 ? val : 2;
            this.renderSheetPreview();
        });
        document.getElementById('ps-btn-dec-margin')?.addEventListener('click', () => {
            const current = (this.state.marginT !== undefined ? this.state.marginT : 2);
            if (current > 0) {
                this.state.marginT = Math.max(0, current - 1);
                if (marginInput) marginInput.value = this.state.marginT;
                this.renderSheetPreview();
            }
        });
        document.getElementById('ps-btn-inc-margin')?.addEventListener('click', () => {
            const current = (this.state.marginT !== undefined ? this.state.marginT : 2);
            this.state.marginT = Math.min(80, current + 1);
            if (marginInput) marginInput.value = this.state.marginT;
            this.renderSheetPreview();
        });

        // Photo Gap control
        const gapInput = document.getElementById('ps-input-gap');
        gapInput?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.state.gapX = !isNaN(val) && val >= 0 ? val : 4;
            this.state.gapY = !isNaN(val) && val >= 0 ? val : 4;
            this.renderSheetPreview();
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

        // Action Buttons
        document.getElementById('ps-btn-dl-single')?.addEventListener('click', () => this.downloadSinglePhoto('jpeg'));
        document.getElementById('ps-btn-dl-sheet-img')?.addEventListener('click', () => this.downloadSheetImage('jpeg'));
        document.getElementById('ps-btn-dl-pdf')?.addEventListener('click', () => this.downloadSheetPdf());

        // Print Flow
        const printModal = document.getElementById('ps-print-modal');
        document.getElementById('ps-btn-print')?.addEventListener('click', () => {
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
            this.initDefaultSamplePhoto();
            this.state.cols = 3;
            this.state.rows = 4;
            this.state.marginT = 2;
            this.state.gapX = 4;
            this.state.gapY = 5;
            const mIn = document.getElementById('ps-input-margin-top');
            if (mIn) mIn.value = 2;
            const gIn = document.getElementById('ps-input-gap');
            if (gIn) gIn.value = 4;
            updateGridUI();
            this.renderCropCanvas();
            this.renderSheetPreview();
            this.app.showToast('Reset to default 3 × 4 studio layout.', 'info');
        });
    }

    // ================= FILE LOADING =================
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

            const newPhoto = {
                id,
                name: file.name,
                sizeStr,
                dimStr,
                dataUrl,
                img,
                copies: this.state.cols * this.state.rows,
                zoom: 1.0,
                panX: 0,
                panY: 0,
                rotation: 0,
                isFlippedH: false,
                bgColor: this.state.bgColor || '#ffffff',
                hasBorder: this.state.hasBorder
            };

            // Replace demo placeholder or add to list
            if (this.state.photos.length === 1 && this.state.photos[0].id === 'sample_portrait_demo') {
                this.state.photos = [newPhoto];
            } else {
                this.state.photos.unshift(newPhoto);
            }

            this.state.activePhotoId = id;
            loadedCount++;
        }

        if (loadedCount > 0) {
            this.syncActivePhotoControls();
            this.renderCropCanvas();
            this.renderSheetPreview();
            this.app.showToast(`Loaded ${loadedCount} photo(s)! Preview updated on A4 sheet.`, 'success');
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

    syncActivePhotoControls() {
        const p = this.getActivePhoto();
        if (!p) return;

        const zoomRange = document.getElementById('ps-zoom-range');
        const zoomText = document.getElementById('ps-zoom-text');
        if (zoomRange) zoomRange.value = Math.round(p.zoom * 100);
        if (zoomText) zoomText.textContent = `${Math.round(p.zoom * 100)}%`;
    }

    // ================= PHYSICAL DIMENSIONS =================
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
            pill.textContent = `${dim.widthMm} × ${dim.heightMm} mm (${pxW} × ${pxH} px)`;
        }
    }

    // ================= INTERACTIVE CROP CANVAS =================
    renderCropCanvas() {
        const canvas = document.getElementById('ps-crop-canvas');
        if (!canvas) return;

        const photo = this.getActivePhoto();
        const ctx = canvas.getContext('2d');
        const dim = this.getPhotoDimensionsMm();

        const targetW = Math.round((dim.widthMm * 300) / 25.4);
        const targetH = Math.round((dim.heightMm * 300) / 25.4);

        canvas.width = targetW;
        canvas.height = targetH;

        if (!photo || !photo.img) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, targetW, targetH);
            return;
        }

        // 1. Fill Background Color
        ctx.fillStyle = photo.bgColor || this.state.bgColor || '#ffffff';
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

        // 3. Dark Photo Cut Outline (matches user's uploaded photo)
        if (this.state.hasBorder) {
            ctx.save();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = Math.max(1, Math.round(targetW * 0.0035));
            ctx.strokeRect(0, 0, targetW, targetH);
            ctx.restore();
        }

        // 4. Biometric Face Oval Guide Overlay
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

            ctx.restore();
        }
    }

    // ================= CLEAN 300 DPI PHOTO GENERATOR =================
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
        ctx.fillStyle = photo.bgColor || this.state.bgColor || '#ffffff';
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

        // Dark Outline (matching studio print)
        if (this.state.hasBorder) {
            ctx.save();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = Math.max(1, Math.round(targetW * 0.0035));
            ctx.strokeRect(0, 0, targetW, targetH);
            ctx.restore();
        }

        return canvas;
    }

    // ================= REALISTIC A4 SHEET PREVIEW =================
    calculateSheetMetrics() {
        const paper = this.getSelectedPaper();
        const photo = this.getPhotoDimensionsMm();

        const cols = Number(this.state.cols) || 3;
        const rows = Number(this.state.rows) || 4;
        const gapX = Number(this.state.gapX) || 4;
        const gapY = Number(this.state.gapY) || 5;

        // Total grid dimensions
        const gridW = (cols * photo.widthMm) + ((cols - 1) * gapX);
        const gridH = (rows * photo.heightMm) + ((rows - 1) * gapY);

        // Top margin: 2mm (Studio & Cyber Cafe standard - starts 2mm from top edge, not centered)
        const marginT = (this.state.marginT !== undefined && this.state.marginT !== null && !isNaN(this.state.marginT))
            ? Math.max(0, Number(this.state.marginT))
            : 2;

        // Horizontally centered across the page width
        const marginL = Math.max(2, (paper.widthMm - gridW) / 2);

        // Physical Paper Fit Calculation
        const minMargin = 2; // mm minimum margin
        const maxCols = Math.max(1, Math.floor((paper.widthMm - (minMargin * 2) + gapX) / (photo.widthMm + gapX)));
        const maxRows = Math.max(1, Math.floor((paper.heightMm - marginT + gapY) / (photo.heightMm + gapY)));
        const isOverflowX = gridW > paper.widthMm;
        const isOverflowY = (marginT + gridH) > paper.heightMm;

        const totalSlots = cols * rows;

        return {
            paper,
            photo,
            cols,
            rows,
            gapX,
            gapY,
            gridW,
            gridH,
            marginL,
            marginT,
            maxCols,
            maxRows,
            isOverflowX,
            isOverflowY,
            totalSlots
        };
    }

    renderSheetPreview() {
        const canvas = document.getElementById('ps-sheet-canvas');
        if (!canvas) return;

        const m = this.calculateSheetMetrics();
        const ctx = canvas.getContext('2d');

        // Scale proportionally for screen preview (Aspect ratio matches exact paper: 210 x 297 mm)
        const PREVIEW_DPI = 96; // Crisp on-screen resolution
        const mmToPx = PREVIEW_DPI / 25.4;
        const sheetW = Math.round(m.paper.widthMm * mmToPx);
        const sheetH = Math.round(m.paper.heightMm * mmToPx);

        canvas.width = sheetW;
        canvas.height = sheetH;

        // 1. Pure Crisp White Paper Surface
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        // 2. Subtle Printable Border Guide (Fine paper perimeter margin)
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, 2, sheetW - 4, sheetH - 4);

        // 3. Tile the Photos in the exact (Cols × Rows) grid
        const photoWPx = m.photo.widthMm * mmToPx;
        const photoHPx = m.photo.heightMm * mmToPx;
        const gapXPx = m.gapX * mmToPx;
        const gapYPx = m.gapY * mmToPx;
        const startXPx = m.marginL * mmToPx;
        const startYPx = m.marginT * mmToPx;

        const activePhoto = this.getActivePhoto();
        const cleanPhotoCanvas = activePhoto ? this.generateCleanPhotoCanvas(activePhoto, 180) : null;

        for (let r = 0; r < m.rows; r++) {
            for (let c = 0; c < m.cols; c++) {
                const x = startXPx + (c * (photoWPx + gapXPx));
                const y = startYPx + (r * (photoHPx + gapYPx));

                if (cleanPhotoCanvas) {
                    ctx.drawImage(cleanPhotoCanvas, x, y, photoWPx, photoHPx);
                } else {
                    // Placeholder box
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(x, y, photoWPx, photoHPx);
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.strokeRect(x, y, photoWPx, photoHPx);
                }
            }
        }

        // 4. Scissor Cutting Lines / Guides (subtle dashed gray lines)
        if (this.state.showCutLines) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.75;
            ctx.setLineDash([3, 3]);

            // Vertical cutting lines between cols
            for (let c = 1; c < m.cols; c++) {
                const lineX = startXPx + (c * (photoWPx + gapXPx)) - (gapXPx / 2);
                ctx.beginPath();
                ctx.moveTo(lineX, Math.max(0, startYPx - 3));
                ctx.lineTo(lineX, startYPx + (m.gridH * mmToPx) + 3);
                ctx.stroke();
            }

            // Horizontal cutting lines between rows
            for (let r = 1; r < m.rows; r++) {
                const lineY = startYPx + (r * (photoHPx + gapYPx)) - (gapYPx / 2);
                ctx.beginPath();
                ctx.moveTo(startXPx - 6, lineY);
                ctx.lineTo(startXPx + (m.gridW * mmToPx) + 6, lineY);
                ctx.stroke();
            }

            // Horizontal strip cutting line right below the last row (allows cutting the printed strip off the paper)
            const bottomCutLineY = startYPx + (m.gridH * mmToPx) + (gapYPx / 2);
            ctx.beginPath();
            ctx.moveTo(startXPx - 6, bottomCutLineY);
            ctx.lineTo(startXPx + (m.gridW * mmToPx) + 6, bottomCutLineY);
            ctx.stroke();

            ctx.restore();
        }

        // Update Overflow Warning Box
        const warnBox = document.getElementById('ps-overflow-warning-box');
        if (warnBox) {
            if (m.isOverflowX) {
                warnBox.classList.remove('hidden');
                warnBox.innerHTML = `
                    <div class="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 shadow-sm flex flex-col gap-2">
                        <div class="flex items-start gap-2">
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
                            <div>
                                <span class="font-bold text-amber-900">Paper Width Exceeded:</span>
                                <span> ${m.cols} photos (${Math.round(m.gridW)} mm) exceed ${m.paper.label} width (${m.paper.widthMm} mm). That's why the last photo cuts off! Physical A4 width is 210 mm (max <strong>${m.maxCols} photos</strong> fit per row).</span>
                            </div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200">
                            <button type="button" id="ps-btn-fix-fit-cols" class="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs">
                                <i data-lucide="check" class="w-3 h-3"></i> Set to ${m.maxCols} Cols (Fit A4)
                            </button>
                            <button type="button" id="ps-btn-fix-landscape" class="px-3 py-1 bg-slate-800 hover:bg-black text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs">
                                <i data-lucide="rotate-cw" class="w-3 h-3"></i> Switch to A4 Landscape (Fits 6-7)
                            </button>
                        </div>
                    </div>
                `;
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }

                document.getElementById('ps-btn-fix-fit-cols')?.addEventListener('click', () => {
                    this.state.cols = m.maxCols;
                    if (typeof this.updateGridUI === 'function') this.updateGridUI();
                    else this.renderSheetPreview();
                });

                document.getElementById('ps-btn-fix-landscape')?.addEventListener('click', () => {
                    this.state.paperId = 'a4-landscape';
                    const pSelect = document.getElementById('ps-paper-select');
                    if (pSelect) pSelect.value = 'a4-landscape';
                    if (typeof this.updateGridUI === 'function') this.updateGridUI();
                    else this.renderSheetPreview();
                });
            } else {
                warnBox.classList.add('hidden');
                warnBox.innerHTML = '';
            }
        }

        // Update Caption & Summary
        const caption = document.getElementById('ps-sheet-caption');
        if (caption) {
            if (m.isOverflowX) {
                caption.innerHTML = `⚠️ <span class="text-amber-600 font-bold">Width Exceeded:</span> ${m.cols} Cols &gt; Max ${m.maxCols} fit &bull; Switch to Landscape for 6 photos`;
            } else {
                caption.innerHTML = `A4 Sheet Preview &bull; ${m.cols} Cols &times; ${m.rows} Rows (${m.totalSlots} Photos) &bull; Top: ${m.marginT}mm`;
            }
        }
    }

    // ================= FULL 300 DPI HIGH-RES SHEET CANVAS =================
    generateHighResSheetCanvas(dpi = 300) {
        const m = this.calculateSheetMetrics();
        const mmToPx = dpi / 25.4;
        const sheetW = Math.round(m.paper.widthMm * mmToPx);
        const sheetH = Math.round(m.paper.heightMm * mmToPx);

        const canvas = document.createElement('canvas');
        canvas.width = sheetW;
        canvas.height = sheetH;
        const ctx = canvas.getContext('2d');

        // Pure white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sheetW, sheetH);

        const photoWPx = m.photo.widthMm * mmToPx;
        const photoHPx = m.photo.heightMm * mmToPx;
        const gapXPx = m.gapX * mmToPx;
        const gapYPx = m.gapY * mmToPx;
        const startXPx = m.marginL * mmToPx;
        const startYPx = m.marginT * mmToPx;

        const activePhoto = this.getActivePhoto();
        const cleanPhotoCanvas = activePhoto ? this.generateCleanPhotoCanvas(activePhoto, dpi) : null;

        for (let r = 0; r < m.rows; r++) {
            for (let c = 0; c < m.cols; c++) {
                const x = startXPx + (c * (photoWPx + gapXPx));
                const y = startYPx + (r * (photoHPx + gapYPx));

                if (cleanPhotoCanvas) {
                    ctx.drawImage(cleanPhotoCanvas, x, y, photoWPx, photoHPx);
                }
            }
        }

        // Cutting lines
        if (this.state.showCutLines) {
            ctx.save();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = Math.max(1, Math.round(sheetW * 0.0008));
            ctx.setLineDash([8, 8]);

            for (let c = 1; c < m.cols; c++) {
                const lineX = startXPx + (c * (photoWPx + gapXPx)) - (gapXPx / 2);
                ctx.beginPath();
                ctx.moveTo(lineX, Math.max(0, startYPx - (3 * mmToPx)));
                ctx.lineTo(lineX, startYPx + (m.gridH * mmToPx) + (3 * mmToPx));
                ctx.stroke();
            }

            for (let r = 1; r < m.rows; r++) {
                const lineY = startYPx + (r * (photoHPx + gapYPx)) - (gapYPx / 2);
                ctx.beginPath();
                ctx.moveTo(startXPx - (6 * mmToPx), lineY);
                ctx.lineTo(startXPx + (m.gridW * mmToPx) + (6 * mmToPx), lineY);
                ctx.stroke();
            }

            // Strip cutting line right below last row
            const bottomCutLineY = startYPx + (m.gridH * mmToPx) + (gapYPx / 2);
            ctx.beginPath();
            ctx.moveTo(startXPx - (6 * mmToPx), bottomCutLineY);
            ctx.lineTo(startXPx + (m.gridW * mmToPx) + (6 * mmToPx), bottomCutLineY);
            ctx.stroke();

            ctx.restore();
        }

        // Footer Note
        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.round(8 * (dpi / 72))}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`TECHTIS Studio (${m.cols} × ${m.rows} = ${m.totalSlots} Photos) • Photo Size: ${m.photo.widthMm} × ${m.photo.heightMm} mm • Top: ${m.marginT} mm • Scale: 100% Actual Size`, startXPx, sheetH - 12);

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
        const canvas = this.generateHighResSheetCanvas(300);
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const ext = format === 'png' ? 'png' : 'jpg';
        const filename = `passport_a4_sheet_${this.state.cols}x${this.state.rows}_300dpi.${ext}`;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Exported high-res 300 DPI sheet (${filename})`);
            this.app.updateHistoryCounter();
            this.app.showToast(`A4 Sheet (${this.state.cols * this.state.rows} Photos) downloaded at 300 DPI!`, 'success');
        }, mime, 0.96);
    }

    // ================= EXACT PHYSICAL MILLIMETER PDF =================
    async downloadSheetPdf() {
        this.app.showToast('Generating exact physical millimeter A4 PDF...', 'info');

        try {
            await ensurePdfLib();
            const pdfDoc = await window.PDFLib.PDFDocument.create();

            const m = this.calculateSheetMetrics();
            if (m.isOverflowX) {
                this.app.showToast(`Notice: ${m.cols} photos exceed ${m.paper.label} width (${m.paper.widthMm}mm). Switch to Landscape to prevent cutting.`, 'warning');
            }
            const MM_TO_PT = 72 / 25.4;

            const paperW_pt = m.paper.widthMm * MM_TO_PT;
            const paperH_pt = m.paper.heightMm * MM_TO_PT;
            const photoW_pt = m.photo.widthMm * MM_TO_PT;
            const photoH_pt = m.photo.heightMm * MM_TO_PT;
            const gapX_pt = m.gapX * MM_TO_PT;
            const gapY_pt = m.gapY * MM_TO_PT;
            const startX_pt = m.marginL * MM_TO_PT;
            const startY_pt = m.marginT * MM_TO_PT;

            const page = pdfDoc.addPage([paperW_pt, paperH_pt]);

            // Embed active photo at 300 DPI
            const activePhoto = this.getActivePhoto();
            const highResCanvas = this.generateCleanPhotoCanvas(activePhoto, 300);
            const dataUrl = highResCanvas.toDataURL('image/jpeg', 0.95);
            const bytes = await fetch(dataUrl).then(r => r.arrayBuffer());
            const embedded = await pdfDoc.embedJpg(bytes);

            // PDF (0,0) is bottom-left
            for (let r = 0; r < m.rows; r++) {
                for (let c = 0; c < m.cols; c++) {
                    const x = startX_pt + (c * (photoW_pt + gapX_pt));
                    const y = paperH_pt - startY_pt - ((r + 1) * photoH_pt) - (r * gapY_pt);

                    page.drawImage(embedded, {
                        x,
                        y,
                        width: photoW_pt,
                        height: photoH_pt
                    });

                    if (this.state.hasBorder) {
                        page.drawRectangle({
                            x,
                            y,
                            width: photoW_pt,
                            height: photoH_pt,
                            borderColor: window.PDFLib.rgb(0.2, 0.25, 0.35),
                            borderWidth: 0.6
                        });
                    }
                }
            }

            // Cutting lines
            if (this.state.showCutLines) {
                const gridBottomY = paperH_pt - startY_pt - (m.rows * photoH_pt) - ((m.rows - 1) * gapY_pt);

                for (let c = 1; c < m.cols; c++) {
                    const lineX = startX_pt + (c * (photoW_pt + gapX_pt)) - (gapX_pt / 2);
                    page.drawLine({
                        start: { x: lineX, y: Math.min(paperH_pt - 1, paperH_pt - startY_pt + 4) },
                        end: { x: lineX, y: Math.max(0, gridBottomY - 4) },
                        color: window.PDFLib.rgb(0.65, 0.7, 0.75),
                        thickness: 0.5,
                        dashArray: [2, 2]
                    });
                }

                for (let r = 1; r < m.rows; r++) {
                    const lineY = paperH_pt - startY_pt - (r * (photoH_pt + gapY_pt)) + (gapY_pt / 2);
                    page.drawLine({
                        start: { x: startX_pt - 6, y: lineY },
                        end: { x: startX_pt + (m.cols * (photoW_pt + gapX_pt)) - gapX_pt + 6, y: lineY },
                        color: window.PDFLib.rgb(0.65, 0.7, 0.75),
                        thickness: 0.5,
                        dashArray: [2, 2]
                    });
                }

                // Strip cutting line right below last row
                const stripCutY = gridBottomY - (gapY_pt / 2);
                page.drawLine({
                    start: { x: startX_pt - 6, y: stripCutY },
                    end: { x: startX_pt + (m.cols * (photoW_pt + gapX_pt)) - gapX_pt + 6, y: stripCutY },
                    color: window.PDFLib.rgb(0.65, 0.7, 0.75),
                    thickness: 0.5,
                    dashArray: [2, 2]
                });
            }

            const fontBold = await pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);
            page.drawText(`TECHTIS Studio (${m.cols} x ${m.rows} = ${m.totalSlots} Photos) • Size: ${m.photo.widthMm} x ${m.photo.heightMm} mm • Top: ${m.marginT} mm • Scale: 100% Actual Size`, {
                x: startX_pt,
                y: 12,
                size: 7.5,
                font: fontBold,
                color: window.PDFLib.rgb(0.3, 0.35, 0.45)
            });

            const pdfBytes = await pdfDoc.save();
            const filename = `techtis_passport_a4_${m.cols}x${m.rows}_${Date.now()}.pdf`;
            PdfHelpers.downloadBytes(pdfBytes, filename, 'application/pdf');

            StorageManager.logActivity('passport-photo-maker', 'Passport Photo Maker', `Generated A4 PDF (${m.totalSlots} photos)`);
            this.app.updateHistoryCounter();
            this.app.showToast(`Print-Ready A4 PDF with ${m.totalSlots} photos generated!`, 'success');
        } catch (err) {
            console.error('PDF sheet error:', err);
            this.app.showToast(`PDF generation error: ${err.message}`, 'error');
        }
    }

    // ================= 100% ACTUAL-SIZE DIRECT PRINT SYSTEM =================
    executeBrowserPrint() {
        const mount = document.getElementById('passport-print-mount');
        if (!mount) return;

        const m = this.calculateSheetMetrics();
        if (m.isOverflowX) {
            this.app.showToast(`Notice: ${m.cols} photos exceed ${m.paper.label} width. Switch to Landscape for 6 photos without cutting.`, 'warning');
        }

        mount.innerHTML = '';
        const sheetCanvas = this.generateHighResSheetCanvas(300);
        const pageDiv = document.createElement('div');
        pageDiv.className = 'passport-print-page';

        const img = document.createElement('img');
        img.className = 'passport-print-img';
        img.src = sheetCanvas.toDataURL('image/png');

        pageDiv.appendChild(img);
        mount.appendChild(pageDiv);

        setTimeout(() => {
            window.print();
            setTimeout(() => {
                mount.innerHTML = '';
            }, 1000);
        }, 300);
    }
}
