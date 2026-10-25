/**
 * TechTis CSS & Design Tools Engine
 * 100% In-Browser RAM Execution | Zero Server Dependencies
 * Tools: Glassmorphism, Box Shadow, CSS Gradient, Neumorphism, Color Converter
 */

// ==============================================================================
// 1. CSS Glassmorphism Generator
// ==============================================================================
export const GlassmorphismEngine = {
    generateCss(options = {}) {
        const {
            blur = 16,
            opacity = 0.25,
            saturation = 140,
            bgColor = '#ffffff',
            borderWidth = 1,
            borderOpacity = 0.2,
            borderRadius = 20,
            hasShadow = true
        } = options;

        // Convert hex to rgb
        const rgb = ColorEngine.hexToRgb(bgColor) || { r: 255, g: 255, b: 255 };
        const bgRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        const borderRgba = `rgba(255, 255, 255, ${borderOpacity})`;
        const shadowCss = hasShadow ? 'box-shadow: 0 8px 32px 0 rgba(0, 34, 68, 0.18);' : 'box-shadow: none;';

        const css = [
            `background: ${bgRgba};`,
            `backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
            `-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);`,
            `border-radius: ${borderRadius}px;`,
            `border: ${borderWidth}px solid ${borderRgba};`,
            shadowCss
        ].join('\n');

        return {
            css,
            styles: {
                background: bgRgba,
                backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                borderRadius: `${borderRadius}px`,
                border: `${borderWidth}px solid ${borderRgba}`,
                boxShadow: hasShadow ? '0 8px 32px 0 rgba(0, 34, 68, 0.18)' : 'none'
            }
        };
    },

    generateCSS(options = {}) {
        return this.generateCss(options).css;
    }
};

// ==============================================================================
// 2. CSS Box Shadow Generator (Multi-Layer)
// ==============================================================================
export const BoxShadowEngine = {
    generateCss(layers = []) {
        if (!layers || layers.length === 0) {
            layers = [{ x: 0, y: 10, blur: 25, spread: -5, color: '#002244', opacity: 0.2, inset: false }];
        } else if (!Array.isArray(layers) && typeof layers === 'object') {
            layers = [layers];
        }

        const shadowStrings = layers.map(l => {
            const rgb = ColorEngine.hexToRgb(l.color || '#000000') || { r: 0, g: 0, b: 0 };
            const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${l.opacity !== undefined ? l.opacity : 0.2})`;
            const insetStr = l.inset ? 'inset ' : '';
            return `${insetStr}${l.x || 0}px ${l.y || 0}px ${l.blur || 0}px ${l.spread || 0}px ${rgba}`;
        });

        const css = `box-shadow: ${shadowStrings.join(',\n            ')};`;
        return {
            css,
            shadowValue: shadowStrings.join(', ')
        };
    },

    generateCSS(options = {}) {
        return this.generateCss(options).css;
    }
};

// ==============================================================================
// 3. CSS Gradient Generator (Linear & Radial)
// ==============================================================================
export const GradientEngine = {
    generateCss(options = {}) {
        let {
            type = 'linear',
            angle = 90,
            radialShape = 'circle',
            stops
        } = options;

        if (!stops && (options.color1 || options.color2)) {
            stops = [
                { color: options.color1 || '#002244', stop: 0 },
                { color: options.color2 || '#ea1d2c', stop: 100 }
            ];
        } else if (!stops) {
            stops = [
                { color: '#002244', stop: 0 },
                { color: '#ea1d2c', stop: 100 }
            ];
        }

        const stopStrings = stops
            .sort((a, b) => a.stop - b.stop)
            .map(s => `${s.color} ${s.stop}%`)
            .join(', ');

        let gradientVal = '';
        if (type === 'linear') {
            gradientVal = `linear-gradient(${angle}deg, ${stopStrings})`;
        } else {
            gradientVal = `radial-gradient(${radialShape}, ${stopStrings})`;
        }

        return {
            css: `background: ${gradientVal};`,
            gradientValue: gradientVal
        };
    },

    generateCSS(options = {}) {
        return this.generateCss(options).css;
    },

    getPresets() {
        return [
            { name: 'TechTis Signature', stops: [{ color: '#002244', stop: 0 }, { color: '#ea1d2c', stop: 100 }], angle: 90 },
            { name: 'Sunset Glow', stops: [{ color: '#ff512f', stop: 0 }, { color: '#dd2476', stop: 100 }], angle: 135 },
            { name: 'Ocean Wave', stops: [{ color: '#2b5876', stop: 0 }, { color: '#4e4376', stop: 100 }], angle: 120 },
            { name: 'Emerald Sea', stops: [{ color: '#10b981', stop: 0 }, { color: '#047857', stop: 100 }], angle: 90 },
            { name: 'Deep Space', stops: [{ color: '#000428', stop: 0 }, { color: '#004e92', stop: 100 }], angle: 45 },
            { name: 'Royal Purple', stops: [{ color: '#654ea3', stop: 0 }, { color: '#eaafc8', stop: 100 }], angle: 135 }
        ];
    }
};

