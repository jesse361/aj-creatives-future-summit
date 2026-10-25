type RegistrationMail = {
  reference: string;
  email: string;
  attendeeName: string;
  quantity: number;
  status: string;
  eventName: string;
};

async function send(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return "SKIPPED" as const;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    return response.ok ? ("SENT" as const) : ("FAILED" as const);
  } catch {
    return "FAILED" as const;
  }
}

export async function sendRegistrationEmail(input: RegistrationMail) {
  const confirmed = input.status === "CONFIRMED";
  const text = confirmed
    ? `Hello ${input.attendeeName},\n\nYour registration ${input.reference} for ${input.eventName} is confirmed. Quantity: ${input.quantity}.\n`
    : `Hello ${input.attendeeName},\n\nYour registration request ${input.reference} for ${input.eventName} has been saved. Quantity: ${input.quantity}. This is not a confirmed ticket until payment is verified.\n`;
  return send(input.email, `${confirmed ? "Registration confirmed" : "Registration request"} ${input.reference}`, text);
}

export async function sendPaymentEmail(input: RegistrationMail) {
  return send(
    input.email,
    `Payment verified ${input.reference}`,
    `Hello ${input.attendeeName},\n\nPayment for registration ${input.reference} has been verified. Your ticket is now confirmed.\n`,
  );
}

export async function sendInquiryEmail(input: { name: string; email: string; category: string; message: string }) {
  const to = process.env.EMAIL_FROM;
  if (!to) return "SKIPPED" as const;
  return send(
    to,
    `Summit inquiry: ${input.category}`,
    `${input.name} <${input.email}>\nCategory: ${input.category}\n\n${input.message}\n`,
  );
}
