export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name, phone, city,
    service, eventId, eventSourceUrl,
    fbp, fbc, userAgent
  } = req.body;

  const now = new Date().toLocaleString('fr-MA', {
    timeZone: 'Africa/Casablanca',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const waLink = `https://wa.me/${(phone || '').replace(/^0/, '212')}`;

  const message = [
    '🌿 *طلب جديد — Ecoolivier*',
    '',
    `👤 الاسم: ${name || '—'}`,
    `📱 الهاتف: ${phone || '—'}`,
    `📍 المدينة: ${city || '—'}`,
    `📦 المنتج: رشاش زراعي احترافي — 3000 DH`,
    `🕐 التاريخ: ${now}`,
    '',
    `💬 [واتساب](${waLink})`
  ].join('\n');

  const telegramResults = await Promise.allSettled([
    sendTelegram(process.env.TELEGRAM_BOT_TOKEN_1, process.env.TELEGRAM_CHAT_ID_1, message),
    sendTelegram(process.env.TELEGRAM_BOT_TOKEN_2, process.env.TELEGRAM_CHAT_ID_2, message),
  ]);

  if (process.env.SHEETS_WEBHOOK_URL) {
    fetch(process.env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, city, service, eventId, eventSourceUrl })
    }).catch(() => {});
  }

  return res.status(200).json({ status: 'ok', eventId });
}

async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
}
