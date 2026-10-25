import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { defaultHighlights, defaultPrivacy, defaultTerms, defaultWhyAttend } from "../src/lib/defaults";

const prisma = new PrismaClient();

const sampleNote = "Sample profile for demonstration. This person has not been invited and has not confirmed participation. ";

const speakers = [
  {
    slug: "amara-mensah",
    name: "Amara Mensah",
    jobTitle: "Product strategist",
    organization: "Northwind Studio (sample)",
    portraitUrl: "/speakers/amara.svg",
    expertise: ["Artificial intelligence", "Product strategy"],
    featured: true,
    order: 1,
    bio: `${sampleNote}The placeholder biography describes a strategist who helps teams decide where new technology is useful and where it should stay out of the way.`,
  },
  {
    slug: "leo-okonkwo",
    name: "Leo Okonkwo",
    jobTitle: "Design director",
    organization: "Harbor Atelier (sample)",
    portraitUrl: "/speakers/leo.svg",
    expertise: ["Digital creativity", "Design"],
    featured: true,
    order: 2,
    bio: `${sampleNote}The placeholder biography describes a designer interested in how visual systems, storytelling, and software can support one another.`,
  },
  {
    slug: "priya-raman",
    name: "Priya Raman",
    jobTitle: "Founder",
    organization: "Example Labs (sample)",
    portraitUrl: "/speakers/priya.svg",
    expertise: ["Entrepreneurship", "Leadership"],
    featured: true,
    order: 3,
    bio: `${sampleNote}The placeholder biography describes a founder using this profile only to demonstrate a speaker card. Example Labs is not a real partner of this event.`,
  },
  {
    slug: "jonah-ellis",
    name: "Jonah Ellis",
    jobTitle: "Engineering lead",
    organization: "Sample Systems (sample)",
    portraitUrl: "/speakers/jonah.svg",
    expertise: ["Software engineering", "Artificial intelligence"],
    featured: true,
    order: 4,
    bio: `${sampleNote}The placeholder biography describes an engineer who would, in a real programme, show a practical workflow rather than a product pitch.`,
  },
  {
    slug: "sofia-alvarez",
    name: "Sofia Alvarez",
    jobTitle: "Skills advisor",
    organization: "FuturePath (sample)",
    portraitUrl: "/speakers/sofia.svg",
    expertise: ["Future careers", "Digital skills"],
    featured: false,
    order: 5,
    bio: `${sampleNote}The placeholder biography describes an advisor talking with students and early-career attendees about digital skills. FuturePath is a fictional name.`,
  },
  {
    slug: "malik-adeyemi",
    name: "Malik Adeyemi",
    jobTitle: "Research investor",
    organization: "Placeholder Capital (sample)",
    portraitUrl: "/speakers/malik.svg",
    expertise: ["Entrepreneurship", "Leadership"],
    featured: false,
    order: 6,
    bio: `${sampleNote}The placeholder biography describes an investor perspective. Placeholder Capital is not a real fund and has no relationship with AJ CREATIVES.`,
  },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "organizer@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Set ADMIN_PASSWORD before seeding.");

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: { email, passwordHash: await hashPassword(password), role: "ADMIN" },
    });
  }

  const existing = await prisma.event.findUnique({ where: { slug: "the-future-summit-2027" } });
  if (existing) {
    console.log("Event already exists. Seed left published content unchanged.");
    return;
  }

  const event = await prisma.event.create({
    data: {
      name: "THE FUTURE SUMMIT 2027",
      slug: "the-future-summit-2027",
      tagline: "Ideas That Shape Tomorrow.",
      description: "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.",
      startAt: new Date("2027-10-15T08:30:00.000Z"),
      endAt: new Date("2027-10-16T15:15:00.000Z"),
      datesConfirmed: false,
      timezone: "UTC",
      timezoneConfirmed: false,
      format: null,
      formatConfirmed: false,
      heroImageUrl: "/images/hero.jpg",
      status: "PUBLISHED",
      venue: { create: { confirmed: false } },
      settings: {
        create: {
          organizerName: "AJ CREATIVES",
          contactEmail: "",
          contactPhone: "",
          socialLinks: "[]",
          currency: "USD",
          currencyConfirmed: false,
          registrationOpen: true,
          phoneRequired: false,
          privacyNotice: defaultPrivacy,
          termsText: defaultTerms,
          whyAttend: JSON.stringify(defaultWhyAttend),
          highlights: JSON.stringify(defaultHighlights),
          heroEyebrow: "AJ CREATIVES PRESENTS",
          heroDescription: "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.",
          ctaHeadline: "BE PART OF WHAT COMES NEXT.",
          ctaDescription: "Join the conversations, connections, and ideas shaping tomorrow.",
        },
      },
      speakers: {
        create: speakers.map((speaker) => ({
          name: speaker.name,
          slug: speaker.slug,
          biography: speaker.bio,
          jobTitle: speaker.jobTitle,
          organization: speaker.organization,
          portraitUrl: speaker.portraitUrl,
          portraitIsSample: true,
          expertise: JSON.stringify(speaker.expertise),
          socialLinks: speaker.slug === "priya-raman" ? JSON.stringify([{ label: "Sample link", url: "https://example.com" }]) : "[]",
          isSample: true,
          published: true,
          featured: speaker.featured,
          displayOrder: speaker.order,
        })),
      },
    },
    include: { speakers: true },
  });

  const bySlug = Object.fromEntries(event.speakers.map((speaker) => [speaker.slug, speaker.id]));
  const sessions = [
    ["Arrival and welcome", "Collect a badge and find the opening room. This arrival block is sample copy.", "2027-10-15T08:30:00.000Z", "2027-10-15T09:30:00.000Z", "Lobby (sample room)", "Arrival", false, []],
    ["Opening keynote", "A sample keynote about the ideas the summit wants to make room for.", "2027-10-15T09:30:00.000Z", "2027-10-15T10:30:00.000Z", "Hall A (sample room)", "Keynote", false, [["amara-mensah", "SPEAKER"]]],
    ["Coffee break", "A scheduled pause.", "2027-10-15T10:30:00.000Z", "2027-10-15T11:00:00.000Z", "Foyer (sample room)", "Break", true, []],
    ["Expert panel: building with emerging technology", "A sample panel. The moderator and speakers are placeholders.", "2027-10-15T11:00:00.000Z", "2027-10-15T12:00:00.000Z", "Hall A (sample room)", "Panel", false, [["priya-raman", "MODERATOR"], ["jonah-ellis", "SPEAKER"], ["malik-adeyemi", "SPEAKER"]]],
    ["Lunch", "A scheduled meal break.", "2027-10-15T12:00:00.000Z", "2027-10-15T13:15:00.000Z", "Foyer (sample room)", "Break", true, []],
    ["Technical workshop: practical AI workflows", "A hands-on sample workshop. No specific tool or sponsor is implied.", "2027-10-15T13:15:00.000Z", "2027-10-15T15:15:00.000Z", "Studio 1 (sample room)", "Workshop", false, [["jonah-ellis", "SPEAKER"]]],
    ["Networking session", "Structured time to meet other attendees.", "2027-10-15T15:30:00.000Z", "2027-10-15T16:30:00.000Z", "Hall B (sample room)", "Networking", false, [["sofia-alvarez", "SPEAKER"]]],
    ["Design and creativity keynote", "A sample keynote on digital creativity.", "2027-10-16T09:00:00.000Z", "2027-10-16T10:00:00.000Z", "Hall A (sample room)", "Keynote", false, [["leo-okonkwo", "SPEAKER"]]],
    ["Future careers conversation", "A sample conversation about digital skills and early careers.", "2027-10-16T10:15:00.000Z", "2027-10-16T11:15:00.000Z", "Studio 2 (sample room)", "Panel", false, [["sofia-alvarez", "SPEAKER"]]],
    ["Coffee break", "A scheduled pause.", "2027-10-16T11:15:00.000Z", "2027-10-16T11:45:00.000Z", "Foyer (sample room)", "Break", true, []],
    ["Leadership panel", "A sample conversation on leadership and professional networks.", "2027-10-16T11:45:00.000Z", "2027-10-16T12:45:00.000Z", "Hall A (sample room)", "Panel", false, [["malik-adeyemi", "MODERATOR"], ["amara-mensah", "SPEAKER"]]],
    ["Lunch", "A scheduled meal break.", "2027-10-16T12:45:00.000Z", "2027-10-16T13:45:00.000Z", "Foyer (sample room)", "Break", true, []],
    ["Closing keynote", "A sample closing keynote.", "2027-10-16T13:45:00.000Z", "2027-10-16T14:45:00.000Z", "Hall A (sample room)", "Closing", false, [["priya-raman", "SPEAKER"]]],
    ["Closing remarks", "A short sample close to the programme.", "2027-10-16T14:45:00.000Z", "2027-10-16T15:15:00.000Z", "Hall A (sample room)", "Closing", false, [["amara-mensah", "SPEAKER"]]],
  ] as const;

  for (const [index, session] of sessions.entries()) {
    const [title, description, startAt, endAt, room, category, isBreak, people] = session;
    await prisma.session.create({
      data: {
        eventId: event.id,
        title,
        description,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        room,
        category,
        isBreak,
        published: true,
        isSample: true,
        displayOrder: index,
        ...(people.length
          ? {
              speakers: {
                create: people.map(([slug, role]) => {
                  const speakerId = bySlug[slug];
                  if (!speakerId) throw new Error(`Missing sample speaker ${slug}`);
                  return { speakerId, role };
                }),
              },
            }
          : {}),
      },
    });
  }

  await prisma.ticketType.createMany({
    data: [
      {
        eventId: event.id,
        name: "General Admission",
        slug: "general-admission",
        description: "Standard access to the published sessions.",
        priceCents: 15000,
        currency: "USD",
        benefits: JSON.stringify(["Entry to scheduled sessions", "Access to general networking blocks", "A demonstration ticket, not an official price"]),
        capacity: 200,
        displayOrder: 1,
        isSample: true,
      },
      {
        eventId: event.id,
        name: "VIP Pass",
        slug: "vip-pass",
        description: "A sample VIP option. Benefits apply only if the organizer confirms them.",
        priceCents: 35000,
        currency: "USD",
        benefits: JSON.stringify(["Everything in General Admission", "Reserved keynote seating if the organizer confirms it", "Access to a VIP conversation if it is added to the agenda"]),
        capacity: 40,
        displayOrder: 2,
        isSample: true,
      },
      {
        eventId: event.id,
        name: "Student Pass",
        slug: "student-pass",
        description: "A free demonstration pass for eligible students.",
        priceCents: 0,
        currency: "USD",
        benefits: JSON.stringify(["Entry to scheduled sessions", "No charge in this demonstration", "The organizer may later ask for proof of study"]),
        capacity: 80,
        displayOrder: 3,
        isSample: true,
        eligibilityNote: "This sample pass is for students and recent graduates. The organizer is not automatically verifying enrollment.",
      },
    ],
  });

  await prisma.sponsor.createMany({
    data: [
      { eventId: event.id, name: "Sample Northwind", logoUrl: "/sponsors/northwind.svg", tier: "Platinum", displayOrder: 1, isSample: true, website: "" },
      { eventId: event.id, name: "Sample Harbor", logoUrl: "/sponsors/harbor.svg", tier: "Gold", displayOrder: 2, isSample: true, website: "" },
      { eventId: event.id, name: "Sample Example Labs", logoUrl: "/sponsors/example-labs.svg", tier: "Gold", displayOrder: 3, isSample: true, website: "" },
      { eventId: event.id, name: "Sample Systems", logoUrl: "/sponsors/sample-systems.svg", tier: "Community", displayOrder: 4, isSample: true, website: "" },
    ],
  });

  console.log("Seeded The Future Summit demonstration content.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
