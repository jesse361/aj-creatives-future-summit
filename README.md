# WHY US — Events & Conference Hub

Multi-event conference platform. Public pages, registration, and a protected admin dashboard read and write PostgreSQL through Prisma. Demonstration events, speakers, and prices are labeled in the database and on the site. They are not confirmed WHY US events.

Paystack, Resend, and Vercel Blob are implemented. In this repository their credentials are empty, so paid checkout, email delivery, and image uploads are **not configured** and the application says so. A browser return from checkout is never treated as proof of payment.

Attendee accounts are not part of this application. Visitors register for an event without creating a login.

## Requirements

- Node.js 20 or newer
- npm

Local development starts an embedded PostgreSQL server on `127.0.0.1:54329` when `DATABASE_URL` is empty or already points at localhost. The data directory is `.data/postgres`, which is gitignored. The local password is `whyus_local_only` and is not a production secret.

Production should use a hosted PostgreSQL database. Neon is a suitable provider. Set both connection strings and do not rely on the embedded server.

## Local setup

```bash
npm install
cp .env.example .env
```

Set `AUTH_SECRET` to a long random string. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first seed. The password must be at least 12 characters. The seed refuses published examples such as `password`, `admin`, `whyus`, and `summit-admin-demo`.

```bash
npm run db:setup
npm run dev
```

Open http://localhost:3000. The admin sign-in is http://localhost:3000/admin/login.

`npm run db:setup` applies the SQL migrations and seeds site settings, page templates, FAQs, one owner account, and labeled demonstration events. Later seeds do not overwrite page content that an administrator has edited. The owner is created only when no administrator exists.

Change the owner password from **Admin → Profile** before any public deployment.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local PostgreSQL if needed, then the development server |
| `npm run db:setup` | Apply migrations and seed |
| `npm run db:migrate` | Apply migrations only |
| `npm run db:seed` | Seed only |
| `npm test` | Critical workflow tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Prisma client generation and production build |
| `npm start` | Serve the production build |

## What the owner can change without code

Sign in at `/admin`. Roles are `OWNER`, `ADMIN`, and `EDITOR`. Editors can change content. Owners and admins can also manage registrations, payments, settings, and CSV export.

- Events: create, edit, publish, unpublish, cancel, archive, and mark demonstration content
- Speakers, sessions, and ticket types, including prices, capacity, and sales windows
- Sponsors, inquiries, newsletter subscribers, FAQs, testimonials, and page content
- Announcement bar, contact details, social links, footer, and SEO fields
- Registration review, cancellation, confirmation resend, and CSV export
- Refund recording when Paystack is configured

Approved sponsors and approved testimonials are the only ones shown publicly. An empty list hides those homepage sections.

## Registration and payments

Ticket prices, capacity, and sale windows come from the database. The server rejects client-supplied prices.

Free tickets are confirmed in the same transaction that increments `sold`. Paid tickets reserve inventory and stay `PENDING_PAYMENT` until Paystack verification succeeds. A successful verification moves `reserved` to `sold` and stores the provider reference. Failed, cancelled, and expired checkouts release the hold. Pending holds expire after `registrationHoldMinutes` on the site settings (30 by default).

`GET /api/cron/release-holds` releases expired holds. Vercel Cron calls it every 15 minutes. Set `CRON_SECRET` and send `Authorization: Bearer <CRON_SECRET>`.

The webhook is `POST /api/payments/webhook`. Paystack signs the raw body with HMAC SHA512. The handler checks that signature, then calls the Paystack verify API before marking a registration paid. Repeated deliveries are ignored. Amount, currency, and reference must match the stored registration.

Refunds are requested through the Paystack API when credentials exist. The local payment row records the refund status returned by Paystack.

## Production database

1. Create a PostgreSQL database.
2. Set `DATABASE_URL` to the pooled connection and `DIRECT_URL` to the direct connection. Prisma migrations use `DIRECT_URL`.
3. From a trusted machine, run `npx prisma migrate deploy`.
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then run `npx tsx prisma/seed.ts` once.
5. Remove `ADMIN_PASSWORD` from the host environment after the owner exists. Sign-in uses the password hash in the database.

Back up the hosted database with the provider’s backup tools. To recover, restore the database, confirm `DATABASE_URL` and `DIRECT_URL`, and run `npx prisma migrate deploy` if the restored copy is behind the current migrations.

## Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel. The framework preset is Next.js. `vercel.json` already defines the hold-release cron.
3. Add the production environment variables from `.env.example`. Use the hosted database URLs. Generate a new `AUTH_SECRET` and `CRON_SECRET`.
4. Deploy. The build runs `prisma generate` and `next build`. Run `prisma migrate deploy` against production before or as part of the release, from a machine that has `DIRECT_URL`. This project does not run migrations inside the Vercel build.
5. Open `/api/health`. A healthy process returns `ok: true` and `database: "up"`. Payments, email, and media are reported as `configured` or `unconfigured`. The response does not include secrets.
6. Sign in, change the owner password, and replace demonstration events before announcing the site.

This repository has not been deployed. A successful local build does not mean a live Vercel deployment exists.

## Environment variables

Copy `.env.example`. Leave a service blank until its account exists.

| Variable | Use |
| --- | --- |
| `DATABASE_URL` | Application connection |
| `DIRECT_URL` | Prisma migrations |
| `AUTH_SECRET` | Rate-limit hashing and session material |
| `APP_URL` | Server callbacks and email links |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin for metadata |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First owner, seed only |
| `PAYSTACK_SECRET_KEY` | Server checkout, verify, and refunds |
| `PAYSTACK_PUBLIC_KEY` | Reserved for a future client checkout key; not required by the current redirect flow |
| `PAYSTACK_WEBHOOK_SECRET` | Optional webhook HMAC secret; falls back to the secret key |
| `RESEND_API_KEY` or `EMAIL_PROVIDER_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender address |
| `RESEND_AUDIENCE_ID` | Optional newsletter audience sync |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob uploads |
| `CRON_SECRET` | Hold-release cron |

Do not put secrets in `NEXT_PUBLIC_` variables. `NEXT_PUBLIC_SITE_URL` is only the public site origin.

## Media

Uploads accept JPEG, PNG, and WebP up to 2 MB after checking file bytes. Files are stored in Vercel Blob under random names. Until `BLOB_READ_WRITE_TOKEN` is set, the admin media screen refuses uploads. Illustrative photographs in `public/images` are local Unsplash files used as design imagery, not photographs of confirmed WHY US events.

## Email and password recovery

Registration, inquiry, and password-reset email are sent only when Resend is configured. A missing email provider does not roll back a free registration. Password reset does not reveal whether an account exists and does not print a reset link when email is unconfigured.

## Security notes

- Admin routes require a server-side session. The proxy only checks that the session cookie exists; every admin layout and action loads the session again.
- Passwords are stored as scrypt hashes.
- There is no default password in the repository.
- Contact and newsletter forms use server-side validation, a honeypot, and rate limits.
- CSV export is limited to owners and admins and escapes spreadsheet formulas.
- Audit logs record sensitive admin changes.

## Checks

Run these before a release:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Then exercise the public pages, a free demonstration registration, the paid-ticket message while Paystack is unconfigured, contact, newsletter, and an admin save.
