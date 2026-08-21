/**
 * QMOS Daily Cron Runner
 * Run by PM2 cron every morning at 8:00 AM.
 * Triggers two API endpoints:
 *   1. /api/daily-report  — Complaint summary email
 *   2. /api/capa-alerts   — CAPA overdue / due-soon email
 *
 * Setup (run once in your project folder):
 *   pm2 start scripts/daily-report.js --name qmos-daily --cron "0 8 * * *" --no-autorestart
 *
 * Test immediately:
 *   node scripts/daily-report.js
 */

const http = require('http');

const PORT   = process.env.PORT || 3000;
const SECRET = process.env.DAILY_REPORT_SECRET || 'QMOS_DAILY_2026';

function callEndpoint(path, label) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port:     PORT,
      path:     `${path}?secret=${SECRET}`,
      method:   'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.sent || result.sent === false) {
            console.log(`[QMOS ${label}] ✅ Done. Response:`, JSON.stringify(result));
          } else {
            console.error(`[QMOS ${label}] ❌ Unexpected response:`, data);
          }
        } catch {
          console.error(`[QMOS ${label}] ❌ Parse error:`, data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`[QMOS ${label}] ❌ Request error:`, err.message);
      console.error(`[QMOS ${label}] Make sure QMOS app is running on port`, PORT);
      resolve();
    });

    req.end();
  });
}

async function run() {
  const ts = new Date().toLocaleString('en-IN');
  console.log(`\n[QMOS Daily] ─── Starting daily cron at ${ts} ───`);

  // 1. Daily complaint summary email
  console.log('[QMOS Daily] → Triggering daily complaint report...');
  await callEndpoint('/api/daily-report', 'Daily Report');

  // 2. CAPA due-date alert email
  console.log('[QMOS Daily] → Triggering CAPA due-date alerts...');
  await callEndpoint('/api/capa-alerts', 'CAPA Alerts');

  console.log('[QMOS Daily] ─── Daily cron complete ───\n');
}

run();
