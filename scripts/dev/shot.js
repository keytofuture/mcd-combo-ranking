'use strict';

/**
 * 移动端截图工具（开发用，不参与产品构建）。
 *
 * headless Chrome 的 --window-size 在 Windows 上有最小宽度限制，
 * 直接截图拿不到 390px 真机视口。这里走 CDP 的 setDeviceMetricsOverride，
 * 才能按 iPhone 逻辑宽度渲染。
 *
 * 用法：
 *   node scripts/dev/shot.js <url> <out.png> [width] [height] [--eval "JS"] [--wait ms]
 */

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => fs.existsSync(p));

const PORT = 9333 + Math.floor(Math.random() * 200);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForDevtools() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch (e) { /* 还没起来 */ }
    await sleep(150);
  }
  throw new Error('Chrome DevTools 没起来');
}

/** 极简 CDP 客户端：一条连接、递增 id、按 id 匹配响应 */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let seq = 0;
  const listeners = [];
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(new Error('ws error')));
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  });
  return {
    ready,
    send(method, params) {
      const id = ++seq;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params: params || {} }));
      });
    },
    once(method) {
      return new Promise((resolve) => {
        const fn = (msg) => {
          if (msg.method === method) {
            listeners.splice(listeners.indexOf(fn), 1);
            resolve(msg.params);
          }
        };
        listeners.push(fn);
      });
    },
    close() { ws.close(); },
  };
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = {};
  const pos = [];
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--eval') flags.eval = argv[++i];
    else if (argv[i] === '--wait') flags.wait = Number(argv[++i]);
    else if (argv[i] === '--full') flags.full = true;
    else pos.push(argv[i]);
  }
  const [url, out, w = 390, h = 844] = pos;
  if (!url || !out) throw new Error('用法：node scripts/dev/shot.js <url> <out.png> [w] [h]');

  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shot-'));
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitForDevtools();

    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const cdp = connect(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: Number(w), height: Number(h), deviceScaleFactor: 2, mobile: true,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url });
    await loaded;
    await sleep(flags.wait == null ? 700 : flags.wait);

    if (flags.eval) {
      const r = await cdp.send('Runtime.evaluate', { expression: flags.eval, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error('注入脚本报错：' + JSON.stringify(r.exceptionDetails));
      if (r.result && r.result.value !== undefined) console.log('eval →', JSON.stringify(r.result.value));
      await sleep(450);
    }

    if (flags.full) {
      const m = await cdp.send('Page.getLayoutMetrics');
      const cs = m.cssContentSize || m.contentSize;
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: Number(w), height: Math.ceil(cs.height), deviceScaleFactor: 2, mobile: true,
      });
      await sleep(300);
    }

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
    console.log(`已截图：${out}`);
    cdp.close();
  } finally {
    chrome.kill();
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }, 600);
  }
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
