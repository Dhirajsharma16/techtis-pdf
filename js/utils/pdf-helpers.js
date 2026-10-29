/**
 * Client-Side PDF Helpers & Rendering Engine
 * Powered by pdf-lib, PDF.js, and JSZip.
 */

import { StorageManager } from './storage.js';

// Robust dynamic loaders that guarantee libraries are loaded before use in any context
export async function ensurePdfLib() {
    if (typeof window !== 'undefined' && window.PDFLib) return window.PDFLib;
    return new Promise((resolve, reject) => {
        const isSubdir = typeof document !== 'undefined' && document.body && document.body.dataset && document.body.dataset.toolId;
        const prefix = isSubdir ? '../' : '';
        const scriptId = 'vendor-pdf-lib-script';

        let script = document.getElementById(scriptId) || document.querySelector('script[src*="pdf-lib.min.js"]');
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `${prefix}vendor/pdf-lib.min.js`;
            document.head.appendChild(script);
        }

        let elapsed = 0;
        const check = setInterval(() => {
            elapsed += 50;
            if (typeof window !== 'undefined' && window.PDFLib) {
                clearInterval(check);
                resolve(window.PDFLib);
            } else if (elapsed >= 10000) {
                clearInterval(check);
                console.warn('Local pdf-lib load timed out. Loading fallback CDN...');
                const cdn = document.createElement('script');
                cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
                cdn.onload = () => resolve(window.PDFLib);
                cdn.onerror = () => reject(new Error('pdf-lib engine is not loaded. Please check your network connection.'));
                document.head.appendChild(cdn);
            }
        }, 50);
    });
}

export async function ensurePdfJs() {
    const isSubdir = typeof document !== 'undefined' && document.body && document.body.dataset && document.body.dataset.toolId;
    const prefix = isSubdir ? '../' : '';

    function configureWorker(lib) {
        if (!lib) return;
        if (!lib.GlobalWorkerOptions) lib.GlobalWorkerOptions = {};
        if (!lib.GlobalWorkerOptions.workerSrc) {
            try {
                const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
                    ? window.location.origin
                    : '';
                if (origin) {
                    lib.GlobalWorkerOptions.workerSrc = origin + '/vendor/pdf.worker.min.js';
                } else {
                    const workerRelative = isSubdir ? '../vendor/pdf.worker.min.js' : 'vendor/pdf.worker.min.js';
                    lib.GlobalWorkerOptions.workerSrc = new URL(workerRelative, window.location.href).href;
                }
            } catch (e) {
                lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
        }
    }

    if (typeof window !== 'undefined' && window.pdfjsLib) {
        configureWorker(window.pdfjsLib);
        return window.pdfjsLib;
    }
    return new Promise((resolve, reject) => {
        const scriptId = 'vendor-pdfjs-script';

        let script = document.getElementById(scriptId) || document.querySelector('script[src*="pdf.min.js"]');
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `${prefix}vendor/pdf.min.js`;
            document.head.appendChild(script);
        }

        let elapsed = 0;
        const check = setInterval(() => {
            elapsed += 50;
            if (typeof window !== 'undefined' && window.pdfjsLib) {
                clearInterval(check);
                configureWorker(window.pdfjsLib);
                resolve(window.pdfjsLib);
            } else if (elapsed >= 10000) {
                clearInterval(check);
                const cdn = document.createElement('script');
                cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                cdn.onload = () => {
                    configureWorker(window.pdfjsLib);
                    resolve(window.pdfjsLib);
                };
                cdn.onerror = () => reject(new Error('PDF.js rendering engine is not ready.'));
                document.head.appendChild(cdn);
            }
        }, 50);
    });
}

export async function ensureJsZip() {
    if (typeof window !== 'undefined' && window.JSZip) return window.JSZip;
    return new Promise((resolve, reject) => {
        const isSubdir = typeof document !== 'undefined' && document.body && document.body.dataset && document.body.dataset.toolId;
        const prefix = isSubdir ? '../' : '';
        const scriptId = 'vendor-jszip-script';

        let script = document.getElementById(scriptId) || document.querySelector('script[src*="jszip.min.js"]');
        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `${prefix}vendor/jszip.min.js`;
            document.head.appendChild(script);
        }

        let elapsed = 0;
        const check = setInterval(() => {
            elapsed += 50;
            if (typeof window !== 'undefined' && window.JSZip) {
                clearInterval(check);
                resolve(window.JSZip);
            } else if (elapsed >= 10000) {
                clearInterval(check);
                const cdn = document.createElement('script');
                cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                cdn.onload = () => resolve(window.JSZip);
                cdn.onerror = () => reject(new Error('JSZip library required.'));
                document.head.appendChild(cdn);
            }
        }, 50);
    });
}

