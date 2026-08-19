const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');

async function getWsEndpoint() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWsEndpoint();
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('linkedin.com'));
  if (!page) {
    page = await browser.newPage();
  }
  
  console.log('Navigating to feed...');
  await page.goto('https://www.linkedin.com/feed', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'linkedin_feed_debug.png' });
  console.log('Screenshot saved to linkedin_feed_debug.png');
  
  await browser.disconnect();
}

run().catch(console.error);
