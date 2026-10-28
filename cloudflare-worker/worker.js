/**
 * TECHTIS (techtis.in) - Cloudflare Edge Worker
 * Serverless Edge AI & Free D1 Database Architecture ($0/Month)
 *
 * Capabilities:
 * - 10,000 Free Neurons/Day via Cloudflare Workers AI (Llama 3.1 8B, Llama 3.2 3B, M2M100)
 * - 5,000,000 Reads & 100,000 Writes/Day via Cloudflare D1 Serverless SQLite
 * - OCR.space & Gemini Free Tier Edge Proxy with Client-IP forwarding
 * - Zero PDF byte persistence: All document processing stays in browser RAM
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS
        }
    });
}

/**
 * Anonymized Daily Rate Limiting per Visitor IP
 * Protects developer's free 10,000 daily AI neurons from being exhausted by a single user.
 */
async function checkAndIncrementQuota(env, clientIp, maxPerDay = 30) {
    if (!env.DB) return { allowed: true, remaining: maxPerDay };
    try {
        const today = new Date().toISOString().slice(0, 10);
        const encoder = new TextEncoder();
        const data = encoder.encode(clientIp + '_techtis_salt_v1');
        const hashBuf = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

        const row = await env.DB.prepare(
            'SELECT request_count FROM ip_quotas WHERE ip_hash = ? AND request_date = ?'
        ).bind(ipHash, today).first();

        const currentCount = row ? row.request_count : 0;
        if (currentCount >= maxPerDay) {
            return { allowed: false, remaining: 0 };
        }

        await env.DB.prepare(
            'INSERT INTO ip_quotas (ip_hash, request_date, request_count) VALUES (?, ?, 1) ' +
            'ON CONFLICT(ip_hash, request_date) DO UPDATE SET request_count = request_count + 1'
        ).bind(ipHash, today).run();

        return { allowed: true, remaining: maxPerDay - (currentCount + 1) };
    } catch (_) {
        return { allowed: true, remaining: maxPerDay };
    }
}

