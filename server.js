/**
 * Zero-Dependency Local Static HTTP Server for TECHTIS (techtis.in)
 * High-performance, cross-platform static server supporting clean directory URLs.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

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
                    error: `Daily free AI extraction limit reached for your IP (${DAILY_IP_AI_LIMIT}/${DAILY_IP_AI_LIMIT}). Add your own free Groq API key in Settings for unlimited AI extractions.`
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
                        message: 'No server AI key configured. Please add your personal free Groq or Gemini key in Settings (100% free tiers).'
                    }));
                    return;
                }

                try {
                    const systemPrompt = `You are an expert OCR document analyst. Extract structured personal and identity information from the provided document into clean JSON format.
Return ONLY valid JSON matching this exact structure:
{
  "docType": "Aadhaar Card" | "PAN Card" | "Passport" | "Driving License" | "Voter ID" | "Invoice" | "Certificate" | "Marksheet" | "General Document",
  "name": "Full name of the individual (clean without prefixes)",
  "email": "Email address if present, else empty string",
  "phone": "Phone or mobile number if present, else empty string",
  "dob": "Date of birth in DD/MM/YYYY or original format, else empty string",
  "gender": "Male" | "Female" | "Other" | "",
  "idNumber": "Document / ID / Registration / Tax number without masking",
  "fatherName": "Father's or Guardian's name if present, else empty string",
  "address": "Full permanent or residential address if found, else empty string",
  "pincode": "6-digit postal PIN code if found, else empty string"
}
Return only JSON. Do not include markdown ticks.`;

                    // Option A: Direct Multimodal Vision with Gemini (if image provided and Gemini key available)
                    if (serverGeminiKey && imageBase64) {
                        try {
                            const cleanB64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
                            const mime = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
                            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${serverGeminiKey}`;

                            const geminiRes = await fetch(endpoint, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [
                                            { text: `${systemPrompt}\n\nAnalyze this document image with multimodal vision and extract all fields:` },
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
                                    res.end(JSON.stringify({ success: true, fields, isVision: true, remaining: DAILY_IP_AI_LIMIT - record.count }));
                                    return;
                                }
                            }
                        } catch (visionErr) {
                            console.warn('Server Gemini vision fallback to Groq:', visionErr);
                        }
                    }

                    // Option B: Flagship Llama 3.3 70B Versatile on Groq (with 8B instant fallback)
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
                                        remaining: DAILY_IP_AI_LIMIT - record.count
                                    }));
                                    return;
                                }
                            } catch (_) {}
                        }
                    }

                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'AI providers currently unavailable' }));
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
        } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
            filePath = filePath + '.html';
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            const stat = fs.statSync(filePath);

            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stat.size,
                'Cache-Control': 'no-cache'
            });

            if (req.method === 'HEAD') {
                res.end();
                return;
            }

            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`404 Not Found: ${req.url}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            createServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });

    server.listen(port, () => {
        console.log('==========================================================');
        console.log(' TECHTIS - Serverless Zero-Cost PDF Platform (techtis.in)');
        console.log('==========================================================');
        console.log(` Local server running at: http://localhost:${port}/`);
        console.log(` Root Directory: ${ROOT_DIR}`);
        console.log(' Press Ctrl+C in this console to stop the server.');
        console.log('==========================================================');
    });

    return server;
}

createServer(Number(process.env.PORT) || 8080);
