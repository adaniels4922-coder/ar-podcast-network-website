/*
  SITE CONFIG — the only file you should need to edit to connect real
  accounts. Replace the placeholder values below once you've completed the
  setup steps in SETUP.md. Every page reads from this file.
*/

const SITE_CONFIG = {
  // Settings > Appointment schedules > (your Studio B schedule) > Share >
  // "Embed this scheduling page" will give you an iframe. Copy just the
  // src="..." URL from that iframe and paste it here.
  googleCalendarEmbedUrl: "https://calendar.google.com/calendar/appointments/schedules/REPLACE_ME",

  // Stripe Dashboard > Payment links. Create one link per rate (see
  // SETUP.md for the exact fields to set on each), then paste the two
  // "https://buy.stripe.com/..." URLs here.
  stripePaymentLinkIndividual: "https://buy.stripe.com/REPLACE_ME_INDIVIDUAL",
  stripePaymentLinkBusiness: "https://buy.stripe.com/REPLACE_ME_BUSINESS",
};
