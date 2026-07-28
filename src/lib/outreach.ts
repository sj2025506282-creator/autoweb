import { sendEmail } from "@/lib/email";

export interface OutreachRestaurantData {
  name: string;
  phone: string;
  email: string;
  address: string;
  lat: number;
  lng: number;
  menuItems: Array<{ name: string; price?: number }>;
  imageUrls: string[];
  description?: string;
}

/**
 * Generate a demo restaurant site by calling the outreach API.
 */
export async function generateDemoSite(data: OutreachRestaurantData) {
  const res = await fetch("/api/outreach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Failed to generate demo site");
  }
  return (await res.json()) as { id: string; slug: string };
}

/**
 * Fetch all demo restaurants awaiting review.
 */
export async function getDemos() {
  const res = await fetch("/api/outreach");
  if (!res.ok) {
    throw new Error("Failed to fetch demos");
  }
  return (await res.json()) as Array<{
    id: string;
    name: string;
    slug: string;
    phone: string;
    email: string;
    address: string;
    status: string;
    cover_image: string;
    description: string;
    created_at: string;
  }>;
}

/**
 * Approve a demo site: change status to "active" and notify via email.
 */
export async function approveDemoSite(id: string) {
  const res = await fetch(`/api/outreach/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "active" }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Failed to approve demo site");
  }
  return (await res.json()) as { success: boolean };
}

/**
 * Reject a demo site: change status to "draft" (returns to regular restaurant listing).
 */
export async function rejectDemoSite(id: string) {
  const res = await fetch(`/api/outreach/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "draft" }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || "Failed to reject demo site");
  }
  return (await res.json()) as { success: boolean };
}

/**
 * Send outreach email with demo site link to restaurant owner.
 */
export function outreachEmailTemplate(data: {
  restaurantName: string;
  demoUrl: string;
}) {
  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "autoweb.app";
  const url = `https://${data.demoUrl}.${mainDomain}`;
  return `
    <h2>Your Restaurant Website is Ready!</h2>
    <p>Hi there,</p>
    <p>
      We've created a beautiful demo website for <strong>${data.restaurantName}</strong>.
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
  `;
}

/**
 * Send the outreach email using Resend.
 */
export async function sendOutreachEmail(demoUrl: string, restaurantName: string, toEmail: string) {
  if (!toEmail) return { success: false, error: "No email address" };
  return sendEmail({
    to: toEmail,
    subject: `Your restaurant website demo is ready — ${restaurantName}`,
    html: outreachEmailTemplate({ restaurantName, demoUrl }),
  });
}
