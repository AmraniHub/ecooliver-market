// ─────────────────────────────────────────────────────────────
// Ecoolivier — Google Apps Script Webhook
// Google Sheets + Telegram Bot Notification
// ─────────────────────────────────────────────────────────────
// SETUP:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Delete everything and paste this entire file
// 4. Fill in TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID below
// 5. Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Copy the Web App URL → add as env var in Vercel
// ─────────────────────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';   // @BotFather
const TELEGRAM_CHAT_ID   = 'YOUR_CHAT_ID_HERE';     // @userinfobot

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Set headers on first run
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['الاسم', 'الهاتف', 'المدينة', 'المنتج', 'التاريخ', 'المصدر', 'Event ID']);
      sheet.getRange(1, 1, 1, 7)
           .setFontWeight('bold')
           .setBackground('#1a5c2a')
           .setFontColor('#ffffff');
    }

    const data = JSON.parse(e.postData.contents);

    const now = new Date().toLocaleString('fr-MA', {
      timeZone: 'Africa/Casablanca',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    sheet.appendRow([
      data.name    || '',
      data.phone   || '',
      data.city    || '',
      data.service || data.product || '',
      now,
      data.eventSourceUrl || 'ecooliver.vercel.app',
      data.eventId || ''
    ]);

    // Send Telegram notification
    sendTelegram(data, now);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendTelegram(data, time) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') return;

  const msg = [
    '🌿 *طلب جديد — Ecoolivier*',
    '',
    '👤 الاسم: ' + (data.name  || '—'),
    '📱 الهاتف: ' + (data.phone || '—'),
    '📍 المدينة: ' + (data.city || '—'),
    '📦 المنتج: رشاش زراعي احترافي — 3000 DH',
    '🕐 التاريخ: ' + time,
    '',
    '💬 [واتساب](https://wa.me/' + (data.phone || '').replace(/^0/, '212') + ')'
  ].join('\n');

  const url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
}

// Test function — run manually to verify sheet + Telegram
function testSubmit() {
  const mock = {
    postData: {
      contents: JSON.stringify({
        name: 'محمد اختبار',
        phone: '0612345678',
        city: 'مراكش',
        service: 'رشاش زراعي احترافي — 3000 DH',
        eventId: 'test-123',
        eventSourceUrl: 'localhost'
      })
    }
  };
  const result = doPost(mock);
  Logger.log(result.getContent());
}
