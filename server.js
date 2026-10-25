/**
 * Zero-Dependency Local Static HTTP Server for TECHTIS (techtis.in)
 * High-performance, cross-platform static server supporting clean directory URLs
 * and 100% Free Edge AI Vision Endpoints (Google Gemini 1.5/2.0 Flash & Groq Vision).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

// Auto-load .env file if present (Zero-dependency .env loader)
const envPath = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envPath)) {
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const idx = trimmed.indexOf('=');
                if (idx > 0) {
                    const key = trimmed.slice(0, idx).trim();
                    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        });
    } catch (_) {}
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.wasm': 'application/wasm',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8'
};

// Strict Daily AI Quota per IP to protect owner's free API limits ($0 cost guarantee)
const ipAiUsage = new Map();
const DAILY_IP_AI_LIMIT = 5;

function createServer(port) {
    const server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Parse requested path
        const parsedUrl = new URL(req.url, `http://localhost:${port}`);
        let pathname = decodeURIComponent(parsedUrl.pathname);

        // API Endpoint: /api/ai/quota (Check remaining IP AI quota)
        if (req.method === 'GET' && pathname === '/api/ai/quota') {
            const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
            const today = new Date().toISOString().split('T')[0];
            const record = ipAiUsage.get(clientIp);
            const used = (record && record.date === today) ? record.count : 0;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                date: today,
                used,
                limit: DAILY_IP_AI_LIMIT,
                remaining: Math.max(0, DAILY_IP_AI_LIMIT - used)
            }));
            return;
        }

        // API Endpoint: /api/ai/extract (AI OCR Document Field Extraction with Strict Rate Limiting)
        if (req.method === 'POST' && pathname === '/api/ai/extract') {
            const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
            const today = new Date().toISOString().split('T')[0];

            let record = ipAiUsage.get(clientIp);
            if (!record || record.date !== today) {
                record = { date: today, count: 0 };
                ipAiUsage.set(clientIp, record);
            }

            if (record.count >= DAILY_IP_AI_LIMIT) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: `Daily free AI extraction limit reached for your IP (${DAILY_IP_AI_LIMIT}/${DAILY_IP_AI_LIMIT}). Add your own free Groq or Gemini key in Settings for unlimited AI extractions.`
                }));
                return;
            }

            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
                let parsed = {};
                try {
                    parsed = JSON.parse(body);
                } catch (_) {}

                const text = (parsed.text || '').slice(0, 10000);
                const imageBase64 = parsed.image || null;

                if (!text && !imageBase64) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'No text or image provided for AI extraction.' }));
                    return;
                }

                const serverGroqKey = process.env.GROQ_API_KEY;
                const serverGeminiKey = process.env.GEMINI_API_KEY;

                if (!serverGroqKey && !serverGeminiKey) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        needsUserKey: true,
                        message: 'No server AI key configured. Please add your personal free Google Gemini or Groq key in Settings (100% free tiers).'
                    }));
                    return;
                }

                try {
                    const systemPrompt = `You are an expert OCR document analyst. Extract structured personal and identity information from the provided document into clean JSON format.
Return ONLY valid JSON matching this exact structure:
{
  "docType": "Aadhaar Card" | "PAN Card" | "Passport" | "Driving License" | "Voter ID" | "Marksheet" | "Certificate" | "Invoice" | "Bank Passbook" | "General Document",
  "name": "Full legal name of the individual (clean without prefixes)",
  "email": "Email address if present, else empty string",
  "phone": "Phone or mobile number if present, else empty string",
  "dob": "Date of birth in DD/MM/YYYY or original format, else empty string",
  "gender": "Male" | "Female" | "Other" | "",
  "idNumber": "Document / ID / Registration / Tax number without masking",
  "fatherName": "Father's or Guardian's or Spouse's name if present, else empty string",
  "address": "Full permanent or residential address if found, else empty string",
  "pincode": "6-digit postal PIN code if found, else empty string",
  "extraNotes": "Key numbers, marks, roll number, bank IFSC, account number, or notes if found, else empty string"
}
Return only JSON. Do not include markdown ticks.`;

                    // Tier 1: Direct Multimodal Vision with Google Gemini (Best in the world for document OCR)
                    if (serverGeminiKey && imageBase64) {
                        const cleanB64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
                        const mime = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
                        const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];

                        for (const model of geminiModels) {
                            try {
                                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${serverGeminiKey}`;
                                const geminiRes = await fetch(endpoint, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        contents: [{
                                            parts: [
                                                { text: `${systemPrompt}\n\nAnalyze this document image with multimodal vision and extract all fields accurately into clean JSON:` },
                                                { inline_data: { mime_type: mime, data: cleanB64 } }
                                            ]
                                        }],
                                        generationConfig: { responseMimeType: 'application/json' }
                                    })
                                });

                                if (geminiRes.ok) {
                                    const data = await geminiRes.json();
                                    const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                    if (textRes) {
                                        const fields = JSON.parse(textRes);
                                        record.count++;
                                        res.writeHead(200, { 'Content-Type': 'application/json' });
                                        res.end(JSON.stringify({
                                            success: true,
                                            fields,
                                            model,
                                            provider: 'Google Gemini (Multimodal Vision)',
                                            isVision: true,
                                            remaining: DAILY_IP_AI_LIMIT - record.count
                                        }));
                                        return;
                                    }
                                }
                            } catch (gemErr) {
                                console.warn(`Gemini model ${model} notice:`, gemErr.message);
                            }
                        }
                    }

                    // Tier 2: Multimodal Vision with Groq (Llama 3.2 11B Vision Preview)
                    if (serverGroqKey && imageBase64) {
                        try {
                            const groqVisionRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${serverGroqKey}`
                                },
                                body: JSON.stringify({
                                    model: 'llama-3.2-11b-vision-preview',
                                    messages: [
                                        { role: 'system', content: systemPrompt },
                                        {
                                            role: 'user',
                                            content: [
                                                { type: 'text', text: 'Extract all fields from this document image into clean JSON:' },
                                                { type: 'image_url', image_url: { url: imageBase64 } }
                                            ]
                                        }
                                    ],
                                    temperature: 0.1,
                                    response_format: { type: 'json_object' }
                                })
                            });

                            if (groqVisionRes.ok) {
                                const data = await groqVisionRes.json();
                                const rawJson = data.choices?.[0]?.message?.content || '{}';
                                const fields = JSON.parse(rawJson);
                                record.count++;
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({
                                    success: true,
                                    fields,
                                    model: 'llama-3.2-11b-vision-preview',
                                    provider: 'Groq Cloud (Llama 3.2 Vision)',
                                    isVision: true,
                                    remaining: DAILY_IP_AI_LIMIT - record.count
                                }));
                                return;
                            }
                        } catch (groqVisionErr) {
                            console.warn('Server Groq vision fallback:', groqVisionErr.message);
                        }
                    }

                    // Tier 3: Neural Text Reasoning with Groq (Llama 3.3 70B Versatile & 8B Instant)
                    if (serverGroqKey) {
                        const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
                        for (const model of modelsToTry) {
                            try {
                                const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${serverGroqKey}`
                                    },
                                    body: JSON.stringify({
                                        model,
                                        messages: [
                                            { role: 'system', content: systemPrompt },
                                            { role: 'user', content: `Document OCR Text:\n${text || 'Extract document info'}` }
                                        ],
                                        temperature: 0.1,
                                        response_format: { type: 'json_object' }
                                    })
                                });

                                if (groqRes.ok) {
                                    const groqData = await groqRes.json();
                                    const rawJson = groqData.choices?.[0]?.message?.content || '{}';
                                    const fields = JSON.parse(rawJson);
                                    record.count++;
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({
                                        success: true,
                                        fields,
                                        model,
                                        provider: 'Groq Cloud (Neural Text)',
                                        remaining: DAILY_IP_AI_LIMIT - record.count
                                    }));
                                    return;
                                }
                            } catch (_) {}
                        }
                    }

                    // Tier 4: Gemini Text-only Fallback
                    if (serverGeminiKey && text) {
                        try {
                            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${serverGeminiKey}`;
                            const gemRes = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [{ text: `${systemPrompt}\n\nDocument text:\n${text}` }]
                                    }],
                                    generationConfig: { responseMimeType: 'application/json' }
                                })
                            });
                            if (gemRes.ok) {
                                const gData = await gemRes.json();
                                const textRes = gData.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (textRes) {
                                    const fields = JSON.parse(textRes);
                                    record.count++;
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({
                                        success: true,
                                        fields,
                                        model: 'gemini-1.5-flash',
                                        provider: 'Google Gemini (Text)',
                                        remaining: DAILY_IP_AI_LIMIT - record.count
                                    }));
                                    return;
                                }
                            }
                        } catch (_) {}
                    }

                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'AI providers currently unavailable. Please verify API keys.' }));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }

        if (pathname === '/' || pathname === '') {
            pathname = '/index.html';
        }

        let filePath = path.join(ROOT_DIR, pathname);

        // Directory index support (/merge-pdf/ -> /merge-pdf/index.html)
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        // Clean URL fallback (/merge-pdf -> /merge-pdf/index.html or /merge-pdf.html)
        if (!fs.existsSync(filePath)) {
            const potentialHtml = filePath + '.html';
            const potentialDirIndex = path.join(filePath, 'index.html');
            if (fs.existsSync(potentialDirIndex)) {
                filePath = potentialDirIndex;
            } else if (fs.existsSync(potentialHtml)) {
                filePath = potentialHtml;
            }
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h1>404 - Not Found</h1><p>The requested resource was not found on this server.</p>');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`500 - Server Error: ${err.code}`);
                }
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            // Cache static assets, but don't cache html for instant developer feedback
            if (ext === '.html') {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            } else {
                res.setHeader('Cache-Control', 'public, max-age=3600');
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });

    return server;
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const server = createServer(PORT);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`==========================================================`);
    console.log(` TECHTIS - Serverless Zero-Cost PDF Platform (techtis.in)`);
    console.log(`==========================================================`);
    console.log(` Local server running at: http://localhost:${PORT}/`);
    console.log(` Root Directory: ${ROOT_DIR}`);
    console.log(` Vision AI Engine: Gemini 1.5/2.0 Flash & Groq Llama 3.2 Vision`);
    console.log(` Press Ctrl+C in this console to stop the server.`);
    console.log(`==========================================================`);
});
