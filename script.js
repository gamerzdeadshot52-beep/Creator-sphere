/* ============================================================
   CREATORSPHERE — script.js
   Vanilla JavaScript only. No dependencies, no build step.
   ------------------------------------------------------------
   TABLE OF CONTENTS
     1.  Configuration
     2.  Helpers
     3.  Header: scroll state + progress bar
     4.  Mobile navigation
     5.  Reveal-on-scroll animations
     6.  Active nav link tracking
     7.  Growth Loop interaction
     8.  Pathway / hero role pre-selection
     9.  Hero micro-parallax
     10. Contact form validation + delivery
     11. Footer year
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. CONFIGURATION
     ----------------------------------------------------------

     CONTACT FORM
     -----------
     GitHub Pages is static hosting: there is no server and no
     database, so this form does NOT store or send anything by
     itself. To start receiving inquiries, point `formEndpoint`
     at any form service that accepts a POST request, for example:

       Formspree  : 'https://formspree.io/f/xxxxxxxx'
       Basin      : 'https://submit-form.com/xxxxxxxx'
       Getform    : 'https://getform.io/f/xxxxxxxx'
       Web3Forms  : 'https://api.web3forms.com/submit'
       Google     : use the form's "action" URL (see below)

     Steps:
       1. Create a form with your chosen service.
       2. Paste its endpoint URL below (keep the quotes).
       3. Save and refresh the page — submissions will then be
          sent with fetch() as JSON and confirmed in the status
          message under the Send Inquiry button.

     If you would rather let the browser submit natively (useful
     for Google Forms / FormSubmit), replace the fetch() call in
     section 10 with:
         form.action = CONFIG.formEndpoint;
         form.method = 'POST';
         form.submit();

     While `formEndpoint` is null, the form only validates the
     input and clearly tells the visitor that delivery is not
     yet configured — nothing is stored anywhere.
     ---------------------------------------------------------- */
  var CONFIG = {
    formEndpoint: null,   // <-- paste your form service URL here
    formMethod: 'POST'
  };

  /* ----------------------------------------------------------
     2. HELPERS
     ---------------------------------------------------------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // set by the reveal block; called from the scroll handler as a fallback
  var sweepReveal = null;

  /* ----------------------------------------------------------
     3. HEADER: scroll state + progress bar
     ---------------------------------------------------------- */
  var header    = $('#siteHeader');
  var progressBar = $('#scrollProgressBar');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    if (header) header.classList.toggle('is-scrolled', y > 24);

    if (progressBar) {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      var pct = Math.min(Math.max(y / max, 0), 1) * 100;
      progressBar.style.width = pct.toFixed(2) + '%';
    }

    if (sweepReveal) sweepReveal();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------
     4. MOBILE NAVIGATION
     ---------------------------------------------------------- */
  var navToggle = $('#navToggle');
  var mobileMenu = $('#mobileMenu');
  var menuOpen = false;

  function setMenu(open) {
    if (!navToggle || !mobileMenu || open === menuOpen) return;
    menuOpen = open;

    if (open) {
      mobileMenu.hidden = false;
      // force a style pass so the slide-in transition runs reliably
      void mobileMenu.offsetWidth;
      mobileMenu.classList.add('is-open');
      navToggle.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
      navToggle.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('menu-open');

      var firstLink = $('.mobile-menu__list a', mobileMenu);
      if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 320);
    } else {
      mobileMenu.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('menu-open');
      window.setTimeout(function () {
        if (!menuOpen) mobileMenu.hidden = true;
      }, 560);
    }
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () { setMenu(!menuOpen); });

    $$('[data-menu-close]', mobileMenu).forEach(function (el) {
      el.addEventListener('click', function () { setMenu(false); });
    });

    $$('a[href^="#"]', mobileMenu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) {
        setMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 980 && menuOpen) setMenu(false);
    });
  }

  /* ----------------------------------------------------------
     5. REVEAL-ON-SCROLL
     ---------------------------------------------------------- */
  var revealEls = $$('[data-reveal]');

  function showEl(el) {
    el.classList.add('is-revealed');
  }

  function inView(el) {
    var rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.94 && rect.bottom > 0;
  }

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(showEl);
  } else {
    // stagger the children of grouped grids
    $$('[data-reveal-group]').forEach(function (group) {
      $$('[data-reveal]', group).forEach(function (el, i) {
        if (!el.style.getPropertyValue('--delay')) {
          el.style.setProperty('--delay', ((i % 4) * 0.07).toFixed(2) + 's');
        }
      });
    });

    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          showEl(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    // anything already on screen at load is revealed on the next frame, so
    // the entrance animation runs and never depends on a later observer tick
    var initial = [];
    revealEls.forEach(function (el) {
      if (inView(el)) initial.push(el);
      else revealObserver.observe(el);
    });

    if (initial.length) {
      // force a style pass first so the entrance transition actually runs
      initial.forEach(function (el) { void el.offsetWidth; });
      initial.forEach(showEl);
    }

    // belt and braces: reveal whatever has scrolled into view even if the
    // observer never delivers a callback
    sweepReveal = function () {
      revealEls.forEach(function (el) {
        if (!el.classList.contains('is-revealed') && inView(el)) showEl(el);
      });
    };

    // safety net: if the observer never fires, reveal what is on screen
    window.setTimeout(function () {
      revealEls.forEach(function (el) {
        if (!el.classList.contains('is-revealed') && inView(el)) showEl(el);
      });
    }, 1600);
  }

  /* ----------------------------------------------------------
     6. ACTIVE NAV LINK
     ---------------------------------------------------------- */
  var navLinks = $$('.nav__link');
  var watched = ['home', 'services', 'approach', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if (navLinks.length && watched.length && 'IntersectionObserver' in window) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-current', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    watched.forEach(function (section) { activeObserver.observe(section); });
  }

  /* ----------------------------------------------------------
     7. GROWTH LOOP INTERACTION
     ---------------------------------------------------------- */
  var stageNodes = $$('.loop-node');
  var stageSteps = $$('.loop-step');
  var stageArcs  = $$('.loop-arcs path');

  function setStage(stage) {
    stageNodes.forEach(function (el) {
      var on = el.getAttribute('data-stage') === stage;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    stageSteps.forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-stage') === stage);
    });
    stageArcs.forEach(function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-stage') === stage);
    });
  }

  if (stageNodes.length) {
    setStage('1');

    stageNodes.forEach(function (node) {
      var stage = node.getAttribute('data-stage');
      node.addEventListener('click', function () { setStage(stage); });
      node.addEventListener('focus', function () { setStage(stage); });
      node.addEventListener('mouseenter', function () { setStage(stage); });
    });

    stageSteps.forEach(function (step) {
      var stage = step.getAttribute('data-stage');
      step.addEventListener('mouseenter', function () { setStage(stage); });
      step.addEventListener('click', function () { setStage(stage); });
    });
  }

  /* ----------------------------------------------------------
     8. ROLE PRE-SELECTION (hero + pathway buttons)
     ---------------------------------------------------------- */
  $$('[data-role]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var role = btn.getAttribute('data-role');
      var input = document.getElementById(role === 'brand' ? 'roleBrand' : 'roleCreator');
      if (input && !input.checked) {
        input.checked = true;
        clearError(input);
      }
    });
  });

  /* ----------------------------------------------------------
     9. HERO MICRO-PARALLAX
     ---------------------------------------------------------- */
  var hero = $('.hero');
  var ecosystem = $('.ecosystem');

  if (hero && ecosystem && !reduceMotion &&
      window.matchMedia('(pointer: fine)').matches) {
    var frame = null;
    hero.addEventListener('mousemove', function (e) {
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var dx = (e.clientX - rect.left) / rect.width  - 0.5;
        var dy = (e.clientY - rect.top)  / rect.height - 0.5;
        ecosystem.style.transform =
          'translate3d(' + (dx * 12).toFixed(2) + 'px,' + (dy * 12).toFixed(2) + 'px,0)';
        frame = null;
      });
    });
    hero.addEventListener('mouseleave', function () {
      ecosystem.style.transform = 'translate3d(0,0,0)';
    });
  }

  /* ----------------------------------------------------------
     10. CONTACT FORM
     ---------------------------------------------------------- */
  var form = $('#contactForm');
  var statusEl = $('#formStatus');

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function errorElementFor(input) {
    return document.getElementById(input.name + '-error');
  }

  function setError(input, message) {
    var field = input.closest('.field');
    var errorEl = errorElementFor(input);
    if (field) field.classList.toggle('has-error', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function clearError(input) {
    setError(input, '');
  }

  function validateField(input) {
    var value = (input.value || '').trim();
    var message = '';

    switch (input.name) {
      case 'fullName':
        if (value.length < 2) message = 'Please enter your full name.';
        break;
      case 'email':
        if (!value) message = 'Please enter your email address.';
        else if (!EMAIL_RE.test(value)) message = 'Please enter a valid email address.';
        break;
      case 'role': {
        var checked = form.querySelector('input[name="role"]:checked');
        if (!checked) message = 'Please tell us whether you are a creator or a brand.';
        break;
      }
      case 'profile':
        if (value && value.length < 3) message = 'Please enter a valid link or handle.';
        break;
      case 'message':
        if (value.length < 12) message = 'Please share a little more about your goals.';
        break;
    }

    setError(input, message);
    return !message;
  }

  if (form) {
    var inputs = $$('input[name], textarea[name], select[name]', form)
      .filter(function (el) { return el.type !== 'hidden'; });

    inputs.forEach(function (input) {
      var eventName = (input.type === 'radio') ? 'change' : 'blur';
      input.addEventListener(eventName, function () {
        if (input.name === 'role') {
          var anyChecked = form.querySelector('input[name="role"]:checked');
          if (anyChecked) clearError(anyChecked);
          return;
        }
        if (input.getAttribute('aria-invalid') === 'true' || input.value.trim()) {
          validateField(input);
        }
      });
      if (input.type !== 'radio') {
        input.addEventListener('input', function () {
          if (input.getAttribute('aria-invalid') === 'true') validateField(input);
        });
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      inputs.forEach(function (input) {
        var ok = validateField(input);
        if (!ok && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        setStatus('Please review the highlighted fields.', 'is-error');
        firstInvalid.focus();
        return;
      }

      var data = {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        role: (form.querySelector('input[name="role"]:checked') || {}).value || '',
        profile: form.profile.value.trim(),
        service: form.service.value,
        message: form.message.value.trim()
      };

      /* --- no endpoint configured: validate only, store nothing --- */
      if (!CONFIG.formEndpoint) {
        setStatus(
          'Thanks, ' + data.fullName + ' — your inquiry looks good. ' +
          'This site is currently static, so nothing has been sent yet. ' +
          'Add your form endpoint to CONFIG.formEndpoint in script.js to start receiving inquiries.',
          ''
        );
        return;
      }

      /* --- endpoint configured: send it --- */
      var submitBtn = form.querySelector('button[type="submit"]');
      setStatus('Sending your inquiry…', '');
      if (submitBtn) { submitBtn.disabled = true; }

      fetch(CONFIG.formEndpoint, {
        method: CONFIG.formMethod,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          setStatus('Thank you — your inquiry has been sent. We will be in touch.', 'is-success');
        })
        .catch(function () {
          setStatus('Something went wrong while sending. Please try again in a moment.', 'is-error');
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  function setStatus(message, className) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'form-status' + (className ? ' ' + className : '');
  }

  /* ----------------------------------------------------------
     11. FOOTER YEAR
     ---------------------------------------------------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
