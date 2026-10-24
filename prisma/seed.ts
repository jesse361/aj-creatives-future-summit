import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const whyAttend = [
  {
    title: "Learn from experienced speakers",
    text: "The public lineup is the place to see who is actually on the program. Profiles marked as samples are demonstrations, not confirmed speakers.",
  },
  {
    title: "Explore emerging technologies",
    text: "The summit themes cover artificial intelligence, digital innovation, and the tools teams are using to build what comes next.",
  },
  {
    title: "Build meaningful professional connections",
    text: "Networking time is included when it appears on the published agenda. Those sessions are the meetings you can plan around.",
  },
  {
    title: "Participate in practical sessions and workshops",
    text: "Workshops and working sessions are listed with their times and rooms once the organizer publishes them.",
  },
  {
    title: "Discover new opportunities for growth",
    text: "Use the program to explore skills, careers, and ideas. Specific opportunities are only those written into the schedule.",
  },
];

const highlights = [
  {
    title: "AI and Technology",
    text: "Sessions on artificial intelligence and emerging tools, as they appear in the agenda.",
    image: "/images/stage.jpg",
  },
  {
    title: "Entrepreneurship",
    text: "Conversations for founders and operators. Sample sessions are labeled until the program is confirmed.",
    image: "/images/collab.jpg",
  },
  {
    title: "Digital Creativity",
    text: "Design, storytelling, and creative practice for people shaping digital work.",
    image: "/images/workshop.jpg",
  },
  {
    title: "Networking",
    text: "Time set aside to meet other attendees when a networking session is on the schedule.",
    image: "/images/networking.jpg",
  },
];

const privacyNotice = `AJ Creatives collects the details you submit so the organizer can manage registrations and answer inquiries.

Registration stores your name, email, phone when required, optional organization and role, ticket choice, quantity, and any dietary or accessibility note you choose to share. Contact messages store your name, email, category, and message.

Records are kept for event administration and are not shown on the public website. Administrator access is required to view attendee lists. You can ask the organizer to correct or delete your record using the contact form once a public email is published.

This notice is a practical summary for the demonstration site. Replace it with the organizer's final privacy notice before collecting real attendee data.`;

const termsText = `Submitting this form creates a registration record. A free ticket can be confirmed when it is saved. A paid ticket stays a request until payment is verified by the configured payment provider or the organizer updates the record through a verified process.

Sample prices, dates, venues, speakers, and sponsors on this website are not confirmed offers. Capacity is limited to the number configured for each ticket.

Keep your registration reference. It is the record of what was saved. These terms are demonstration copy and should be replaced before ticket sales open.`;

