/**
 * Client-Side Image Processing Engine for TECHTIS (techtis.in)
 * High-performance, 100% in-browser Canvas & WebAssembly image tools.
 * Zero server uploads, zero network latency, strict user privacy.
 */

export const ImageEngine = {
    /**
     * Load an image file into an HTMLImageElement using FileReader
     * (Preserves persistent data URL that never gets revoked)
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('No file provided.'));
            }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    img._dataUrl = reader.result;
                    resolve(img);
                };
                img.onerror = () => reject(new Error('Failed to load and decode image data.'));
                img.src = reader.result;
            };
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Render a PDF page onto an HTML5 Canvas using PDF.js
     */
    async renderPdfToCanvas(file, pageNum = 1, scale = 1.75) {
        if (!window.pdfjsLib) {
            throw new Error('PDF.js engine is not loaded in browser.');
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(Math.min(pageNum, pdf.numPages));
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({ canvasContext: ctx, viewport }).promise;
        return {
            canvas,
            numPages: pdf.numPages,
            dataUrl: canvas.toDataURL('image/png')
        };
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
        const MM_TO_POINTS = 72 / 25.4;
        const A4_WIDTH_POINTS = 210 * MM_TO_POINTS;
        const A4_HEIGHT_POINTS = 297 * MM_TO_POINTS;

        const photoWidthPoints = preset.widthMm * MM_TO_POINTS;
        const photoHeightPoints = preset.heightMm * MM_TO_POINTS;

        const marginX = 15 * MM_TO_POINTS;
        const marginY = 15 * MM_TO_POINTS;
        const gapX = 4 * MM_TO_POINTS;
        const gapY = 4 * MM_TO_POINTS;

        const printableWidth = A4_WIDTH_POINTS - (2 * marginX);
        const cols = Math.floor((printableWidth + gapX) / (photoWidthPoints + gapX));
        const rows = Math.ceil(quantity / cols);

        if (!window.PDFLib) {
            throw new Error('PDF-Lib engine not available in browser memory.');
        }

        const pdfDoc = await window.PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage([A4_WIDTH_POINTS, A4_HEIGHT_POINTS]);

        const imgBytes = await fetch(croppedDataUrl).then(r => r.arrayBuffer());
        const isPng = croppedDataUrl.startsWith('data:image/png');
        const embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

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

        let placed = 0;
        for (let r = 0; r < rows && placed < quantity; r++) {
            for (let c = 0; c < cols && placed < quantity; c++) {
                const x = marginX + (c * (photoWidthPoints + gapX));
                const y = A4_HEIGHT_POINTS - marginY - 28 - ((r + 1) * photoHeightPoints) - (r * gapY);

                page.drawImage(embeddedImg, {
                    x,
                    y,
                    width: photoWidthPoints,
                    height: photoHeightPoints
                });

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
    },

    /**
     * Perform 100% Client-Side OCR using in-browser WebAssembly Tesseract.js
     */
    async performClientOcr(imageSource, onProgress = () => {}) {
        if (!window.Tesseract) {
            throw new Error('Tesseract OCR library is not available in browser memory.');
        }

        onProgress({ status: 'init', progress: 0.15, message: 'Initializing client-side WASM OCR worker...' });
        
        try {
            if (typeof window.Tesseract.createWorker === 'function') {
                const worker = await window.Tesseract.createWorker('eng', 1, {
                    logger: m => {
                        if (m && m.status) {
                            const pct = Math.round((m.progress || 0) * 100);
                            onProgress({ status: m.status, progress: m.progress || 0, message: `Running OCR: ${m.status} (${pct}%)` });
                        }
                    }
                });
                const res = await worker.recognize(imageSource);
                await worker.terminate();
                return res.data?.text || '';
            } else if (typeof window.Tesseract.recognize === 'function') {
                const res = await window.Tesseract.recognize(imageSource, 'eng', {
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
     * Comprehensive Intelligent OCR Parser for any ID card, PDF or Form
     * Extracts: Name, Email, Phone, Father's Name, DOB, Gender, ID Numbers, Address, Pin Code
     */
    extractAllDocumentFields(rawText) {
        if (!rawText || !rawText.trim()) {
            return {
                docType: 'Document',
                name: '',
                email: '',
                phone: '',
                dob: '',
                gender: '',
                idNumber: '',
                maskedIdNumber: '',
                fatherName: '',
                address: '',
                pincode: '',
                organization: '',
                allFields: [],
                rawText: ''
            };
        }

        const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
        const upper = cleanText.toUpperCase();

        // 1. Detect Document / Card Type
        let docType = 'General Document';
        if (upper.includes('AADHAAR') || upper.includes('UIDAI') || upper.includes('MERA AADHAAR') || /\b\d{4}\s\d{4}\s\d{4}\b/.test(cleanText)) {
            docType = 'Aadhaar Card';
        } else if (upper.includes('INCOME TAX') || upper.includes('PERMANENT ACCOUNT NUMBER') || upper.includes('PAN CARD') || /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/.test(cleanText)) {
            docType = 'PAN Card';
        } else if (upper.includes('PASSPORT') || upper.includes('REPUBLIC OF') || /\bP<[A-Z]{3}/.test(cleanText)) {
            docType = 'Passport';
        } else if (upper.includes('DRIVING LICENCE') || upper.includes('DRIVING LICENSE') || upper.includes('UNION OF INDIA') && upper.includes('TRANSPORT')) {
            docType = 'Driving License';
        } else if (upper.includes('ELECTION COMMISSION') || upper.includes('VOTER') || /\b[A-Z]{3}[0-9]{7}\b/.test(cleanText)) {
            docType = 'Voter ID Card';
        } else if (upper.includes('INVOICE') || upper.includes('TAX INVOICE') || upper.includes('BILL TO')) {
            docType = 'Invoice / Bill';
        } else if (upper.includes('RESUME') || upper.includes('CURRICULUM VITAE') || upper.includes('EXPERIENCE') && upper.includes('EDUCATION')) {
            docType = 'Resume / CV';
        } else if (upper.includes('CERTIFICATE') || upper.includes('MARKSHEET') || upper.includes('DEGREE')) {
            docType = 'Academic Certificate';
        }

        // 2. Extract Email Address
        let email = '';
        const emailMatch = cleanText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
        if (emailMatch) {
            email = emailMatch[0].toLowerCase();
        }

        // 3. Extract Phone / Mobile Number
        let phone = '';
        // Look for labeled phone first: "Phone: 9876543210", "Mob: +91 9876543210"
        const labeledPhone = cleanText.match(/(?:Mobile|Phone|Tel|Mob|Cell|Contact)\s*[:\-]?\s*([+]?[0-9\s\-\(\)]{10,16})/i);
        if (labeledPhone) {
            const digits = labeledPhone[1].replace(/[^0-9+]/g, '');
            if (digits.length >= 10 && digits.length <= 13) {
                phone = digits;
            }
        }
        if (!phone) {
            // Check for Indian mobile numbers starting with 6, 7, 8, 9 (10 digits)
            const indMobile = cleanText.match(/(?:\+91[\-\s]?)?([6-9]\d{9})\b/);
            if (indMobile) {
                phone = indMobile[1];
            } else {
                // International phone regex
                const anyPhone = cleanText.match(/\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/);
                if (anyPhone) {
                    phone = anyPhone[0];
                }
            }
        }

        // 4. Extract Date of Birth
        let dob = '';
        const labeledDob = cleanText.match(/(?:DOB|Date of Birth|Birth Date|Birth|YOB|Year of Birth)\s*[:\-\/]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4})/i);
        if (labeledDob) {
            dob = labeledDob[1];
        } else {
            const anyDate = cleanText.match(/\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/);
            if (anyDate) {
                dob = anyDate[1];
            }
        }

        // 5. Extract Gender
        let gender = '';
        if (/\b(FEMALE|WOMAN)\b/i.test(cleanText)) {
            gender = 'FEMALE';
        } else if (/\b(MALE|MAN)\b/i.test(cleanText)) {
            gender = 'MALE';
        } else if (/\b(TRANSGENDER)\b/i.test(cleanText)) {
            gender = 'TRANSGENDER';
        }

        // 6. Extract Document / ID Numbers
        let idNumber = '';
        let maskedIdNumber = '';

        if (docType === 'Aadhaar Card') {
            const aadhaarMatch = cleanText.match(/\b(\d{4})\s*(\d{4})\s*(\d{4})\b/);
            if (aadhaarMatch) {
                idNumber = `${aadhaarMatch[1]} ${aadhaarMatch[2]} ${aadhaarMatch[3]}`;
                maskedIdNumber = `XXXX XXXX ${aadhaarMatch[3]}`;
            }
        } else if (docType === 'PAN Card') {
            const panMatch = cleanText.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
            if (panMatch) {
                idNumber = panMatch[1].toUpperCase();
                maskedIdNumber = idNumber;
            }
        } else if (docType === 'Voter ID Card') {
            const voterMatch = cleanText.match(/\b([A-Z]{3}[0-9]{7})\b/);
            if (voterMatch) {
                idNumber = voterMatch[1];
                maskedIdNumber = idNumber;
            }
        } else if (docType === 'Passport') {
            const passMatch = cleanText.match(/\b([A-Z][0-9]{7})\b/);
            if (passMatch) {
                idNumber = passMatch[1];
                maskedIdNumber = idNumber;
            }
        }

        if (!idNumber) {
            const aadhaarGeneral = cleanText.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
            const panGeneral = cleanText.match(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/i);
            const labeledId = cleanText.match(/(?:ID|No|Number|Registration|Reg|Card No)\s*[:\-]?\s*([A-Za-z0-9\-\/]{6,18})/i);

            if (aadhaarGeneral) {
                idNumber = aadhaarGeneral[0];
                const parts = idNumber.split(' ');
                maskedIdNumber = `XXXX XXXX ${parts[2]}`;
            } else if (panGeneral) {
                idNumber = panGeneral[0].toUpperCase();
                maskedIdNumber = idNumber;
            } else if (labeledId) {
                idNumber = labeledId[1].trim();
                maskedIdNumber = idNumber;
            }
        }

        // 7. Extract Father / Guardian Name
        let fatherName = '';
        const fatherMatch = cleanText.match(/(?:Father's Name|Father Name|Father|S\/O|D\/O|W\/O|Husband)\s*[:\-\/]?\s*([A-Za-z\s\.]+)/i);
        if (fatherMatch) {
            const candidate = fatherMatch[1].split('\n')[0].replace(/[^a-zA-Z\s\.]/g, '').trim();
            if (candidate.length >= 3 && candidate.length <= 40) {
                fatherName = candidate;
            }
        }

        // 8. Extract Pin Code / Postal Code
        let pincode = '';
        const pinMatch = cleanText.match(/(?:Pin|PIN|Postal|Zip)\s*(?:Code)?\s*[:\-]?\s*([1-9][0-9]{5})/i) ||
                         cleanText.match(/\b([1-9][0-9]{5})\b/);
        if (pinMatch) {
            pincode = pinMatch[1];
        }

        // 9. Extract Address
        let address = '';
        const addressMatch = cleanText.match(/(?:Address|Add|Residential Address)\s*[:\-]?\s*([^\n]+(?:\n[^\n]+){1,3})/i);
        if (addressMatch) {
            address = addressMatch[1].replace(/\n/g, ', ').replace(/\s+/g, ' ').trim();
        }

        // 10. Extract Full Name
        let name = '';
        // Explicit "Name: ..."
        const labeledName = cleanText.match(/(?:Name|Full Name|Candidate Name|Applicant Name|Cardholder)\s*[:\-]?\s*([A-Za-z\s\.]+)/i);
        if (labeledName) {
            const cand = labeledName[1].split('\n')[0].replace(/[^a-zA-Z\s]/g, '').trim();
            if (cand.length >= 3 && cand.length <= 40) {
                name = cand;
            }
        }

        if (!name) {
            const ignoredWords = ['GOVERNMENT', 'INDIA', 'INCOME', 'TAX', 'DEPARTMENT', 'PERMANENT', 'ACCOUNT', 'NUMBER', 'CARD', 'MALE', 'FEMALE', 'FATHER', 'SIGNATURE', 'UIDAI', 'ENROLMENT', 'HELP', 'BHARAT', 'SARKAR', 'REPUBLIC', 'STATE', 'TRANSPORT', 'MINISTRY', 'AUTHORITY', 'COMMISSION', 'ELECTION'];
            for (const line of lines) {
                const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
                const words = cleanLine.split(/\s+/).filter(w => w.length > 1);
                if (words.length >= 2 && words.length <= 4) {
                    const hasIgnored = words.some(w => ignoredWords.includes(w.toUpperCase()));
                    if (!hasIgnored && !cleanLine.toLowerCase().includes('date') && !cleanLine.toLowerCase().includes('year') && !cleanLine.toLowerCase().includes('address')) {
                        name = cleanLine;
                        break;
                    }
                }
            }
        }

        // Collect all non-empty key-value fields for dynamic UI
        const allFields = [];
        if (name) allFields.push({ label: 'Full Name', key: 'name', value: name, icon: 'user' });
        if (email) allFields.push({ label: 'Email Address', key: 'email', value: email, icon: 'mail' });
        if (phone) allFields.push({ label: 'Phone Number', key: 'phone', value: phone, icon: 'phone' });
        if (idNumber) allFields.push({ label: `${docType} Number`, key: 'idNumber', value: idNumber, masked: maskedIdNumber || idNumber, icon: 'credit-card' });
        if (dob) allFields.push({ label: 'Date of Birth', key: 'dob', value: dob, icon: 'calendar' });
        if (gender) allFields.push({ label: 'Gender', key: 'gender', value: gender, icon: 'users' });
        if (fatherName) allFields.push({ label: "Father / Guardian", key: 'fatherName', value: fatherName, icon: 'user-check' });
        if (pincode) allFields.push({ label: 'PIN / Postal Code', key: 'pincode', value: pincode, icon: 'map-pin' });
        if (address) allFields.push({ label: 'Full Address', key: 'address', value: address, icon: 'map' });

        return {
            docType,
            name,
            email,
            phone,
            dob,
            gender,
            idNumber,
            maskedIdNumber: maskedIdNumber || idNumber,
            fatherName,
            address,
            pincode,
            allFields,
            rawText: cleanText
        };
    },

    /**
     * Backward-compatible parseIdCard calling extractAllDocumentFields
     */
    parseIdCard(rawText) {
        const fields = this.extractAllDocumentFields(rawText);
        return {
            docType: fields.docType,
            name: fields.name,
            docNumber: fields.idNumber,
            maskedNumber: fields.maskedIdNumber,
            dob: fields.dob,
            gender: fields.gender,
            email: fields.email,
            phone: fields.phone,
            rawText: fields.rawText
        };
    }
};
