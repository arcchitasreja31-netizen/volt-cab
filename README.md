# Volt-Cab — Cab Booking Application

Volt-Cab is a full-stack cab-booking web application inspired by ride-hailing services. It allows riders to book trips, drivers to manage ride requests, and riders to view ride history and payment records.

**Live application:** https://volt-cab.vercel.app  
**Source code:** https://github.com/arcchitasreja31-netizen/volt-cab

## Features

### Authentication and user access
- Sign-in and sign-up using Clerk.
- Protected application routes.
- Rider and driver workflows.

### Ride booking
- Map-based pickup and destination selection.
- Ride-distance and fare estimation.
- Ride requests stored in Supabase.
- Driver workflow for accepting, starting, and completing rides.

### Ride management
- Ride history and completed-ride details.
- Fare and receipt/payment information.
- Driver ratings and reviews.

### Payments
- Stripe Checkout integration in test mode.
- Server-side creation of checkout sessions.
- Webhook signature verification.
- Supabase payment-status updates after successful Stripe payment events.

**Payment note:** Stripe is configured for test-mode transactions. Test payments do not represent real-money transactions.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL)
- **Maps:** Leaflet and Leaflet Routing Machine
- **Payments:** Stripe Checkout (test mode)
- **Deployment:** Vercel

## Local Setup

### Prerequisites
- Node.js and npm
- A Clerk project
- A Supabase project
- A Stripe Sandbox/Test environment for payment testing

### Installation

Clone the repository:

```bash
git clone https://github.com/arcchitasreja31-netizen/volt-cab.git
cd volt-cab
```

Install dependencies:

```bash
npm install
```

Create a local `.env.local` file in the project root. Configure the following variables using credentials from your own service dashboards:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Use the exact environment-variable names expected by the application. Keep all secret values private.

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Production Build

Run the production build check:

```bash
npm run build
```

## Stripe Test Configuration

The Stripe webhook endpoint is:

`https://volt-cab.vercel.app/api/stripe/webhook`

Configure the endpoint in Stripe Sandbox mode to receive:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the deployment environment. A payment should only be marked successful after the server verifies the corresponding Stripe event.

## Testing

The following workflows have been tested manually in the deployed application:

- User sign-in and access to the application.
- Ride creation and ride-history display.
- Driver acceptance, ride start, and ride completion.
- Completed-ride fare and receipt/payment information.
- Rider rating and review submission.
- Stripe test checkout, successful webhook delivery, and payment-status update in Supabase.

## Scope and Limitations

The application is a student project and demonstration of a cab-booking workflow. Stripe payments are in test mode and must not be presented as live payment processing.

Advanced requirements such as live GPS tracking, automated nearby-driver matching, multi-stop trips, promo codes, emergency SOS, and customer-support workflows should be considered incomplete unless separately implemented and verified.

## Security

- Do not commit `.env.local` or real API credentials.
- Do not expose server-side Supabase or Stripe secret keys in client-side code.
- Keep production and test credentials separate.

## Deployment

The application is deployed on Vercel. Changes pushed to the configured GitHub branch can trigger a new deployment.

---

**Project:** Volt-Cab  
**Purpose:** Educational full-stack cab-booking application