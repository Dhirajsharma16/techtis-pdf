/**
 * Client-Side Image Processing Engine for TECHTIS (techtis.in)
 * High-performance, 100% in-browser Canvas & WebAssembly image tools.
 * Zero server uploads, zero network latency, strict user privacy.
 */

export const ImageEngine = {
    /**
     * Load an image file into an HTMLImageElement
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('Selected file is not a valid image format.'));
            }
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load and decode image data.'));
            };
            img.src = url;
        });
    },

    /**
     * Compress an image using HTML5 Canvas toBlob
     */
    async compressImage(file, quality = 0.75, outputMime = 'image/jpeg') {
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (outputMime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Image compression failed.'));
                const originalSize = file.size;
                const compressedSize = blob.size;
                const savingsPct = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
                resolve({
                    blob,
                    width: canvas.width,
                    height: canvas.height,
                    originalSize,
                    compressedSize,
                    savingsPct,
                    dataUrl: canvas.toDataURL(outputMime, quality)
                });
            }, outputMime, quality);
        });
    },

    /**
     * Resize an image with aspect ratio lock or custom dimensions
     */
    async resizeImage(file, targetWidth, targetHeight, outputMime = 'image/png', quality = 0.9) {
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(targetWidth));
        canvas.height = Math.max(1, Math.round(targetHeight));

        const ctx = canvas.getContext('2d');
        // High quality bicubic scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (outputMime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Image resizing failed.'));
                resolve({
                    blob,
                    width: canvas.width,
                    height: canvas.height,
                    size: blob.size,
                    dataUrl: canvas.toDataURL(outputMime, quality)
                });
            }, outputMime, quality);
        });
    },

    /**
     * Convert image formats (e.g. JPG to PNG, PNG to JPG, JPG to WebP)
     */
    async convertFormat(file, targetMime = 'image/png', quality = 0.9, backgroundColor = '#ffffff') {
        const img = await this.loadImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply background color for formats that do not support transparency
        if (targetMime === 'image/jpeg' || backgroundColor !== 'transparent') {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Format conversion failed.'));
                resolve({
                    blob,
                    width: canvas.width,
                    height: canvas.height,
                    size: blob.size,
                    dataUrl: canvas.toDataURL(targetMime, quality)
                });
            }, targetMime, quality);
        });
    },

    /**
     * Crop and rotate an image
     */
    async cropImage(file, cropRect, rotationAngle = 0, outputMime = 'image/png', quality = 0.9) {
        const img = await this.loadImage(file);
        
        // Setup offscreen canvas for rotation first
        const rotCanvas = document.createElement('canvas');
        const rotCtx = rotCanvas.getContext('2d');
        rotCtx.imageSmoothingEnabled = true;
        rotCtx.imageSmoothingQuality = 'high';

        const rads = (rotationAngle * Math.PI) / 180;
        const isRotated90 = (rotationAngle % 180 !== 0);

        rotCanvas.width = isRotated90 ? img.naturalHeight : img.naturalWidth;
        rotCanvas.height = isRotated90 ? img.naturalWidth : img.naturalHeight;

        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate(rads);
        rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        // Now crop from rotated canvas
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.max(1, Math.round(cropRect.width));
        cropCanvas.height = Math.max(1, Math.round(cropRect.height));

        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.imageSmoothingEnabled = true;
        cropCtx.imageSmoothingQuality = 'high';

        if (outputMime === 'image/jpeg') {
            cropCtx.fillStyle = '#ffffff';
            cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
        }

        cropCtx.drawImage(
            rotCanvas,
            cropRect.x, cropRect.y, cropRect.width, cropRect.height,
            0, 0, cropCanvas.width, cropCanvas.height
        );

        return new Promise((resolve, reject) => {
            cropCanvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Image cropping failed.'));
                resolve({
                    blob,
                    width: cropCanvas.width,
                    height: cropCanvas.height,
                    size: blob.size,
                    dataUrl: cropCanvas.toDataURL(outputMime, quality)
                });
            }, outputMime, quality);
        });
    },

    /**
     * Verified Passport & ID Photo Presets
     */
    PASSPORT_PRESETS: [
        {
            id: 'in-passport',
            country: 'India',
            purpose: 'Passport / OCI / Visa',
            widthMm: 35,
            heightMm: 45,
            desc: 'Standard 35 x 45 mm color photo with light background',
            sourceUrl: 'https://passportindia.gov.in',
            lastVerified: '2026-10'
        },
        {
            id: 'us-passport',
            country: 'United States',
            purpose: 'Passport / Visa / Green Card',
            widthMm: 50.8, // 2 inches
            heightMm: 50.8, // 2 inches
            desc: '2 x 2 inch (51 x 51 mm) square photo with plain white background',
            sourceUrl: 'https://travel.state.gov',
            lastVerified: '2026-10'
        },
        {
            id: 'uk-schengen',
            country: 'UK / Schengen / EU',
            purpose: 'Passport & Schengen Visa',
            widthMm: 35,
            heightMm: 45,
            desc: '35 x 45 mm biometric portrait, chin-to-crown height 32-36 mm',
            sourceUrl: 'https://gov.uk/photos-for-passports',
            lastVerified: '2026-10'
        },
        {
            id: 'student-id',
            country: 'Universal',
            purpose: 'Student & Employee ID Badge',
            widthMm: 30,
            heightMm: 40,
            desc: '30 x 40 mm portrait format suitable for standard university & corporate ID cards',
            sourceUrl: 'https://techtis.in',
            lastVerified: '2026-10'
        }
    ],

    /**
     * Generate Single ID Photo & Multi-Up A4 Print Sheet PDF
     */
    async generatePassportPrintSheet(croppedDataUrl, preset, quantity = 8, dpi = 300) {
        // 1 mm in PDF points = 72 points / 25.4 mm ≈ 2.834645 points
        const MM_TO_POINTS = 72 / 25.4;
        const A4_WIDTH_POINTS = 210 * MM_TO_POINTS;  // 595.28 points
        const A4_HEIGHT_POINTS = 297 * MM_TO_POINTS; // 841.89 points

        const photoWidthPoints = preset.widthMm * MM_TO_POINTS;
        const photoHeightPoints = preset.heightMm * MM_TO_POINTS;

        // Calculate grid layout on A4
        const marginX = 15 * MM_TO_POINTS; // 15mm page margin
        const marginY = 15 * MM_TO_POINTS;
        const gapX = 4 * MM_TO_POINTS;     // 4mm cutting gap between photos
        const gapY = 4 * MM_TO_POINTS;

        const printableWidth = A4_WIDTH_POINTS - (2 * marginX);
        const cols = Math.floor((printableWidth + gapX) / (photoWidthPoints + gapX));
        const rows = Math.ceil(quantity / cols);

        // Build PDF using pdf-lib
        if (!window.PDFLib) {
            throw new Error('PDF-Lib engine not available in browser memory.');
        }

        const pdfDoc = await window.PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage([A4_WIDTH_POINTS, A4_HEIGHT_POINTS]);

        // Embed the cropped image
        const imgBytes = await fetch(croppedDataUrl).then(r => r.arrayBuffer());
        const isPng = croppedDataUrl.startsWith('data:image/png');
        const embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

        // Header disclaimer on the print sheet
        const font = await pdfDoc.embedFont(window.PDFLib.StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(window.PDFLib.StandardFonts.HelveticaBold);

        page.drawText(`TECHTIS ID Photo Print Sheet: ${preset.country} - ${preset.purpose} (${preset.widthMm} x ${preset.heightMm} mm)`, {
            x: marginX,
            y: A4_HEIGHT_POINTS - (marginY / 2) - 4,
            size: 9,
            font: fontBold,
            color: window.PDFLib.rgb(0.2, 0.2, 0.2)
        });

        page.drawText('IMPORTANT: Print at "Actual Size" or 100% scale. Do NOT use "Fit to page" or physical dimensions will be altered.', {
            x: marginX,
            y: A4_HEIGHT_POINTS - (marginY / 2) - 16,
            size: 7.5,
            font: font,
            color: window.PDFLib.rgb(0.85, 0.15, 0.15)
        });

        // Tile photos
        let placed = 0;
        for (let r = 0; r < rows && placed < quantity; r++) {
            for (let c = 0; c < cols && placed < quantity; c++) {
                const x = marginX + (c * (photoWidthPoints + gapX));
                const y = A4_HEIGHT_POINTS - marginY - 28 - ((r + 1) * photoHeightPoints) - (r * gapY);

                // Draw photo
                page.drawImage(embeddedImg, {
                    x,
                    y,
                    width: photoWidthPoints,
                    height: photoHeightPoints
                });

                // Draw subtle cutting border
                page.drawRectangle({
                    x,
                    y,
                    width: photoWidthPoints,
                    height: photoHeightPoints,
                    borderColor: window.PDFLib.rgb(0.8, 0.8, 0.8),
                    borderWidth: 0.5
                });

                placed++;
            }
        }

        const pdfBytes = await pdfDoc.save();
        return {
            pdfBytes,
            placedCount: placed,
            cols,
            rows,
            photoWidthMm: preset.widthMm,
            photoHeightMm: preset.heightMm
        };
    }
,

    /**
     * Perform 100% Client-Side OCR using in-browser WebAssembly Tesseract.js
     * Zero server uploads, zero network leaks.
     */
    async performClientOcr(imageFile, onProgress = () => {}) {
        if (!window.Tesseract) {
            throw new Error('Tesseract OCR library is not available in browser memory.');
        }

        onProgress({ status: 'init', progress: 0.15, message: 'Initializing client-side WASM OCR worker...' });
        
        try {
            // Check if createWorker is supported
            if (typeof window.Tesseract.createWorker === 'function') {
                const worker = await window.Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        if (m && m.status) {
                            const pct = Math.round((m.progress || 0) * 100);
                            onProgress({ status: m.status, progress: m.progress || 0, message: `Running OCR: ${m.status} (${pct}%)` });
                        }
                    }
                });
                const res = await worker.recognize(imageFile);
                await worker.terminate();
                return res.data?.text || '';
            } else if (typeof window.Tesseract.recognize === 'function') {
                const res = await window.Tesseract.recognize(imageFile, 'eng', {
                    logger: m => {
                        if (m && m.status) {
                            const pct = Math.round((m.progress || 0) * 100);
                            onProgress({ status: m.status, progress: m.progress || 0, message: `Running OCR: ${m.status} (${pct}%)` });
                        }
                    }
                });
                return res.data?.text || '';
            } else {
                throw new Error('Unsupported Tesseract API version.');
            }
        } catch (err) {
            console.warn('WASM Tesseract processing note:', err);
            throw err;
        }
    },

    /**
     * Parse Aadhaar & PAN Card Fields from Raw Extracted Text
     */
    parseIdCard(rawText) {
        if (!rawText) {
            return {
                docType: 'Government ID',
                name: '',
                docNumber: '',
                maskedNumber: '',
                dob: '',
                gender: '',
                rawText: ''
            };
        }

        const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
        const upper = rawText.toUpperCase();
        
        let docType = 'Government ID';
        let isAadhaar = false;
        let isPan = false;

        if (upper.includes('AADHAAR') || upper.includes('GOVERNMENT OF INDIA') || upper.includes('UIDAI') || upper.includes('MERA AADHAAR') || /\b\d{4}\s\d{4}\s\d{4}\b/.test(rawText)) {
            isAadhaar = true;
            docType = 'Aadhaar Card';
        } else if (upper.includes('INCOME TAX') || upper.includes('PERMANENT ACCOUNT NUMBER') || upper.includes('PAN') || /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/.test(rawText)) {
            isPan = true;
            docType = 'PAN Card';
        }

        // 1. Extract Document Number
        let docNumber = '';
        let maskedNumber = '';

        if (isAadhaar) {
            const matchAadhaar = rawText.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);
            if (matchAadhaar) {
                docNumber = `${matchAadhaar[1]} ${matchAadhaar[2]} ${matchAadhaar[3]}`;
                maskedNumber = `XXXX XXXX ${matchAadhaar[3]}`;
            }
        } else if (isPan) {
            const matchPan = rawText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
            if (matchPan) {
                docNumber = matchPan[1].toUpperCase();
                maskedNumber = docNumber;
            }
        }

        // Regex fallback
        if (!docNumber) {
            const aadhaarFallback = rawText.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
            const panFallback = rawText.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i);
            if (aadhaarFallback) {
                docNumber = aadhaarFallback[0];
                const parts = docNumber.split(' ');
                maskedNumber = `XXXX XXXX ${parts[2]}`;
                docType = 'Aadhaar Card';
            } else if (panFallback) {
                docNumber = panFallback[0].toUpperCase();
                maskedNumber = docNumber;
                docType = 'PAN Card';
            }
        }

        // 2. Extract DOB
        let dob = '';
        const dobMatch = rawText.match(/(?:DOB|Date of Birth|Year of Birth|Birth|YOB)\s*[:\-\/]?\s*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}|\d{4})/i)
            || rawText.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
        if (dobMatch) {
            dob = dobMatch[1];
        }

        // 3. Extract Gender
        let gender = '';
        if (/\b(FEMALE|WOMAN)\b/i.test(rawText)) {
            gender = 'FEMALE';
        } else if (/\b(MALE|MAN)\b/i.test(rawText)) {
            gender = 'MALE';
        } else if (/\b(TRANSGENDER)\b/i.test(rawText)) {
            gender = 'TRANSGENDER';
        }

        // 4. Extract Name
        let name = '';
        const ignoredWords = ['GOVERNMENT', 'INDIA', 'INCOME', 'TAX', 'DEPARTMENT', 'PERMANENT', 'ACCOUNT', 'NUMBER', 'CARD', 'MALE', 'FEMALE', 'FATHER', 'SIGNATURE', 'UIDAI', 'ENROLMENT', 'HELP', 'BHARAT', 'SARKAR'];
        for (const line of lines) {
            const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
            const words = cleanLine.split(/\s+/).filter(w => w.length > 1);
            if (words.length >= 2 && words.length <= 4) {
                const hasIgnored = words.some(w => ignoredWords.includes(w.toUpperCase()));
                if (!hasIgnored && !cleanLine.toLowerCase().includes('date') && !cleanLine.toLowerCase().includes('year')) {
                    name = cleanLine;
                    break;
                }
            }
        }

        return {
            docType,
            name,
            docNumber,
            maskedNumber: maskedNumber || docNumber,
            dob,
            gender,
            rawText
        };
    }
};
