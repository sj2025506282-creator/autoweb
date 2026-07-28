import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return getResend().emails.send({
    from: "AutoWeb <noreply@autoweb.app>",
    to,
    subject,
    html,
  });
}

export function reservationEmailTemplate(data: {
  restaurantName: string;
  customerName: string;
  phone: string;
  email: string;
  partySize: number;
  time: string;
  note: string;
}) {
  return `
    <h2>New Reservation at ${data.restaurantName}</h2>
    <table>
      <tr><td><strong>Customer:</strong></td><td>${data.customerName}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${data.phone}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${data.email}</td></tr>
      <tr><td><strong>Party Size:</strong></td><td>${data.partySize}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${data.time}</td></tr>
      <tr><td><strong>Note:</strong></td><td>${data.note || "—"}</td></tr>
    </table>
  `;
}
