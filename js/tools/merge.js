/**
 * Client-Side Merge PDF Utility
 * 100% In-Browser Execution via pdf-lib.js
 * Zero Server Cost | Zero Network Footprint | Sub-100ms Per-Page Processing
 */

import { PdfHelpers } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export const MergeTool = {
    /**
     * Merge multiple PDF files into a single PDF document
     */
    async merge(files, options = {}, onProgress = () => {}) {
        return this.execute(files, options, onProgress);
    },

    /**
     * Merge multiple PDF files into a single PDF document
     * @param {Array<File>} files - Array of File objects in user-defined order
     * @param {Object} options - Merge options (outputName, etc.)
     * @param {Function} onProgress - Progress reporter callback
     */
    async execute(files, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        if (!files || files.length < 2) {
            throw new Error('Please select at least 2 PDF files to merge.');
        }

        if (!window.PDFLib) {
            throw new Error('pdf-lib engine is not loaded. Please verify vendor scripts.');
        }

        const { PDFDocument } = window.PDFLib;
        const totalFiles = files.length;
        let totalInputBytes = 0;
        files.forEach(f => totalInputBytes += f.size);

        onProgress({
            step: 'init',
            percent: 5,
            message: `Allocating browser memory for ${totalFiles} documents...`
        });

        // 1. Create a fresh target PDF document
        const mergedDoc = await PDFDocument.create();
        let totalMergedPages = 0;

        // 2. Iterate through files sequentially to preserve user's custom order
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const filePercentBase = 10 + Math.round((i / totalFiles) * 75);

            onProgress({
                step: 'reading',
                percent: filePercentBase,
                message: `Reading [${i + 1}/${totalFiles}] "${file.name}" locally in RAM...`
            });

            const arrayBuffer = await PdfHelpers.fileToArrayBuffer(file);

            onProgress({
                step: 'copying',
                percent: filePercentBase + Math.round(50 / totalFiles),
                message: `Extracting pages from "${file.name}"...`
            });

            // Load source document into pdf-lib
            const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pageIndices = srcDoc.getPageIndices();
            
            // Copy all pages into target document
            const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
            copiedPages.forEach((page) => mergedDoc.addPage(page));
            totalMergedPages += copiedPages.length;
        }

        // 3. Serialize the merged PDF to Uint8Array
        onProgress({
            step: 'compiling',
            percent: 90,
            message: `Compiling ${totalMergedPages} pages into optimized PDF stream...`
        });

        const mergedPdfBytes = await mergedDoc.save();
        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        // 4. Output filename
        const customName = options.outputName && options.outputName.trim()
            ? (options.outputName.endsWith('.pdf') ? options.outputName : options.outputName + '.pdf')
            : `merged_${Date.now()}.pdf`;

        // 5. Trigger instant client-side download
        onProgress({
            step: 'downloading',
            percent: 100,
            message: `Merge complete in ${durationMs}ms! Triggering direct download...`
        });

        PdfHelpers.downloadBytes(mergedPdfBytes, customName, 'application/pdf');

        // 6. Record metadata in local storage (never the bytes)
        StorageManager.addHistoryEntry({
            toolId: 'merge-pdf',
            toolName: 'Merge PDF',
            inputFilesCount: totalFiles,
            inputTotalSize: totalInputBytes,
            outputSize: mergedPdfBytes.byteLength,
            durationMs: durationMs,
            summary: `Merged ${totalFiles} documents (${totalMergedPages} pages total) in ${PdfHelpers.formatDuration(durationMs)}`
        });

        return {
            success: true,
            totalFiles,
            totalMergedPages,
            inputSize: totalInputBytes,
            outputSize: mergedPdfBytes.byteLength,
            durationMs,
            filename: customName,
            bytes: mergedPdfBytes,
            pdfBytes: mergedPdfBytes,
            pageCount: totalMergedPages
        };
    }
};
