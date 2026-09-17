document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* Fade/lift elements in as they scroll into view */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Highlight the current page in the nav */
  var currentPage = document.body.getAttribute('data-page');
  if (currentPage) {
    document.querySelectorAll('.nav-links a[data-page]').forEach(function (link) {
      if (link.getAttribute('data-page') === currentPage) {
        link.classList.add('active');
      }
    });
  }

  /* Book page: calendar embed + rate dropdown */
  var calendarFrame = document.getElementById('calendar-embed');
  if (calendarFrame && typeof SITE_CONFIG !== 'undefined') {
    calendarFrame.src = SITE_CONFIG.googleCalendarEmbedUrl;
  }

  var rateSelect = document.getElementById('rate-select');
  if (rateSelect) {
    var rateAmountEl = document.getElementById('rate-amount');
    var payButtons = document.getElementById('pay-buttons');
    var payIndividualBtn = document.getElementById('pay-individual');
    var payBusinessBtn = document.getElementById('pay-business');
    var confirmCheckbox = document.getElementById('rate-confirm');
    var confirmDate = document.getElementById('confirm-date');
    var confirmTime = document.getElementById('confirm-time');
    var timePreview = document.getElementById('time-preview');
    var copyBtn = document.getElementById('copy-time-btn');
    var formattedTime = '';

    if (typeof SITE_CONFIG !== 'undefined') {
      if (payIndividualBtn) payIndividualBtn.href = SITE_CONFIG.stripePaymentLinkIndividual;
      if (payBusinessBtn) payBusinessBtn.href = SITE_CONFIG.stripePaymentLinkBusiness;
    }

    /* Remember in-progress selections for this browser tab only, so an
       accidental refresh doesn't lose what the visitor already picked. */
    var STORAGE_KEY = 'studioBBookingDraft';

    function saveDraft() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          rate: rateSelect.value,
          confirmed: !!(confirmCheckbox && confirmCheckbox.checked),
          date: confirmDate ? confirmDate.value : '',
          time: confirmTime ? confirmTime.value : ''
        }));
      } catch (err) { /* sessionStorage unavailable (private mode, etc.) — fine to skip */ }
    }

    function restoreDraft() {
      try {
        var raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var draft = JSON.parse(raw);
        if (draft.rate) rateSelect.value = draft.rate;
        if (confirmCheckbox && draft.confirmed) confirmCheckbox.checked = true;
        if (confirmDate && draft.date) confirmDate.value = draft.date;
        if (confirmTime && draft.time) confirmTime.value = draft.time;
      } catch (err) { /* corrupted or unavailable — start fresh */ }
    }

    function updateRateDisplay() {
      var value = rateSelect.value;

      if (value === 'individual') {
        rateAmountEl.textContent = '$100/hr — Individual / Creator rate';
      } else if (value === 'business') {
        rateAmountEl.textContent = '$150/hr — Business rate';
      } else {
        rateAmountEl.textContent = 'Select an option above to see your rate';
      }

      if (payIndividualBtn) payIndividualBtn.style.display = value === 'individual' ? 'inline-block' : 'none';
      if (payBusinessBtn) payBusinessBtn.style.display = value === 'business' ? 'inline-block' : 'none';

      refreshPayButtonsVisibility();
      saveDraft();
    }

    function refreshPayButtonsVisibility() {
      var hasRate = rateSelect.value === 'individual' || rateSelect.value === 'business';
      var confirmed = !confirmCheckbox || confirmCheckbox.checked;
      if (payButtons) {
        payButtons.classList.toggle('visible', hasRate && confirmed);
      }
    }

    function updateTimePreview() {
      if (!confirmDate || !confirmTime || !timePreview || !copyBtn) return;

      if (!confirmDate.value || !confirmTime.value) {
        timePreview.textContent = 'Fill in the date and time above to generate a copyable confirmation line.';
        copyBtn.disabled = true;
        formattedTime = '';
        saveDraft();
        return;
      }

      var dateParts = confirmDate.value.split('-');
      var timeParts = confirmTime.value.split(':');
      var picked = new Date(
        Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]),
        Number(timeParts[0]), Number(timeParts[1])
      );

      var humanReadable = picked.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) +
        ' at ' + picked.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      /* The parenthesized part isn't for the customer — it's a
         machine-readable copy so our Apps Script automation can reliably
         match this payment to the right calendar hold instead of guessing
         from free text. Keep it when you copy/paste; it's harmless either
         way. */
      formattedTime = humanReadable + ' (' + confirmDate.value + 'T' + confirmTime.value + ')';

      timePreview.textContent = humanReadable;
      copyBtn.disabled = false;
      saveDraft();
    }

    function fallbackCopy(text, done) {
      var tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      try { document.execCommand('copy'); } catch (err) { /* clipboard unavailable — user can still select the text manually */ }
      document.body.removeChild(tempInput);
      done();
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        if (!formattedTime) return;
        var originalLabel = 'Copy to clipboard';
        function showCopied() {
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = originalLabel; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(formattedTime).then(showCopied).catch(function () {
            fallbackCopy(formattedTime, showCopied);
          });
        } else {
          fallbackCopy(formattedTime, showCopied);
        }
      });
    }

    rateSelect.addEventListener('change', updateRateDisplay);
    if (confirmCheckbox) {
      confirmCheckbox.addEventListener('change', function () {
        refreshPayButtonsVisibility();
        saveDraft();
      });
    }
    if (confirmDate) confirmDate.addEventListener('change', updateTimePreview);
    if (confirmTime) confirmTime.addEventListener('change', updateTimePreview);

    restoreDraft();
    updateRateDisplay();
    updateTimePreview();
  }
});
