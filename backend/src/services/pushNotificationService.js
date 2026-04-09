const https = require('https');

/**
 * Send push notifications via Expo Push API.
 * Messages: Array of { to, title, body, data? }
 * Non-blocking — errors are logged but never thrown.
 */
async function sendExpoPushNotifications(messages) {
  if (!messages || messages.length === 0) return;

  const valid = messages.filter(
    (m) => m.to && typeof m.to === 'string' && m.to.startsWith('ExponentPushToken[')
  );
  if (valid.length === 0) return;

  const body = JSON.stringify(valid);

  return new Promise((resolve) => {
    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });

    req.on('error', (err) => {
      console.error('[Push] Failed to send push notification:', err.message);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

module.exports = { sendExpoPushNotifications };
