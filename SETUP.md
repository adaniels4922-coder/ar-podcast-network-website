# Studio B Website — Setup Guide

This walks you through every step that has to happen inside your own
accounts (Google, Stripe, your domain registrar, Vercel). I can't click
through these for you since they require your logins, but each step below
tells you exactly what to do and what to copy back into the site.

The site itself is already built. You're connecting it to your real
calendar, payment links, and domain.

---

## 1. Turn on Google Calendar's booking page

1. Open [Google Calendar](https://calendar.google.com) with the Google
   account you want Studio B bookings to land on.
2. Click **Create** → **Appointment schedule**.
3. Name it something like "Studio B Booking."
4. Set the available hours to **Monday–Friday, 9:00am–8:00pm**, and set a
   duration (e.g. 1 hour slots — clients can typically book multiple
   consecutive slots if they need more time).
5. Save it.
6. Open the schedule you just created, click **Share** (or the booking
   page link icon), and find **"Embed this scheduling page"**. It'll give
   you an `<iframe>` snippet — copy just the URL inside `src="..."`.
7. Also copy your **Calendar ID**: go to Calendar **Settings** → click on
   your calendar under "Settings for my calendars" → scroll to
   **"Integrate calendar"** → copy the **Calendar ID** (it looks like
   `your.email@gmail.com` or `something@group.calendar.google.com`).

**Paste into the site:** open [js/config.js](js/config.js) and paste the
embed URL into `googleCalendarEmbedUrl`.

**Save for later:** paste the Calendar ID somewhere handy — you'll need it
in Step 3.

---

## 2. Create your two Stripe Payment Links

1. Log into your [Stripe Dashboard](https://dashboard.stripe.com).
2. Go to **Payment links** → **Create payment link**.
3. **Individual/Creator link:**
   - Product name: "Studio B — Individual/Creator Rate"
   - Price: $100.00, and set it as billed **per hour** if Stripe's unit
     options let you, otherwise just a flat one-time price of $100 (you'll
     rely on the client to already know it's hourly from your pricing
     page — most single-session bookings are one hour).
   - Under **"Collect additional information"** (or "Custom fields"), add
     a required text field:
     - Key: `booking_date_time`
     - Label: "Date & time you selected on the booking calendar"
   - Save, then copy the resulting `https://buy.stripe.com/...` link.
4. Repeat for the **Business link**: same steps, price $150.00.

**Paste into the site:** open [js/config.js](js/config.js) and paste the
two links into `stripePaymentLinkIndividual` and `stripePaymentLinkBusiness`.

---

## 3. Deploy the auto-release automation (Google Apps Script)

This is the small free script that tags paid bookings and clears unpaid
holds after 24 hours.

1. Go to [script.google.com](https://script.google.com) → **New project**.
2. Delete the placeholder code, then open
   [apps-script/auto-release-holds.gs](apps-script/auto-release-holds.gs)
   in this project, copy its entire contents, and paste it into the
   script editor.
3. At the top of the script, fill in:
   - `CALENDAR_ID` — the Calendar ID you copied in Step 1.
   - `SHARED_SECRET` — make up a long random string (e.g. mash your
     keyboard for 20+ characters). This acts as a password so random
     strangers can't trigger the script.
4. Click **Deploy** → **New deployment** → gear icon → **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, and authorize the permissions it asks for (it needs
     access to your calendar).
5. Copy the **Web app URL** it gives you. Your webhook URL will be that
   URL plus `?token=YOUR_SHARED_SECRET`, e.g.:
   `https://script.google.com/macros/s/XXXXX/exec?token=your-random-secret`

### Connect it to Stripe

1. In Stripe Dashboard, go to **Developers** → **Webhooks** → **Add
   endpoint**.
2. Endpoint URL: paste the webhook URL from above (with `?token=...`).
3. Select event: **checkout.session.completed**.
4. Save.

### Turn on the 24-hour cleanup timer

1. Back in the Apps Script editor, click the clock icon (**Triggers**) on
   the left sidebar → **Add Trigger**.
2. Function to run: `releaseUnpaidHolds`
3. Event source: **Time-driven** → **Hour timer** → **Every hour**.
4. Save (authorize again if asked).

**Heads up on limitations:** Apps Script can't fully verify that a webhook
really came from Stripe (a platform limitation, explained in comments at
the top of the script) — it only checks the secret token in the URL. For a
single small room this is a reasonable tradeoff, but keep that webhook URL
private, and check in on your calendar occasionally to make sure
`[PAID]` tags look right.

---

## 4. Point ambitiousroots.com at Vercel

1. Create a free account at [vercel.com](https://vercel.com) if you don't
   have one.
2. From the Vercel dashboard, **Add New** → **Project**, and import this
   folder (Vercel supports deploying a plain HTML/CSS/JS folder with no
   build step — when it asks for a framework preset, choose **Other**).
3. Deploy. Vercel will give you a temporary `*.vercel.app` URL to confirm
   it works.
4. In the Vercel project, go to **Settings** → **Domains** → add
   `ambitiousroots.com`.
5. Vercel will show you DNS records to add (usually an `A` record and a
   `CNAME` for `www`).
6. Log into wherever ambitiousroots.com is registered, find the **DNS
   settings**, and add the records Vercel gave you.
7. DNS changes can take anywhere from a few minutes to a few hours to go
   live.

---

## 5. Before you tell anyone the site is live

- [ ] `js/config.js` has your real calendar embed URL and both Stripe
      links (no `REPLACE_ME` left in the file)
- [ ] Book a test slot yourself and pay with a
      [Stripe test card](https://stripe.com/docs/testing) (while Stripe is
      in test mode) to confirm the whole flow works end to end, and that
      the calendar event gets tagged `[PAID]`
- [ ] Switch Stripe from test mode to live mode, and re-check the payment
      links still work (live mode has its own separate payment links —
      double check you copied the **live** link URLs, not the test ones)
- [ ] Replace `hello@ambitiousroots.com` in the footer/contact page with
      your real inbox, or set up that email address
- [ ] Add real photos to the [Gallery](gallery.html) page when you have
      them (there's a comment in that file showing the pattern to follow)
