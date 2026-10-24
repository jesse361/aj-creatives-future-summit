-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startAt" DATETIME,
    "endAt" DATETIME,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "datesConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "format" TEXT NOT NULL DEFAULT 'TBD',
    "heroImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "venueName" TEXT,
    "venueAddress" TEXT,
    "venueCity" TEXT,
    "venueCountry" TEXT,
    "venueConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "directionsUrl" TEXT,
    "mapEmbedUrl" TEXT,
    "travelSummary" TEXT,
    "transitInfo" TEXT,
    "parkingInfo" TEXT,
    "accessibilityInfo" TEXT,
    "accommodationInfo" TEXT,
    "hoursLabel" TEXT,
    "whyAttend" TEXT NOT NULL DEFAULT '[]',
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "ctaHeadline" TEXT NOT NULL DEFAULT 'BE PART OF WHAT COMES NEXT.',
    "ctaText" TEXT NOT NULL DEFAULT 'Join the conversations, connections, and ideas shaping tomorrow.',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "organizerName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "websiteUrl" TEXT,
    "socialLinks" TEXT NOT NULL DEFAULT '{}',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "maxTicketsPerOrder" INTEGER NOT NULL DEFAULT 4,
    "requirePhone" BOOLEAN NOT NULL DEFAULT true,
    "privacyNotice" TEXT NOT NULL,
    "termsText" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Speaker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "portrait" TEXT,
    "expertise" TEXT NOT NULL DEFAULT '[]',
    "socialLinks" TEXT NOT NULL DEFAULT '{}',
    "sessionTitle" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Speaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "room" TEXT,
    "category" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionSpeaker" (
    "sessionId" TEXT NOT NULL,
    "speakerId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'speaker',

    PRIMARY KEY ("sessionId", "speakerId"),
    CONSTRAINT "SessionSpeaker_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionSpeaker_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Speaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "capacity" INTEGER NOT NULL,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "salesStart" DATETIME,
    "salesEnd" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "attendeeName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "jobTitle" TEXT,
    "quantity" INTEGER NOT NULL,
    "dietaryNotes" TEXT,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "emailStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Registration_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "tier" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sponsor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Speaker_eventId_published_idx" ON "Speaker"("eventId", "published");

-- CreateIndex
CREATE UNIQUE INDEX "Speaker_eventId_slug_key" ON "Speaker"("eventId", "slug");

-- CreateIndex
CREATE INDEX "Session_eventId_startAt_idx" ON "Session"("eventId", "startAt");

-- CreateIndex
CREATE INDEX "TicketType_eventId_active_idx" ON "TicketType"("eventId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "TicketType_eventId_slug_key" ON "TicketType"("eventId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_reference_key" ON "Registration"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_idempotencyKey_key" ON "Registration"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Registration_email_idx" ON "Registration"("email");

-- CreateIndex
CREATE INDEX "Registration_ticketTypeId_idx" ON "Registration"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Registration_status_idx" ON "Registration"("status");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE INDEX "Sponsor_eventId_active_sortOrder_idx" ON "Sponsor"("eventId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

