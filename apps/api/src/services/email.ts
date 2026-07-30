import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(apiKey: string): Resend {
  if (!resend) {
    resend = new Resend(apiKey)
  }
  return resend
}

/** Escape HTML special characters to prevent XSS in email templates. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function sendEmail(
  apiKey: string,
  { to, subject, html }: { to: string; subject: string; html: string }
) {
  return getResend(apiKey).emails.send({
    from: 'AutoWeb <noreply@autoweb.app>',
    to,
    subject,
    html,
  })
}

export function reservationEmailTemplate(data: {
  restaurantName: string
  customerName: string
  phone: string
  email: string
  partySize: number
  time: string
  note: string
}) {
  return `
    <h2>New Reservation at ${escapeHtml(data.restaurantName)}</h2>
    <table>
      <tr><td><strong>Customer:</strong></td><td>${escapeHtml(data.customerName)}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${escapeHtml(data.phone)}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${escapeHtml(data.email)}</td></tr>
      <tr><td><strong>Party Size:</strong></td><td>${data.partySize}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${escapeHtml(data.time)}</td></tr>
      <tr><td><strong>Note:</strong></td><td>${escapeHtml(data.note) || '—'}</td></tr>
    </table>
  `
}

export function outreachEmailTemplate(data: {
  restaurantName: string
  demoUrl: string
}) {
  const mainDomain = 'autoweb.app'
  const url = `https://${data.demoUrl}.${mainDomain}`
  return `
    <h2>Your Restaurant Website is Ready!</h2>
    <p>Hi there,</p>
    <p>
      We've created a beautiful demo website for <strong>${escapeHtml(data.restaurantName)}</strong>.
      You can preview it here:
    </p>
    <p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
        View Your Demo Site
      </a>
    </p>
    <p>
      We'd love to hear your feedback and help you customize it further. Just reply to this email!
    </p>
    <p>
      Best regards,<br/>
      The AutoWeb Team
    </p>
  `
}
