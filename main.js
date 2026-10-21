// ─── LOADER (hanya kunjungan pertama dalam satu sesi) ─────────────────────────
(function() {
  var loader = document.getElementById('loader');
  var nav = document.getElementById('nav');
  var heroSub = document.getElementById('hero-sub');
  var heroCta = document.getElementById('hero-cta');
  var waFloat = document.getElementById('wa-float');
  var hlines = [document.getElementById('hline1'), document.getElementById('hline2'), document.getElementById('hline3')];
  var seen = false;
  try { seen = sessionStorage.getItem('icb-intro') === '1'; } catch (e) {}
  if (seen && loader) loader.style.display = 'none';

  function start() {
    if (!seen && loader) {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      try { sessionStorage.setItem('icb-intro', '1'); } catch (e) {}
    }
    nav.classList.add('visible');
    hlines.forEach(function(l, i) {
      setTimeout(function() { l.classList.add('vis'); }, 80 + i * 90);
    });
    setTimeout(function() { heroSub.classList.add('vis'); }, 250);
    setTimeout(function() { heroCta.classList.add('vis'); }, 380);
    var heroTrust = document.getElementById('hero-trust');
    var heroVisual = document.getElementById('hero-visual');
    if (heroTrust) setTimeout(function() { heroTrust.classList.add('vis'); }, 500);
    if (heroVisual) {
      setTimeout(function() { heroVisual.classList.add('vis'); }, 300);
      var isMobile = window.matchMedia('(max-width: 900px)').matches;
      if (isMobile) {
        // Buka kunci HP setelah bingkainya benar-benar terlihat di layar
        var phoneUnlockObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              phoneUnlockObserver.disconnect();
              setTimeout(function() { if (window.__htcUnlockPhone) window.__htcUnlockPhone(); }, 900);
            }
          });
        }, { threshold: 0.45 });
        phoneUnlockObserver.observe(heroVisual);
        setTimeout(function() { if (window.__htcUnlockPhone) window.__htcUnlockPhone(); }, 8000);
      } else {
        setTimeout(function() { if (window.__htcUnlockPhone) window.__htcUnlockPhone(); }, 1700);
      }
    }
    setTimeout(function() { waFloat.classList.add('vis'); }, 650);
  }
  setTimeout(start, seen ? 0 : 1700);
})();

// ─── TESTIMONIAL CAROUSEL: ROTATING CARDS ────────────
(function() {
  var wrap = document.getElementById('htcWrap');
  if (!wrap) return;

  var cards = wrap.querySelectorAll('.htc-card');
  var dots  = wrap.querySelectorAll('.htc-dot');
  var lock  = document.getElementById('htcLock');
  var lockTimeEl = document.getElementById('htcLockTime');
  var lockDateEl = document.getElementById('htcLockDate');
  var current = 0;
  var timer = null;
  var unlocked = false;

  function updateLockClock() {
    if (!lockTimeEl || !lockDateEl) return;
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    lockTimeEl.textContent = hh + ':' + mm;
    var days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    var months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    lockDateEl.textContent = days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
  }
  updateLockClock();
  setInterval(updateLockClock, 1000);

  function unlockPhone() {
    if (unlocked || !lock) return;
    unlocked = true;
    lock.classList.add('unlocking');
    setTimeout(function() {
      lock.style.display = 'none';
    }, 780);
  }

  function goTo(i) {
    cards[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = i % cards.length;
    cards[current].classList.add('active');
    dots[current].classList.add('active');
  }

  dots.forEach(function(dot, i) {
    dot.addEventListener('click', function() {
      goTo(i);
      resetTimer();
    });
  });

  function startLoop() {
    if (timer) return;
    timer = setInterval(function() { goTo(current + 1); }, 4200);
  }
  function stopLoop() {
    clearInterval(timer);
    timer = null;
  }
  function resetTimer() {
    stopLoop();
    startLoop();
  }

  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) startLoop();
      else stopLoop();
    });
  }, { threshold: 0.2 });
  io.observe(wrap);

  window.__htcUnlockPhone = unlockPhone;
})();

// ─── NAV SOLID ─────────────────────────
window.addEventListener('scroll', function() {
  document.getElementById('nav').classList.toggle('solid', window.scrollY > 40);
}, { passive: true });

// ─── MOBILE MENU ─────────────────────────
function setMenu(open) {
  document.getElementById('mm').classList.toggle('open', open);
  document.getElementById('hbg').classList.toggle('open', open);
  document.getElementById('mm-overlay').classList.toggle('open', open);
  document.getElementById('nav').classList.toggle('menu-open', open);
  document.getElementById('hbg').setAttribute('aria-expanded', open ? 'true' : 'false');
  document.getElementById('hbg').setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  document.body.style.overflow = open ? 'hidden' : '';
}
function toggleMenu() { setMenu(!document.getElementById('mm').classList.contains('open')); }
function closeMenu() { setMenu(false); }
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', function() { if (window.innerWidth > 900) closeMenu(); });

