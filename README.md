# The Future Summit 2027

Event and conference website for **AJ Creatives**. The public site includes the homepage, speakers, schedule, tickets, and contact pages. Registrations and inquiries are saved in a database, and organizers manage the content at `/admin`.

Dates, the venue, speaker profiles, sponsor logos, ticket prices, and the public contact email in the seed data are **demonstration placeholders**. They are labeled on the site and are not confirmed event facts.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS
- Zod validation
- Prisma

PostgreSQL and Docker are not installed on this machine, so Prisma uses a **SQLite file** at `prisma/dev.db`. That file is persistent local storage: registrations, inquiries, and admin edits survive restarts. To use PostgreSQL later, change the datasource provider in `prisma/schema.prisma` to `postgresql`, set `DATABASE_URL`, and run `npx prisma migrate dev`.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The included `.env` is for local demonstration only. Change `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` before anyone else can reach the machine.

Local demo sign-in:

- Email: `organizer@example.com`
- Password: `Summit-Demo-2027-Aj`
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the site |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit and database tests |
| `npm run db:setup` | Apply migrations and seed demonstration content |
| `npm run db:reset` | Drop the local database, migrate, and seed again |

`db:reset` deletes registrations. Do not run it against a database you need to keep.

## What is editable

Sign in at `/admin` to change:

- Event title, description, date, timezone, and publication status
- Venue and travel notes
- Speakers, portraits, and biographies
- Schedule sessions
- Ticket names, prices, currency, and capacity
- Sponsor logos and links
- Contact inquiries and registration records
- Social links, privacy notice, and registration terms

The public site reads this data. Sample records stay badged until you turn off **Sample**.

Confirm a date or venue only when it is final. Until then, the homepage shows “not confirmed” and does not publish event structured data. The countdown runs only when a start time is saved, and it says when that time is still a demonstration. If the start time is empty, the countdown does not show numbers.

## Registration and payments

1. The visitor chooses a ticket and quantity.
2. The server checks the fields, the sales window, the per-order limit, and remaining capacity.
3. Capacity is reserved inside a database transaction so two people cannot take the last tickets.
4. A repeated submit with the same idempotency key returns the original reference and does not reserve twice.
5. A free ticket is stored as `CONFIRMED` / `NOT_REQUIRED`.
6. A paid ticket is stored as `REQUESTED` / `UNPAID`. That is a request, not a confirmed ticket.

Card checkout is optional. Set these environment variables and point Stripe at `POST /api/stripe/webhook`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

The webhook checks the Stripe signature. A registration is marked paid only after that check succeeds and the Checkout session is `paid`. Prices and quantities sent by the browser are ignored; the server reads them from the database.

Without Stripe, paid categories still save a request and the confirmation page says payment has not been verified.

## Email

Set both `RESEND_API_KEY` and `EMAIL_FROM` to send registration and inquiry email through [Resend](https://resend.com). If they are empty, the record is still saved and the page does not claim that an email was sent.

## Images

Conference photographs in `public/images` are from Unsplash and are used as event atmosphere, not as portraits of the sample speakers. Sample speakers use generated initials. Organizer portrait uploads accept JPG, PNG, and WebP up to 2 MB and are stored in `public/uploads`.

## Security notes

- Admin routes and the registration export require a signed httpOnly session.
- Public confirmation pages show the reference, name, ticket, and status. They do not show email, phone, or notes.
- Forms use server-side Zod validation, a honeypot field, and an in-memory rate limit. The rate limit resets when the server process restarts. Use a shared store if you run more than one server.
- Do not commit `.env`.

## Tests

`npm test` creates `prisma/test.db`, then checks the countdown, schedule ordering and overlaps, validation, admin token checks, registration capacity, duplicate submits, unpaid paid-ticket requests, and contact storage.
