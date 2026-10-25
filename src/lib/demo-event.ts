import { defaultHighlights, defaultPrivacy, defaultTerms, defaultWhyAttend } from "@/lib/defaults";
import type { PublicEvent, PublicSession, PublicSpeaker } from "@/lib/types";

const sampleNote = "Sample profile for demonstration. This person has not been invited and has not confirmed participation. ";

const people = [
  ["amara-mensah", "Amara Mensah", "Product strategist", "Northwind Studio (sample)", "/speakers/amara.svg", ["Artificial intelligence", "Product strategy"], true, `${sampleNote}The placeholder biography describes a strategist who helps teams decide where new technology is useful and where it should stay out of the way.`],
  ["leo-okonkwo", "Leo Okonkwo", "Design director", "Harbor Atelier (sample)", "/speakers/leo.svg", ["Digital creativity", "Design"], true, `${sampleNote}The placeholder biography describes a designer interested in how visual systems, storytelling, and software can support one another.`],
  ["priya-raman", "Priya Raman", "Founder", "Example Labs (sample)", "/speakers/priya.svg", ["Entrepreneurship", "Leadership"], true, `${sampleNote}The placeholder biography describes a founder using this profile only to demonstrate a speaker card. Example Labs is not a real partner of this event.`],
  ["jonah-ellis", "Jonah Ellis", "Engineering lead", "Sample Systems (sample)", "/speakers/jonah.svg", ["Software engineering", "Artificial intelligence"], true, `${sampleNote}The placeholder biography describes an engineer who would, in a real programme, show a practical workflow rather than a product pitch.`],
  ["sofia-alvarez", "Sofia Alvarez", "Skills advisor", "FuturePath (sample)", "/speakers/sofia.svg", ["Future careers", "Digital skills"], false, `${sampleNote}The placeholder biography describes an advisor talking with students and early-career attendees about digital skills. FuturePath is a fictional name.`],
  ["malik-adeyemi", "Malik Adeyemi", "Research investor", "Placeholder Capital (sample)", "/speakers/malik.svg", ["Entrepreneurship", "Leadership"], false, `${sampleNote}The placeholder biography describes an investor perspective. Placeholder Capital is not a real fund and has no relationship with AJ CREATIVES.`],
] as const;

const programme = [
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

const names = Object.fromEntries(people.map((person) => [person[0], person[1]]));

function sessions(): PublicSession[] {
  return programme.map((session, index) => {
    const [title, description, startAt, endAt, room, category, isBreak, speakers] = session;
    return {
      id: `demo-session-${index + 1}`,
      title,
      description,
      startAt,
      endAt,
      room,
      category,
      isBreak,
      isSample: true,
      speakers: speakers.map(([slug, role]) => ({ name: names[slug] ?? slug, slug, role })),
    };
  });
}

function speakers(sessionList: PublicSession[]): PublicSpeaker[] {
  return people.map((person) => {
    const [slug, name, jobTitle, organization, portraitUrl, expertise, featured, biography] = person;
    const related = sessionList.filter((session) => session.speakers.some((speaker) => speaker.slug === slug));
    return {
      id: `demo-speaker-${slug}`,
      slug,
      name,
      jobTitle,
      organization,
      biography,
      portraitUrl,
      portraitIsSample: true,
      expertise: [...expertise],
      socialLinks: slug === "priya-raman" ? [{ label: "Sample link", url: "https://example.com" }] : [],
      isSample: true,
      featured,
      sessionTitles: related.map((session) => session.title),
      categories: [...new Set(related.map((session) => session.category))],
    };
  });
}

export function demoPublishedEvent(): PublicEvent {
  const sessionList = sessions();
  return {
    id: "demo-future-summit-2027",
    name: "THE FUTURE SUMMIT 2027",
    slug: "the-future-summit-2027",
    tagline: "Ideas That Shape Tomorrow.",
    description: "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.",
    startAt: "2027-10-15T08:30:00.000Z",
    endAt: "2027-10-16T15:15:00.000Z",
    datesConfirmed: false,
    timezone: "UTC",
    timezoneConfirmed: false,
    format: null,
    formatConfirmed: false,
    heroImageUrl: "/images/hero.jpg",
    venue: {
      confirmed: false,
      name: "",
      streetAddress: "",
      city: "",
      country: "",
      publicTransport: "",
      parking: "",
      accessibility: "",
      accommodation: "",
      directionsUrl: "",
      mapEmbedUrl: "",
      travelSummary: "",
      hoursLabel: "",
    },
    settings: {
      organizerName: "AJ CREATIVES",
      contactEmail: "",
      contactPhone: "",
      socialLinks: [],
      currency: "USD",
      currencyConfirmed: false,
      registrationOpen: true,
      phoneRequired: false,
      privacyNotice: defaultPrivacy,
      termsText: defaultTerms,
      whyAttend: defaultWhyAttend,
      highlights: defaultHighlights,
      heroEyebrow: "AJ CREATIVES PRESENTS",
      heroDescription: "Discover new ideas, meet inspiring innovators, and explore the technologies and creative thinking shaping our future.",
      ctaHeadline: "BE PART OF WHAT COMES NEXT.",
      ctaDescription: "Join the conversations, connections, and ideas shaping tomorrow.",
      nextEventUrl: "",
      nextEventLabel: "",
    },
    speakers: speakers(sessionList),
    sessions: sessionList,
    tickets: [
      {
        id: "demo-general-admission",
        slug: "general-admission",
        name: "General Admission",
        description: "Standard access to the published sessions.",
        priceCents: 15000,
        currency: "USD",
        benefits: ["Entry to scheduled sessions", "Access to general networking blocks", "A demonstration ticket, not an official price"],
        capacity: 200,
        sold: 0,
        salesStart: null,
        salesEnd: null,
        isSample: true,
        eligibilityNote: "",
      },
      {
        id: "demo-vip-pass",
        slug: "vip-pass",
        name: "VIP Pass",
        description: "A sample VIP option. Benefits apply only if the organizer confirms them.",
        priceCents: 35000,
        currency: "USD",
        benefits: ["Everything in General Admission", "Reserved keynote seating if the organizer confirms it", "Access to a VIP conversation if it is added to the agenda"],
        capacity: 40,
        sold: 0,
        salesStart: null,
        salesEnd: null,
        isSample: true,
        eligibilityNote: "",
      },
      {
        id: "demo-student-pass",
        slug: "student-pass",
        name: "Student Pass",
        description: "A free demonstration pass for eligible students.",
        priceCents: 0,
        currency: "USD",
        benefits: ["Entry to scheduled sessions", "No charge in this demonstration", "The organizer may later ask for proof of study"],
        capacity: 80,
        sold: 0,
        salesStart: null,
        salesEnd: null,
        isSample: true,
        eligibilityNote: "This sample pass is for students and recent graduates. The organizer is not automatically verifying enrollment.",
      },
    ],
    sponsors: [
      { id: "demo-northwind", name: "Sample Northwind", logoUrl: "/sponsors/northwind.svg", website: "", tier: "Platinum", isSample: true },
      { id: "demo-harbor", name: "Sample Harbor", logoUrl: "/sponsors/harbor.svg", website: "", tier: "Gold", isSample: true },
      { id: "demo-example-labs", name: "Sample Example Labs", logoUrl: "/sponsors/example-labs.svg", website: "", tier: "Gold", isSample: true },
      { id: "demo-systems", name: "Sample Systems", logoUrl: "/sponsors/sample-systems.svg", website: "", tier: "Community", isSample: true },
    ],
  };
}
