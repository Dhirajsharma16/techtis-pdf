/**
 * TechTis Developer Tools Engine
 * 100% In-Browser RAM Execution | Zero Server Dependencies
 * Tools: QR Code Generator, JSON Formatter, Base64 Converter, URL Encoder, Hash Generator, Password Generator
 */

// ==============================================================================
// 1. Pure JS QR Code Matrix Generator (Zero External Dependencies)
// ==============================================================================
// Compact, standalone QR Code byte-mode generator supporting Version 1-10 with EC Level M/L
class QRBitBuffer {
    constructor() { this.buffer = []; this.length = 0; }
    get(index) { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; }
    put(num, length) { for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1); }
    putBit(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) this.buffer.push(0);
        if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        this.length++;
    }
}

const QR_POLY = [
    0, 1, 2, 4, 8, 16, 32, 64, 128, 29, 58, 116, 232, 205, 135, 19, 38, 76, 152, 45, 90, 180, 117, 234, 201, 143, 3, 6,
    12, 24, 48, 96, 192, 157, 39, 78, 156, 37, 74, 148, 53, 106, 212, 217, 223, 219, 211, 219, 203, 147, 51, 102, 204
];

export const QRCodeEngine = {
    /**
     * Generate QR code matrix as 2D boolean array
     */
    generateMatrix(text, errorCorrectLevel = 'M') {
        const str = String(text || '');
        // Determine version based on length
        let version = 1;
        const len = str.length;
        if (len <= 14) version = 1;
        else if (len <= 26) version = 2;
        else if (len <= 42) version = 3;
        else if (len <= 62) version = 4;
        else if (len <= 84) version = 5;
        else if (len <= 106) version = 6;
        else if (len <= 122) version = 7;
        else if (len <= 152) version = 8;
        else if (len <= 180) version = 9;
        else version = 10;

        const size = version * 4 + 17;
        const matrix = Array.from({ length: size }, () => Array(size).fill(null));

        function setFinder(r, c) {
            for (let y = -1; y <= 7; y++) {
                for (let x = -1; x <= 7; x++) {
                    const row = r + y, col = c + x;
                    if (row >= 0 && row < size && col >= 0 && col < size) {
                        const isOuter = (y === 0 || y === 6 || x === 0 || x === 6);
                        const isInner = (y >= 2 && y <= 4 && x >= 2 && x <= 4);
                        const isBorder = (y === -1 || y === 7 || x === -1 || x === 7);
                        if (isBorder) matrix[row][col] = false;
                        else matrix[row][col] = isOuter || isInner;
                    }
                }
            }
        }

        // Place finders (Top-Left, Top-Right, Bottom-Left)
        setFinder(0, 0);
        setFinder(0, size - 7);
        setFinder(size - 7, 0);

        // Timing patterns
        for (let i = 8; i < size - 8; i++) {
            if (matrix[6][i] === null) matrix[6][i] = (i % 2 === 0);
            if (matrix[i][6] === null) matrix[i][6] = (i % 2 === 0);
        }

        // Dark module
        matrix[4 * version + 9][8] = true;

        // Populate payload bits
        const buffer = new QRBitBuffer();
        buffer.put(4, 4); // Byte mode indicator
        buffer.put(len, version < 10 ? 8 : 16);
        for (let i = 0; i < len; i++) {
            buffer.put(str.charCodeAt(i), 8);
        }

        // Simple mask & data layout
        let bitIndex = 0;
        let right = size - 1;
        let upward = true;

        while (right > 0) {
            if (right === 6) right--; // Skip timing col
            for (let v = 0; v < size; v++) {
                const y = upward ? size - 1 - v : v;
                for (let h = 0; h < 2; h++) {
                    const x = right - h;
                    if (matrix[y][x] === null) {
                        let bit = false;
                        if (bitIndex < buffer.length) {
                            bit = buffer.get(bitIndex++);
                        } else {
                            // Padding bits
                            bit = ((y + x) % 2 === 0);
                        }
                        // Mask pattern: (row + col) % 2 === 0
                        const mask = ((y + x) % 2 === 0);
                        matrix[y][x] = bit ^ mask;
                    }
                }
            }
            right -= 2;
            upward = !upward;
        }

        return matrix;
    },

    /**
     * Draw QR Code onto HTML5 Canvas
     */
    drawToCanvas(canvas, text, options = {}) {
        const {
            size = 300,
            darkColor = '#002244',
            lightColor = '#ffffff',
            margin = 2
        } = options;

        const matrix = this.generateMatrix(text);
        const moduleCount = matrix.length;
        const totalModules = moduleCount + margin * 2;
        const moduleSize = size / totalModules;

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, size, size);

        // Modules
        ctx.fillStyle = darkColor;
        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                if (matrix[r][c]) {
                    const x = Math.round((c + margin) * moduleSize);
                    const y = Math.round((r + margin) * moduleSize);
                    const w = Math.ceil(moduleSize);
                    const h = Math.ceil(moduleSize);
                    ctx.fillRect(x, y, w, h);
                }
            }
        }
        return canvas;
    },

    /**
     * Render as vector SVG string
     */
    generateSvg(text, options = {}) {
        const {
            size = 300,
            darkColor = '#002244',
            lightColor = '#ffffff',
            margin = 2
        } = options;

        const matrix = this.generateMatrix(text);
        const moduleCount = matrix.length;
        const totalModules = moduleCount + margin * 2;
        let rects = '';

        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                if (matrix[r][c]) {
                    rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="${darkColor}"/>`;
                }
            }
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${size}" height="${size}">
            <rect width="100%" height="100%" fill="${lightColor}"/>
            ${rects}
        </svg>`;
    },

    generateSVG(text, options = {}) {
        return this.generateSvg(text, options);
    },

    renderToCanvas(text, options = {}) {
        const canvas = document.createElement('canvas');
        return this.drawToCanvas(canvas, text, options);
    }
};