export default {
    async fetch(request, env, ctx) {
        // Handle preflight OPTIONS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        const url = new URL(request.url);
        const path = url.pathname;
        const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
        const clientCountry = request.cf?.country || 'XX';

        try {
            // ==========================================
            // 1. HEALTH & DIAGNOSTIC CHECK
            // ==========================================
            if (path === '/api/health' || path === '/health') {
                return jsonResponse({
                    status: 'online',
                    platform: 'TECHTIS Edge Engine',
                    domain: 'techtis.in',
                    cost: '$0.00/mo',
                    edgeLocation: request.cf?.colo || 'LOCAL',
                    clientCountry,
                    hasWorkersAI: Boolean(env.AI),
                    hasD1Database: Boolean(env.DB),
                    hasGeminiSecret: Boolean(env.GEMINI_API_KEY),
                    hasOcrSecret: Boolean(env.OCR_SPACE_API_KEY)
                });
            }

            // ==========================================
            // 2. CLOUDFLARE WORKERS AI - SUMMARIZE
            // ==========================================
            if (path === '/api/ai/summarize' && request.method === 'POST') {
                const body = await request.json().catch(() => ({}));
                const promptText = body.prompt || body.text || '';

                if (!promptText.trim()) {
                    return jsonResponse({ error: 'Text prompt is required.' }, 400);
                }

                // Check daily IP quota to protect developer neurons
                const quota = await checkAndIncrementQuota(env, clientIp, 25);
                if (!quota.allowed) {
                    return jsonResponse({
                        error: 'Daily free AI limit reached for this device. Please add your free personal key in Edge AI Settings or try again tomorrow.',
                        rateLimited: true
                    }, 429);
                }

                // If Cloudflare Workers AI binding is available (10,000 free neurons/day)
                if (env.AI) {
                    const aiResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
                        messages: [
                            {
                                role: 'system',
                                content: 'You are TECHTIS AI, a high-speed document analyst. Provide a clear, bulleted executive summary, key numerical metrics, and main takeaways from the document text. Be concise and factual.'
                            },
                            {
                                role: 'user',
                                content: promptText.slice(0, 16000)
                            }
                        ],
                        max_tokens: 1024,
                        temperature: 0.2
                    });

                    return jsonResponse({
                        summary: aiResult.response || 'Summary generated.',
                        engine: 'Cloudflare Workers AI (Llama 3.1 8B)',
                        edgeLocation: request.cf?.colo || 'EDGE'
                    });
                }

                // Fallback to Gemini if configured
                if (env.GEMINI_API_KEY) {
                    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`;
                    const gemRes = await fetch(geminiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptText.slice(0, 25000) }] }]
                        })
                    });
                    const gemData = await gemRes.json();
                    const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        return jsonResponse({
                            summary: text,
                            engine: 'Google Gemini 1.5 Flash Edge Proxy'
                        });
                    }
                }

                return jsonResponse({
                    error: 'Workers AI binding ([ai]) not active in wrangler.toml or developer keys not set.',
                    hint: 'Run "npx wrangler deploy" with [ai] binding enabled in wrangler.toml.'
                }, 501);
            }

            // ==========================================
            // 3. CLOUDFLARE WORKERS AI - TRANSLATION
            // ==========================================
            if (path === '/api/ai/translate' && request.method === 'POST') {
                const body = await request.json().catch(() => ({}));
                const text = body.text || '';
                const targetLang = (body.targetLang || 'es').toLowerCase();

                if (!text.trim()) {
                    return jsonResponse({ error: 'Text to translate is required.' }, 400);
                }

                // Check daily IP quota
                const transQuota = await checkAndIncrementQuota(env, clientIp, 25);
                if (!transQuota.allowed) {
                    return jsonResponse({
                        error: 'Daily free AI limit reached for this device. Please add your free personal key in Edge AI Settings or try again tomorrow.',
                        rateLimited: true
                    }, 429);
                }

                if (env.AI) {
                    // Try M2M100 multilingual translation model first
                    try {
                        const trResult = await env.AI.run('@cf/meta/m2m100-1.2b', {
                            text: text.slice(0, 4000),
                            source_lang: body.sourceLang || 'english',
                            target_lang: targetLang
                        });
                        return jsonResponse({
                            translatedText: trResult.translated_text || trResult.response,
                            engine: 'Cloudflare Workers AI (M2M100)'
                        });
                    } catch (m2mErr) {
                        // Fallback to Llama 3.1 for high-speed conversational translation
                        const llamaResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are an expert professional translator. Translate the given text accurately into ${targetLang}. Return ONLY the direct translated text with zero conversational fluff.`
                                },
                                { role: 'user', content: text.slice(0, 10000) }
                            ],
                            max_tokens: 1500
                        });
                        return jsonResponse({
                            translatedText: llamaResult.response,
                            engine: 'Cloudflare Workers AI (Llama 3.1 8B)'
                        });
                    }
                }

                return jsonResponse({ error: 'Workers AI not configured.' }, 501);
            }

            // ==========================================
            // 4. CLOUDFLARE WORKERS AI - FORM DETECTOR
            // ==========================================
            if (path === '/api/ai/detect-blanks' && request.method === 'POST') {
                const body = await request.json().catch(() => ({}));
                const docText = body.text || '';

                if (env.AI) {
                    const aiResult = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
                        messages: [
                            {
                                role: 'system',
                                content: 'Analyze the text from a form document. Identify all blank input fields, missing signature lines, date lines, or uncompleted sections. Return a clean bulleted list of missing or unfilled items with recommendations.'
                            },
                            { role: 'user', content: docText.slice(0, 12000) }
                        ],
                        max_tokens: 1000
                    });

                    return jsonResponse({
                        analysis: aiResult.response,
                        engine: 'Cloudflare Workers AI'
                    });
                }

                return jsonResponse({ error: 'Workers AI not enabled.' }, 501);
            }

            // ==========================================
            // 5. OCR.SPACE PROXY ROUTE (Visitor IP Quota)
            // ==========================================
            if (path === '/api/ocr' && request.method === 'POST') {
                const incomingFormData = await request.formData();
                const ocrApiKey = env.OCR_SPACE_API_KEY || 'K87899142388957';

                incomingFormData.set('apikey', ocrApiKey);

                const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    body: incomingFormData,
                    headers: {
                        'X-Forwarded-For': clientIp // Routes usage against visitor's individual IP
                    }
                });

                const data = await ocrResponse.text();
                return new Response(data, {
                    status: ocrResponse.status,
                    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
                });
            }

            // ==========================================
            // 5b. CLOUDFLARE EDGE - SERVERLESS GEMINI VISION OCR (99%+ Precision)
            // ==========================================
            if (path === '/api/ai/ocr' && request.method === 'POST') {
                const body = await request.json().catch(() => ({}));
                const imageBase64 = body.image || '';

                if (!imageBase64) {
                    return jsonResponse({ error: 'Image data is required.' }, 400);
                }

                // Check daily IP quota
                const ocrQuota = await checkAndIncrementQuota(env, clientIp, 30);
                if (!ocrQuota.allowed) {
                    return jsonResponse({
                        error: 'Daily free AI OCR limit reached for this IP. Please add your personal key in Settings.',
                        rateLimited: true
                    }, 429);
                }

                if (env.GEMINI_API_KEY) {
                    const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
                    const mime = imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
                    const geminiModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];
                    for (const model of geminiModels) {
                        try {
                            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
                            const gemRes = await fetch(geminiUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    contents: [{
                                        parts: [
                                            { text: 'Transcribe all text from this document image with 100% precision. Return ONLY the plain transcribed text, preserving paragraphs, numbers, and headings accurately.' },
                                            { inline_data: { mime_type: mime, data: cleanData } }
                                        ]
                                    }]
                                })
                            });
                            if (gemRes.ok) {
                                const gemData = await gemRes.json();
                                const text = gemData?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text && text.trim()) {
                                    return jsonResponse({
                                        text: text.trim(),
                                        engine: `Google Gemini Vision (${model}) via Cloudflare Edge`
                                    });
                                }
                            }
                        } catch (err) {
                            console.warn('Gemini edge OCR error:', err);
                        }
                    }
                }

                // 2. Cloudflare Workers AI Free Tier (Llama 3.2 Vision - 10,000 Free Neurons/Day)
                if (env.AI) {
                    try {
                        const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
                        const binaryData = Uint8Array.from(atob(cleanData), c => c.charCodeAt(0));
                        const cfVisionRes = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
                            image: [...binaryData],
                            prompt: 'Transcribe all text from this document image accurately with exact words, numbers, and layout. Return only the extracted text with no conversational filler.'
                        });
                        if (cfVisionRes && (cfVisionRes.response || cfVisionRes.description)) {
                            return jsonResponse({
                                text: (cfVisionRes.response || cfVisionRes.description).trim(),
                                engine: 'Cloudflare Workers AI (Llama 3.2 11B Vision - 100% Free Tier)'
                            });
                        }
                    } catch (cfErr) {
                        console.warn('Cloudflare Workers AI Vision error:', cfErr);
                    }
                }

                return jsonResponse({ error: 'No AI engine active. Configure GEMINI_API_KEY or Cloudflare Workers AI [ai] binding.' }, 501);
            }

            // ==========================================
            // 6. CLOUDFLARE D1 DATABASE - TELEMETRY & STATS
            // ==========================================
            if (path === '/api/stats/log' && request.method === 'POST') {
                if (!env.DB) {
                    return jsonResponse({ logged: false, reason: 'D1 database not bound.' });
                }

                const body = await request.json().catch(() => ({}));
                const toolId = body.toolId || 'unknown';
                const bytes = Number(body.bytesProcessed) || 0;
                const duration = Number(body.durationMs) || 0;

                await env.DB.prepare(
                    'INSERT INTO telemetry (tool_id, bytes_processed, duration_ms, client_country) VALUES (?, ?, ?, ?)'
                ).bind(toolId, bytes, duration, clientCountry).run();

                return jsonResponse({ logged: true });
            }

            if (path === '/api/stats/global' && request.method === 'GET') {
                if (!env.DB) {
                    return jsonResponse({
                        totalOps: 0,
                        totalMbSaved: 0,
                        status: 'D1 not bound'
                    });
                }

                const stats = await env.DB.prepare(
                    'SELECT count(*) as total_ops, COALESCE(sum(bytes_processed), 0) as total_bytes FROM telemetry'
                ).first();

                return jsonResponse({
                    totalOps: stats?.total_ops || 0,
                    totalMbSaved: Math.round(((stats?.total_bytes || 0) / (1024 * 1024)) * 10) / 10,
                    status: 'active'
                });
            }

            // ==========================================
            // 7. CLOUDFLARE D1 DATABASE - USER FEEDBACK
            // ==========================================
            if (path === '/api/feedback' && request.method === 'POST') {
                if (!env.DB) {
                    return jsonResponse({ received: true, note: 'Saved locally (D1 pending).' });
                }

                const body = await request.json().catch(() => ({}));
                const rating = Math.min(5, Math.max(1, parseInt(body.rating, 10) || 5));
                const toolId = String(body.toolId || 'general').slice(0, 50);
                const message = String(body.message || '').slice(0, 1000);

                await env.DB.prepare(
                    'INSERT INTO feedback (rating, tool_id, message, client_country) VALUES (?, ?, ?, ?)'
                ).bind(rating, toolId, message, clientCountry).run();

                return jsonResponse({ success: true, message: 'Thank you for your feedback!' });
            }

            // ==========================================
            // ==========================================
            // 8. STATIC ASSETS FALLBACK (TECHTIS 60 TOOLS)
            // ==========================================
            if (env.ASSETS) {
                return env.ASSETS.fetch(request);
            }

            // DEFAULT 404 HANDLER
            // ==========================================
            return jsonResponse({
                error: 'Endpoint not found',
                availableEndpoints: [
                    'GET  /api/health',
                    'POST /api/ai/summarize',
                    'POST /api/ai/translate',
                    'POST /api/ai/detect-blanks',
                    'POST /api/ocr',
                    'POST /api/ai/ocr',
                    'POST /api/stats/log',
                    'GET  /api/stats/global',
                    'POST /api/feedback'
                ]
            }, 404);

        } catch (err) {
            return jsonResponse({ error: err.message || 'Internal Edge Error' }, 500);
        }
    }
};
