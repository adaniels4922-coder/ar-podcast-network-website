document.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
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

    if (typeof SITE_CONFIG !== 'undefined') {
      if (payIndividualBtn) payIndividualBtn.href = SITE_CONFIG.stripePaymentLinkIndividual;
      if (payBusinessBtn) payBusinessBtn.href = SITE_CONFIG.stripePaymentLinkBusiness;
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
    }

    function refreshPayButtonsVisibility() {
      var hasRate = rateSelect.value === 'individual' || rateSelect.value === 'business';
      var confirmed = !confirmCheckbox || confirmCheckbox.checked;
      if (payButtons) {
        payButtons.classList.toggle('visible', hasRate && confirmed);
      }
    }

    rateSelect.addEventListener('change', updateRateDisplay);
    if (confirmCheckbox) {
      confirmCheckbox.addEventListener('change', refreshPayButtonsVisibility);
    }

    updateRateDisplay();
  }
});
