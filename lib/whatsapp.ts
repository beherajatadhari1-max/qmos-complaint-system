/**
 * QMOS WhatsApp Notifier — Meta WhatsApp Business Cloud API
 *
 * Config in .env.local:
 *   WA_PHONE_NUMBER_ID   — from Meta Developer App → WhatsApp → API Setup
 *   WA_ACCESS_TOKEN      — from Meta Developer App (temporary or permanent token)
 *   WA_RECIPIENT_NUMBERS — comma-separated E.164 numbers e.g. 919876543210,919123456789
 *   WA_TEMPLATE_NAME     — template name (default: qmos_capa_alert)
 *
 * Testing (no template needed):
 *   In sandbox mode Meta provides a test number. Add your number as test recipient
 *   in Meta Developer App → WhatsApp → API Setup → "To" field.
 *
 * Production:
 *   Use pre-approved message templates. Template must be approved in
 *   Meta Business Manager → WhatsApp Manager → Message Templates.
 */

import type { CapaDueItem, DailySummary } from './mailer';

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_BASE        = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ── Internal: send one WhatsApp API request ────────────────────────────────
async function postToGraphApi(phoneNumberId: string, token: string, body: object): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.json() as { messages?: {id: string}[]; error?: {message: string} };

    if (!res.ok || json.error) {
      console.error('[QMOS WhatsApp] API error:', json.error?.message ?? res.status);
      return false;
    }

    console.log('[QMOS WhatsApp] Message sent, ID:', json.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error('[QMOS WhatsApp] Fetch error:', err);
    return false;
  }
}

// ── Send free-form text (works only in sandbox / within 24h customer window) ─
export async function sendWhatsAppText(to: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const token         = process.env.WA_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    console.log('[QMOS WhatsApp] Not configured — skipping text message');
    return false;
  }

  return postToGraphApi(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: message },
  });
}

// ── Send template message (works for production outbound alerts) ─────────────
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  components: object[],
): Promise<boolean> {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const token         = process.env.WA_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    console.log('[QMOS WhatsApp] Not configured — skipping template message');
    return false;
  }

  return postToGraphApi(phoneNumberId, token, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name:     templateName,
      language: { code: 'en' },
      components,
    },
  });
}

// ── CAPA Due-Date WhatsApp Alert ──────────────────────────────────────────────
export async function sendCapaWhatsAppAlert(
  overdue: CapaDueItem[],
  dueSoon: CapaDueItem[],
): Promise<void> {
  if (overdue.length === 0 && dueSoon.length === 0) return;

  const recipients = (process.env.WA_RECIPIENT_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.log('[QMOS WhatsApp] WA_RECIPIENT_NUMBERS not set — skipping CAPA WhatsApp alert');
    return;
  }

  const appUrl      = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const templateName = process.env.WA_TEMPLATE_NAME || 'qmos_capa_alert';
  const dateStr      = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Build top overdue summary (max 3 items to keep message short)
  const topOverdue = overdue.slice(0, 3).map((item, i) =>
    `${i + 1}. *${item.complaint_number}* | ${item.customer_name}\n` +
    `   Action #${item.action_number}: ${String(item.action_description).slice(0, 50)}${item.action_description.length > 50 ? '…' : ''}\n` +
    `   Responsible: ${item.responsible_person || 'Unassigned'}\n` +
    `   Due: ${new Date(item.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} ` +
    `(*${item.days_overdue} day${item.days_overdue === 1 ? '' : 's'} overdue*)`
  ).join('\n\n');

  // Also build a plain text fallback (for sandbox testing without templates)
  const textMessage =
    `⏰ *QMOS CAPA Alert* — ${dateStr}\n\n` +
    `🔴 Overdue: *${overdue.length}* action${overdue.length !== 1 ? 's' : ''}\n` +
    `⚠️ Due in 3 days: *${dueSoon.length}* action${dueSoon.length !== 1 ? 's' : ''}\n\n` +
    (topOverdue ? `*Overdue Actions:*\n${topOverdue}\n\n` : '') +
    (overdue.length > 3 ? `...and ${overdue.length - 3} more overdue action(s)\n\n` : '') +
    `📋 IATF 16949 Cl. 10.2.1(f): CAPA must be completed within target dates.\n\n` +
    `🔗 Open CAPA Tracker: ${appUrl}/capa`;

  // Template parameters matching your approved template body
  const templateComponents = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: dateStr },
        { type: 'text', text: String(overdue.length) },
        { type: 'text', text: String(dueSoon.length) },
        { type: 'text', text: topOverdue || 'None' },
        { type: 'text', text: `${appUrl}/capa` },
      ],
    },
  ];

  for (const recipient of recipients) {
    // Try template first (production); fall back to text (sandbox)
    if (process.env.WA_USE_TEMPLATE === 'true') {
      await sendWhatsAppTemplate(recipient, templateName, templateComponents);
    } else {
      // Sandbox / 24h window — free text
      await sendWhatsAppText(recipient, textMessage);
    }
  }
}

// ── Daily Quality Summary WhatsApp Message ────────────────────────────────────
export async function sendDailyWhatsAppSummary(summary: DailySummary): Promise<void> {
  const recipients = (process.env.WA_RECIPIENT_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);
  if (recipients.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const urgencyEmoji = summary.critical > 0 ? '🚨' : summary.overdue > 0 ? '⚠️' : '✅';

  const message =
    `${urgencyEmoji} *QMOS Daily Quality Report*\n` +
    `${summary.date}\n\n` +
    `📊 *Summary:*\n` +
    `• Open Complaints: *${summary.open}*\n` +
    `• Critical: *${summary.critical}*\n` +
    `• Overdue (>14d): *${summary.overdue}*\n` +
    `• Closed Today: *${summary.closedToday}*\n` +
    `• New Today: *${summary.newToday}*\n` +
    (summary.criticalList.length > 0
      ? `\n🚨 *Critical Complaints:*\n` +
        summary.criticalList.slice(0, 3).map(c =>
          `• ${c.complaint_number} | ${c.customer_name} (${c.days}d)`
        ).join('\n') + '\n'
      : '') +
    `\n🔗 Dashboard: ${appUrl}`;

  for (const recipient of recipients) {
    await sendWhatsAppText(recipient, message);
  }
}