// Initialize PDF.js worker with fallback (resolves path properly in root and subdirectories)
if (typeof window !== 'undefined' && window.pdfjsLib) {
    try {
        const isSubdir = document.body && document.body.dataset && document.body.dataset.toolId;
        const workerRelative = isSubdir ? '../vendor/pdf.worker.min.js' : 'vendor/pdf.worker.min.js';
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(workerRelative, window.location.href).href;
    } catch (e) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}

export const PdfHelpers = {
    ensurePdfLib,
    ensurePdfJs,
    ensureJsZip,

    /**
     * Read File to ArrayBuffer
     */
    async fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Trigger client-side direct download of a Blob or Uint8Array
     */
    downloadBytes(bytes, filename, mimeType = 'application/pdf', meta = {}) {
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        // Skip clicking link in automated headless test environment to avoid OS taskbar blocking
        if (!navigator.webdriver) {
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);

        try {
            StorageManager.addHistoryEntry({
                toolId: meta.toolId || 'pdf-operation',
                toolName: meta.toolName || filename,
                inputFilesCount: meta.inputFilesCount || 1,
                inputTotalSize: meta.inputTotalSize || bytes.byteLength || 0,
                outputSize: bytes.byteLength || 0,
                durationMs: meta.durationMs || 50,
                summary: `Downloaded ${filename}`
            });
            window.dispatchEvent(new CustomEvent('techtis:history-updated'));
        } catch (_) {}
    },

    /**
     * Format byte sizes into readable KB / MB
     */
    formatBytes(bytes, decimals = 1) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Format time duration
     */
    formatDuration(ms) {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    },

    /**
     * Inspect PDF to get Page Count
     */
    async getPdfPageCount(arrayBuffer) {
        try {
            if (!window.PDFLib) {
                await ensurePdfLib().catch(() => {});
            }
            if (window.PDFLib) {
                const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                return pdfDoc.getPageCount();
            }
            if (!window.pdfjsLib) {
                await ensurePdfJs().catch(() => {});
            }
            if (window.pdfjsLib) {
                const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
                const pdf = await loadingTask.promise;
                return pdf.numPages;
            }
            return 1;
        } catch (e) {
            console.warn('Error reading page count:', e);
            return 1;
        }
    },

    /**
     * Render a page thumbnail onto a data URL using PDF.js
     */
    async renderPageThumbnail(arrayBuffer, pageNumber = 1, targetWidth = 180) {
        try {
            if (!window.pdfjsLib) {
                await ensurePdfJs();
            }
            if (!window.pdfjsLib) {
                return null;
            }
            // Use clone of buffer to avoid detaching
            const copy = arrayBuffer.slice(0);
            const loadingTask = window.pdfjsLib.getDocument({ data: copy });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(pageNumber);

            const unscaledViewport = page.getViewport({ scale: 1.0 });
            const scale = targetWidth / unscaledViewport.width;
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            return canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
            console.warn('Thumbnail generation error:', e);
            return null;
        }
    },

    /**
     * Bundle multiple PDF Uint8Array files into a ZIP archive and trigger download
     */
    async downloadAsZip(files, zipFilename = 'split-documents.zip') {
        if (!window.JSZip) {
            await ensureJsZip();
        }
        if (!window.JSZip) {
            throw new Error('JSZip library not available');
        }
        const zip = new window.JSZip();
        for (const file of files) {
            zip.file(file.name, file.bytes);
        }
        const content = await zip.generateAsync({ type: 'uint8array' });
        this.downloadBytes(content, zipFilename, 'application/zip');
    },

    /**
     * Parse page range string like "1-3, 5, 8-10" into 0-indexed array of page numbers
     */
    parsePageRanges(rangeStr, maxPages) {
        if (!rangeStr || !rangeStr.trim()) {
            return Array.from({ length: maxPages }, (_, i) => i);
        }
        const clean = rangeStr.replace(/\s+/g, '');
        const parts = clean.split(',');
        const pageIndices = new Set();

        for (const part of parts) {
            if (part.includes('-')) {
                const [startStr, endStr] = part.split('-');
                let start = parseInt(startStr, 10);
                let end = parseInt(endStr, 10);
                if (isNaN(start)) start = 1;
                if (isNaN(end)) end = maxPages;
                start = Math.max(1, Math.min(start, maxPages));
                end = Math.max(1, Math.min(end, maxPages));
                if (start > end) [start, end] = [end, start];
                for (let i = start; i <= end; i++) {
                    pageIndices.add(i - 1);
                }
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num) && num >= 1 && num <= maxPages) {
                    pageIndices.add(num - 1);
                }
            }
        }
        return Array.from(pageIndices).sort((a, b) => a - b);
    }
};
