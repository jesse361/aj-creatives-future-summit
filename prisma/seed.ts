import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/db";
import { BENEFITS } from "../src/lib/constants";

const blocked = new Set(["change-this-password", "summit-admin-demo", "password", "admin", "whyus", "whyus-admin"]);

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "site" },
    update: {},
    create: {
      id: "site",
      brandName: "WHY US",
      legalName: "WHY US — Events & Conference Hub",
      tagline: "Where Ideas Meet. Where Connections Begin.",
      secondaryTagline: "Bringing People, Ideas, and Opportunities Together.",
      defaultCurrency: "GHS",
      footerContent: "WHY US brings people, ideas, and opportunities together through conferences, summits, workshops, and private gatherings.",
      seoTitle: "WHY US — Events & Conference Hub",
      seoDescription: "Discover exceptional conferences, connect with inspiring people, and experience events designed to turn ideas into opportunities.",
      registrationHoldMinutes: 30,
    },
  });

  const pages = [
    ["home-about", "A room for serious ideas", "WHY US exists to help people find the conferences, workshops, and conversations that are worth leaving the office for. The public site is managed from the admin dashboard: events, speakers, tickets, and pages can change without a code edit.\n\nThis introduction is editable. It is not a claim about a specific past event."],
    ["about", "Bringing people, ideas, and opportunities together", "WHY US is an events and conference platform for attendees, speakers, sponsors, partners, and organizers.\n\nThe mission is straightforward: make it easier to discover a gathering, understand who will be there, and register with a price that comes from the organizer's own catalogue.\n\nThe audience is people who take professional community seriously — founders, operators, students, and teams looking for practical knowledge and a room that is worth their time.\n\nThe vision is a calendar of conferences, summits, seminars, and private experiences that the organizer can publish, revise, and retire without rebuilding the website.\n\nContact details, partners, and confirmed programmes stay empty until someone with access to the dashboard adds them."],
    ["benefits", "Why choose WHY US?", JSON.stringify(BENEFITS)],
    ["privacy", "Privacy notice", "This notice is a template for the organizer to edit and, where needed, have reviewed.\n\nWHY US collects the details you submit on a registration, contact, or newsletter form: name, email, optional phone and organization, the event and ticket you chose, and the message you send. Payment card numbers are handled by the payment provider and are not stored on this site.\n\nRegistration records are visible to signed-in administrators and to the person who has the registration reference. The public site does not list attendees.\n\nNewsletter subscription requires consent. You can unsubscribe from the link in the site, which records the withdrawal of consent.\n\nInquiries are kept so the organizer can reply. They can be marked reviewed or closed in the dashboard.\n\nThe site uses a signed-in session cookie for administrators. It is httpOnly and is not used to advertise to visitors.\n\nAsk the organizer if you want a copy of your record or want it corrected. Do not send passwords or card details by email."],
    ["terms", "Terms of use", "These terms are a starting template. They are not legal advice.\n\nThe public pages describe events that an administrator has published. Demonstration content is labeled and is not a confirmed offer. Ticket prices, capacities, and sale windows are the values stored for that ticket at the time you register. A later price change does not rewrite a saved registration.\n\nA free registration is confirmed when it is saved and inventory is available. A paid registration is confirmed only after the payment provider verifies the charge. Opening the return page is not itself proof of payment.\n\nPending paid registrations hold inventory for a limited time, then the hold is released. Cancelled, failed, and expired registrations are not tickets.\n\nYou agree not to misuse the forms, attempt to access another person's registration, or interfere with the site.\n\nThe organizer can cancel or archive an event. A cancelled event does not accept new registrations."],
  ] as const;
  for (const [key, title, body] of pages) {
    await prisma.pageContent.upsert({ where: { key }, update: {}, create: { key, title, body } });
  }

  const faqs = [
    ["How do I register?", "Choose an event, pick a published ticket, and submit the attendee details. Free tickets are confirmed immediately when places remain. Paid tickets are confirmed only after payment is verified.", "Tickets", 1],
    ["Are the sample events real?", "Entries marked Demonstration are sample content so the platform can be previewed. They are not confirmed WHY US events, speakers, or prices.", "Events", 2],
    ["Where are attendees listed?", "They are not listed publicly. Administrators can see registrations after signing in.", "Privacy", 3],
    ["How do I unsubscribe?", "Use the unsubscribe link from the newsletter page, or the link sent with a message when email delivery is configured.", "Newsletter", 4],
  ] as const;
  for (const [question, answer, category, displayOrder] of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question } });
    if (!existing) await prisma.faq.create({ data: { question, answer, category, displayOrder, published: true } });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const existingAdmin = await prisma.adminUser.count();
  if (existingAdmin === 0 && email && password.length >= 12 && !blocked.has(password)) {
    await prisma.adminUser.create({
      data: { name: process.env.ADMIN_NAME?.trim() || "Owner", email, passwordHash: await hashPassword(password), role: "OWNER", status: "ACTIVE" },
    });
    console.log(`Created owner ${email}`);
  } else if (existingAdmin === 0) {
    console.log("No administrator was created. Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters, then run npm run db:seed again.");
  }

  const demoCount = await prisma.event.count({ where: { isDemonstration: true } });
  if (demoCount > 0) return;

  const amara = await prisma.speaker.create({
    data: {
      name: "Demonstration Speaker Amara Cole",
      slug: "demonstration-amara-cole",
      professionalTitle: "Sample programme host",
      organization: "Demonstration studio",
      biography: "This is a fictional speaker profile used to preview the directory. It is not a confirmed appearance.",
      expertise: ["Leadership", "Community"],
      status: "PUBLISHED",
      isDemonstration: true,
      featured: true,
      socialLinks: [],
    },
  });
  const jonah = await prisma.speaker.create({
    data: {
      name: "Demonstration Speaker Jonah Mensah",
      slug: "demonstration-jonah-mensah",
      professionalTitle: "Sample workshop lead",
      organization: "Demonstration lab",
      biography: "This profile exists so the schedule can show more than one speaker. Replace or unpublish it before announcing a real programme.",
      expertise: ["Workshops", "Technology"],
      status: "PUBLISHED",
      isDemonstration: true,
      featured: true,
      socialLinks: [],
    },
  });

  const summit = await prisma.event.create({
    data: {
      title: "Demonstration Ideas Assembly",
      slug: "demonstration-ideas-assembly",
      shortDescription: "A labeled sample conference used to preview listings, tickets, and the agenda.",
      fullDescription: "This event is demonstration content. The date, venue, speakers, and prices are placeholders for the owner to replace. It is not a confirmed WHY US gathering and should be unpublished before the site is presented as a live calendar.",
      category: "Business conference",
      coverImage: "/images/hero.jpg",
      coverAlt: "Illustrative conference photograph used for demonstration content. Not a WHY US event.",
      startDate: new Date("2027-03-18T09:00:00.000Z"),
      endDate: new Date("2027-03-19T17:00:00.000Z"),
      timezone: "Africa/Accra",
      venueName: "Venue to be confirmed",
      city: "City to be confirmed",
      country: "",
      eventFormat: "HYBRID",
      onlineDetails: "Joining instructions will be added when a real event replaces this demonstration.",
      travelInfo: "Travel notes have not been confirmed.",
      accessibilityInfo: "Accessibility information has not been confirmed.",
      status: "PUBLISHED",
      isDemonstration: true,
      registrationOpen: true,
      publishedAt: new Date(),
      faqs: [{ question: "Is this a real event?", answer: "No. It is demonstration content." }],
      speakers: { create: [{ speakerId: amara.id }, { speakerId: jonah.id }] },
      ticketTypes: {
        create: [
          { name: "General Admission", description: "Demonstration general admission.", priceMinor: 25000, currency: "GHS", capacity: 80, benefits: ["Sample seat", "Sample programme"], minimumQuantity: 1, maximumQuantity: 4, status: "ACTIVE", isDemonstration: true },
          { name: "Student", description: "Demonstration student price.", priceMinor: 10000, currency: "GHS", capacity: 20, benefits: ["Sample seat"], minimumQuantity: 1, maximumQuantity: 1, status: "ACTIVE", isDemonstration: true },
          { name: "Complimentary Registration", description: "A free demonstration ticket so registration can be tested without a payment provider.", priceMinor: 0, currency: "GHS", capacity: 10, benefits: ["Sample confirmation"], minimumQuantity: 1, maximumQuantity: 2, status: "ACTIVE", isDemonstration: true },
        ],
      },
      sessions: {
        create: [
          { title: "Arrival", description: "Demonstration arrival block.", startTime: new Date("2027-03-18T09:00:00.000Z"), endTime: new Date("2027-03-18T09:30:00.000Z"), room: "Foyer", category: "Arrival", displayOrder: 1, status: "PUBLISHED" },
          { title: "Opening conversation", description: "A sample keynote slot.", startTime: new Date("2027-03-18T09:30:00.000Z"), endTime: new Date("2027-03-18T10:30:00.000Z"), room: "Main hall", category: "Keynote", displayOrder: 2, status: "PUBLISHED", speakers: { create: [{ speakerId: amara.id }] } },
          { title: "Break", description: "Sample break.", startTime: new Date("2027-03-18T10:30:00.000Z"), endTime: new Date("2027-03-18T11:00:00.000Z"), room: "Foyer", category: "Break", displayOrder: 3, status: "PUBLISHED" },
          { title: "Working session", description: "A sample workshop.", startTime: new Date("2027-03-18T11:00:00.000Z"), endTime: new Date("2027-03-18T12:30:00.000Z"), room: "Studio", category: "Workshop", displayOrder: 4, status: "PUBLISHED", speakers: { create: [{ speakerId: jonah.id }, { speakerId: amara.id, role: "HOST" }] } },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Demonstration Online Workshop",
      slug: "demonstration-online-workshop",
      shortDescription: "A labeled sample online session for the directory filters.",
      fullDescription: "This online event is demonstration content. It has no confirmed venue because it is not a real gathering.",
      category: "Professional workshop",
      coverImage: "/images/workshop.jpg",
      coverAlt: "Illustrative workshop photograph used for demonstration content.",
      startDate: new Date("2027-06-10T13:00:00.000Z"),
      endDate: new Date("2027-06-10T16:00:00.000Z"),
      timezone: "Africa/Accra",
      eventFormat: "ONLINE",
      onlineDetails: "A joining link would be published here for a real event.",
      status: "PUBLISHED",
      isDemonstration: true,
      registrationOpen: true,
      publishedAt: new Date(),
      speakers: { create: [{ speakerId: jonah.id }] },
      ticketTypes: { create: [{ name: "Workshop Pass", description: "Demonstration workshop pass.", priceMinor: 15000, currency: "GHS", capacity: 40, benefits: ["Sample online seat"], status: "ACTIVE", isDemonstration: true }] },
      sessions: { create: [{ title: "Live working hour", description: "Sample online session.", startTime: new Date("2027-06-10T13:00:00.000Z"), endTime: new Date("2027-06-10T14:30:00.000Z"), room: "Online", category: "Workshop", status: "PUBLISHED", speakers: { create: [{ speakerId: jonah.id }] } }] },
    },
  });

  console.log(`Seeded demonstration events, including ${summit.slug}. They are labeled and are not confirmed programmes.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
