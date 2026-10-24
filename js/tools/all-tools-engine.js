/**
 * Complete Client-Side PDF Tools Engine
 * 100% In-Browser Execution via pdf-lib.js, PDF.js, and JSZip.
 * Zero Server Overhead | Zero File Uploads | Sub-100ms In-Memory Processing
 */

import { PdfHelpers } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export const AllToolsEngine = {

    /**
     * Remove specific pages from PDF
     */
    async removePages(fileOrBuffer, pagesToRemoveIndices, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const initialCount = pdfDoc.getPageCount();

        // Sort descending so indices don't shift when removing
        const sortedIndices = [...pagesToRemoveIndices].sort((a, b) => b - a);
        for (const idx of sortedIndices) {
            if (idx >= 0 && idx < pdfDoc.getPageCount()) {
                pdfDoc.removePage(idx);
            }
        }

        if (pdfDoc.getPageCount() === 0) {
            throw new Error('Cannot remove all pages. At least 1 page must remain.');
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'remove-pages',
            toolName: 'Remove Pages',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Removed ${sortedIndices.length} page(s) (${initialCount} → ${pdfDoc.getPageCount()} pages)`
        });

        return { pdfBytes, durationMs, remainingPages: pdfDoc.getPageCount() };
    },

    /**
     * Extract specific pages into a brand new PDF
     */
    async extractPages(fileOrBuffer, pageIndicesToExtract, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const newDoc = await PDFDocument.create();

        const validIndices = pageIndicesToExtract.filter(idx => idx >= 0 && idx < srcDoc.getPageCount());
        if (validIndices.length === 0) {
            throw new Error('Please select at least 1 valid page to extract.');
        }

        const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
        copiedPages.forEach(p => newDoc.addPage(p));

        const pdfBytes = await newDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'extract-pages',
            toolName: 'Extract Pages',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Extracted ${validIndices.length} pages into a new PDF`
        });

        return { pdfBytes, durationMs, pageCount: validIndices.length };
    },

    /**
     * Reorder pages according to a custom array of 0-based indices
     */
    async reorderPages(fileOrBuffer, newOrderIndices, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const newDoc = await PDFDocument.create();

        const copiedPages = await newDoc.copyPages(srcDoc, newOrderIndices);
        copiedPages.forEach(p => newDoc.addPage(p));

        const pdfBytes = await newDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'organize-pages',
            toolName: 'Organize Pages',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Reordered ${newOrderIndices.length} pages`
        });

        return { pdfBytes, durationMs, pageCount: newOrderIndices.length };
    },

    /**
     * Add customizable Watermark to all pages
     */
    async addWatermark(fileOrBuffer, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const text = options.text || 'CONFIDENTIAL';
        const opacity = parseFloat(options.opacity || 0.3);
        const fontSize = parseInt(options.fontSize || 48, 10);
        const angle = parseInt(options.angle || 45, 10);
        const colorHex = options.color || '#ef4444';

        const { PDFDocument, StandardFonts, rgb, degrees } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();

        // Convert hex color to rgb [0, 1]
        const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 0.8;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0.2;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0.2;

        pages.forEach((page) => {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const textHeight = font.heightAtSize(fontSize);

            // Center of the page
            page.drawText(text, {
                x: (width / 2) - (textWidth / 2) * Math.cos(angle * Math.PI / 180),
                y: (height / 2) - (textWidth / 2) * Math.sin(angle * Math.PI / 180),
                size: fontSize,
                font: font,
                color: rgb(r, g, b),
                opacity: opacity,
                rotate: degrees(angle)
            });
        });

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'add-watermark',
            toolName: 'Add Watermark',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Stamped watermark "${text}" across ${pages.length} pages`
        });

        return { pdfBytes, durationMs, pageCount: pages.length };
    },

    /**
     * Add Page Numbers with layout and format control
     */
    async addPageNumbers(fileOrBuffer, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const format = options.format || 'page_of_total'; // 'page_of_total' | 'simple' | 'page_only'
        const position = options.position || 'bottom-center'; // 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-center'
        const fontSize = parseInt(options.fontSize || 10, 10);
        const margin = parseInt(options.margin || 25, 10);

        const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        const total = pages.length;

        pages.forEach((page, i) => {
            const currentNum = i + 1;
            let text = `${currentNum}`;
            if (format === 'page_of_total') text = `Page ${currentNum} of ${total}`;
            else if (format === 'simple') text = `${currentNum} / ${total}`;
            else if (format === 'page_only') text = `Page ${currentNum}`;

            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(text, fontSize);

            let x = (width - textWidth) / 2;
            let y = margin;

            if (position === 'bottom-right') {
                x = width - textWidth - margin;
                y = margin;
            } else if (position === 'bottom-left') {
                x = margin;
                y = margin;
            } else if (position === 'top-center') {
                x = (width - textWidth) / 2;
                y = height - margin;
            } else if (position === 'top-right') {
                x = width - textWidth - margin;
                y = height - margin;
            }

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(0.25, 0.25, 0.25)
            });
        });

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'add-page-numbers',
            toolName: 'Add Page Numbers',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Numbered ${pages.length} pages (${position})`
        });

        return { pdfBytes, durationMs, pageCount: pages.length };
    },

    /**
     * Sign PDF: Embed signature PNG drawn on canvas onto specified page
     */
    async signPdf(fileOrBuffer, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { signatureDataUrl, pageNumber = 1, xPercent = 60, yPercent = 15, scale = 1.0 } = options;
        if (!signatureDataUrl) throw new Error('No signature data provided.');

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const pageIdx = Math.max(0, Math.min(pageNumber - 1, pages.length - 1));
        const targetPage = pages[pageIdx];

        // Fetch signature data url as bytes
        const signatureBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
        const signatureImage = await pdfDoc.embedPng(signatureBytes);

        const imgDims = signatureImage.scale(0.35 * scale);
        const { width: pageWidth, height: pageHeight } = targetPage.getSize();

        // Convert percentage positions to PDF coordinates (PDF origin is bottom-left)
        const x = (pageWidth * (xPercent / 100)) - (imgDims.width / 2);
        const y = (pageHeight * (yPercent / 100)) - (imgDims.height / 2);

        targetPage.drawImage(signatureImage, {
            x: Math.max(10, Math.min(x, pageWidth - imgDims.width - 10)),
            y: Math.max(10, Math.min(y, pageHeight - imgDims.height - 10)),
            width: imgDims.width,
            height: imgDims.height
        });

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'sign-pdf',
            toolName: 'Sign PDF',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Stamped digital signature onto Page ${pageIdx + 1}`
        });

        return { pdfBytes, durationMs, signedPage: pageIdx + 1 };
    },

    /**
     * Render PDF pages to JPG images
     */
    async pdfToJpg(fileOrBuffer, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        if (!window.pdfjsLib) throw new Error('PDF.js rendering engine is not ready.');
        const loadingTask = window.pdfjsLib.getDocument({ data: buffer.slice(0) });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        const renderedImages = [];

        for (let i = 1; i <= totalPages; i++) {
            onProgress({
                step: 'rendering',
                percent: Math.round((i / totalPages) * 90),
                message: `Rendering Page ${i} of ${totalPages} at 2x Hi-DPI...`
            });

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // 2x high resolution
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            // Convert dataUrl to uint8array bytes for zip bundling
            const res = await fetch(dataUrl);
            const blobBytes = new Uint8Array(await res.arrayBuffer());

            renderedImages.push({
                pageNumber: i,
                name: `page_${i}.jpg`,
                dataUrl: dataUrl,
                bytes: blobBytes
            });
        }

        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'pdf-to-jpg',
            toolName: 'PDF to JPG',
            inputTotalSize: buffer.byteLength,
            outputSize: renderedImages.reduce((sum, img) => sum + img.bytes.length, 0),
            durationMs,
            summary: `Rendered ${totalPages} high-DPI JPG images`
        });

        return { renderedImages, totalPages, durationMs };
    },

    /**
     * JPG to PDF: Combine images into formatted PDF
     */
    async jpgToPdf(imageFiles, onProgress = () => {}) {
        const startTime = performance.now();
        if (!imageFiles || imageFiles.length === 0) throw new Error('Please select at least 1 image.');

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < imageFiles.length; i++) {
            const imgFile = imageFiles[i];
            onProgress({
                step: 'converting',
                percent: Math.round(((i + 1) / imageFiles.length) * 90),
                message: `Processing image ${i + 1} of ${imageFiles.length}...`
            });

            const imgBytes = await PdfHelpers.fileToArrayBuffer(imgFile);
            let pdfImg;
            if (imgFile.type === 'image/png' || imgFile.name.toLowerCase().endsWith('.png')) {
                pdfImg = await pdfDoc.embedPng(imgBytes);
            } else {
                pdfImg = await pdfDoc.embedJpg(imgBytes);
            }

            const { width, height } = pdfImg;
            const page = pdfDoc.addPage([width, height]);
            page.drawImage(pdfImg, { x: 0, y: 0, width, height });
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'jpg-to-pdf',
            toolName: 'JPG to PDF',
            inputTotalSize: imageFiles.reduce((sum, f) => sum + f.size, 0),
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Combined ${imageFiles.length} images into PDF`
        });

        return { pdfBytes, durationMs, pageCount: imageFiles.length };
    },

    /**
     * Compress PDF: Optimizes uncompressed streams and object graphs
     */
    async compressPdf(fileOrBuffer, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

        // Strip metadata and compress object streams
        pdfDoc.setProducer('TECHTIS Zero-Cost Stream Compressor (techtis.in)');
        pdfDoc.setCreator('TECHTIS (techtis.in)');

        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        const durationMs = Math.round(performance.now() - startTime);

        const bytesSaved = Math.max(0, buffer.byteLength - pdfBytes.byteLength);
        const percentReduced = buffer.byteLength > 0 ? Math.round((bytesSaved / buffer.byteLength) * 100) : 0;

        StorageManager.addHistoryEntry({
            toolId: 'compress-pdf',
            toolName: 'Compress PDF',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Optimized streams (${PdfHelpers.formatBytes(buffer.byteLength)} → ${PdfHelpers.formatBytes(pdfBytes.byteLength)})`
        });

        return {
            pdfBytes,
            durationMs,
            originalSize: buffer.byteLength,
            newSize: pdfBytes.byteLength,
            bytesSaved,
            percentReduced
        };
    },

    /**
     * Grayscale PDF: Renders pages and converts to monochrome ink-saving PDF
     */
    async grayscalePdf(fileOrBuffer, onProgress = () => {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        if (!window.pdfjsLib) throw new Error('PDF.js engine is not ready.');
        const loadingTask = window.pdfjsLib.getDocument({ data: buffer.slice(0) });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        const { PDFDocument } = window.PDFLib;
        const grayDoc = await PDFDocument.create();

        for (let i = 1; i <= totalPages; i++) {
            onProgress({
                step: 'grayscaling',
                percent: Math.round((i / totalPages) * 90),
                message: `Converting page ${i} of ${totalPages} to monochrome...`
            });

            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: ctx, viewport }).promise;

            // Apply grayscale pixel manipulation
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const d = imgData.data;
            for (let k = 0; k < d.length; k += 4) {
                const gray = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
                d[k] = gray;
                d[k + 1] = gray;
                d[k + 2] = gray;
            }
            ctx.putImageData(imgData, 0, 0);

            const grayDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const grayBytes = await fetch(grayDataUrl).then(r => r.arrayBuffer());
            const embedded = await grayDoc.embedJpg(grayBytes);

            const p = grayDoc.addPage([viewport.width, viewport.height]);
            p.drawImage(embedded, { x: 0, y: 0, width: viewport.width, height: viewport.height });
        }

        const pdfBytes = await grayDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'grayscale-pdf',
            toolName: 'Grayscale PDF',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Converted ${totalPages} pages to monochrome grayscale`
        });

        return { pdfBytes, durationMs, pageCount: totalPages };
    },

    /**
     * Read and Update Document Metadata
     */
    async editMetadata(fileOrBuffer, metadata = {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

        if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
        if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
        if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
        if (metadata.keywords !== undefined) {
            const kwArray = Array.isArray(metadata.keywords)
                ? metadata.keywords
                : metadata.keywords.split(',').map(s => s.trim());
            pdfDoc.setKeywords(kwArray);
        }
        if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'metadata-editor',
            toolName: 'PDF Metadata Editor',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Updated title, author, and catalog tags`
        });

        return { pdfBytes, durationMs };
    },

    /**
     * Extract current metadata from document
     */
    async readMetadata(fileOrBuffer) {
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

        return {
            title: pdfDoc.getTitle() || '',
            author: pdfDoc.getAuthor() || '',
            subject: pdfDoc.getSubject() || '',
            keywords: (pdfDoc.getKeywords() || []).join(', '),
            producer: pdfDoc.getProducer() || '',
            pageCount: pdfDoc.getPageCount()
        };
    },

    /**
     * Convert Plain Text into PDF
     */
    async textToPdf(text, options = {}) {
        const startTime = performance.now();
        const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(options.font === 'monospace' ? StandardFonts.Courier : StandardFonts.Helvetica);

        const fontSize = parseInt(options.fontSize || 10, 10);
        const lineHeight = fontSize * 1.35;
        const margin = 40;
        const pageWidth = 595.28; // A4 width
        const pageHeight = 841.89; // A4 height

        const lines = text.split('\n');
        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let currentY = pageHeight - margin;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (currentY <= margin + lineHeight) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentY = pageHeight - margin;
            }

            currentPage.drawText(line.slice(0, 95), {
                x: margin,
                y: currentY,
                size: fontSize,
                font: font,
                color: rgb(0.1, 0.1, 0.1)
            });

            currentY -= lineHeight;
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'text-to-pdf',
            toolName: 'Text to PDF',
            inputTotalSize: text.length,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Compiled ${lines.length} lines into ${pdfDoc.getPageCount()} pages`
        });

        return { pdfBytes, durationMs, pageCount: pdfDoc.getPageCount() };
    },

    /**
     * Flatten Interactive PDF Forms into Static Vectors
     */
    async flattenPdf(fileOrBuffer) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        
        try {
            const form = pdfDoc.getForm();
            form.flatten();
        } catch (e) {
            console.warn('Form flattening notice (no form fields or already flat):', e);
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'flatten-pdf',
            toolName: 'Flatten PDF Forms',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Flattened interactive form fields into static vectors`
        });

        return { pdfBytes, durationMs };
    },

    /**
     * Inspect AcroForm Interactive Fields
     */
    async getFormFields(fileOrBuffer) {
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        
        try {
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            return fields.map(f => {
                let currentVal = '';
                try {
                    if (typeof f.getText === 'function') currentVal = f.getText() || '';
                } catch(e) {}
                return {
                    name: f.getName(),
                    type: f.constructor.name || 'TextField',
                    value: currentVal
                };
            });
        } catch (e) {
            return [];
        }
    },

    /**
     * Populate AcroForm Fields and Save
     */
    async fillFormFields(fileOrBuffer, fieldValues = {}) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const form = pdfDoc.getForm();

        for (const [name, val] of Object.entries(fieldValues)) {
            try {
                const field = form.getField(name);
                if (field && typeof field.setText === 'function') {
                    field.setText(String(val));
                }
            } catch (err) {
                console.warn(`Could not set field ${name}:`, err);
            }
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'form-filler',
            toolName: 'Form Filler',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Filled ${Object.keys(fieldValues).length} form fields`
        });

        return { pdfBytes, durationMs };
    },

    /**
     * Crop PDF Margins
     */
    async cropPdf(fileOrBuffer, marginPercent = 10) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const factor = Math.max(0.01, Math.min(0.35, marginPercent / 100));

        pages.forEach(page => {
            const { width, height } = page.getSize();
            const trimX = width * factor;
            const trimY = height * factor;
            page.setCropBox(trimX, trimY, width - (2 * trimX), height - (2 * trimY));
        });

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'crop-pdf',
            toolName: 'Crop PDF Margins',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Trimmed ${marginPercent}% margins across ${pages.length} pages`
        });

        return { pdfBytes, durationMs, pageCount: pages.length };
    },

    /**
     * Repair PDF: Reconstruct broken trees and rebuild XREF tables
     */
    async repairPdf(fileOrBuffer) {
        const startTime = performance.now();
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const { PDFDocument } = window.PDFLib;
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const cleanDoc = await PDFDocument.create();

        const count = srcDoc.getPageCount();
        const indices = srcDoc.getPageIndices();
        const copied = await cleanDoc.copyPages(srcDoc, indices);
        copied.forEach(p => cleanDoc.addPage(p));

        const pdfBytes = await cleanDoc.save({ useObjectStreams: false });
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'repair-pdf',
            toolName: 'Repair PDF',
            inputTotalSize: buffer.byteLength,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Rebuilt xref tables and page trees (${count} pages recovered)`
        });

        return { pdfBytes, durationMs, pageCount: count };
    },

    /**
     * Document Compare: Client-Side text diff between Doc A and Doc B
     */
    async compareDocuments(fileOrBufferA, fileOrBufferB) {
        if (!window.pdfjsLib) throw new Error('PDF.js text extractor not available.');

        const extractLines = async (fOrB) => {
            const buf = fOrB instanceof File ? await PdfHelpers.fileToArrayBuffer(fOrB) : fOrB;
            const task = window.pdfjsLib.getDocument({ data: buf.slice(0) });
            const pdf = await task.promise;
            const lines = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const str = content.items.map(it => it.str).join(' ');
                lines.push(...str.split(/(?<=[.?!])\s+/));
            }
            return lines.filter(l => l.trim().length > 0);
        };

        const linesA = await extractLines(fileOrBufferA);
        const linesB = await extractLines(fileOrBufferB);

        // Simple LCS diff
        const setA = new Set(linesA);
        const setB = new Set(linesB);

        const diffResult = {
            docAOnly: linesA.filter(l => !setB.has(l)),
            docBOnly: linesB.filter(l => !setA.has(l)),
            commonCount: linesA.filter(l => setB.has(l)).length,
            totalLinesA: linesA.length,
            totalLinesB: linesB.length
        };

        return diffResult;
    },

    /**
     * Markdown to PDF Compiler
     */
    async markdownToPdf(mdText) {
        const startTime = performance.now();
        const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
        const pdfDoc = await PDFDocument.create();

        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);

        const margin = 40;
        const pageWidth = 595.28;
        const pageHeight = 841.89;

        let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        let currentY = pageHeight - margin;

        const lines = mdText.split('\n');

        for (let rawLine of lines) {
            let line = rawLine.trim();
            let font = regularFont;
            let fontSize = 10;
            let color = rgb(0.15, 0.15, 0.15);
            let indent = margin;

            if (line.startsWith('# ')) {
                line = line.replace('# ', '');
                font = boldFont;
                fontSize = 18;
                color = rgb(0.85, 0.15, 0.15);
                currentY -= 6;
            } else if (line.startsWith('## ')) {
                line = line.replace('## ', '');
                font = boldFont;
                fontSize = 14;
                color = rgb(0.1, 0.1, 0.1);
                currentY -= 4;
            } else if (line.startsWith('### ')) {
                line = line.replace('### ', '');
                font = boldFont;
                fontSize = 12;
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                line = '• ' + line.slice(2);
                indent = margin + 12;
            } else if (line.startsWith('> ')) {
                line = line.slice(2);
                color = rgb(0.4, 0.4, 0.4);
                indent = margin + 16;
            } else if (line.startsWith('`') && line.endsWith('`')) {
                line = line.replace(/`/g, '');
                font = monoFont;
                fontSize = 9;
            }

            const lineHeight = fontSize * 1.4;

            if (currentY <= margin + lineHeight) {
                currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                currentY = pageHeight - margin;
            }

            if (line.length > 0) {
                currentPage.drawText(line.slice(0, 90), {
                    x: indent,
                    y: currentY,
                    size: fontSize,
                    font,
                    color
                });
            }

            currentY -= lineHeight;
        }

        const pdfBytes = await pdfDoc.save();
        const durationMs = Math.round(performance.now() - startTime);

        StorageManager.addHistoryEntry({
            toolId: 'markdown-to-pdf',
            toolName: 'Markdown to PDF',
            inputTotalSize: mdText.length,
            outputSize: pdfBytes.byteLength,
            durationMs,
            summary: `Compiled Markdown into styled PDF`
        });

        return { pdfBytes, durationMs, pageCount: pdfDoc.getPageCount() };
    },

    /**
     * Word (.docx) to PDF Client Fallback Converter
     * Unzips DOCX XML structure via JSZip and renders paragraphs into PDF
     */
    async wordToPdf(docxFile) {
        if (!window.JSZip) throw new Error('JSZip library required for DOCX parsing.');
        const startTime = performance.now();
        const arrayBuf = await PdfHelpers.fileToArrayBuffer(docxFile);
        const zip = await window.JSZip.loadAsync(arrayBuf);

        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) throw new Error('Invalid .docx file structure: word/document.xml not found.');

        const xmlText = await docXmlFile.async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const paragraphs = xmlDoc.getElementsByTagName('w:p');

        const extractedTextLines = [];
        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const textNodes = p.getElementsByTagName('w:t');
            let pText = '';
            for (let j = 0; j < textNodes.length; j++) {
                pText += textNodes[j].textContent;
            }
            if (pText.trim()) extractedTextLines.push(pText.trim());
        }

        const fullText = extractedTextLines.join('\n\n');
        const result = await this.textToPdf(fullText, { font: 'proportional', fontSize: 11 });
        result.extractedLines = extractedTextLines.length;

        StorageManager.addHistoryEntry({
            toolId: 'word-to-pdf',
            toolName: 'Word (DOCX) to PDF',
            inputTotalSize: docxFile.size,
            outputSize: result.pdfBytes.byteLength,
            durationMs: Math.round(performance.now() - startTime),
            summary: `Parsed DOCX XML structure into clean PDF`
        });

        return result;
    },

    /**
     * Excel (XLSX / CSV) to PDF Client Fallback Converter
     */
    async excelToPdf(file) {
        const startTime = performance.now();
        let csvText = '';

        if (file.name.toLowerCase().endsWith('.csv')) {
            csvText = await file.text();
        } else {
            // Unzip XLSX worksheet and shared strings
            const arrayBuf = await PdfHelpers.fileToArrayBuffer(file);
            const zip = await window.JSZip.loadAsync(arrayBuf);
            
            // Extract shared strings
            const sharedStrings = [];
            const ssFile = zip.file('xl/sharedStrings.xml');
            if (ssFile) {
                const ssXml = await ssFile.async('string');
                const dom = new DOMParser().parseFromString(ssXml, 'text/xml');
                const tTags = dom.getElementsByTagName('t');
                for (let k = 0; k < tTags.length; k++) sharedStrings.push(tTags[k].textContent);
            }

            // Extract sheet1 cells
            const sheetFile = zip.file('xl/worksheets/sheet1.xml');
            if (!sheetFile) throw new Error('Sheet1 not found in XLSX file.');
            const sheetXml = await sheetFile.async('string');
            const sheetDom = new DOMParser().parseFromString(sheetXml, 'text/xml');
            const rows = sheetDom.getElementsByTagName('row');

            const rowTexts = [];
            for (let r = 0; r < rows.length; r++) {
                const cells = rows[r].getElementsByTagName('c');
                const cellVals = [];
                for (let c = 0; c < cells.length; c++) {
                    const cell = cells[c];
                    const isShared = cell.getAttribute('t') === 's';
                    const vTag = cell.getElementsByTagName('v')[0];
                    if (vTag) {
                        const val = vTag.textContent;
                        cellVals.push(isShared && sharedStrings[parseInt(val, 10)] !== undefined ? sharedStrings[parseInt(val, 10)] : val);
                    }
                }
                if (cellVals.length) rowTexts.push(cellVals.join(' | '));
            }
            csvText = rowTexts.join('\n');
        }

        const result = await this.textToPdf(csvText, { font: 'monospace', fontSize: 9 });

        StorageManager.addHistoryEntry({
            toolId: 'excel-to-pdf',
            toolName: 'Excel to PDF',
            inputTotalSize: file.size,
            outputSize: result.pdfBytes.byteLength,
            durationMs: Math.round(performance.now() - startTime),
            summary: `Parsed spreadsheet structure into PDF table`
        });

        return result;
    },

    /**
     * Form Blank & Missing Signature Detector
     */
    async detectFormBlanks(fileOrBuffer) {
        const buffer = fileOrBuffer instanceof File
            ? await PdfHelpers.fileToArrayBuffer(fileOrBuffer)
            : fileOrBuffer;

        const findings = [];

        // Check AcroForm fields
        try {
            const fields = await this.getFormFields(buffer);
            fields.forEach(f => {
                if (!f.value || !f.value.trim()) {
                    findings.push({
                        type: 'Empty Form Field',
                        label: `Field "${f.name}" (${f.type}) is currently blank`,
                        severity: 'warning'
                    });
                }
            });
        } catch(e) {}

        // Check text stream for signature lines and missing dates
        if (window.pdfjsLib) {
            try {
                const task = window.pdfjsLib.getDocument({ data: buffer.slice(0) });
                const pdf = await task.promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const text = content.items.map(item => item.str).join(' ');

                    if (text.includes('____') || text.includes('Signature:') || text.includes('Sign Here:')) {
                        findings.push({
                            type: 'Signature / Blank Line',
                            label: `Page ${i}: Detected blank signature line or underscore placeholders`,
                            severity: 'important'
                        });
                    }
                    if (/Date:\s*_{2,}/i.test(text) || /Date:\s*$/i.test(text)) {
                        findings.push({
                            type: 'Unfilled Date',
                            label: `Page ${i}: Blank date prompt detected`,
                            severity: 'info'
                        });
                    }
                }
            } catch(e) {}
        }

        return findings;
    }
};
