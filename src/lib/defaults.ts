import type { Highlight, WhyItem } from "@/lib/types";

export const defaultWhyAttend: WhyItem[] = [
  {
    title: "Learn from the programme",
    description: "Follow the sessions that the organizer publishes, including keynotes, panels, and workshops.",
  },
  {
    title: "Explore emerging themes",
    description: "Spend time with ideas across technology, entrepreneurship, design, and future careers.",
  },
  {
    title: "Meet other attendees",
    description: "Use the networking blocks on the agenda to start professional conversations.",
  },
  {
    title: "Join practical sessions",
    description: "Take part in workshops and working sessions when they are listed on the schedule.",
  },
  {
    title: "Look ahead",
    description: "Hear how people are approaching digital skills, leadership, and new opportunities.",
  },
];

export const defaultHighlights: Highlight[] = [
  {
    title: "AI and technology",
    description: "Sessions on emerging technology and how teams put new tools to work.",
    image: "/images/workspace.jpg",
  },
  {
    title: "Entrepreneurship",
    description: "Conversations for founders, operators, and people building new ventures.",
    image: "/images/networking.jpg",
  },
  {
    title: "Digital creativity",
    description: "Design, storytelling, and creative practice in a technology setting.",
    image: "/images/workshop.jpg",
  },
  {
    title: "Networking",
    description: "Scheduled time to meet developers, designers, students, and business leaders.",
    image: "/images/keynote.jpg",
  },
];

export const defaultPrivacy = `AJ CREATIVES uses this website to share information about The Future Summit 2027 and to collect registration requests and inquiries.

Information requested for registration is limited to your name, email address, optional phone number, optional organization and role, ticket choice, quantity, and optional dietary or accessibility notes. The contact form collects your name, email address, inquiry category, and message.

Records are stored so the organizer can manage capacity, respond to questions, and administer the event. They are not displayed publicly. Payment status is recorded only after a configured payment provider verifies a payment, or as not required when a ticket is free.

Keep these records only for event planning, delivery, and a short administrative period afterward. Use the contact form to ask for a correction or deletion. If the organizer publishes an email address, you can use that as well.

This notice is demonstration copy until the organizer replaces it. Sample dates, venues, speakers, prices, and sponsors elsewhere on the site are not confirmed facts.`;

export const defaultTerms = `These are sample registration terms for demonstration. They are not the organizer's official terms until they are replaced in the admin dashboard.

Choosing a free ticket and receiving a confirmation page that says your registration is confirmed means a place has been reserved. Choosing a priced ticket creates a registration request. That request is not a confirmed ticket until payment is verified by the configured payment provider, or until the organizer confirms another payment arrangement.

Sample prices are not official prices. The date, venue, format, speakers, rooms, and sponsor names shown as samples are placeholders. The organizer may replace them before the event is confirmed.

Do not submit another person's personal information unless you are authorized to register them. Submit one registration per email address. The organizer may cancel a registration that exceeds capacity, fails validation, or was created in error, and will release the reserved places when a registration is cancelled.`;
