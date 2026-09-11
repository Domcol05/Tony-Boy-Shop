import gsap from 'gsap';
import Lenis from 'lenis';

/* ==========================================================================
   1. LENIS SMOOTH SCROLL SETUP
   ========================================================================== */
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.4,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Anchor Links Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId && targetId !== '#') {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -70, duration: 1.1 });
      }
    }
  });
});

/* ==========================================================================
   2. PRELOADER DISMISSAL
   ========================================================================== */
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

window.addEventListener('load', () => {
  if (progressBar) progressBar.style.width = '100%';
  if (progressText) progressText.innerText = '100%';
  setTimeout(() => {
    if (preloader) preloader.classList.add('hidden');
  }, 250);
});

// Fallback in case load already fired
setTimeout(() => {
  if (preloader && !preloader.classList.contains('hidden')) {
    preloader.classList.add('hidden');
  }
}, 800);

/* ==========================================================================
   3. PACKSHOT VIEWER (FRONTE LISCIO & RETRO CON GRAFICA GOING HARD)
   ========================================================================== */
const packshotFrame = document.getElementById('packshot-frame');
const frontImg = document.getElementById('packshot-img-front');
const backImg = document.getElementById('packshot-img-back');
const packshotBadge = document.getElementById('packshot-badge');
const flipBtn = document.getElementById('packshot-flip-btn');
const thumbBtns = document.querySelectorAll('.packshot-thumb-btn');

let currentView = 'back'; // 'front' or 'back' (default: back view upon opening)

function setPackshotView(view) {
  currentView = view;

  if (view === 'front') {
    if (frontImg) frontImg.classList.add('active');
    if (backImg) backImg.classList.remove('active');
    if (packshotBadge) packshotBadge.textContent = 'FRONTE // MINIMAL CUT';
  } else {
    if (frontImg) frontImg.classList.remove('active');
    if (backImg) backImg.classList.add('active');
    if (packshotBadge) packshotBadge.textContent = 'RETRO // GOING HARD SERIGRAFIA';
  }

  // Update thumb buttons
  thumbBtns.forEach((btn) => {
    if (btn.dataset.view === view) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Thumb buttons click
thumbBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const view = e.currentTarget.dataset.view;
    setPackshotView(view);
  });
});

// Flip Button click
if (flipBtn) {
  flipBtn.addEventListener('click', () => {
    const nextView = currentView === 'front' ? 'back' : 'front';
    setPackshotView(nextView);
  });
}

// Click on the packshot image directly flips between front and back
if (packshotFrame) {
  packshotFrame.addEventListener('click', (e) => {
    if (e.target.closest('#packshot-flip-btn')) return;
    const nextView = currentView === 'front' ? 'back' : 'front';
    setPackshotView(nextView);
  });

  // Interactive subtle pan on mouse move (Desktop)
  packshotFrame.addEventListener('mousemove', (e) => {
    const rect = packshotFrame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const activeImg = currentView === 'front' ? frontImg : backImg;
    if (activeImg) {
      const moveX = (x - 0.5) * 16;
      const moveY = (y - 0.5) * 16;
      activeImg.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
    }
  });

  packshotFrame.addEventListener('mouseleave', () => {
    const activeImg = currentView === 'front' ? frontImg : backImg;
    if (activeImg) {
      activeImg.style.transform = 'scale(1) translate(0px, 0px)';
    }
  });
}

/* ==========================================================================
   4. E-COMMERCE SELECTION & CHECKOUT INTERACTIONS
   ========================================================================== */

// Size Selector [ S ] [ M ] [ L ] [ XL ]
const sizeBtns = document.querySelectorAll('.size-btn');
let selectedSize = 'M';

sizeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    sizeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSize = btn.dataset.size;
  });
});

// Quantity Stepper
let quantity = 1;
const qtyMinus = document.getElementById('qty-minus');
const qtyPlus = document.getElementById('qty-plus');
const qtyValue = document.getElementById('qty-value');

if (qtyMinus && qtyPlus && qtyValue) {
  qtyMinus.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyValue.textContent = quantity;
    }
  });

  qtyPlus.addEventListener('click', () => {
    if (quantity < 10) {
      quantity++;
      qtyValue.textContent = quantity;
    }
  });
}

// Add To Cart & Toast Notification
const buyBtn = document.getElementById('buy-btn');
const cartCounter = document.getElementById('cart-counter');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
let totalCartItems = 0;

function triggerToast(text) {
  if (toast && toastMessage) {
    toastMessage.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

if (buyBtn) {
  buyBtn.addEventListener('click', () => {
    totalCartItems += quantity;
    if (cartCounter) {
      cartCounter.textContent = totalCartItems;
      gsap.fromTo(
        cartCounter,
        { scale: 1.6, backgroundColor: '#ffffff', color: '#08080a' },
        { scale: 1, backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', duration: 0.4, ease: 'back.out(2)' }
      );
    }

    triggerToast(`Aggiunto al carrello: Going Hard 2 Box Tee Pitch Black (${selectedSize}) x${quantity}`);
  });
}

// Size Guide Modal
const openSizeGuide = document.getElementById('open-size-guide');
const closeSizeModal = document.getElementById('close-modal');
const sizeModal = document.getElementById('size-modal');

function showModal() {
  if (sizeModal) {
    sizeModal.classList.add('open');
    sizeModal.setAttribute('aria-hidden', 'false');
  }
}

function hideModal() {
  if (sizeModal) {
    sizeModal.classList.remove('open');
    sizeModal.setAttribute('aria-hidden', 'true');
  }
}

if (openSizeGuide && sizeModal && closeSizeModal) {
  openSizeGuide.addEventListener('click', showModal);
  closeSizeModal.addEventListener('click', hideModal);

  sizeModal.addEventListener('click', (e) => {
    if (e.target === sizeModal) hideModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sizeModal.classList.contains('open')) hideModal();
  });
}

/* ==========================================================================
   5. MINIMAL FAQ ACCORDION
   ========================================================================== */
const faqRows = document.querySelectorAll('.faq-row');

faqRows.forEach((row) => {
  const trigger = row.querySelector('.faq-trigger');
  if (trigger) {
    trigger.addEventListener('click', () => {
      const isCurrentlyActive = row.classList.contains('active');

      faqRows.forEach((r) => {
        r.classList.remove('active');
        const t = r.querySelector('.faq-trigger');
        const icon = r.querySelector('.faq-toggle-icon');
        if (t) t.setAttribute('aria-expanded', 'false');
        if (icon) icon.textContent = '+';
      });

      if (!isCurrentlyActive) {
        row.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        const icon = row.querySelector('.faq-toggle-icon');
        if (icon) icon.textContent = '−';
      }
    });
  }
});

/* ==========================================================================
   6. NEWSLETTER SUBMISSION
   ========================================================================== */
const newsletterForm = document.getElementById('newsletter-form');
const newsletterFeedback = document.getElementById('newsletter-feedback');

if (newsletterForm && newsletterFeedback) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterFeedback.style.display = 'block';
    newsletterForm.reset();
  });
}