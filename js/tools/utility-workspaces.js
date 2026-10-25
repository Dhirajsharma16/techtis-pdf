/**
 * TechTis Utility Workspaces
 * 100% Client-Side Interactive Workspaces for Developer, CSS Design, Text, and Vector Tools
 * Styled in TechTis Navy (#002244) & Crimson Red (#EA1D2C)
 */

import { QRCodeEngine, JsonEngine, Base64Engine, UrlEngine, HashEngine, PasswordEngine } from '../engines/dev-tools-engine.js';
import { GlassmorphismEngine, BoxShadowEngine, GradientEngine, NeumorphismEngine, ColorEngine } from '../engines/design-tools-engine.js';
import { WordCounterEngine, CaseConverterEngine, LoremIpsumEngine, MarkdownEngine } from '../engines/text-tools-engine.js';
import { ImageConverterEngine } from '../engines/image-converters-engine.js';

export const UtilityWorkspaces = {
    // ==============================================================================
    // 1. QR Code Generator Workspace
    // ==============================================================================
    renderQrCodeWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <!-- Controls -->
                    <div class="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-[#002244] mb-1.5">Enter URL, Text, or Wi-Fi Details:</label>
                            <textarea id="qr-input" rows="3" placeholder="https://techtis.in or enter any text..."
                                      class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed">https://techtis.in</textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-[11px] font-bold text-slate-700 mb-1">Foreground Color</label>
                                <div class="flex items-center gap-2">
                                    <input type="color" id="qr-dark-color" value="#002244" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                                    <span id="qr-dark-val" class="text-xs font-mono text-slate-600">#002244</span>
                                </div>
                            </div>
                            <div>
                                <label class="block text-[11px] font-bold text-slate-700 mb-1">Background Color</label>
                                <div class="flex items-center gap-2">
                                    <input type="color" id="qr-light-color" value="#ffffff" class="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                                    <span id="qr-light-val" class="text-xs font-mono text-slate-600">#ffffff</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                <span>Output Size: <span id="qr-size-val">320px</span></span>
                            </div>
                            <input type="range" id="qr-size-slider" min="160" max="600" step="20" value="320" class="w-full accent-[#EA1D2C]">
                        </div>

                        <!-- Sample Quick Links -->
                        <div class="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span class="text-slate-400 font-medium">Quick Presets:</span>
                            <button type="button" class="btn-qr-sample px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#EA1D2C] hover:text-[#EA1D2C] transition font-medium" data-val="https://techtis.in">Website URL</button>
                            <button type="button" class="btn-qr-sample px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#EA1D2C] hover:text-[#EA1D2C] transition font-medium" data-val="WIFI:T:WPA;S:MyNetwork;P:MyPassword;;">Wi-Fi Config</button>
                            <button type="button" class="btn-qr-sample px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:border-[#EA1D2C] hover:text-[#EA1D2C] transition font-medium" data-val="mailto:support@techtis.in?subject=Inquiry">Email Link</button>
                        </div>
                    </div>

                    <!-- Live Preview & Export -->
                    <div class="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-between text-center space-y-4">
                        <div class="w-full flex justify-between items-center pb-2 border-b border-slate-100">
                            <span class="text-xs font-bold text-[#002244]">Live QR Preview</span>
                            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Instant Vector</span>
                        </div>

                        <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-2xs flex items-center justify-center min-h-[220px]">
                            <canvas id="qr-canvas" class="max-w-full rounded-lg shadow-2xs"></canvas>
                        </div>

                        <div class="w-full grid grid-cols-2 gap-2.5">
                            <button type="button" id="btn-qr-download-png" class="px-4 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                                <i data-lucide="download" class="w-4 h-4"></i>
                                <span>Download PNG</span>
                            </button>
                            <button type="button" id="btn-qr-download-svg" class="px-4 py-2.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer">
                                <i data-lucide="file-code" class="w-4 h-4"></i>
                                <span>Download SVG</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#qr-input');
        const canvas = container.querySelector('#qr-canvas');
        const darkColor = container.querySelector('#qr-dark-color');
        const lightColor = container.querySelector('#qr-light-color');
        const darkVal = container.querySelector('#qr-dark-val');
        const lightVal = container.querySelector('#qr-light-val');
        const sizeSlider = container.querySelector('#qr-size-slider');
        const sizeVal = container.querySelector('#qr-size-val');

        function updateQr() {
            const text = input.value.trim() || 'https://techtis.in';
            const size = parseInt(sizeSlider.value, 10);
            sizeVal.textContent = `${size}px`;
            darkVal.textContent = darkColor.value;
            lightVal.textContent = lightColor.value;

            QRCodeEngine.drawToCanvas(canvas, text, {
                size,
                darkColor: darkColor.value,
                lightColor: lightColor.value,
                margin: 2
            });
        }

        input.addEventListener('input', updateQr);
        darkColor.addEventListener('input', updateQr);
        lightColor.addEventListener('input', updateQr);
        sizeSlider.addEventListener('input', updateQr);

        container.querySelectorAll('.btn-qr-sample').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.val;
                updateQr();
            });
        });

        container.querySelector('#btn-qr-download-png').addEventListener('click', () => {
            const a = document.createElement('a');
            a.download = `techtis-qrcode-${Date.now()}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        });

        container.querySelector('#btn-qr-download-svg').addEventListener('click', () => {
            const text = input.value.trim() || 'https://techtis.in';
            const size = parseInt(sizeSlider.value, 10);
            const svgString = QRCodeEngine.generateSvg(text, {
                size,
                darkColor: darkColor.value,
                lightColor: lightColor.value,
                margin: 2
            });
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const a = document.createElement('a');
            a.download = `techtis-qrcode-${Date.now()}.svg`;
            a.href = URL.createObjectURL(blob);
            a.click();
        });

        updateQr();
    },

    // ==============================================================================
    // 2. JSON Formatter & Validator Workspace
    // ==============================================================================
    renderJsonFormatterWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-4">
                <!-- Toolbar -->
                <div class="p-3 bg-white border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div class="flex items-center gap-2">
                        <span id="json-status-badge" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Ready
                        </span>
                        <span id="json-info-text" class="text-xs text-slate-500 font-medium"></span>
                    </div>

                    <div class="flex items-center gap-1.5 flex-wrap">
                        <button type="button" id="btn-json-format-2" class="px-3 py-1.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold transition shadow-xs">
                            Format (2 Spaces)
                        </button>
                        <button type="button" id="btn-json-format-4" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                            Format (4 Spaces)
                        </button>
                        <button type="button" id="btn-json-minify" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">
                            Minify (1 Line)
                        </button>
                        <button type="button" id="btn-json-copy" class="px-3 py-1.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy</span>
                        </button>
                        <button type="button" id="btn-json-clear" class="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs font-medium">
                            Clear
                        </button>
                    </div>
                </div>

                <!-- Split Editor -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Input JSON:</span>
                            <button type="button" id="btn-json-sample" class="text-[11px] text-[#EA1D2C] hover:underline font-semibold">Load Sample</button>
                        </div>
                        <textarea id="json-input" rows="16" placeholder='Paste your raw JSON string here, e.g. {"name": "TechTis", "tools": 60}'
                                  class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed bg-slate-50 resize-y"></textarea>
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Formatted Output:</span>
                            <span id="json-output-stats" class="text-[11px] text-slate-400 font-medium"></span>
                        </div>
                        <textarea id="json-output" rows="16" readonly placeholder="Formatted output will appear here..."
                                  class="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-900 text-slate-100 font-mono leading-relaxed resize-y"></textarea>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#json-input');
        const output = container.querySelector('#json-output');
        const badge = container.querySelector('#json-status-badge');
        const info = container.querySelector('#json-info-text');

        function validateAndRun(indent = 2) {
            const raw = input.value.trim();
            if (!raw) {
                output.value = '';
                badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200';
                badge.textContent = 'Empty';
                info.textContent = 'Enter JSON text to format';
                return;
            }

            const res = JsonEngine.validate(raw);
            if (res.valid) {
                badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
                badge.textContent = '✓ Valid JSON';
                info.textContent = `${res.type} with ${res.keysCount} keys (${res.sizeBytes} bytes)`;
                output.value = indent === 0 ? JsonEngine.minify(raw) : JsonEngine.format(raw, indent);
            } else {
                badge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200';
                badge.textContent = '✗ Invalid JSON';
                info.textContent = `Error at line ${res.line || 1}: ${res.error}`;
                output.value = `/* JSON SYNTAX ERROR */\n\n${res.error}`;
            }
        }

        input.addEventListener('input', () => validateAndRun(2));
        container.querySelector('#btn-json-format-2').addEventListener('click', () => validateAndRun(2));
        container.querySelector('#btn-json-format-4').addEventListener('click', () => validateAndRun(4));
        container.querySelector('#btn-json-minify').addEventListener('click', () => validateAndRun(0));
        container.querySelector('#btn-json-clear').addEventListener('click', () => { input.value = ''; validateAndRun(); });

        container.querySelector('#btn-json-sample').addEventListener('click', () => {
            input.value = JSON.stringify({
                platform: "TechTis",
                domain: "techtis.in",
                version: "2.0",
                features: ["100% Client-Side", "Zero Server Uploads", "60 Tools", "Free Forever"],
                stats: { totalTools: 60, privacyGuaranteed: true, fee: 0 }
            });
            validateAndRun(2);
        });

        container.querySelector('#btn-json-copy').addEventListener('click', () => {
            if (!output.value) return;
            navigator.clipboard.writeText(output.value);
            const btn = container.querySelector('#btn-json-copy');
            btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>';
            }, 1800);
        });
    },

    // ==============================================================================
    // 3. Base64 Encoder & Decoder Workspace
    // ==============================================================================
    renderBase64Workspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-5">
                <!-- Mode Switcher -->
                <div class="flex items-center gap-2 border-b border-slate-200 pb-3">
                    <button type="button" class="btn-b64-tab active px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white transition shadow-xs" data-mode="text-enc">
                        Text to Base64
                    </button>
                    <button type="button" class="btn-b64-tab px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition" data-mode="text-dec">
                        Base64 to Text
                    </button>
                    <button type="button" class="btn-b64-tab px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition" data-mode="image-enc">
                        Image to Base64
                    </button>
                </div>

                <!-- Text Mode View -->
                <div id="b64-text-view" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                            <label class="block text-xs font-bold text-[#002244]" id="b64-input-label">Plain Text Input:</label>
                            <textarea id="b64-input" rows="10" placeholder="Type or paste text to convert..."
                                      class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed bg-slate-50 resize-y">Hello TechTis! Fast, private & free online utilities.</textarea>
                        </div>
                        <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                            <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                                <span id="b64-output-label">Base64 Output:</span>
                                <button type="button" id="btn-b64-copy" class="px-2.5 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-[11px] font-bold transition shadow-2xs">
                                    Copy
                                </button>
                            </div>
                            <textarea id="b64-output" rows="10" readonly placeholder="Output appears here..."
                                      class="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono leading-relaxed resize-y break-all"></textarea>
                        </div>
                    </div>
                </div>

                <!-- Image Mode View (Hidden by default) -->
                <div id="b64-image-view" class="hidden space-y-4">
                    <div class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#EA1D2C] transition cursor-pointer" id="b64-dropzone">
                        <input type="file" id="b64-file-input" accept="image/*" class="hidden">
                        <i data-lucide="image" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                        <p class="text-xs font-bold text-[#002244]">Click to upload or drag an image here</p>
                        <p class="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WebP, SVG, GIF (Converted 100% in local RAM)</p>
                    </div>

                    <div id="b64-img-result" class="hidden bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-[#002244]">Base64 Data URI (<span id="b64-img-size"></span>):</span>
                            <button type="button" id="btn-b64-img-copy" class="px-3 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-xs font-bold transition">Copy Data URI</button>
                        </div>
                        <textarea id="b64-img-output" rows="6" readonly class="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono break-all"></textarea>
                    </div>
                </div>
            </div>
        `;

        let mode = 'text-enc';
        const input = container.querySelector('#b64-input');
        const output = container.querySelector('#b64-output');
        const inLabel = container.querySelector('#b64-input-label');
        const outLabel = container.querySelector('#b64-output-label');
        const textView = container.querySelector('#b64-text-view');
        const imgView = container.querySelector('#b64-image-view');

        function runTextConversion() {
            const val = input.value;
            if (!val) { output.value = ''; return; }
            try {
                if (mode === 'text-enc') {
                    output.value = Base64Engine.textToBase64(val);
                } else {
                    output.value = Base64Engine.base64ToText(val);
                }
            } catch (e) {
                output.value = `[Error decoding Base64: ${e.message}]`;
            }
        }

        input.addEventListener('input', runTextConversion);

        container.querySelectorAll('.btn-b64-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.btn-b64-tab').forEach(t => {
                    t.className = 'btn-b64-tab px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';
                });
                tab.className = 'btn-b64-tab active px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white transition shadow-xs';
                mode = tab.dataset.mode;

                if (mode === 'image-enc') {
                    textView.classList.add('hidden');
                    imgView.classList.remove('hidden');
                } else {
                    textView.classList.remove('hidden');
                    imgView.classList.add('hidden');

                    if (mode === 'text-enc') {
                        inLabel.textContent = 'Plain Text Input:';
                        outLabel.textContent = 'Base64 Output:';
                        input.placeholder = 'Type or paste plain text...';
                    } else {
                        inLabel.textContent = 'Base64 Input:';
                        outLabel.textContent = 'Decoded Plain Text:';
                        input.placeholder = 'Paste Base64 string here...';
                    }
                    runTextConversion();
                }
            });
        });

        // Image file handling
        const dropzone = container.querySelector('#b64-dropzone');
        const fileIn = container.querySelector('#b64-file-input');
        const imgOut = container.querySelector('#b64-img-output');
        const imgResult = container.querySelector('#b64-img-result');
        const imgSize = container.querySelector('#b64-img-size');

        dropzone.addEventListener('click', () => fileIn.click());
        fileIn.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const b64 = await Base64Engine.fileToBase64(file);
            imgOut.value = b64;
            imgSize.textContent = `${Math.round(b64.length / 1024)} KB`;
            imgResult.classList.remove('hidden');
        });

        container.querySelector('#btn-b64-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(output.value);
            const btn = container.querySelector('#btn-b64-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });

        container.querySelector('#btn-b64-img-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(imgOut.value);
            const btn = container.querySelector('#btn-b64-img-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy Data URI'; }, 1500);
        });

        runTextConversion();
    },

    // ==============================================================================
    // 4. URL Encoder & Decoder Workspace
    // ==============================================================================
    renderUrlEncoderWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-4">
                <div class="p-3 bg-white border border-slate-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div class="flex items-center gap-1.5">
                        <button type="button" id="btn-url-encode" class="px-4 py-1.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold transition shadow-xs">
                            Encode URI
                        </button>
                        <button type="button" id="btn-url-decode" class="px-4 py-1.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition shadow-xs">
                            Decode URI
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" id="btn-url-copy" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy Result</span>
                        </button>
                        <button type="button" id="btn-url-clear" class="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium">Clear</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <label class="block text-xs font-bold text-[#002244]">Input Text or URL:</label>
                        <textarea id="url-input" rows="8" placeholder="https://example.com/search?q=free pdf tools&category=dev..."
                                  class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed bg-slate-50 resize-y">https://techtis.in/search?q=free pdf & image tools&sort=popular#top</textarea>
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <label class="block text-xs font-bold text-[#002244]">Processed Output:</label>
                        <textarea id="url-output" rows="8" readonly placeholder="Result appears here..."
                                  class="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono leading-relaxed resize-y break-all"></textarea>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#url-input');
        const output = container.querySelector('#url-output');

        function doEncode() {
            output.value = UrlEngine.encode(input.value);
        }

        function doDecode() {
            output.value = UrlEngine.decode(input.value);
        }

        container.querySelector('#btn-url-encode').addEventListener('click', doEncode);
        container.querySelector('#btn-url-decode').addEventListener('click', doDecode);
        container.querySelector('#btn-url-clear').addEventListener('click', () => { input.value = ''; output.value = ''; });

        container.querySelector('#btn-url-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(output.value);
            const btn = container.querySelector('#btn-url-copy');
            btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied!</span>';
            setTimeout(() => { btn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy Result</span>'; }, 1500);
        });

        doEncode();
    },

    // ==============================================================================
    // 5. Hash Generator Workspace (MD5, SHA-1, SHA-256, SHA-512)
    // ==============================================================================
    renderHashGeneratorWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-5">
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                    <label class="block text-xs font-bold text-[#002244]">Input String or Data to Hash:</label>
                    <textarea id="hash-input" rows="3" placeholder="Type text to generate cryptographic hashes..."
                              class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed bg-slate-50">techtis</textarea>
                </div>

                <!-- Hash Results Grid -->
                <div class="grid grid-cols-1 gap-3" id="hash-results-list">
                    <!-- MD5 -->
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MD5 (128-bit)</span>
                            <div id="hash-md5" class="text-xs font-mono font-bold text-[#002244] break-all select-all">Calculating...</div>
                        </div>
                        <button type="button" class="btn-copy-hash px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shrink-0" data-target="hash-md5">Copy</button>
                    </div>

                    <!-- SHA-1 -->
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SHA-1 (160-bit)</span>
                            <div id="hash-sha1" class="text-xs font-mono font-bold text-[#002244] break-all select-all">Calculating...</div>
                        </div>
                        <button type="button" class="btn-copy-hash px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shrink-0" data-target="hash-sha1">Copy</button>
                    </div>

                    <!-- SHA-256 -->
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">SHA-256 (Industry Standard)</span>
                            <div id="hash-sha256" class="text-xs font-mono font-bold text-[#002244] break-all select-all">Calculating...</div>
                        </div>
                        <button type="button" class="btn-copy-hash px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shrink-0" data-target="hash-sha256">Copy</button>
                    </div>

                    <!-- SHA-512 -->
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-bold text-purple-600 uppercase tracking-wider">SHA-512 (High Security)</span>
                            <div id="hash-sha512" class="text-xs font-mono font-bold text-[#002244] break-all select-all">Calculating...</div>
                        </div>
                        <button type="button" class="btn-copy-hash px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition shrink-0" data-target="hash-sha512">Copy</button>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#hash-input');
        const md5El = container.querySelector('#hash-md5');
        const sha1El = container.querySelector('#hash-sha1');
        const sha256El = container.querySelector('#hash-sha256');
        const sha512El = container.querySelector('#hash-sha512');

        async function compute() {
            const text = input.value;
            const res = await HashEngine.computeAllHashes(text);
            md5El.textContent = res.md5;
            sha1El.textContent = res.sha1;
            sha256El.textContent = res.sha256;
            sha512El.textContent = res.sha512;
        }

        input.addEventListener('input', compute);

        container.querySelectorAll('.btn-copy-hash').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetEl = container.querySelector(`#${btn.dataset.target}`);
                if (targetEl) {
                    navigator.clipboard.writeText(targetEl.textContent);
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
                }
            });
        });

        compute();
    },

    // ==============================================================================
    // 6. Cryptographic Password Generator Workspace
    // ==============================================================================
    renderPasswordGeneratorWorkspace(container, tool) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto space-y-6">
                <!-- Main Display Box -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 text-center">
                    <div class="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <span id="pass-output" class="text-base sm:text-xl font-mono font-bold text-[#002244] tracking-wide break-all select-all">Generating...</span>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button type="button" id="btn-pass-copy" class="p-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1">
                                <i data-lucide="copy" class="w-4 h-4"></i>
                                <span class="hidden sm:inline">Copy</span>
                            </button>
                            <button type="button" id="btn-pass-refresh" class="p-2.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition shadow-xs">
                                <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Entropy & Strength Meter -->
                    <div class="flex items-center justify-between text-xs px-1">
                        <div class="flex items-center gap-2">
                            <span class="text-slate-500 font-medium">Strength:</span>
                            <span id="pass-strength-badge" class="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Very Strong</span>
                        </div>
                        <span id="pass-entropy" class="text-slate-400 font-mono text-[11px]">~96 bits entropy</span>
                    </div>
                </div>

                <!-- Customization Options -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div>
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244] mb-2">
                            <span>Password Length: <span id="pass-len-val">16</span> characters</span>
                        </div>
                        <input type="range" id="pass-length" min="8" max="64" value="16" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div class="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <label class="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                            <input type="checkbox" id="pass-opt-upper" checked class="w-4 h-4 rounded text-[#EA1D2C] focus:ring-[#EA1D2C]">
                            <span>Uppercase (A-Z)</span>
                        </label>
                        <label class="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                            <input type="checkbox" id="pass-opt-lower" checked class="w-4 h-4 rounded text-[#EA1D2C] focus:ring-[#EA1D2C]">
                            <span>Lowercase (a-z)</span>
                        </label>
                        <label class="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                            <input type="checkbox" id="pass-opt-nums" checked class="w-4 h-4 rounded text-[#EA1D2C] focus:ring-[#EA1D2C]">
                            <span>Numbers (0-9)</span>
                        </label>
                        <label class="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                            <input type="checkbox" id="pass-opt-syms" checked class="w-4 h-4 rounded text-[#EA1D2C] focus:ring-[#EA1D2C]">
                            <span>Symbols (!@#$%)</span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        const out = container.querySelector('#pass-output');
        const lenSlider = container.querySelector('#pass-length');
        const lenVal = container.querySelector('#pass-len-val');
        const strBadge = container.querySelector('#pass-strength-badge');
        const entropyEl = container.querySelector('#pass-entropy');

        const optUpper = container.querySelector('#pass-opt-upper');
        const optLower = container.querySelector('#pass-opt-lower');
        const optNums = container.querySelector('#pass-opt-nums');
        const optSyms = container.querySelector('#pass-opt-syms');

        function generate() {
            const length = parseInt(lenSlider.value, 10);
            lenVal.textContent = length;

            const res = PasswordEngine.generate({
                length,
                uppercase: optUpper.checked,
                lowercase: optLower.checked,
                numbers: optNums.checked,
                symbols: optSyms.checked
            });

            out.textContent = res.password;
            entropyEl.textContent = `~${res.entropy} bits entropy`;
            strBadge.textContent = res.strength;

            if (res.strength === 'Very Strong') {
                strBadge.className = 'px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
            } else if (res.strength === 'Strong') {
                strBadge.className = 'px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200';
            } else if (res.strength === 'Moderate') {
                strBadge.className = 'px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200';
            } else {
                strBadge.className = 'px-2.5 py-0.5 rounded-full font-bold bg-red-50 text-red-700 border border-red-200';
            }
        }

        lenSlider.addEventListener('input', generate);
        optUpper.addEventListener('change', generate);
        optLower.addEventListener('change', generate);
        optNums.addEventListener('change', generate);
        optSyms.addEventListener('change', generate);
        container.querySelector('#btn-pass-refresh').addEventListener('click', generate);

        container.querySelector('#btn-pass-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(out.textContent);
            const btn = container.querySelector('#btn-pass-copy');
            btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span class="hidden sm:inline">Copied!</span>';
            setTimeout(() => { btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i><span class="hidden sm:inline">Copy</span>'; }, 1500);
        });

        generate();
    },

    // ==============================================================================
    // 7. CSS Glassmorphism Generator Workspace
    // ==============================================================================
    renderGlassmorphismWorkspace(container, tool) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Controls -->
                <div class="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Blur: <span id="glass-blur-val">16px</span></span>
                        </div>
                        <input type="range" id="glass-blur" min="0" max="40" value="16" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Opacity: <span id="glass-opacity-val">25%</span></span>
                        </div>
                        <input type="range" id="glass-opacity" min="0" max="100" value="25" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Border Radius: <span id="glass-radius-val">20px</span></span>
                        </div>
                        <input type="range" id="glass-radius" min="0" max="40" value="20" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div class="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Surface Base Color</label>
                            <input type="color" id="glass-color" value="#ffffff" class="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                        </div>
                        <div class="flex items-center pt-4">
                            <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                <input type="checkbox" id="glass-shadow" checked class="w-4 h-4 rounded text-[#EA1D2C] focus:ring-[#EA1D2C]">
                                <span>Drop Shadow</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Preview & CSS Code -->
                <div class="md:col-span-6 space-y-4">
                    <!-- Glass Interactive Canvas -->
                    <div class="h-48 rounded-2xl p-6 flex items-center justify-center relative overflow-hidden" 
                         style="background: linear-gradient(135deg, #002244 0%, #0a3366 50%, #ea1d2c 100%);">
                        <div id="glass-preview-box" class="w-56 h-32 p-4 flex flex-col justify-between text-white transition-all">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-black tracking-wider">TECHTIS</span>
                                <i data-lucide="sparkles" class="w-4 h-4"></i>
                            </div>
                            <span class="text-sm font-bold">Frosted Glass UI</span>
                        </div>
                    </div>

                    <!-- CSS Output -->
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Generated CSS:</span>
                            <button type="button" id="btn-glass-copy" class="px-3 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-xs font-bold transition shadow-xs">
                                Copy CSS
                            </button>
                        </div>
                        <textarea id="glass-css" rows="6" readonly class="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl leading-relaxed resize-none"></textarea>
                    </div>
                </div>
            </div>
        `;

        const blurIn = container.querySelector('#glass-blur');
        const opIn = container.querySelector('#glass-opacity');
        const radIn = container.querySelector('#glass-radius');
        const colIn = container.querySelector('#glass-color');
        const shIn = container.querySelector('#glass-shadow');

        const box = container.querySelector('#glass-preview-box');
        const cssOut = container.querySelector('#glass-css');

        function updateGlass() {
            const blur = parseInt(blurIn.value, 10);
            const opacity = parseInt(opIn.value, 10) / 100;
            const radius = parseInt(radIn.value, 10);
            const bgColor = colIn.value;
            const hasShadow = shIn.checked;

            container.querySelector('#glass-blur-val').textContent = `${blur}px`;
            container.querySelector('#glass-opacity-val').textContent = `${Math.round(opacity * 100)}%`;
            container.querySelector('#glass-radius-val').textContent = `${radius}px`;

            const res = GlassmorphismEngine.generateCss({ blur, opacity, borderRadius: radius, bgColor, hasShadow });
            Object.assign(box.style, res.styles);
            cssOut.value = res.css;
        }

        blurIn.addEventListener('input', updateGlass);
        opIn.addEventListener('input', updateGlass);
        radIn.addEventListener('input', updateGlass);
        colIn.addEventListener('input', updateGlass);
        shIn.addEventListener('change', updateGlass);

        container.querySelector('#btn-glass-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(cssOut.value);
            const btn = container.querySelector('#btn-glass-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy CSS'; }, 1500);
        });

        updateGlass();
    },

    // ==============================================================================
    // 8. CSS Box Shadow Generator Workspace
    // ==============================================================================
    renderBoxShadowWorkspace(container, tool) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Controls -->
                <div class="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Horizontal Offset (X): <span id="shadow-x-val">0px</span></span>
                        </div>
                        <input type="range" id="shadow-x" min="-50" max="50" value="0" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Vertical Offset (Y): <span id="shadow-y-val">12px</span></span>
                        </div>
                        <input type="range" id="shadow-y" min="-50" max="50" value="12" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Blur Radius: <span id="shadow-blur-val">24px</span></span>
                        </div>
                        <input type="range" id="shadow-blur" min="0" max="80" value="24" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Spread: <span id="shadow-spread-val">-4px</span></span>
                        </div>
                        <input type="range" id="shadow-spread" min="-30" max="30" value="-4" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div class="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Shadow Color</label>
                            <input type="color" id="shadow-color" value="#002244" class="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                                <span>Opacity: <span id="shadow-op-val">20%</span></span>
                            </div>
                            <input type="range" id="shadow-opacity" min="0" max="100" value="20" class="w-full accent-[#EA1D2C]">
                        </div>
                    </div>
                </div>

                <!-- Preview & Output -->
                <div class="md:col-span-6 space-y-4">
                    <div class="h-48 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center p-6">
                        <div id="shadow-preview-box" class="w-40 h-28 bg-white rounded-2xl border border-slate-100 flex items-center justify-center font-bold text-xs text-[#002244]">
                            Preview Card
                        </div>
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Generated CSS:</span>
                            <button type="button" id="btn-shadow-copy" class="px-3 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-xs font-bold transition shadow-xs">Copy CSS</button>
                        </div>
                        <textarea id="shadow-css" rows="4" readonly class="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl leading-relaxed resize-none"></textarea>
                    </div>
                </div>
            </div>
        `;

        const xIn = container.querySelector('#shadow-x');
        const yIn = container.querySelector('#shadow-y');
        const blurIn = container.querySelector('#shadow-blur');
        const spreadIn = container.querySelector('#shadow-spread');
        const colIn = container.querySelector('#shadow-color');
        const opIn = container.querySelector('#shadow-opacity');
        const box = container.querySelector('#shadow-preview-box');
        const cssOut = container.querySelector('#shadow-css');

        function updateShadow() {
            const x = parseInt(xIn.value, 10);
            const y = parseInt(yIn.value, 10);
            const blur = parseInt(blurIn.value, 10);
            const spread = parseInt(spreadIn.value, 10);
            const color = colIn.value;
            const opacity = parseInt(opIn.value, 10) / 100;

            container.querySelector('#shadow-x-val').textContent = `${x}px`;
            container.querySelector('#shadow-y-val').textContent = `${y}px`;
            container.querySelector('#shadow-blur-val').textContent = `${blur}px`;
            container.querySelector('#shadow-spread-val').textContent = `${spread}px`;
            container.querySelector('#shadow-op-val').textContent = `${Math.round(opacity * 100)}%`;

            const res = BoxShadowEngine.generateCss([{ x, y, blur, spread, color, opacity, inset: false }]);
            box.style.boxShadow = res.shadowValue;
            cssOut.value = res.css;
        }

        xIn.addEventListener('input', updateShadow);
        yIn.addEventListener('input', updateShadow);
        blurIn.addEventListener('input', updateShadow);
        spreadIn.addEventListener('input', updateShadow);
        colIn.addEventListener('input', updateShadow);
        opIn.addEventListener('input', updateShadow);

        container.querySelector('#btn-shadow-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(cssOut.value);
            const btn = container.querySelector('#btn-shadow-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy CSS'; }, 1500);
        });

        updateShadow();
    },

    // ==============================================================================
    // 9. CSS Gradient Generator Workspace
    // ==============================================================================
    renderGradientWorkspace(container, tool) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Controls -->
                <div class="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div class="flex gap-2">
                        <button type="button" class="btn-grad-type active flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white" data-type="linear">Linear</button>
                        <button type="button" class="btn-grad-type flex-1 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200" data-type="radial">Radial</button>
                    </div>

                    <div id="grad-angle-wrapper">
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Angle: <span id="grad-angle-val">90°</span></span>
                        </div>
                        <input type="range" id="grad-angle" min="0" max="360" value="90" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Start Color</label>
                            <input type="color" id="grad-c1" value="#002244" class="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">End Color</label>
                            <input type="color" id="grad-c2" value="#ea1d2c" class="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                        </div>
                    </div>

                    <!-- Presets -->
                    <div>
                        <span class="text-[11px] font-bold text-slate-400 block mb-2">Preset Galleries:</span>
                        <div class="flex flex-wrap gap-1.5" id="grad-presets"></div>
                    </div>
                </div>

                <!-- Preview & Output -->
                <div class="md:col-span-6 space-y-4">
                    <div id="grad-preview-box" class="h-48 rounded-2xl shadow-xs transition-all flex items-center justify-center text-white font-black text-sm drop-shadow-md">
                        TechTis Gradient Preview
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Generated CSS:</span>
                            <button type="button" id="btn-grad-copy" class="px-3 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-xs font-bold transition shadow-xs">Copy CSS</button>
                        </div>
                        <textarea id="grad-css" rows="3" readonly class="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl leading-relaxed resize-none"></textarea>
                    </div>
                </div>
            </div>
        `;

        let type = 'linear';
        const angleIn = container.querySelector('#grad-angle');
        const c1In = container.querySelector('#grad-c1');
        const c2In = container.querySelector('#grad-c2');
        const box = container.querySelector('#grad-preview-box');
        const cssOut = container.querySelector('#grad-css');
        const presetsBox = container.querySelector('#grad-presets');

        function updateGrad() {
            const angle = parseInt(angleIn.value, 10);
            container.querySelector('#grad-angle-val').textContent = `${angle}°`;
            const stops = [
                { color: c1In.value, stop: 0 },
                { color: c2In.value, stop: 100 }
            ];

            const res = GradientEngine.generateCss({ type, angle, stops });
            box.style.background = res.gradientValue;
            cssOut.value = res.css;
        }

        angleIn.addEventListener('input', updateGrad);
        c1In.addEventListener('input', updateGrad);
        c2In.addEventListener('input', updateGrad);

        container.querySelectorAll('.btn-grad-type').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-grad-type').forEach(b => {
                    b.className = 'btn-grad-type flex-1 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200';
                });
                btn.className = 'btn-grad-type active flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white';
                type = btn.dataset.type;
                container.querySelector('#grad-angle-wrapper').style.display = type === 'linear' ? 'block' : 'none';
                updateGrad();
            });
        });

        // Add presets
        GradientEngine.getPresets().forEach(p => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-[#EA1D2C] transition';
            chip.textContent = p.name;
            chip.addEventListener('click', () => {
                c1In.value = p.stops[0].color;
                c2In.value = p.stops[1].color;
                if (p.angle !== undefined) angleIn.value = p.angle;
                updateGrad();
            });
            presetsBox.appendChild(chip);
        });

        container.querySelector('#btn-grad-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(cssOut.value);
            const btn = container.querySelector('#btn-grad-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy CSS'; }, 1500);
        });

        updateGrad();
    },

    // ==============================================================================
    // 10. CSS Neumorphism Workspace
    // ==============================================================================
    renderNeumorphismWorkspace(container, tool) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                <!-- Controls -->
                <div class="md:col-span-6 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div class="grid grid-cols-4 gap-1.5">
                        <button type="button" class="btn-neu-shape active py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white" data-shape="flat">Flat</button>
                        <button type="button" class="btn-neu-shape py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200" data-shape="concave">Concave</button>
                        <button type="button" class="btn-neu-shape py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200" data-shape="convex">Convex</button>
                        <button type="button" class="btn-neu-shape py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200" data-shape="pressed">Pressed</button>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-[#002244] mb-1">Base Surface Color</label>
                        <input type="color" id="neu-color" value="#e0e5ec" class="w-full h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Size: <span id="neu-size-val">180px</span></span>
                        </div>
                        <input type="range" id="neu-size" min="100" max="280" value="180" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Radius: <span id="neu-rad-val">30px</span></span>
                        </div>
                        <input type="range" id="neu-radius" min="0" max="80" value="30" class="w-full accent-[#EA1D2C]">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs font-bold text-[#002244] mb-1">
                            <span>Blur: <span id="neu-blur-val">30px</span></span>
                        </div>
                        <input type="range" id="neu-blur" min="5" max="60" value="30" class="w-full accent-[#EA1D2C]">
                    </div>
                </div>

                <!-- Preview & Output -->
                <div class="md:col-span-6 space-y-4">
                    <div id="neu-stage" class="h-60 rounded-2xl flex items-center justify-center transition-colors" style="background: #e0e5ec;">
                        <div id="neu-preview-box" class="flex items-center justify-center font-bold text-xs text-slate-600 transition-all">
                            Soft UI
                        </div>
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                            <span>Generated CSS:</span>
                            <button type="button" id="btn-neu-copy" class="px-3 py-1 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-lg text-xs font-bold transition shadow-xs">Copy CSS</button>
                        </div>
                        <textarea id="neu-css" rows="4" readonly class="w-full p-2.5 text-xs font-mono bg-slate-900 text-slate-100 rounded-xl leading-relaxed resize-none"></textarea>
                    </div>
                </div>
            </div>
        `;

        let shape = 'flat';
        const colIn = container.querySelector('#neu-color');
        const sizeIn = container.querySelector('#neu-size');
        const radIn = container.querySelector('#neu-radius');
        const blurIn = container.querySelector('#neu-blur');

        const stage = container.querySelector('#neu-stage');
        const box = container.querySelector('#neu-preview-box');
        const cssOut = container.querySelector('#neu-css');

        function updateNeu() {
            const color = colIn.value;
            const size = parseInt(sizeIn.value, 10);
            const radius = parseInt(radIn.value, 10);
            const blur = parseInt(blurIn.value, 10);

            container.querySelector('#neu-size-val').textContent = `${size}px`;
            container.querySelector('#neu-rad-val').textContent = `${radius}px`;
            container.querySelector('#neu-blur-val').textContent = `${blur}px`;

            stage.style.background = color;
            box.style.width = `${size}px`;
            box.style.height = `${size}px`;

            const res = NeumorphismEngine.generateCss({ color, size, radius, blur, shape });
            box.style.borderRadius = res.borderRadius;
            box.style.background = res.background;
            box.style.boxShadow = res.boxShadow;
            cssOut.value = res.css;
        }

        colIn.addEventListener('input', updateNeu);
        sizeIn.addEventListener('input', updateNeu);
        radIn.addEventListener('input', updateNeu);
        blurIn.addEventListener('input', updateNeu);

        container.querySelectorAll('.btn-neu-shape').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-neu-shape').forEach(b => {
                    b.className = 'btn-neu-shape py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200';
                });
                btn.className = 'btn-neu-shape active py-1.5 rounded-xl text-xs font-bold bg-[#002244] text-white';
                shape = btn.dataset.shape;
                updateNeu();
            });
        });

        container.querySelector('#btn-neu-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(cssOut.value);
            const btn = container.querySelector('#btn-neu-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy CSS'; }, 1500);
        });

        updateNeu();
    },

    // ==============================================================================
    // 11. Color Converter Workspace (HEX, RGB, HSL, CMYK)
    // ==============================================================================
    renderColorConverterWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Color Input Bar -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="flex items-center gap-3 w-full sm:w-auto">
                        <input type="color" id="col-picker" value="#002244" class="w-14 h-14 rounded-2xl cursor-pointer border border-slate-200 p-1 shrink-0">
                        <div>
                            <label class="block text-xs font-bold text-[#002244]">Select Color / Enter HEX:</label>
                            <input type="text" id="col-hex-input" value="#002244" class="px-3 py-1.5 text-sm font-mono font-bold text-[#002244] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 uppercase">
                        </div>
                    </div>

                    <div id="col-swatch-box" class="w-full sm:w-48 h-14 rounded-2xl flex items-center justify-center font-bold text-xs shadow-2xs" style="background: #002244; color: #ffffff;">
                        Preview Swatch
                    </div>
                </div>

                <!-- Format Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HEX</span>
                        <div id="col-out-hex" class="text-sm font-mono font-bold text-[#002244]">#002244</div>
                        <button type="button" class="btn-copy-col w-full py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#EA1D2C] border border-slate-200 rounded-xl text-xs font-bold transition" data-target="col-out-hex">Copy HEX</button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RGB</span>
                        <div id="col-out-rgb" class="text-sm font-mono font-bold text-[#002244]">rgb(0, 34, 68)</div>
                        <button type="button" class="btn-copy-col w-full py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#EA1D2C] border border-slate-200 rounded-xl text-xs font-bold transition" data-target="col-out-rgb">Copy RGB</button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HSL</span>
                        <div id="col-out-hsl" class="text-sm font-mono font-bold text-[#002244]">hsl(210, 100%, 13%)</div>
                        <button type="button" class="btn-copy-col w-full py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#EA1D2C] border border-slate-200 rounded-xl text-xs font-bold transition" data-target="col-out-hsl">Copy HSL</button>
                    </div>

                    <div class="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CMYK</span>
                        <div id="col-out-cmyk" class="text-sm font-mono font-bold text-[#002244]">cmyk(100%, 50%, 0%, 73%)</div>
                        <button type="button" class="btn-copy-col w-full py-1.5 bg-slate-50 hover:bg-red-50 hover:text-[#EA1D2C] border border-slate-200 rounded-xl text-xs font-bold transition" data-target="col-out-cmyk">Copy CMYK</button>
                    </div>
                </div>

                <!-- Palette Shades -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                    <span class="text-xs font-bold text-[#002244]">Light to Dark Tonal Palette:</span>
                    <div id="col-shades-container" class="grid grid-cols-5 gap-2 h-14 rounded-xl overflow-hidden"></div>
                </div>
            </div>
        `;

        const picker = container.querySelector('#col-picker');
        const hexIn = container.querySelector('#col-hex-input');
        const swatch = container.querySelector('#col-swatch-box');
        const outHex = container.querySelector('#col-out-hex');
        const outRgb = container.querySelector('#col-out-rgb');
        const outHsl = container.querySelector('#col-out-hsl');
        const outCmyk = container.querySelector('#col-out-cmyk');
        const shadesBox = container.querySelector('#col-shades-container');

        function updateColor(hex) {
            const data = ColorEngine.convertAll(hex);
            picker.value = data.hex;
            hexIn.value = data.hex;
            swatch.style.background = data.hex;
            swatch.style.color = data.textColor;

            outHex.textContent = data.hex;
            outRgb.textContent = data.rgbString;
            outHsl.textContent = data.hslString;
            outCmyk.textContent = data.cmykString;

            shadesBox.innerHTML = data.shades.map(s => `
                <div class="h-full flex items-center justify-center font-mono text-[10px] font-bold rounded-lg cursor-pointer hover:opacity-90 transition"
                     style="background: ${s}; color: ${ColorEngine.convertAll(s).textColor}" title="${s}">
                    ${s}
                </div>
            `).join('');
        }

        picker.addEventListener('input', () => updateColor(picker.value));
        hexIn.addEventListener('input', () => {
            if (/^#?[0-9a-fA-F]{6}$/.test(hexIn.value)) {
                updateColor(hexIn.value.startsWith('#') ? hexIn.value : `#${hexIn.value}`);
            }
        });

        container.querySelectorAll('.btn-copy-col').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = container.querySelector(`#${btn.dataset.target}`);
                if (target) {
                    navigator.clipboard.writeText(target.textContent);
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = btn.dataset.target.replace('col-out-', '').toUpperCase(); }, 1500);
                }
            });
        });

        updateColor('#002244');
    },

    // ==============================================================================
    // 12. Word & Character Counter Workspace
    // ==============================================================================
    renderWordCounterWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-5">
                <!-- Stats Row -->
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-words" class="text-xl font-extrabold text-[#002244]">0</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Words</div>
                    </div>
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-chars-spaces" class="text-xl font-extrabold text-[#002244]">0</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Characters</div>
                    </div>
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-chars-no-spaces" class="text-xl font-extrabold text-[#002244]">0</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">No Spaces</div>
                    </div>
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-sentences" class="text-xl font-extrabold text-[#002244]">0</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Sentences</div>
                    </div>
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-paragraphs" class="text-xl font-extrabold text-[#002244]">0</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Paragraphs</div>
                    </div>
                    <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center">
                        <div id="stat-reading" class="text-xl font-extrabold text-[#EA1D2C]">0m</div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Reading Time</div>
                    </div>
                </div>

                <!-- Text Area -->
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                    <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                        <span>Type or paste your text:</span>
                        <div class="flex items-center gap-2">
                            <button type="button" id="btn-word-copy" class="text-slate-500 hover:text-[#EA1D2C] transition font-semibold">Copy Text</button>
                            <span class="text-slate-300">&bull;</span>
                            <button type="button" id="btn-word-clear" class="text-slate-500 hover:text-[#EA1D2C] transition font-semibold">Clear</button>
                        </div>
                    </div>
                    <textarea id="word-input" rows="12" placeholder="Start typing or paste your content here..."
                              class="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] leading-relaxed resize-y"></textarea>
                </div>

                <!-- Keyword Frequency -->
                <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                    <span class="text-xs font-bold text-[#002244]">Top Keywords &amp; Density:</span>
                    <div id="word-keywords" class="flex flex-wrap gap-2 text-xs">
                        <span class="text-slate-400 text-xs italic">Start typing to see keyword density</span>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#word-input');
        const wordsEl = container.querySelector('#stat-words');
        const charsSpacesEl = container.querySelector('#stat-chars-spaces');
        const charsNoSpacesEl = container.querySelector('#stat-chars-no-spaces');
        const sentEl = container.querySelector('#stat-sentences');
        const paraEl = container.querySelector('#stat-paragraphs');
        const readEl = container.querySelector('#stat-reading');
        const kwEl = container.querySelector('#word-keywords');

        function updateStats() {
            const text = input.value;
            const res = WordCounterEngine.analyze(text);
            wordsEl.textContent = res.words.toLocaleString();
            charsSpacesEl.textContent = res.charsWithSpaces.toLocaleString();
            charsNoSpacesEl.textContent = res.charsNoSpaces.toLocaleString();
            sentEl.textContent = res.sentences.toLocaleString();
            paraEl.textContent = res.paragraphs.toLocaleString();
            readEl.textContent = `${res.readingTimeMin}m`;

            if (res.keywords.length > 0) {
                kwEl.innerHTML = res.keywords.map(k => `
                    <span class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                        <strong>${k.word}</strong>: ${k.count} (${k.percentage}%)
                    </span>
                `).join('');
            } else {
                kwEl.innerHTML = '<span class="text-slate-400 text-xs italic">Start typing to see keyword density</span>';
            }
        }

        input.addEventListener('input', updateStats);
        container.querySelector('#btn-word-clear').addEventListener('click', () => { input.value = ''; updateStats(); });
        container.querySelector('#btn-word-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(input.value);
            const btn = container.querySelector('#btn-word-copy');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy Text'; }, 1500);
        });

        // Sample
        input.value = "TechTis is a world-class browser-based utility suite engineered for radical privacy and speed. Every document and image is processed 100% in local memory with zero server uploads.";
        updateStats();
    },

    // ==============================================================================
    // 13. Case Converter Workspace
    // ==============================================================================
    renderCaseConverterWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-5">
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                    <div class="flex justify-between items-center text-xs font-bold text-[#002244]">
                        <span>Enter Text to Transform:</span>
                        <button type="button" id="btn-case-clear" class="text-slate-400 hover:text-slate-600 font-medium">Clear</button>
                    </div>
                    <textarea id="case-input" rows="8" placeholder="Type or paste text to transform case..."
                              class="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] leading-relaxed resize-y">TechTis Free Online PDF and Image Tools</textarea>
                </div>

                <!-- Case Buttons Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toUpper">
                        UPPERCASE
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toLower">
                        lowercase
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toTitle">
                        Title Case
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toSentence">
                        Sentence case
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toCamel">
                        camelCase
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toPascal">
                        PascalCase
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toSnake">
                        snake_case
                    </button>
                    <button type="button" class="btn-case-action p-3 bg-white hover:bg-red-50 hover:border-[#EA1D2C] hover:text-[#EA1D2C] border border-slate-200/90 rounded-2xl text-xs font-bold text-[#002244] transition shadow-2xs" data-fn="toKebab">
                        kebab-case
                    </button>
                </div>

                <div class="flex justify-end">
                    <button type="button" id="btn-case-copy" class="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                        <span>Copy Transformed Text</span>
                    </button>
                </div>
            </div>
        `;

        const input = container.querySelector('#case-input');

        container.querySelectorAll('.btn-case-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const fn = btn.dataset.fn;
                if (typeof CaseConverterEngine[fn] === 'function') {
                    input.value = CaseConverterEngine[fn](input.value);
                }
            });
        });

        container.querySelector('#btn-case-clear').addEventListener('click', () => { input.value = ''; });
        container.querySelector('#btn-case-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(input.value);
            const btn = container.querySelector('#btn-case-copy');
            btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i><span>Copied!</span>';
            setTimeout(() => { btn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i><span>Copy Transformed Text</span>'; }, 1500);
        });
    },

    // ==============================================================================
    // 14. Lorem Ipsum Generator Workspace
    // ==============================================================================
    renderLoremIpsumWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-5">
                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-3 flex-wrap">
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Type:</label>
                            <select id="lorem-type" class="px-3 py-1.5 text-xs font-bold text-[#002244] border border-slate-200 rounded-xl bg-slate-50">
                                <option value="paragraphs">Paragraphs</option>
                                <option value="sentences">Sentences</option>
                                <option value="words">Words</option>
                                <option value="list">Unordered List</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-slate-700 mb-1">Count:</label>
                            <input type="number" id="lorem-count" min="1" max="50" value="3" class="w-20 px-3 py-1.5 text-xs font-bold text-[#002244] border border-slate-200 rounded-xl bg-slate-50">
                        </div>
                        <div class="pt-4 flex items-center gap-3 text-xs">
                            <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                                <input type="checkbox" id="lorem-start" checked class="w-4 h-4 rounded text-[#EA1D2C]">
                                <span>Start with "Lorem ipsum"</span>
                            </label>
                            <label class="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                                <input type="checkbox" id="lorem-tags" class="w-4 h-4 rounded text-[#EA1D2C]">
                                <span>Wrap in &lt;p&gt; tags</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button type="button" id="btn-lorem-gen" class="px-4 py-2 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition">Generate</button>
                        <button type="button" id="btn-lorem-copy" class="px-4 py-2 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                    <span class="text-xs font-bold text-[#002244]">Generated Dummy Content:</span>
                    <textarea id="lorem-output" rows="12" readonly class="w-full p-4 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 font-sans leading-relaxed resize-y"></textarea>
                </div>
            </div>
        `;

        const typeIn = container.querySelector('#lorem-type');
        const countIn = container.querySelector('#lorem-count');
        const startIn = container.querySelector('#lorem-start');
        const tagsIn = container.querySelector('#lorem-tags');
        const out = container.querySelector('#lorem-output');

        function generate() {
            const type = typeIn.value;
            const count = parseInt(countIn.value, 10) || 3;
            const startWith = startIn.checked;
            const wrap = tagsIn.checked;

            out.value = LoremIpsumEngine.generate(type, count, startWith, wrap);
        }

        container.querySelector('#btn-lorem-gen').addEventListener('click', generate);
        container.querySelector('#btn-lorem-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(out.value);
            const btn = container.querySelector('#btn-lorem-copy');
            btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied!</span>';
            setTimeout(() => { btn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>'; }, 1500);
        });

        generate();
    },

    // ==============================================================================
    // 15. Markdown to HTML Workspace
    // ==============================================================================
    renderMarkdownToHtmlWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-4">
                <div class="p-3 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
                    <span class="text-xs font-bold text-[#002244]">Live Markdown to HTML Engine</span>
                    <div class="flex items-center gap-2">
                        <button type="button" id="btn-md-copy-html" class="px-3.5 py-1.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            <span>Copy HTML Code</span>
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <span class="text-xs font-bold text-[#002244]">Markdown Source:</span>
                        <textarea id="md-input" rows="16" class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA1D2C]/20 focus:border-[#EA1D2C] font-mono leading-relaxed bg-slate-50 resize-y"># Welcome to TechTis
## Fast, Private & Free Online Utilities

TechTis provides **60 professional tools**:
* 100% In-Browser Execution
* Zero Server Uploads
* Unlimited Free Access

> "The most secure server is no server at all."

Visit [techtis.in](https://techtis.in) to explore!</textarea>
                    </div>

                    <div class="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                        <span class="text-xs font-bold text-[#002244]">Live Rendered HTML Preview:</span>
                        <div id="md-preview" class="p-4 text-xs border border-slate-200 rounded-xl bg-white min-h-[300px] overflow-y-auto leading-relaxed"></div>
                    </div>
                </div>
            </div>
        `;

        const input = container.querySelector('#md-input');
        const preview = container.querySelector('#md-preview');

        function updatePreview() {
            preview.innerHTML = MarkdownEngine.parse(input.value);
        }

        input.addEventListener('input', updatePreview);
        container.querySelector('#btn-md-copy-html').addEventListener('click', () => {
            const html = MarkdownEngine.parse(input.value);
            navigator.clipboard.writeText(html);
            const btn = container.querySelector('#btn-md-copy-html');
            btn.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied!</span>';
            setTimeout(() => { btn.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy HTML Code</span>'; }, 1500);
        });

        updatePreview();
    },

    // ==============================================================================
    // 16. SVG to PNG Converter Workspace
    // ==============================================================================
    renderSvgToPngWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#EA1D2C] transition cursor-pointer" id="svg2png-dropzone">
                    <input type="file" id="svg2png-file" accept=".svg" class="hidden">
                    <i data-lucide="file-code" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-[#002244]">Click to upload or drag an SVG file here</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Rasterizes vector graphics with transparent background</p>
                </div>

                <div id="svg2png-result" class="hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-[#002244]">Select Export Scale:</span>
                            <div class="flex gap-1">
                                <button type="button" class="btn-svg-scale active px-3 py-1 bg-[#002244] text-white rounded-lg text-xs font-bold" data-scale="1">1x</button>
                                <button type="button" class="btn-svg-scale px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200" data-scale="2">2x (Retina)</button>
                                <button type="button" class="btn-svg-scale px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200" data-scale="4">4x (Ultra HD)</button>
                            </div>
                        </div>

                        <button type="button" id="btn-svg-download" class="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            <span>Download High-Res PNG</span>
                        </button>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[220px]">
                        <img id="svg2png-preview" class="max-h-56 object-contain rounded shadow-2xs">
                    </div>
                </div>
            </div>
        `;

        const dropzone = container.querySelector('#svg2png-dropzone');
        const fileIn = container.querySelector('#svg2png-file');
        const result = container.querySelector('#svg2png-result');
        const preview = container.querySelector('#svg2png-preview');
        let currentSvg = '';
        let currentScale = 2;

        dropzone.addEventListener('click', () => fileIn.click());
        fileIn.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            currentSvg = text;
            renderPng();
            result.classList.remove('hidden');
        });

        async function renderPng() {
            if (!currentSvg) return;
            const res = await ImageConverterEngine.svgToPng(currentSvg, currentScale);
            preview.src = res.dataUrl;
        }

        container.querySelectorAll('.btn-svg-scale').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-svg-scale').forEach(b => {
                    b.className = 'btn-svg-scale px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200';
                });
                btn.className = 'btn-svg-scale active px-3 py-1 bg-[#002244] text-white rounded-lg text-xs font-bold';
                currentScale = parseFloat(btn.dataset.scale);
                renderPng();
            });
        });

        container.querySelector('#btn-svg-download').addEventListener('click', async () => {
            const res = await ImageConverterEngine.svgToPng(currentSvg, currentScale);
            const a = document.createElement('a');
            a.download = `techtis-vector-${currentScale}x-${Date.now()}.png`;
            a.href = res.dataUrl;
            a.click();
        });
    },

    // ==============================================================================
    // 17. Image to SVG Converter Workspace (Vectorizer)
    // ==============================================================================
    renderImageToSvgWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#EA1D2C] transition cursor-pointer" id="img2svg-dropzone">
                    <input type="file" id="img2svg-file" accept="image/png, image/jpeg" class="hidden">
                    <i data-lucide="image" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-[#002244]">Click to upload or drag an image (PNG, JPG) here</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Traces high-contrast bitmap pixels into scalable vector SVG paths</p>
                </div>

                <div id="img2svg-result" class="hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-[#002244]">Color Tone Quantization:</span>
                            <select id="img2svg-colors" class="px-3 py-1.5 text-xs font-bold text-[#002244] border border-slate-200 rounded-xl bg-slate-50">
                                <option value="4">4 Colors (High Contrast)</option>
                                <option value="8" selected>8 Colors (Balanced)</option>
                                <option value="16">16 Colors (Detailed)</option>
                            </select>
                        </div>

                        <div class="flex items-center gap-2">
                            <button type="button" id="btn-img2svg-download" class="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                                <i data-lucide="download" class="w-4 h-4"></i>
                                <span>Download SVG Vector</span>
                            </button>
                        </div>
                    </div>

                    <div id="img2svg-preview-wrap" class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[240px]">
                        <!-- Injected SVG -->
                    </div>
                </div>
            </div>
        `;

        const dropzone = container.querySelector('#img2svg-dropzone');
        const fileIn = container.querySelector('#img2svg-file');
        const result = container.querySelector('#img2svg-result');
        const previewWrap = container.querySelector('#img2svg-preview-wrap');
        const colorsSelect = container.querySelector('#img2svg-colors');
        let currentFile = null;
        let lastSvgBlob = null;

        dropzone.addEventListener('click', () => fileIn.click());
        fileIn.addEventListener('change', (e) => {
            currentFile = e.target.files[0];
            if (currentFile) vectorize();
        });

        colorsSelect.addEventListener('change', () => {
            if (currentFile) vectorize();
        });

        async function vectorize() {
            previewWrap.innerHTML = '<div class="text-xs text-slate-400 font-bold">Vectorizing image paths in browser RAM...</div>';
            result.classList.remove('hidden');

            const colors = parseInt(colorsSelect.value, 10);
            const res = await ImageConverterEngine.imageToSvg(currentFile, { colors });
            lastSvgBlob = res.blob;
            previewWrap.innerHTML = res.svgString;
            const svgEl = previewWrap.querySelector('svg');
            if (svgEl) {
                svgEl.style.maxHeight = '240px';
                svgEl.style.width = 'auto';
            }
        }

        container.querySelector('#btn-img2svg-download').addEventListener('click', () => {
            if (!lastSvgBlob) return;
            const a = document.createElement('a');
            a.download = `techtis-vector-${Date.now()}.svg`;
            a.href = URL.createObjectURL(lastSvgBlob);
            a.click();
        });
    },

    // ==============================================================================
    // 18. WebP to JPG / PNG Converter Workspace
    // ==============================================================================
    renderWebpToJpgWorkspace(container, tool) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#EA1D2C] transition cursor-pointer" id="webp2jpg-dropzone">
                    <input type="file" id="webp2jpg-file" accept="image/webp" class="hidden">
                    <i data-lucide="image" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-[#002244]">Click to upload or drag a WebP image here</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Converts modern WebP files into universal JPG or PNG format</p>
                </div>

                <div id="webp2jpg-result" class="hidden bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-[#002244]">Target Format:</span>
                            <div class="flex gap-1">
                                <button type="button" class="btn-webp-fmt active px-3.5 py-1.5 bg-[#002244] text-white rounded-xl text-xs font-bold" data-fmt="jpeg">JPG</button>
                                <button type="button" class="btn-webp-fmt px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200" data-fmt="png">PNG (Lossless)</button>
                            </div>
                        </div>

                        <button type="button" id="btn-webp-download" class="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            <span id="btn-webp-download-text">Download JPG</span>
                        </button>
                    </div>

                    <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[200px]">
                        <img id="webp-preview-img" class="max-h-56 object-contain rounded shadow-2xs">
                    </div>
                </div>
            </div>
        `;

        const dropzone = container.querySelector('#webp2jpg-dropzone');
        const fileIn = container.querySelector('#webp2jpg-file');
        const result = container.querySelector('#webp2jpg-result');
        const preview = container.querySelector('#webp-preview-img');
        const dlBtnText = container.querySelector('#btn-webp-download-text');
        let currentFile = null;
        let currentFormat = 'jpeg';

        dropzone.addEventListener('click', () => fileIn.click());
        fileIn.addEventListener('change', (e) => {
            currentFile = e.target.files[0];
            if (currentFile) convert();
        });

        async function convert() {
            if (!currentFile) return;
            const res = await ImageConverterEngine.convertWebp(currentFile, currentFormat, 0.92);
            preview.src = res.dataUrl;
            dlBtnText.textContent = `Download ${res.format}`;
            result.classList.remove('hidden');
        }

        container.querySelectorAll('.btn-webp-fmt').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-webp-fmt').forEach(b => {
                    b.className = 'btn-webp-fmt px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200';
                });
                btn.className = 'btn-webp-fmt active px-3.5 py-1.5 bg-[#002244] text-white rounded-xl text-xs font-bold';
                currentFormat = btn.dataset.fmt;
                convert();
            });
        });

        container.querySelector('#btn-webp-download').addEventListener('click', async () => {
            if (!currentFile) return;
            const res = await ImageConverterEngine.convertWebp(currentFile, currentFormat, 0.92);
            const a = document.createElement('a');
            a.download = `techtis-converted-${Date.now()}.${currentFormat === 'jpeg' ? 'jpg' : 'png'}`;
            a.href = res.dataUrl;
            a.click();
        });
    },

    // ==============================================================================
    // 19. Social Media Image Resizer Workspace
    // ==============================================================================
    renderSocialMediaResizerWorkspace(container, tool) {
        const presets = ImageConverterEngine.getSocialPresets();
        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-[#EA1D2C] transition cursor-pointer" id="social-dropzone">
                    <input type="file" id="social-file" accept="image/*" class="hidden">
                    <i data-lucide="image" class="w-10 h-10 text-slate-400 mx-auto mb-2"></i>
                    <p class="text-xs font-bold text-[#002244]">Click to upload or drag an image here</p>
                    <p class="text-[11px] text-slate-400 mt-0.5">Resize to exact social media dimensions for Instagram, YouTube, LinkedIn &amp; Twitter</p>
                </div>

                <div id="social-result" class="hidden space-y-6">
                    <!-- Preset Selector Grid -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                        <span class="text-xs font-bold text-[#002244]">Select Social Media Target Preset:</span>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            ${presets.map((p, idx) => `
                                <button type="button" class="btn-social-preset ${idx === 0 ? 'active border-[#EA1D2C] bg-red-50 text-[#EA1D2C]' : 'border-slate-200 bg-white text-slate-700'} p-3 rounded-2xl border text-left hover:border-[#EA1D2C] transition shadow-2xs" data-idx="${idx}">
                                    <div class="text-[10px] font-bold text-slate-400 uppercase">${p.platform}</div>
                                    <div class="text-xs font-bold mt-0.5">${p.name}</div>
                                    <div class="text-[10px] text-slate-500 font-mono mt-0.5">${p.width} x ${p.height} px</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Fitting & Export -->
                    <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-[#002244]">Fitting:</span>
                                <div class="flex gap-1">
                                    <button type="button" class="btn-social-fit active px-3 py-1 bg-[#002244] text-white rounded-lg text-xs font-bold" data-fit="cover">Cover / Center Crop</button>
                                    <button type="button" class="btn-social-fit px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200" data-fit="contain">Fit / Letterbox</button>
                                </div>
                            </div>

                            <button type="button" id="btn-social-download" class="px-5 py-2.5 bg-[#EA1D2C] hover:bg-[#cf1523] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer">
                                <i data-lucide="download" class="w-4 h-4"></i>
                                <span>Download Resized Image</span>
                            </button>
                        </div>

                        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[220px]">
                            <img id="social-preview-img" class="max-h-64 object-contain rounded shadow-2xs">
                        </div>
                    </div>
                </div>
            </div>
        `;

        const dropzone = container.querySelector('#social-dropzone');
        const fileIn = container.querySelector('#social-file');
        const result = container.querySelector('#social-result');
        const preview = container.querySelector('#social-preview-img');
        let currentFile = null;
        let selectedPreset = presets[0];
        let fitMode = 'cover';

        dropzone.addEventListener('click', () => fileIn.click());
        fileIn.addEventListener('change', (e) => {
            currentFile = e.target.files[0];
            if (currentFile) renderPreset();
        });

        async function renderPreset() {
            if (!currentFile) return;
            const res = await ImageConverterEngine.resizeToSocialPreset(currentFile, selectedPreset, fitMode);
            preview.src = res.dataUrl;
            result.classList.remove('hidden');
        }

        container.querySelectorAll('.btn-social-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-social-preset').forEach(b => {
                    b.className = 'btn-social-preset border-slate-200 bg-white text-slate-700 p-3 rounded-2xl border text-left hover:border-[#EA1D2C] transition shadow-2xs';
                });
                btn.className = 'btn-social-preset active border-[#EA1D2C] bg-red-50 text-[#EA1D2C] p-3 rounded-2xl border text-left shadow-2xs';
                selectedPreset = presets[parseInt(btn.dataset.idx, 10)];
                renderPreset();
            });
        });

        container.querySelectorAll('.btn-social-fit').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.btn-social-fit').forEach(b => {
                    b.className = 'btn-social-fit px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200';
                });
                btn.className = 'btn-social-fit active px-3 py-1 bg-[#002244] text-white rounded-lg text-xs font-bold';
                fitMode = btn.dataset.fit;
                renderPreset();
            });
        });

        container.querySelector('#btn-social-download').addEventListener('click', async () => {
            if (!currentFile) return;
            const res = await ImageConverterEngine.resizeToSocialPreset(currentFile, selectedPreset, fitMode);
            const a = document.createElement('a');
            a.download = `techtis-${selectedPreset.platform.toLowerCase()}-${selectedPreset.width}x${selectedPreset.height}-${Date.now()}.jpg`;
            a.href = res.dataUrl;
            a.click();
        });
    }
};
