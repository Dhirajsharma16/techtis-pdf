/**
 * TechTis Image & Vector Converters Engine
 * 100% In-Browser RAM Execution | Zero Server Dependencies
 * Tools: SVG to PNG, Image to SVG, WebP to JPG/PNG, Social Media Resizer
 */

export const ImageConverterEngine = {
    /**
     * 1. SVG to PNG Converter with Custom Scale
     */
    async svgToPng(svgDataOrUrl, scaleOrOptions = 2, bgColor = 'transparent') {
        return new Promise((resolve, reject) => {
            let scale = 2;
            if (typeof scaleOrOptions === 'object' && scaleOrOptions !== null) {
                scale = scaleOrOptions.scale || 2;
                if (scaleOrOptions.bgColor) bgColor = scaleOrOptions.bgColor;
            } else if (typeof scaleOrOptions === 'number') {
                scale = scaleOrOptions;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';

            let srcUrl = svgDataOrUrl;
            let shouldRevoke = false;

            if (svgDataOrUrl.startsWith('<svg') || svgDataOrUrl.startsWith('<?xml')) {
                const blob = new Blob([svgDataOrUrl], { type: 'image/svg+xml;charset=utf-8' });
                srcUrl = URL.createObjectURL(blob);
                shouldRevoke = true;
            }

            img.onload = () => {
                const origW = img.naturalWidth || 500;
                const origH = img.naturalHeight || 500;
                const targetW = Math.round(origW * scale);
                const targetH = Math.round(origH * scale);

                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');

                if (bgColor !== 'transparent') {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, targetW, targetH);
                }

                ctx.drawImage(img, 0, 0, targetW, targetH);
                if (shouldRevoke) URL.revokeObjectURL(srcUrl);

                canvas.toBlob(blob => {
                    resolve({
                        blob,
                        dataUrl: canvas.toDataURL('image/png'),
                        width: targetW,
                        height: targetH,
                        sizeBytes: blob ? blob.size : 0
                    });
                }, 'image/png');
            };

            img.onerror = (e) => {
                if (shouldRevoke) URL.revokeObjectURL(srcUrl);
                reject(new Error('Failed to parse or render SVG file.'));
            };

            img.src = srcUrl;
        });
    },

    /**
     * 2. Image to SVG Vectorizer (Trace raster pixels to SVG paths)
     */
    async imageToSvg(imageFileOrUrl, options = {}) {
        const {
            contrast = 1.2,
            colors = 8, // color quantization steps
            threshold = 128
        } = options;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Downsample to max 300px for responsive vector tracing
                const maxDim = 250;
                let w = img.naturalWidth;
                let h = img.naturalHeight;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    else { w = Math.round((w * maxDim) / h); h = maxDim; }
                }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const imgData = ctx.getImageData(0, 0, w, h);
                const d = imgData.data;

                // Color quantization clusters
                const clusterMap = new Map();
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const idx = (y * w + x) * 4;
                        const a = d[idx + 3];
                        if (a < 30) continue; // transparent

                        // Posterize RGB channels
                        const step = Math.max(16, Math.floor(256 / colors));
                        const r = Math.min(255, Math.floor(d[idx] / step) * step);
                        const g = Math.min(255, Math.floor(d[idx + 1] / step) * step);
                        const b = Math.min(255, Math.floor(d[idx + 2] / step) * step);
                        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

                        if (!clusterMap.has(hex)) clusterMap.set(hex, []);
                        clusterMap.get(hex).push({ x, y });
                    }
                }

                // Generate SVG paths with grouped rects / run-length rectangles
                let svgPaths = '';
                clusterMap.forEach((pixels, color) => {
                    // Group adjacent horizontal pixels into wider rectangles for compact SVG
                    const rows = new Map();
                    pixels.forEach(p => {
                        if (!rows.has(p.y)) rows.set(p.y, []);
                        rows.get(p.y).push(p.x);
                    });

                    let pathD = '';
                    rows.forEach((xList, y) => {
                        xList.sort((a, b) => a - b);
                        let startX = xList[0];
                        let runLen = 1;

                        for (let i = 1; i < xList.length; i++) {
                            if (xList[i] === startX + runLen) {
                                runLen++;
                            } else {
                                pathD += `M${startX},${y}h${runLen}v1h-${runLen}Z `;
                                startX = xList[i];
                                runLen = 1;
                            }
                        }
                        pathD += `M${startX},${y}h${runLen}v1h-${runLen}Z `;
                    });

                    if (pathD) {
                        svgPaths += `<path fill="${color}" d="${pathD.trim()}"/>\n`;
                    }
                });

                const svgMarkup = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${img.naturalWidth}" height="${img.naturalHeight}">\n${svgPaths}</svg>`;
                const blob = new Blob([svgMarkup], { type: 'image/svg+xml' });

                resolve({
                    svgString: svgMarkup,
                    blob,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    sizeBytes: blob.size
                });
            };

            img.onerror = () => reject(new Error('Failed to load image for vectorization.'));

            if (imageFileOrUrl instanceof File || imageFileOrUrl instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => { img.src = reader.result; };
                reader.readAsDataURL(imageFileOrUrl);
            } else {
                img.src = imageFileOrUrl;
            }
        });
    },

    /**
     * 3. WebP to JPG / PNG Converter
     */
    async convertWebp(fileOrBlob, targetFormat = 'jpeg', quality = 0.92) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const isFile = fileOrBlob instanceof File || fileOrBlob instanceof Blob;
            const url = isFile ? URL.createObjectURL(fileOrBlob) : fileOrBlob;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || 500;
                canvas.height = img.naturalHeight || 500;
                const ctx = canvas.getContext('2d');

                const mime = targetFormat.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg';
                if (!mime.includes('png')) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);
                if (isFile) URL.revokeObjectURL(url);

                canvas.toBlob(blob => {
                    resolve({
                        blob,
                        dataUrl: canvas.toDataURL(mime, quality),
                        width: canvas.width,
                        height: canvas.height,
                        format: targetFormat.toUpperCase(),
                        sizeBytes: blob ? blob.size : 0
                    });
                }, mime, quality);
            };

            img.onerror = () => {
                if (isFile) URL.revokeObjectURL(url);
                reject(new Error('Failed to decode WebP image.'));
            };

            img.src = url;
        });
    },

    /**
     * 4. Social Media Image Resizer (Presets & Smart Fitting)
     */
    getSocialPresets() {
        return [
            { id: 'ig-square', platform: 'Instagram', name: 'Square Post (1:1)', width: 1080, height: 1080, icon: 'instagram' },
            { id: 'ig-story', platform: 'Instagram', name: 'Story / Reel (9:16)', width: 1080, height: 1920, icon: 'smartphone' },
            { id: 'yt-thumb', platform: 'YouTube', name: 'Video Thumbnail (16:9)', width: 1280, height: 720, icon: 'youtube' },
            { id: 'yt-banner', platform: 'YouTube', name: 'Channel Banner', width: 2560, height: 1440, icon: 'tv' },
            { id: 'li-post', platform: 'LinkedIn', name: 'Feed Post (1.91:1)', width: 1200, height: 627, icon: 'briefcase' },
            { id: 'tw-post', platform: 'Twitter / X', name: 'Post Image (16:9)', width: 1200, height: 675, icon: 'twitter' },
            { id: 'tw-header', platform: 'Twitter / X', name: 'Profile Header (3:1)', width: 1500, height: 500, icon: 'layout' },
            { id: 'fb-post', platform: 'Facebook', name: 'Shared Post', width: 1200, height: 630, icon: 'facebook' }
        ];
    },

    async resizeToSocialPreset(fileOrImage, presetOrId, fitMode = 'cover', bgColor = '#ffffff') {
        return new Promise((resolve, reject) => {
            const presets = this.getSocialPresets();
            let preset = presetOrId;
            if (typeof presetOrId === 'string') {
                const normalized = presetOrId.replace('instagram-square', 'ig-square')
                                             .replace('instagram-story', 'ig-story')
                                             .replace('youtube-thumbnail', 'yt-thumb')
                                             .replace('youtube-banner', 'yt-banner');
                preset = presets.find(p => p.id === presetOrId || p.id === normalized || p.id.includes(presetOrId)) || presets[0];
            }
            if (!preset || !preset.width || !preset.height) {
                preset = presets[0];
            }

            const img = new Image();
            const isFile = fileOrImage instanceof File || fileOrImage instanceof Blob;
            const url = isFile ? URL.createObjectURL(fileOrImage) : fileOrImage;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = preset.width;
                canvas.height = preset.height;
                const ctx = canvas.getContext('2d');

                // Fill background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                const srcW = img.naturalWidth || 500;
                const srcH = img.naturalHeight || 500;

                if (fitMode === 'cover') {
                    // Crop center to fill
                    const scale = Math.max(preset.width / srcW, preset.height / srcH);
                    const drawW = srcW * scale;
                    const drawH = srcH * scale;
                    const dx = (preset.width - drawW) / 2;
                    const dy = (preset.height - drawH) / 2;
                    ctx.drawImage(img, dx, dy, drawW, drawH);
                } else if (fitMode === 'contain') {
                    // Fit within canvas with background letterbox
                    const scale = Math.min(preset.width / srcW, preset.height / srcH);
                    const drawW = srcW * scale;
                    const drawH = srcH * scale;
                    const dx = (preset.width - drawW) / 2;
                    const dy = (preset.height - drawH) / 2;
                    ctx.drawImage(img, dx, dy, drawW, drawH);
                } else {
                    // Stretch
                    ctx.drawImage(img, 0, 0, preset.width, preset.height);
                }

                if (isFile) URL.revokeObjectURL(url);

                canvas.toBlob(blob => {
                    resolve({
                        blob,
                        dataUrl: canvas.toDataURL('image/jpeg', 0.92),
                        width: preset.width,
                        height: preset.height,
                        presetName: preset.name,
                        sizeBytes: blob ? blob.size : 0
                    });
                }, 'image/jpeg', 0.92);
            };

            img.onerror = () => {
                if (isFile) URL.revokeObjectURL(url);
                reject(new Error('Failed to load image for social resizing.'));
            };

            img.src = url;
        });
    }
};