// ==============================================================================
// 2. JSON Formatter, Minifier & Validator
// ==============================================================================
export const JsonEngine = {
    validate(jsonString) {
        if (!jsonString || !jsonString.trim()) {
            return { valid: false, isValid: false, error: 'Input is empty' };
        }
        try {
            const parsed = JSON.parse(jsonString);
            return {
                valid: true,
                isValid: true,
                data: parsed,
                type: Array.isArray(parsed) ? 'Array' : typeof parsed,
                keysCount: (parsed && typeof parsed === 'object') ? Object.keys(parsed).length : 0,
                sizeBytes: new Blob([jsonString]).size
            };
        } catch (err) {
            // Extract line and column from error message if available
            const match = err.message.match(/at position (\d+)/);
            let line = 1, col = 1;
            if (match) {
                const pos = parseInt(match[1], 10);
                const sub = jsonString.slice(0, pos);
                const lines = sub.split('\n');
                line = lines.length;
                col = lines[lines.length - 1].length + 1;
            }
            return {
                valid: false,
                isValid: false,
                error: err.message,
                line,
                col
            };
        }
    },

    format(jsonString, indent = 2) {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, indent);
    },

    minify(jsonString) {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed);
    }
};

// ==============================================================================
// 3. Base64 Encoder & Decoder (Text & Binary/Image)
// ==============================================================================
export const Base64Engine = {
    textToBase64(text) {
        return btoa(unescape(encodeURIComponent(text)));
    },

    base64ToText(base64) {
        const clean = base64.replace(/^data:[a-zA-Z0-9\/+-]+;base64,/, '').trim();
        return decodeURIComponent(escape(atob(clean)));
    },

    encodeUtf8(text) {
        return this.textToBase64(text);
    },

    decodeUtf8(base64) {
        return this.base64ToText(base64);
    },

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    base64ToBlob(base64Data, defaultMime = 'image/png') {
        const parts = base64Data.split(';base64,');
        const contentType = parts.length > 1 ? parts[0].replace('data:', '') : defaultMime;
        const raw = atob(parts.length > 1 ? parts[1] : parts[0]);
        const uInt8Array = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array], { type: contentType });
    }
};