async function main() {
  const event = await prisma.event.upsert({
    where: { slug: "future-summit-2027" },
    update: {},
    create: {
      slug: "future-summit-2027",
      name: "THE FUTURE SUMMIT 2027",
      tagline: "Ideas That Shape Tomorrow.",
      description:
        "AJ Creatives presents The Future Summit 2027, a technology conference, innovation summit, creative workshop, and professional networking event. Dates, venue, speakers, prices, and sponsors on this site are placeholders until the organizer confirms them.",
      startAt: new Date("2027-06-15T09:00:00.000Z"),
      endAt: new Date("2027-06-16T12:30:00.000Z"),
      timezone: "UTC",
      datesConfirmed: false,
      format: "TBD",
      heroImage: "/images/hero.jpg",
      status: "PUBLISHED",
      whyAttend: JSON.stringify(whyAttend),
      highlights: JSON.stringify(highlights),
      ctaHeadline: "BE PART OF WHAT COMES NEXT.",
      ctaText: "Join the conversations, connections, and ideas shaping tomorrow.",
    },
  });

  await prisma.eventSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      organizerName: "AJ Creatives",
      contactEmail: null,
      contactPhone: null,
      socialLinks: "{}",
      currency: "USD",
      registrationOpen: true,
      maxTicketsPerOrder: 4,
      requirePhone: true,
      privacyNotice,
      termsText,
    },
  });

  const existingSpeakers = await prisma.speaker.count({ where: { eventId: event.id } });
  if (existingSpeakers > 0) return;

  const speakerData = [
    {
      slug: "amara-cole",
      name: "Amara Cole",
      jobTitle: "Innovation lead",
      organization: "Sample Studio",
      sessionTitle: "Opening keynote (sample)",
      expertise: ["Artificial intelligence", "Leadership"],
      sortOrder: 1,
      featured: true,
      bio: "Demonstration profile. Amara Cole is a fictional placeholder, not a confirmed speaker, and this biography does not describe a real person or employer. The sample session introduces the summit themes of artificial intelligence and emerging technology.",
    },
    {
      slug: "elias-grant",
      name: "Elias Grant",
      jobTitle: "Product designer",
      organization: "Sample Collective",
      sessionTitle: "Digital creativity studio (sample)",
      expertise: ["Design", "Creativity"],
      sortOrder: 2,
      featured: true,
      bio: "Demonstration profile. Elias Grant is a fictional placeholder, not a confirmed speaker. The sample workshop is about design and creative practice. No real client work or credentials are claimed.",
    },
    {
      slug: "priya-shah",
      name: "Priya Shah",
      jobTitle: "Founder",
      organization: "Sample Ventures",
      sessionTitle: "Closing keynote (sample)",
      expertise: ["Entrepreneurship", "Leadership"],
      sortOrder: 3,
      featured: true,
      bio: "Demonstration profile. Priya Shah is a fictional placeholder, not a confirmed speaker or investor. The sample keynote is about building a venture. Sample Ventures is not a real firm.",
    },
    {
      slug: "noah-blake",
      name: "Noah Blake",
      jobTitle: "Engineering mentor",
      organization: "Sample Lab",
      sessionTitle: "Technical workshop (sample)",
      expertise: ["Software", "Future careers"],
      sortOrder: 4,
      featured: false,
      bio: "Demonstration profile. Noah Blake is a fictional placeholder, not a confirmed speaker. The sample workshop is a hands-on session for developers and students. Sample Lab is not a real organization.",
    },
  ];

  const speakers = new Map<string, string>();
  for (const speaker of speakerData) {
    const created = await prisma.speaker.create({
      data: {
        eventId: event.id,
        slug: speaker.slug,
        name: speaker.name,
        jobTitle: speaker.jobTitle,
        organization: speaker.organization,
        bio: speaker.bio,
        expertise: JSON.stringify(speaker.expertise),
        socialLinks: "{}",
        sessionTitle: speaker.sessionTitle,
        featured: speaker.featured,
        published: true,
        isSample: true,
        sortOrder: speaker.sortOrder,
      },
    });
    speakers.set(speaker.slug, created.id);
  }

  const sessions = [
    ["2027-06-15T08:30:00.000Z", "2027-06-15T09:15:00.000Z", "Registration and welcome", "Collect badges and find the rooms for the day.", "Lobby", "Registration", false, []],
    ["2027-06-15T09:15:00.000Z", "2027-06-15T10:15:00.000Z", "Opening keynote", "A sample keynote on ideas shaping the next wave of technology.", "Main Hall", "Keynote", false, ["amara-cole"]],
    ["2027-06-15T10:15:00.000Z", "2027-06-15T10:45:00.000Z", "Coffee break", "A short break between sessions.", "Foyer", "Break", true, []],
    ["2027-06-15T10:45:00.000Z", "2027-06-15T12:00:00.000Z", "Expert panel", "A sample conversation across technology, design, and entrepreneurship.", "Main Hall", "Panel", false, ["amara-cole", "elias-grant", "priya-shah"]],
    ["2027-06-15T13:00:00.000Z", "2027-06-15T15:00:00.000Z", "Technical workshop", "A sample practical session for builders and students.", "Studio A", "Workshop", false, ["noah-blake"]],
    ["2027-06-15T15:30:00.000Z", "2027-06-15T16:30:00.000Z", "Networking session", "Structured time to meet other attendees.", "Atrium", "Networking", false, []],
    ["2027-06-16T09:30:00.000Z", "2027-06-16T10:30:00.000Z", "Digital creativity studio", "A sample working session on design and creative practice.", "Main Hall", "Workshop", false, ["elias-grant"]],
    ["2027-06-16T10:45:00.000Z", "2027-06-16T11:45:00.000Z", "Closing keynote", "A sample closing talk on entrepreneurship and what comes next.", "Main Hall", "Keynote", false, ["priya-shah"]],
    ["2027-06-16T11:45:00.000Z", "2027-06-16T12:15:00.000Z", "Closing remarks", "Thank you and next steps from the organizer.", "Main Hall", "Remarks", false, []],
  ] as const;

  for (const [index, session] of sessions.entries()) {
    const [startAt, endAt, title, description, room, category, isBreak, speakerSlugs] = session;
    const created = await prisma.session.create({
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
        sortOrder: index,
      },
    });
    if (speakerSlugs.length) {
      await prisma.sessionSpeaker.createMany({
        data: speakerSlugs.map((slug) => ({
          sessionId: created.id,
          speakerId: speakers.get(slug)!,
          role: "speaker",
        })),
      });
    }
  }

  await prisma.ticketType.createMany({
    data: [
      {
        eventId: event.id,
        name: "General Admission",
        slug: "general-admission",
        description: "Sample general admission. Includes the published sessions for the summit.",
        priceMinor: 15000,
        currency: "USD",
        benefits: JSON.stringify(["Access to scheduled sessions", "Networking sessions on the agenda"]),
        capacity: 200,
        sortOrder: 1,
        active: true,
        isSample: true,
      },
      {
        eventId: event.id,
        name: "VIP Pass",
        slug: "vip-pass",
        description: "Sample VIP pass. Benefits below are placeholders until the organizer defines the real inclusions.",
        priceMinor: 35000,
        currency: "USD",
        benefits: JSON.stringify(["General admission access", "Reserved seating where offered", "A sample reception if the organizer adds one"]),
        capacity: 40,
        sortOrder: 2,
        active: true,
        isSample: true,
      },
      {
        eventId: event.id,
        name: "Student Pass",
        slug: "student-pass",
        description: "Sample student pass. Eligibility has not been confirmed.",
        priceMinor: 7500,
        currency: "USD",
        benefits: JSON.stringify(["Access to scheduled sessions", "Student rate shown as a sample price"]),
        capacity: 80,
        eligibilityNote: "Student eligibility must be confirmed by the organizer. This category is a demonstration.",
        sortOrder: 3,
        active: true,
        isSample: true,
      },
    ],
  });

  await prisma.sponsor.createMany({
    data: [
      { eventId: event.id, name: "Sample Partner A", logo: "/sponsors/sample-a.svg", tier: "Demonstration", sortOrder: 1, active: true, isSample: true },
      { eventId: event.id, name: "Sample Partner B", logo: "/sponsors/sample-b.svg", tier: "Demonstration", sortOrder: 2, active: true, isSample: true },
      { eventId: event.id, name: "Sample Partner C", logo: "/sponsors/sample-c.svg", tier: "Demonstration", sortOrder: 3, active: true, isSample: true },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
