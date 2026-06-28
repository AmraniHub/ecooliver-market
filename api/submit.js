module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, city, service, eventId } = req.body || {};

  const now = new Date().toLocaleString('fr-MA', {
    timeZone: 'Africa/Casablanca',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const waLink = 'https://wa.me/' + (phone || '').replace(/^0/, '212');

  const message =
    '🌿 *طلب جديد — Ecoolivier*\n\n' +
    '👤 الاسم: ' + (name  || '—') + '\n' +
    '📱 الهاتف: ' + (phone || '—') + '\n' +
    '📍 المدينة: ' + (city  || '—') + '\n' +
    '📦 المنتج: رشاش زراعي احترافي — 3000 DH\n' +
    '🕐 التاريخ: ' + now + '\n\n' +
    '💬 [واتساب](' + waLink + ')';

  await Promise.allSettled([
    sendTelegram(process.env.TELEGRAM_BOT_TOKEN_1, process.env.TELEGRAM_CHAT_ID_1, message),
    sendTelegram(process.env.TELEGRAM_BOT_TOKEN_2, process.env.TELEGRAM_CHAT_ID_2, message),
  ]);

  if (process.env.SHEETS_WEBHOOK_URL) {
    try {
      await fetch(process.env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, city, service, eventId })
      });
    } catch (_) {}
  }

  return res.status(200).json({ status: 'ok' });
};

async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return;
  try {
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    return r.json();
  } catch (e) {
    console.error('Telegram error:', e.message);
  }
}