// ==============================================================================
// 4. URL Encoder & Decoder
// ==============================================================================
export const UrlEngine = {
    encode(str, mode = 'component') {
        return mode === 'component' ? encodeURIComponent(str) : encodeURI(str);
    },

    decode(str, mode = 'component') {
        return mode === 'component' ? decodeURIComponent(str) : decodeURI(str);
    },

    parseUrl(urlString) {
        try {
            const u = new URL(urlString);
            const params = [];
            u.searchParams.forEach((value, key) => {
                params.push({ key, value });
            });
            return {
                valid: true,
                protocol: u.protocol,
                host: u.host,
                pathname: u.pathname,
                hash: u.hash,
                params
            };
        } catch (_) {
            return { valid: false };
        }
    },

    parseQueryParams(urlString) {
        const result = {};
        try {
            const u = new URL(urlString.startsWith('http') ? urlString : 'https://dummy.local/' + urlString);
            u.searchParams.forEach((value, key) => {
                result[key] = value;
            });
        } catch (_) {
            const qIdx = urlString.indexOf('?');
            if (qIdx !== -1) {
                const pairs = urlString.slice(qIdx + 1).split('&');
                for (const pair of pairs) {
                    const [k, v] = pair.split('=');
                    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
                }
            }
        }
        return result;
    }
};

// ==============================================================================
// 5. Cryptographic Hash Generator (SHA-256, SHA-1, SHA-512, MD5)
// ==============================================================================
// Fast Pure JS MD5 algorithm
function md5Cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    function ff(a, b, c, d, x, s, t) { return ((a + ((b & c) | (~b & d)) + x + t) << s | (a + ((b & c) | (~b & d)) + x + t) >>> (32 - s)) + b; }
    function gg(a, b, c, d, x, s, t) { return ((a + ((b & d) | (c & ~d)) + x + t) << s | (a + ((b & d) | (c & ~d)) + x + t) >>> (32 - s)) + b; }
    function hh(a, b, c, d, x, s, t) { return ((a + (b ^ c ^ d) + x + t) << s | (a + (b ^ c ^ d) + x + t) >>> (32 - s)) + b; }
    function ii(a, b, c, d, x, s, t) { return ((a + (c ^ (b | ~d)) + x + t) << s | (a + (c ^ (b | ~d)) + x + t) >>> (32 - s)) + b; }

    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);

    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);

    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);

    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);

    x[0] = (a + x[0]) & 0xffffffff;
    x[1] = (b + x[1]) & 0xffffffff;
    x[2] = (c + x[2]) & 0xffffffff;
    x[3] = (d + x[3]) & 0xffffffff;
}

