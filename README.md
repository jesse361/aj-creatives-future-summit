# THE FUTURE SUMMIT 2027

Event website for AJ CREATIVES. The public site includes the homepage, speakers, schedule, tickets, and contact pages, a live countdown, registration, and a protected admin area.

Dates, venue, speakers, prices, sponsors, and contact details in the database are **demonstration placeholders**. They are labeled on the site and are not confirmed facts.

## Requirements

- Node.js 20 or newer (developed on Node.js 24)
- npm

PostgreSQL is not required. This environment did not have a PostgreSQL server, so Prisma uses a local SQLite file. Registration records, inquiries, and admin edits persist in that file. To use PostgreSQL later, change `provider` in `prisma/schema.prisma` to `postgresql`, set `DATABASE_URL` to your connection string, and run `npx prisma db push`.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `AUTH_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Then create the database and load the demonstration content:

```bash
npm run db:setup
```

The local demo in this project uses:

- Admin email: `organizer@example.com`
- Admin password: `summit-admin-demo`

Change both before any public deployment. The admin email is a sign-in credential, not the public event contact address. The public contact email is blank until you add one.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run db:setup` | Create the database and seed placeholders |
| `npm test` | Unit and registration tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

Run `npm run db:setup` before `npm run build` when you want the production build to read saved records. On Vercel, a SQLite file is not available, so the public pages render this demonstration programme instead of a blank screen. Saved registrations, inquiries, and admin edits need `DATABASE_URL` pointed at PostgreSQL. Change the Prisma provider to `postgresql`, push the schema, and seed before treating those records as persistent.

## What you can edit without code

Sign in at `/admin` to change:

- Event name, description, date, timezone, format, and publication status
- Venue and travel fields
- Homepage copy, social links, privacy text, and terms
- Speakers, sessions, tickets, and sponsors
- Registration list, cancellation, and CSV export
- Contact inquiries

Confirm a date, venue, format, timezone, or currency only after the real detail is known. The public homepage keeps bracket placeholders such as `[EVENT DATE]` until those confirmation flags are on. Sample speakers, sample prices, and sample sponsor logos stay marked until you replace them.

Free tickets are confirmed when the registration is saved. Priced tickets are stored as unpaid requests. They become confirmed only after Stripe verifies the payment.

## Optional services

Leave these blank if you are not using them.

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: card payments. Point Stripe to `POST /api/stripe/webhook`. The return URL never marks a ticket paid by itself.
- `RESEND_API_KEY` and `EMAIL_FROM`: confirmation and inquiry email. Registration still succeeds when email is not configured.
- `NEXT_PUBLIC_SITE_URL`: canonical URL used for metadata, the sitemap, and payment return links.

Uploaded portraits and logos are checked as JPEG, PNG, or WebP and stored in `public/uploads`. A read-only host should use image paths instead of uploads.

## Privacy

Registration and inquiry records are available only in the admin area and the CSV export. The confirmation page is available to someone who has the registration reference. Public pages do not list attendees.
