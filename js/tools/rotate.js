/**
 * Client-Side Rotate PDF Utility
 * In-Browser Page Rotation using pdf-lib.js
 */

import { PdfHelpers, ensurePdfLib } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export const RotateTool = {
    /**
     * Rotate pages helper
     */
    async rotate(file, degrees = 90, onProgress = () => {}) {
        return this.execute(file, { rotationDegrees: degrees }, onProgress);
    },

    /**
     * Rotate pages in a PDF document
     * @param {File} file
     * @param {Object} options - { rotationDegrees: 90 | 180 | 270, pageIndices: 'all' | [0, 1] }
     * @param {Function} onProgress
     */
    async execute(file, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        if (!file) throw new Error('Please select a PDF file to rotate.');
        const degrees = parseInt(options.rotationDegrees || 90, 10);

        onProgress({ step: 'init', percent: 20, message: 'Loading PDF in browser memory...' });
        await ensurePdfLib();
        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const { PDFDocument, degrees: libDegrees } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const totalPages = pages.length;

        onProgress({ step: 'rotating', percent: 60, message: `Rotating ${totalPages} pages by ${degrees}°...` });

        pages.forEach((page) => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(libDegrees((currentRotation + degrees) % 360));
        });

        onProgress({ step: 'saving', percent: 90, message: 'Encoding updated PDF document...' });
        const pdfBytes = await pdfDoc.save();
        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_rotated_${degrees}deg.pdf`;

        onProgress({ step: 'downloading', percent: 100, message: `Done in ${durationMs}ms! Downloading...` });
        PdfHelpers.downloadBytes(pdfBytes, filename, 'application/pdf');

        StorageManager.addHistoryEntry({
            toolId: 'rotate-pdf',
            toolName: 'Rotate PDF',
            inputFilesCount: 1,
            inputTotalSize: file.size,
            outputSize: pdfBytes.byteLength,
            durationMs: durationMs,
            summary: `Rotated ${totalPages} pages by ${degrees}° in ${PdfHelpers.formatDuration(durationMs)}`
        });

        return {
            success: true,
            totalPages,
            durationMs,
            filename,
            pdfBytes
        };
    }
};
