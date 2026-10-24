/**
 * Client-Side Split PDF Utility
 * 100% In-Browser Execution via pdf-lib.js & JSZip
 * Zero Server Cost | Zero Network Footprint
 */

import { PdfHelpers } from '../utils/pdf-helpers.js';
import { StorageManager } from '../utils/storage.js';

export const SplitTool = {
    /**
     * Split PDF by range string (e.g. "1-3, 5")
     */
    async splitByRanges(file, range = '1', onProgress = () => {}) {
        return this.execute(file, { mode: 'custom-range', range }, onProgress);
    },

    /**
     * Split every page into separate files
     */
    async splitAllPages(file, onProgress = () => {}) {
        return this.execute(file, { mode: 'extract-all' }, onProgress);
    },

    /**
     * Inspect PDF and return total pages and basic metadata
     */
    async inspect(file) {
        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const { PDFDocument } = window.PDFLib;
        const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const numPages = pdfDoc.getPageCount();
        return {
            buffer,
            numPages,
            name: file.name,
            size: file.size
        };
    },

    /**
     * Execute Split PDF operation
     * @param {File} file - Source PDF file
     * @param {Object} options - Split configuration
     *        options.mode: 'extract-all' | 'custom-range' | 'fixed-chunks'
     *        options.range: string e.g. "1-3, 5" (for 'custom-range')
     *        options.chunkSize: number e.g. 2 (for 'fixed-chunks')
     *        options.mergeRanges: boolean (whether custom ranges should be combined into 1 new PDF or separate files)
     * @param {Function} onProgress - Progress reporter
     */
    async execute(file, options = {}, onProgress = () => {}) {
        const startTime = performance.now();
        if (!file) throw new Error('Please select a PDF file to split.');
        if (!window.PDFLib) throw new Error('pdf-lib is not available.');

        const { PDFDocument } = window.PDFLib;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const mode = options.mode || 'custom-range';

        onProgress({ step: 'init', percent: 10, message: 'Reading document into browser memory...' });
        const buffer = await PdfHelpers.fileToArrayBuffer(file);
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const totalPages = srcDoc.getPageCount();

        const generatedFiles = [];

        if (mode === 'extract-all') {
            onProgress({ step: 'splitting', percent: 20, message: `Extracting all ${totalPages} individual pages...` });
            for (let i = 0; i < totalPages; i++) {
                const subDoc = await PDFDocument.create();
                const [copiedPage] = await subDoc.copyPages(srcDoc, [i]);
                subDoc.addPage(copiedPage);
                const bytes = await subDoc.save();
                const filename = `${baseName}_page_${i + 1}.pdf`;
                generatedFiles.push({ name: filename, bytes });

                const percent = 20 + Math.round(((i + 1) / totalPages) * 70);
                onProgress({ step: 'splitting', percent, message: `Processed page ${i + 1} of ${totalPages}...` });
            }
        } else if (mode === 'fixed-chunks') {
            const chunkSize = Math.max(1, parseInt(options.chunkSize, 10) || 1);
            const totalChunks = Math.ceil(totalPages / chunkSize);

            onProgress({ step: 'splitting', percent: 20, message: `Splitting into ${totalChunks} chunks of ${chunkSize} pages...` });

            for (let c = 0; c < totalChunks; c++) {
                const start = c * chunkSize;
                const end = Math.min(start + chunkSize, totalPages);
                const indices = [];
                for (let k = start; k < end; k++) indices.push(k);

                const subDoc = await PDFDocument.create();
                const copiedPages = await subDoc.copyPages(srcDoc, indices);
                copiedPages.forEach(p => subDoc.addPage(p));
                const bytes = await subDoc.save();

                const filename = `${baseName}_part_${c + 1}_(pp_${start + 1}-${end}).pdf`;
                generatedFiles.push({ name: filename, bytes });

                const percent = 20 + Math.round(((c + 1) / totalChunks) * 70);
                onProgress({ step: 'splitting', percent, message: `Created part ${c + 1} of ${totalChunks}...` });
            }
        } else {
            // Mode: custom-range
            const pageIndices = PdfHelpers.parsePageRanges(options.range || `1-${totalPages}`, totalPages);
            if (pageIndices.length === 0) {
                throw new Error('No valid pages found in the specified range.');
            }

            if (options.mergeRanges === false && pageIndices.length > 1) {
                // Split each selected page individually
                for (let idx of pageIndices) {
                    const subDoc = await PDFDocument.create();
                    const [copiedPage] = await subDoc.copyPages(srcDoc, [idx]);
                    subDoc.addPage(copiedPage);
                    const bytes = await subDoc.save();
                    generatedFiles.push({ name: `${baseName}_page_${idx + 1}.pdf`, bytes });
                }
            } else {
                // Combine the selected ranges into one extracted document
                onProgress({ step: 'extracting', percent: 50, message: `Extracting ${pageIndices.length} chosen pages...` });
                const subDoc = await PDFDocument.create();
                const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
                copiedPages.forEach(p => subDoc.addPage(p));
                const bytes = await subDoc.save();

                const rangeLabel = options.range ? options.range.replace(/[^0-9,-]/g, '') : `selected`;
                const filename = `${baseName}_extracted_pages_${rangeLabel}.pdf`;
                generatedFiles.push({ name: filename, bytes });
            }
        }

        const endTime = performance.now();
        const durationMs = Math.round(endTime - startTime);

        // Download handling
        let totalOutputBytes = 0;
        generatedFiles.forEach(f => totalOutputBytes += f.bytes.byteLength);

        if (generatedFiles.length === 1) {
            onProgress({ step: 'downloading', percent: 100, message: `Split complete in ${durationMs}ms! Downloading...` });
            PdfHelpers.downloadBytes(generatedFiles[0].bytes, generatedFiles[0].name, 'application/pdf');
        } else {
            onProgress({ step: 'zipping', percent: 95, message: `Packaging ${generatedFiles.length} files into ZIP...` });
            const zipName = `${baseName}_split.zip`;
            await PdfHelpers.downloadAsZip(generatedFiles, zipName);
        }

        // Record history
        StorageManager.addHistoryEntry({
            toolId: 'split-pdf',
            toolName: 'Split PDF',
            inputFilesCount: 1,
            inputTotalSize: file.size,
            outputSize: totalOutputBytes,
            durationMs: durationMs,
            summary: `Split into ${generatedFiles.length} files (${totalPages} original pages) in ${PdfHelpers.formatDuration(durationMs)}`
        });

        return {
            success: true,
            filesCreated: generatedFiles.length,
            durationMs,
            totalOutputBytes,
            generatedFiles,
            pdfBytes: generatedFiles[0]?.bytes
        };
    }
};
