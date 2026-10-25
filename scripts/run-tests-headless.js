import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9224;

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('[Test Runner] Launching Headless Chrome on port', DEBUG_PORT, '...');
    const chrome = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--user-data-dir=' + process.env.TEMP + '\\chrome_test_profile_' + Date.now(),
        'http://localhost:8080/test-runner.html'
    ]);

    chrome.on('error', (err) => {
        console.error('Failed to spawn Chrome:', err);
        process.exit(1);
    });

    let target = null;
    for (let i = 0; i < 30; i++) {
        await sleep(300);
        try {
            const list = await fetchJson(`http://localhost:${DEBUG_PORT}/json`);
            if (list && list.length > 0) {
                target = list.find(t => t.url && t.url.includes('test-runner.html')) || list.find(t => t.type === 'page');
                if (target) break;
            }
        } catch (_) {}
    }

    if (!target) {
        console.error('Chrome debugger page target did not become ready in time.');
        chrome.kill();
        process.exit(1);
    }

    console.log('[Test Runner] Connected to target:', target.id, target.url);
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    function send(method, params = {}) {
        return new Promise((resolve) => {
            const id = msgId++;
            const handler = (event) => {
                const data = JSON.parse(event.data);
                if (data.id === id) {
                    ws.removeEventListener('message', handler);
                    resolve(data.result);
                }
            };
            ws.addEventListener('message', handler);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    ws.onopen = async () => {
        await send('Runtime.enable');

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Runtime.consoleAPICalled') {
                const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
                console.log(' [BROWSER LOG]', text);
            } else if (msg.method === 'Runtime.exceptionThrown') {
                console.error(' [BROWSER EXCEPTION]', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
            }
        };

        console.log('[Test Runner] Polling test execution progress...');
        let finished = false;
        for (let i = 0; i < 60; i++) {
            await sleep(500);
            const evalRes = await send('Runtime.evaluate', {
                expression: 'window.TEST_COMPLETED ? { completed: true, passed: window.TEST_PASSED, failed: window.TEST_FAILED, output: document.getElementById("output").innerText } : { completed: false }',
                returnByValue: true
            });

            if (evalRes && evalRes.result && evalRes.result.value && evalRes.result.value.completed) {
                const val = evalRes.result.value;
                console.log('\n==============================================');
                console.log('       ALL TEST RESULTS FROM BROWSER          ');
                console.log('==============================================');
                console.log(val.output);
                console.log('==============================================');
                console.log(`FINAL SUMMARY: ${val.passed} PASSED | ${val.failed} FAILED`);
                finished = true;
                break;
            }
        }

        if (!finished) {
            // Read output even if not marked complete
            const partialRes = await send('Runtime.evaluate', {
                expression: 'document.getElementById("output") ? document.getElementById("output").innerText : "NO OUTPUT"',
                returnByValue: true
            });
            console.log('\n[Partial Output Before Timeout]:\n', partialRes?.result?.value);
        }

        ws.close();
        chrome.kill();
        process.exit(finished ? 0 : 1);
    };
}

main().catch(err => {
    console.error('Fatal error in runner:', err);
    process.exit(1);
});
