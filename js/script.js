(function () {
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var toggle = document.querySelector('.nav__toggle');
  var menu = document.querySelector('.nav__menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('active');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealEls = document.querySelectorAll('.reveal');
  var counters = document.querySelectorAll('.stat__value');
  var observerFired = false;

  function showEl(el) { el.classList.add('is-visible'); }

  function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reducedMotionQuery.matches) {
      el.textContent = target + suffix;
      return;
    }
    var duration = 1400;
    var startTime = null;
    var finished = false;
    function step(timestamp) {
      if (finished) return;
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        finished = true;
      }
    }
    requestAnimationFrame(step);
    // Gdyby animacja nie ruszyła (albo była mocno spowolniona),
    // pokaż końcową liczbę i zatrzymaj animację, żeby jej nie nadpisała.
    setTimeout(function () {
      if (!finished) {
        finished = true;
        el.textContent = target + suffix;
      }
    }, duration + 300);
  }

  function showEverything() {
    revealEls.forEach(showEl);
    counters.forEach(runCounter);
  }

  if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
    showEverything();
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      observerFired = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          showEl(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });

    var counterObserver = new IntersectionObserver(function (entries) {
      observerFired = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { counterObserver.observe(el); });

    // Siatka bezpieczeństwa: gdyby IntersectionObserver nie zadziałał,
    // po sekundzie pokaż całą treść, żeby strona nigdy nie została pusta.
    setTimeout(function () {
      if (!observerFired) showEverything();
    }, 1000);
  }

  var slider = document.querySelector('.slider');
  if (!slider) return;

  if (!reducedMotionQuery.matches) {
    var parallaxTicking = false;
    window.addEventListener('scroll', function () {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(function () {
        var offset = window.scrollY;
        if (offset < window.innerHeight * 1.2) {
          var shift = offset * 0.12;
          slider.querySelectorAll('.slide picture').forEach(function (pic) {
            pic.style.transform = 'translate3d(0,' + shift + 'px,0) scale(1.3)';
          });
        }
        parallaxTicking = false;
      });
    }, { passive: true });
  }

  var slides = Array.prototype.slice.call(slider.querySelectorAll('.slide'));
  var dotsWrap = slider.querySelector('.slider__dots');
  var prevBtn = slider.querySelector('.slider__arrow--prev');
  var nextBtn = slider.querySelector('.slider__arrow--next');
  var current = 0;
  var timer = null;
  var INTERVAL = 6000;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var dots = slides.map(function (_, i) {
    var dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' slider__dot--active' : '');
    dot.setAttribute('aria-label', 'Slajd ' + (i + 1));
    dot.addEventListener('click', function () {
      goTo(i);
      restart();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    slides[current].classList.remove('slide--active');
    dots[current].classList.remove('slider__dot--active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('slide--active');
    dots[current].classList.add('slider__dot--active');
  }

  function start() {
    if (reducedMotion || timer) return;
    timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function restart() { stop(); start(); }

  prevBtn.addEventListener('click', function () { goTo(current - 1); restart(); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); restart(); });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  var touchStartX = null;
  slider.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].clientX;
    stop();
  }, { passive: true });
  slider.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    touchStartX = null;
    start();
  }, { passive: true });

  start();
})();

// =====================================================
// Śledzenie kliknięć w telefon (GA4) — event "phone_click"
// =====================================================
(function () {
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'phone_click', {
          phone_number: this.getAttribute('href').replace('tel:', ''),
          link_text: this.textContent.trim(),
          page_location: window.location.pathname
        });
      }
    });
  });
})();

// =====================================================
// Baner cookies + Google Consent Mode v2 (RODO)
// GA4 rusza dopiero po kliknięciu "Akceptuję".
// =====================================================
(function () {
  'use strict';

  var COOKIE_KEY = 'cookies-consent-v2';
  var banner = document.querySelector('.cookie-banner');
  var acceptBtn = document.querySelector('[data-cookie-action="accept"]');
  var rejectBtn = document.querySelector('[data-cookie-action="reject"]');

  // 'granted' = GA4 zbiera anonimowe statystyki, 'denied' = nie zbiera nic.
  function updateGoogleConsent(granted) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'analytics_storage': granted ? 'granted' : 'denied',
        // ad_* zawsze denied — strona nie używa reklam Google
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
  }

  if (!banner) return;

  var consent = localStorage.getItem(COOKIE_KEY);

  if (consent === 'accepted') {
    // Wcześniej zaakceptowano — włącz GA4 od razu, bez pokazywania banera
    updateGoogleConsent(true);
  } else if (consent !== 'rejected') {
    // Brak decyzji — pokaż baner po chwili
    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 800);
  }

  function decide(value) {
    localStorage.setItem(COOKIE_KEY, value);
    updateGoogleConsent(value === 'accepted');
    banner.classList.remove('is-visible');
    // Mapa Google nasłuchuje tego zdarzenia i wczytuje się bez przeładowania strony
    document.dispatchEvent(new CustomEvent('cookies-decision', { detail: value }));
  }

  if (acceptBtn) acceptBtn.addEventListener('click', function () { decide('accepted'); });
  if (rejectBtn) rejectBtn.addEventListener('click', function () { decide('rejected'); });
})();

// =====================================================
// Mapa Google dopiero za zgodą (RODO)
// Bez zgody iframe ma tylko data-src, więc przeglądarka nie łączy się
// z Google. Adres IP odwiedzającego trafia tam dopiero po kliknięciu
// "Akceptuję" w banerze albo "Pokaż mapę" na samej zaślepce.
// =====================================================

(function () {
  'use strict';

  var COOKIE_KEY = 'cookies-consent-v2';
  var kontenery = document.querySelectorAll('[data-map-consent]');
  if (!kontenery.length) return;

  function pokazMape(kontener) {
    var ramka = kontener.querySelector('iframe[data-src]');
    if (!ramka) return;
    ramka.src = ramka.getAttribute('data-src');
    ramka.removeAttribute('data-src');
    kontener.classList.add('is-map-loaded');
  }

  var zgoda = localStorage.getItem(COOKIE_KEY) === 'accepted';

  Array.prototype.forEach.call(kontenery, function (kontener) {
    if (zgoda) {
      pokazMape(kontener);
      return;
    }
    var przycisk = kontener.querySelector('[data-map-action="load"]');
    if (przycisk) {
      przycisk.addEventListener('click', function () { pokazMape(kontener); });
    }
  });

  // Ktoś kliknął "Akceptuję" już po wejściu na stronę — dociągamy mapę od razu
  document.addEventListener('cookies-decision', function (e) {
    if (e.detail === 'accepted') Array.prototype.forEach.call(kontenery, pokazMape);
  });
})();