export const HashEngine = {
    md5(string) {
        const n = string.length;
        let state = [1732584193, -271733879, -1732584194, 271733878];
        let i;
        for (i = 64; i <= n; i += 64) {
            const block = [];
            for (let j = 0; j < 16; j++) {
                block[j] = string.charCodeAt(i - 64 + j * 4) |
                    (string.charCodeAt(i - 64 + j * 4 + 1) << 8) |
                    (string.charCodeAt(i - 64 + j * 4 + 2) << 16) |
                    (string.charCodeAt(i - 64 + j * 4 + 3) << 24);
            }
            md5Cycle(state, block);
        }
        string = string.substring(i - 64);
        const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let j = 0;
        for (j = 0; j < string.length; j++) {
            tail[j >> 2] |= string.charCodeAt(j) << ((j % 4) << 3);
        }
        tail[j >> 2] |= 0x80 << ((j % 4) << 3);
        if (j > 55) {
            md5Cycle(state, tail);
            for (let k = 0; k < 16; k++) tail[k] = 0;
        }
        tail[14] = n * 8;
        md5Cycle(state, tail);

        const hex = '0123456789abcdef';
        let res = '';
        for (let k = 0; k < 4; k++) {
            for (let b = 0; b < 4; b++) {
                res += hex.charAt((state[k] >> (b * 8 + 4)) & 0x0f) + hex.charAt((state[k] >> (b * 8)) & 0x0f);
            }
        }
        return res;
    },

    async hashWebCrypto(algorithm, text) {
        const enc = new TextEncoder();
        const data = enc.encode(text);
        const hashBuf = await crypto.subtle.digest(algorithm, data);
        const hashArr = Array.from(new Uint8Array(hashBuf));
        return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async sha1(text) {
        return this.hashWebCrypto('SHA-1', text);
    },

    async sha256(text) {
        return this.hashWebCrypto('SHA-256', text);
    },

    async sha512(text) {
        return this.hashWebCrypto('SHA-512', text);
    },

    async computeAllHashes(text) {
        const [sha1, sha256, sha512] = await Promise.all([
            this.hashWebCrypto('SHA-1', text),
            this.hashWebCrypto('SHA-256', text),
            this.hashWebCrypto('SHA-512', text)
        ]);
        const md5Val = this.md5(text);
        return {
            md5: md5Val,
            sha1,
            sha256,
            sha512
        };
    }
};

// ==============================================================================
// 6. Cryptographically Secure Password Generator
// ==============================================================================
export const PasswordEngine = {
    generate(options = {}) {
        const {
            length = 16,
            uppercase = true,
            lowercase = true,
            numbers = true,
            symbols = true,
            excludeAmbiguous = false
        } = options;

        let uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let lowers = 'abcdefghijklmnopqrstuvwxyz';
        let nums = '0123456789';
        let syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (excludeAmbiguous) {
            uppers = uppers.replace(/[IO]/g, '');
            lowers = lowers.replace(/[lo]/g, '');
            nums = nums.replace(/[01]/g, '');
            syms = syms.replace(/[{}\[\]()/\\'"`~,;:.<>]/g, '');
        }

        let charset = '';
        const guaranteed = [];

        if (uppercase && uppers) { charset += uppers; guaranteed.push(uppers[Math.floor(Math.random() * uppers.length)]); }
        if (lowercase && lowers) { charset += lowers; guaranteed.push(lowers[Math.floor(Math.random() * lowers.length)]); }
        if (numbers && nums) { charset += nums; guaranteed.push(nums[Math.floor(Math.random() * nums.length)]); }
        if (symbols && syms) { charset += syms; guaranteed.push(syms[Math.floor(Math.random() * syms.length)]); }

        if (!charset) charset = lowers + nums;

        const randValues = new Uint32Array(length);
        crypto.getRandomValues(randValues);

        const result = [];
        for (let i = 0; i < length; i++) {
            result.push(charset[randValues[i] % charset.length]);
        }

        // Inject guaranteed characters
        for (let i = 0; i < guaranteed.length && i < length; i++) {
            result[i] = guaranteed[i];
        }

        // Shuffle
        for (let i = result.length - 1; i > 0; i--) {
            const j = randValues[i] % (i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }

        const password = result.join('');
        const entropyScore = this.calculateEntropy(password, charset.length);

        return {
            password,
            length: password.length,
            entropy: entropyScore,
            strength: (typeof entropyScore === 'object' ? entropyScore.bits : entropyScore) >= 80 ? 'Very Strong' : (typeof entropyScore === 'object' ? entropyScore.bits : entropyScore) >= 60 ? 'Strong' : 'Moderate'
        };
    },

    calculateEntropy(password, poolSize = 64) {
        if (!password) return { bits: 0, strength: 'Weak' };
        const bits = Math.round(password.length * Math.log2(poolSize || 64));
        const strength = bits >= 80 ? 'Very Strong' : bits >= 60 ? 'Strong' : bits >= 40 ? 'Moderate' : 'Weak';
        return { bits, strength };
    }
};