// ─── SCROLL REVEAL ─────────────────────────
var observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('vis');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.rv, .rv-l, .rv-r').forEach(function(el) {
  observer.observe(el);
});

// ─── COUNT-UP NUMBERS ─────────────────────────
(function() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatNumber(val, decimals) {
    if (decimals > 0) return val.toFixed(decimals).replace('.', ',');
    return Math.round(val).toLocaleString('id-ID');
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

    if (reduceMotion || isNaN(target)) {
      el.textContent = formatNumber(target, decimals) + suffix;
      return;
    }

    var duration = 2200;
    var startTime = null;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = easeOutCubic(progress);
      var current = target * eased;
      el.textContent = formatNumber(current, decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target, decimals) + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.counter').forEach(function(el) {
    counterObserver.observe(el);
  });
})();

// ─── ACCORDION (Brands / Struktur Organisasi) ──────────────────────────────────
var accGroups = {
  org:    { toggle: document.getElementById('orgToggle'),    panel: document.getElementById('orgPanel'),    label: 'Lihat Struktur Tim',          labelOpen: 'Sembunyikan Struktur Tim' },

};

function accSetState(key, open) {
  var g = accGroups[key];
  if (!g || !g.toggle || !g.panel) return;
  g.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  g.panel.setAttribute('data-open', open ? 'true' : 'false');
  var labelEl = g.toggle.querySelector('.acc-toggle-label');
  if (labelEl) labelEl.textContent = open ? g.labelOpen : g.label;
}

function orgResetCards() {
  var panel = document.getElementById('orgPanel');
  if (!panel) return;
  panel.querySelectorAll('.org-card, .org-connector-v').forEach(function(el) {
    ['org-anim-owner','org-anim-card','org-anim-wire','org-wire-done'].forEach(function(c) {
      el.classList.remove(c);
    });
    el.classList.add('org-hidden');
  });
}

function orgRevealSequential() {
  var panel = document.getElementById('orgPanel');
  if (!panel) return;
  var cards      = Array.from(panel.querySelectorAll('.org-card'));
  var connectors = Array.from(panel.querySelectorAll('.org-connector-v'));

  // Helper: animate a card with specific class
  function revealCard(el, cls, delay) {
    if (!el) return;
    setTimeout(function() {
      el.classList.remove('org-hidden');
      el.classList.add(cls);
    }, delay);
  }

  // Helper: grow connector wire, then add pulse after
  function revealWire(el, delay) {
    if (!el) return;
    setTimeout(function() {
      el.classList.remove('org-hidden');
      el.classList.add('org-anim-wire');
      // pulse after wire finishes growing
      setTimeout(function() {
        el.classList.add('org-wire-done');
      }, 600);
    }, delay);
  }

  // ── SEQUENCE ─────────────────────────────────────────────────
  // Slower & more dramatic: total ~2.8s for all 6 members
  // Owner (special entrance)
  revealCard(cards[0], 'org-anim-owner', 0);

  // Wire 1 grows down from owner
  revealWire(connectors[0], 700);

  // Wakil Owner
  revealCard(cards[1], 'org-anim-card', 1100);

  // Wire 2
  revealWire(connectors[1], 1700);

  // Siti & Sonia side by side (staggered 120ms)
  revealCard(cards[2], 'org-anim-card', 2050);
  revealCard(cards[3], 'org-anim-card', 2170);

  // Wire 3
  revealWire(connectors[2], 2700);

  // Aini & Fadia (staggered 120ms)
  revealCard(cards[4], 'org-anim-card', 3050);
  revealCard(cards[5], 'org-anim-card', 3170);
}

function accToggle(key) {
  var g = accGroups[key];
  if (!g) return;
  var isOpen = g.panel.getAttribute('data-open') === 'true';
  Object.keys(accGroups).forEach(function(k) { accSetState(k, false); });
  orgResetCards();

  if (!isOpen) {
    accSetState(key, true);
    if (key === 'org') {
      // wait for accordion open transition (~200ms) then start
      setTimeout(orgRevealSequential, 260);
    }
    setTimeout(function() {
      var headEl = g.toggle.closest('.org-head');
      var anchor = headEl || g.toggle;
      var rect = anchor.getBoundingClientRect();
      if (rect.top < 0) {
        window.scrollTo({ top: window.scrollY + rect.top - 90, behavior: 'smooth' });
      }
    }, 80);
  }
}

// Hide org cards on page load
window.addEventListener('DOMContentLoaded', function() {
  orgResetCards();
});

document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
