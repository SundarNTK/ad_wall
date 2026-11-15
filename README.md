# ClassiNest

A single Next.js classifieds marketplace with a customer portal and a separate admin panel. Both talk to the same MongoDB database.

## Setup

1. Copy the environment file and fill in real values. Do not commit `.env.local`.

```bash
copy .env.example .env.local
```

2. Install and seed.

```bash
npm install
npm run seed
npm run dev
```

3. Open the portals.

- Customer: http://localhost:5000
- Customer login: http://localhost:5000/login
- Customer register: http://localhost:5000/register
- Post an ad: http://localhost:5000/post
- Account: http://localhost:5000/account
- Admin panel: http://localhost:5000/admin
- Admin login: http://localhost:5000/admin/login

`npm run build` compiles the production app. Pages that need MongoDB run at request time, so the build itself does not require a database.

## Environment

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Access-token signing secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `NEXT_PUBLIC_APP_URL` | Public site URL used in email links |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | Outbound mail. If `SMTP_HOST` is empty, the message and link are printed in the server console |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photo uploads. Ads can be posted without photos if these are empty |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First superadmin created by `npm run seed` |

## Seed accounts

- Superadmin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- Demo customer: `demo.customer@classinest.local` / `Demo1234!`

The seed also creates 8 categories, subcategories with dynamic fields, 20 locations, and 40 live sample ads. Running it again does not duplicate the superadmin or the sample ads.

## Roles

- A person who registers on the customer portal is always a `customer`.
- Customers can sign in only at `/login`. `/admin/login` answers “You do not have access to the admin panel” and does not set an admin cookie.
- Admins and superadmins are created only from Admin → Admin Users → Add New Admin. There is no public admin registration.
- Admin and superadmin accounts can sign in on both portals with the same password, including posting ads after they also sign in at `/login`.
- The two portals use separate httpOnly cookies: `ca_token` / `ca_refresh` and `ca_admin_token` / `ca_admin_refresh`. Signing out of one does not sign out of the other.
- Access tokens last 15 minutes. Refresh tokens last 7 days and rotate. Password reset, “log out of all devices”, and blocking an account bump `tokenVersion` and revoke refresh tokens.
- A user whose status is not `active` cannot sign in, and existing API sessions are rejected.
- Only a superadmin can create or delete a superadmin. Nobody can delete or demote themselves, and the last active superadmin cannot be removed.
- Reset links expire in 30 minutes, invite links expire in 48 hours, and both are stored as a SHA-256 hash and work once.
- Email verification links expire in 24 hours. Posting an ad requires a verified email.
- New ads are `pending` while moderation is on, and `live` when it is off.

## Scripts

- `npm run dev` — local app
- `npm run build` — production build
- `npm run seed` — superadmin, masters, and sample ads
