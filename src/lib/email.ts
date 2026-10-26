type Mail = { to: string; subject: string; text: string };

async function send(input: Mail) {
  const key = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return "SKIPPED" as const;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text }),
    });
    return response.ok ? ("SENT" as const) : ("FAILED" as const);
  } catch {
    return "FAILED" as const;
  }
}

export async function syncNewsletterContact(email: string, unsubscribed: boolean) {
  const key = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) return "SKIPPED" as const;
  try {
    const response = await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed }),
    });
    return response.ok ? ("SENT" as const) : ("FAILED" as const);
  } catch {
    return "FAILED" as const;
  }
}

export async function sendRegistrationEmail(input: { reference: string; email: string; attendeeName: string; eventName: string; status: string }) {
  const confirmed = input.status === "CONFIRMED";
  const text = confirmed
    ? `Hello ${input.attendeeName},\n\nYour registration ${input.reference} for ${input.eventName} is confirmed.\n\nKeep this reference. It is the key to your confirmation page.\n`
    : `Hello ${input.attendeeName},\n\nWe saved registration ${input.reference} for ${input.eventName}. It is not confirmed until payment is verified.\n`;
  return send({ to: input.email, subject: `${confirmed ? "Registration confirmed" : "Registration received"} ${input.reference}`, text });
}

export async function sendInquiryEmail(input: { name: string; email: string; category: string; subject: string; message: string }) {
  const to = process.env.EMAIL_FROM;
  if (!to) return "SKIPPED" as const;
  return send({
    to,
    subject: `WHY US inquiry: ${input.subject}`,
    text: `${input.name} <${input.email}>\nCategory: ${input.category}\n\n${input.message}\n`,
  });
}

export async function sendPasswordResetEmail(input: { email: string; url: string }) {
  return send({
    to: input.email,
    subject: "Reset your WHY US admin password",
    text: `Use this link within one hour to choose a new password:\n\n${input.url}\n\nIf you did not request this, you can ignore the email.\n`,
  });
}