// ==============================================================================
// 4. CSS Neumorphism Generator (Soft UI)
// ==============================================================================
export const NeumorphismEngine = {
    generateCss(options = {}) {
        const {
            color = '#e0e5ec',
            size = 200,
            radius = 30,
            distance = 15,
            blur = 30,
            intensity = 0.15
        } = options;
        const shape = options.shape || options.type || 'flat';

        const rgb = ColorEngine.hexToRgb(color) || { r: 224, g: 229, b: 236 };

        // Calculate lighter and darker shades
        const darkR = Math.max(0, Math.round(rgb.r * (1 - intensity)));
        const darkG = Math.max(0, Math.round(rgb.g * (1 - intensity)));
        const darkB = Math.max(0, Math.round(rgb.b * (1 - intensity)));
        const darkColor = `rgba(${darkR}, ${darkG}, ${darkB}, 0.6)`;

        const lightR = Math.min(255, Math.round(rgb.r * (1 + intensity * 0.75)));
        const lightG = Math.min(255, Math.round(rgb.g * (1 + intensity * 0.75)));
        const lightB = Math.min(255, Math.round(rgb.b * (1 + intensity * 0.75)));
        const lightColor = `rgba(${lightR}, ${lightG}, ${lightB}, 0.9)`;

        let bgVal = color;
        let shadowVal = '';

        if (shape === 'flat') {
            bgVal = color;
            shadowVal = `${distance}px ${distance}px ${blur}px ${darkColor}, -${distance}px -${distance}px ${blur}px ${lightColor}`;
        } else if (shape === 'concave') {
            bgVal = `linear-gradient(145deg, ${ColorEngine.rgbToHex(darkR, darkG, darkB)}, ${ColorEngine.rgbToHex(lightR, lightG, lightB)})`;
            shadowVal = `${distance}px ${distance}px ${blur}px ${darkColor}, -${distance}px -${distance}px ${blur}px ${lightColor}`;
        } else if (shape === 'convex') {
            bgVal = `linear-gradient(145deg, ${ColorEngine.rgbToHex(lightR, lightG, lightB)}, ${ColorEngine.rgbToHex(darkR, darkG, darkB)})`;
            shadowVal = `${distance}px ${distance}px ${blur}px ${darkColor}, -${distance}px -${distance}px ${blur}px ${lightColor}`;
        } else if (shape === 'pressed') {
            bgVal = color;
            shadowVal = `inset ${distance}px ${distance}px ${blur}px ${darkColor}, inset -${distance}px -${distance}px ${blur}px ${lightColor}`;
        }

        const css = [
            `border-radius: ${radius}px;`,
            `background: ${bgVal};`,
            `box-shadow: ${shadowVal};`
        ].join('\n');

        return {
            css,
            borderRadius: `${radius}px`,
            background: bgVal,
            boxShadow: shadowVal
        };
    },

    generateCSS(options = {}) {
        return this.generateCss(options).css;
    }
};

// ==============================================================================
// 5. Hex to RGB Color Converter & Palette Tools
// ==============================================================================
export const ColorEngine = {
    hexToRgb(hex) {
        let clean = hex.replace('#', '').trim();
        if (clean.length === 3) {
            clean = clean.split('').map(c => c + c).join('');
        }
        if (clean.length !== 6) return null;
        const num = parseInt(clean, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
        };
    },

    rgbToHex(r, g, b) {
        const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
        return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    },

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    rgbToCmyk(r, g, b) {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, Math.min(m, y));

        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        return {
            c: Math.round(((c - k) / (1 - k)) * 100),
            m: Math.round(((m - k) / (1 - k)) * 100),
            y: Math.round(((y - k) / (1 - k)) * 100),
            k: Math.round(k * 100)
        };
    },

    convertAll(inputHex) {
        const rgb = this.hexToRgb(inputHex) || { r: 0, g: 34, b: 68 };
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = this.rgbToCmyk(rgb.r, rgb.g, rgb.b);

        // Complementary color: (h + 180) % 360
        const compH = (hsl.h + 180) % 360;
        // Contrast ratio against white (255,255,255) and black (0,0,0)
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const textColor = luminance > 0.55 ? '#000000' : '#ffffff';

        // 5 Shades (Light to Dark)
        const shades = [0.8, 0.4, 0, -0.3, -0.6].map(factor => {
            const adjust = (c) => factor > 0 ? c + (255 - c) * factor : c * (1 + factor);
            return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
        });

        return {
            hex,
            rgbString: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            cmykString: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
            rgb,
            hsl,
            cmyk,
            textColor,
            shades
        };
    },

    fromHex(hex) {
        const all = this.convertAll(hex);
        return {
            hex: all.hex,
            rgb: all.rgbString,
            hsl: all.hslString,
            cmyk: all.cmykString,
            shades: all.shades,
            textColor: all.textColor
        };
    },

    getLuminance(hex) {
        const rgb = this.hexToRgb(hex) || { r: 0, g: 0, b: 0 };
        const a = [rgb.r, rgb.g, rgb.b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    },

    getContrastRatio(hex1, hex2) {
        const l1 = this.getLuminance(hex1);
        const l2 = this.getLuminance(hex2);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return Math.round(ratio * 10) / 10;
    },

    generateShades(hex, count = 5) {
        const all = this.convertAll(hex);
        return all.shades.slice(0, count);
    }
};
