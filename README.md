This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Admin & Import Routes

Admin pages (`/admin/*`) and API routes (`/api/admin/*`) support optional HTTP Basic Auth protection.

**Configuration:**
- Set `ADMIN_USER` and `ADMIN_PASSWORD` environment variables to protect admin & import routes.
- If neither variable is set, admin routes are accessible without authentication (development mode).

## Affiliates & Links

PriceLance may use affiliate links provided by partner networks. When users click some store links and complete a purchase, PriceLance might earn a commission. This has no impact on the listed price shown to users.

All store names and logos remain trademarks of their respective owners.

**Technical notes:**
- All affiliate imports go through the same normalized pipeline (`importNormalizedListings`)
- All listings pass through the "good listing" filter (`isGoodListing`) before being shown to users
- Affiliate metadata (provider, program, merchant ID) is stored on the Listing model for debugging

## Maintenance

See `docs/maintenance.md` for a suggested weekly / monthly / quarterly maintenance routine for PriceLance.

## Seeding laptop products

To seed a small curated set of laptop models into the `Product` table, run:

```bash
npm run seed:laptops
```

This creates or updates a small list of laptop products that can later be linked to listings from multiple stores.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
