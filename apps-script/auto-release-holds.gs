/*
  AR Podcast Network — Studio B
  Auto-release unpaid calendar holds + tag paid ones.

  WHAT THIS DOES
  1) When a client pays via one of your two Stripe Payment Links, Stripe
     notifies this script (a "webhook"). This script finds the matching
     calendar hold and renames it with a "[PAID]" prefix.
  2) On a repeating timer (you'll set this up in SETUP.md), this script
     checks all Studio B calendar holds and deletes any that are older
     than HOLD_HOURS and were never marked "[PAID]" — freeing that time
     slot back up for someone else to book.

  IMPORTANT LIMITATION — read before relying on this
  Google Apps Script web apps cannot read custom HTTP headers, so this
  script CANNOT verify Stripe's cryptographic webhook signature the way a
  real backend normally would. Instead, this script checks a random secret
  token that you put directly in the webhook URL you give Stripe (see
  SETUP.md). This is "good enough" security for a small single-room
  booking site, but it is not the same guarantee a full server gives you.
  Keep your webhook URL private, and periodically glance at your calendar
  to make sure "[PAID]" tags look right — matching is done by comparing
  the date/time text the client typed against your calendar, which is
  best-effort, not guaranteed perfect.

  SETUP — fill in the three values below, then follow SETUP.md to deploy
  this as a Web App and connect it to Stripe.
*/

const CALENDAR_ID = 'REPLACE_WITH_YOUR_CALENDAR_ID'; // e.g. 'your.email@gmail.com' or a group calendar ID
const SHARED_SECRET = 'REPLACE_WITH_A_RANDOM_SECRET'; // make up a long random string, keep it private
const HOLD_HOURS = 24; // how long an unpaid slot stays held before release
const PAID_PREFIX = '[PAID] ';

/**
 * Entry point Stripe calls when a payment completes.
 * Configure this URL (with ?token=SHARED_SECRET appended) as a webhook
 * endpoint in the Stripe Dashboard, listening for "checkout.session.completed".
 */
function doPost(e) {
  const token = e && e.parameter ? e.parameter.token : null;
  if (token !== SHARED_SECRET) {
    return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT);
  }

  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('Bad payload').setMimeType(ContentService.MimeType.TEXT);
  }

  if (body.type !== 'checkout.session.completed') {
    return ContentService.createTextOutput('Ignored').setMimeType(ContentService.MimeType.TEXT);
  }

  const session = body.data.object;
  const clientText = extractBookingTimeText(session);
  const payerEmail = session.customer_details ? session.customer_details.email : '';

  markMatchingEventAsPaid(clientText, payerEmail);

  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Pulls the date/time text the client typed into the Stripe custom field.
 * In SETUP.md you'll name that field's key "booking_date_time" — adjust
 * here if you name it differently.
 */
function extractBookingTimeText(session) {
  const fields = session.custom_fields || [];
  const field = fields.find(function (f) { return f.key === 'booking_date_time'; });
  if (field && field.text && field.text.value) {
    return field.text.value.trim();
  }
  return '';
}

/**
 * Looks through upcoming Studio B calendar holds for one whose title or
 * description contains the date/time text the client provided, and tags
 * it as paid. If nothing matches, logs it so you can check manually.
 */
function markMatchingEventAsPaid(clientText, payerEmail) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const now = new Date();
  const searchWindowEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // next 60 days
  const events = calendar.getEvents(now, searchWindowEnd);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const title = event.getTitle() || '';
    const description = event.getDescription() || '';

    if (title.indexOf(PAID_PREFIX) === 0) continue; // already tagged paid

    if (clientText && (title.indexOf(clientText) !== -1 || description.indexOf(clientText) !== -1)) {
      event.setTitle(PAID_PREFIX + title);
      return;
    }
  }

  Logger.log(
    'Could not auto-match a payment to a calendar hold. ' +
    'Client-entered time: "' + clientText + '", payer email: ' + payerEmail +
    '. Please check the calendar manually.'
  );
}

/**
 * Run on a repeating timer (see SETUP.md). Deletes any Studio B calendar
 * hold that is older than HOLD_HOURS and was never tagged "[PAID]".
 */
function releaseUnpaidHolds() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const now = new Date();
  const lookBack = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // catch holds up to a week old
  const lookAhead = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(lookBack, lookAhead);

  events.forEach(function (event) {
    const title = event.getTitle() || '';
    if (title.indexOf(PAID_PREFIX) === 0) return; // paid, keep it

    const created = event.getDateCreated();
    const hoursSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreated >= HOLD_HOURS) {
      Logger.log('Releasing unpaid hold: "' + title + '" (created ' + created + ')');
      event.deleteEvent();
    }
  });
}
