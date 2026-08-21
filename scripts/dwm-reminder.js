// DWM Daily Reminder Script
// Called by PM2 cron at 09:00 every morning.
// Posts to /api/dwm/reminders which sends WhatsApp reminders for all open tasks.

const http = require('http');

const port = process.env.QMOS_PORT || 3000;

const options = {
  hostname: 'localhost',
  port,
  path: '/api/dwm/reminders',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': 0 },
};

console.log(`[DWM Reminder ${new Date().toISOString()}] Sending to port ${port}...`);

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`[DWM Reminder] Done — ${json.remindersSent} sent, ${json.totalOpen} open tasks`);
    } catch {
      console.log('[DWM Reminder] Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('[DWM Reminder] Error:', e.message);
  process.exit(1);
});

req.end();
