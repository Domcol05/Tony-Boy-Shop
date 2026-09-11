import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ==========================================================================
   1. LENIS SMOOTH SCROLL & GSAP SYNC
   ========================================================================== */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  touchMultiplier: 1.5,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// Smooth scroll to anchors
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId && targetId !== '#') {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
      }
    }
  });
});

/* ==========================================================================
   2. THREE.JS SCENE SETUP & STUDIO LIGHTING
   ========================================================================== */
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();

const isInitialSmallMobile = window.innerWidth <= 480;
const isInitialMobile = window.innerWidth <= 768;

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Adjust initial camera Z on mobile so sleeves and garment aren't cropped in portrait
camera.position.set(0, 0, isInitialSmallMobile ? 5.8 : (isInitialMobile ? 5.2 : 4.8));

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Studio Lighting Setup — Going Hard 2 Album Palette
// (Deep atmospheric noir ambient + cool ice-cyan keylight + fiery crimson backlight)
const ambientLight = new THREE.AmbientLight(0x280d16, 1.3);
scene.add(ambientLight);

// Key Light (Cool Electric Ice-Cyan hitting the front contours, just like on Tony Boy's tee in the cover)
const keyLight = new THREE.DirectionalLight(0x7dd3fc, 3.4);
keyLight.position.set(3, 3.5, 4.5);
scene.add(keyLight);

// Fill Light (Soft cool cyan fill from left)
const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
fillLight.position.set(-4, 1.5, 3);
scene.add(fillLight);

// Back Rim Light (Iconic blood-crimson backlight aura from the album backdrop)
const rimLightCrimson = new THREE.DirectionalLight(0xff1744, 4.8);
rimLightCrimson.position.set(0, 3, -4);
scene.add(rimLightCrimson);

// Secondary Warm Rose / Fire Rim on the right
const rimLightRose = new THREE.DirectionalLight(0xf43f5e, 2.4);
rimLightRose.position.set(4, -1.5, -2.5);
scene.add(rimLightRose);

// Top Overhead Crimson Accent
const topLight = new THREE.SpotLight(0xff3355, 2.4, 15, Math.PI / 4, 0.4);
topLight.position.set(0, 6, 1);
scene.add(topLight);

/* ==========================================================================
   3. 3D MODEL LOADING, CENTERING & NORMALIZATION
   ========================================================================== */
const modelPivot = new THREE.Group();
modelPivot.position.set(0, -0.22, 0);
scene.add(modelPivot);

const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

let tshirtMeshes = [];
let isModelLoaded = false;
let autoSpin = false;

// Loading GLTF Model
const loader = new GLTFLoader();
const modelUrl = `${import.meta.env.BASE_URL}models/tshirt.glb`;
loader.load(
  modelUrl,
  (gltf) => {
    const tshirt = gltf.scene;

    // Compute bounding box and normalize
    const box = new THREE.Box3().setFromObject(tshirt);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Fit smoothly into perspective view
    const targetSize = 2.75;
    const scaleFactor = targetSize / maxDim;

    tshirt.scale.setScalar(scaleFactor);
    // Center object within the pivot
    tshirt.position.x = -center.x * scaleFactor;
    tshirt.position.y = -center.y * scaleFactor;
    tshirt.position.z = -center.z * scaleFactor;

    // Apply high-end fabric shader properties
    tshirt.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.82;
          child.material.metalness = 0.12;
          // Default color Noir Shadow
          child.material.color.set('#16161a');
          tshirtMeshes.push(child.material);
        }
      }
    });

    modelPivot.add(tshirt);
    isModelLoaded = true;

    // Hide preloader with reveal
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.innerText = '100%';
    setTimeout(() => {
      if (preloader) preloader.classList.add('hidden');
    }, 450);

    // Initial entrance animation
    gsap.from(modelPivot.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.4,
      ease: 'power3.out',
    });
  },
  (xhr) => {
    if (xhr.lengthComputable && xhr.total > 0) {
      const percent = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
      if (progressBar) progressBar.style.width = percent + '%';
      if (progressText) progressText.innerText = percent + '%';
    } else {
      if (progressBar) progressBar.style.width = '80%';
      if (progressText) progressText.innerText = 'Caricamento...';
    }
  },
  (error) => {
    console.warn('Errore durante il caricamento di tshirt.glb:', error);
    if (preloader) preloader.classList.add('hidden');
  }
);

/* ==========================================================================
   4. RESPONSIVE GSAP SCROLL ANIMATIONS (DESKTOP & MOBILE)
   ========================================================================== */
const mm = gsap.matchMedia();

// Desktop (> 768px): drifts right & left beside text cards
mm.add("(min-width: 769px)", () => {
  const desktopTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#main-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    },
  });

  desktopTL
    // Specs Section: drifts right & rotates
    .to(modelPivot.position, { x: 0.9, y: -0.15, z: 0.2, ease: 'power1.inOut' }, 0.2)
    .to(modelPivot.rotation, { y: Math.PI * 1.5, x: 0.08, ease: 'none' }, 0.2)
    // Transition
    .to(modelPivot.position, { x: -0.85, y: -0.18, z: 0.4, ease: 'power1.inOut' }, 0.45)
    .to(modelPivot.rotation, { y: Math.PI * 2.8, ease: 'none' }, 0.45)
    // Buy Section: Sits prominently in the right column
    .to(modelPivot.position, { x: 0.78, y: 0.02, z: 0.7, ease: 'power2.out' }, 0.7)
    .to(modelPivot.rotation, { y: Math.PI * 4, x: 0, ease: 'power1.inOut' }, 0.7)
    // Lookbook & FAQ: Sinks smoothly away
    .to(modelPivot.position, { y: -4.5, z: -1, ease: 'power2.in' }, 0.88)
    .to(modelPivot.scale, { x: 0.05, y: 0.05, z: 0.05, ease: 'power2.in' }, 0.88);
});

// Mobile & Smartphones (<= 768px): stays centered so sleeves don't clip outside view
mm.add("(max-width: 768px)", () => {
  const mobileTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#main-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    },
  });

  mobileTL
    // Specs Section: stays horizontally centered, subtle vertical float & angle
    .to(modelPivot.position, { x: 0, y: 0.25, z: -0.2, ease: 'power1.inOut' }, 0.2)
    .to(modelPivot.rotation, { y: Math.PI * 1.5, x: 0.05, ease: 'none' }, 0.2)
    // Buy Section: centered with nice rotation
    .to(modelPivot.position, { x: 0, y: 0.35, z: 0, ease: 'power1.inOut' }, 0.45)
    .to(modelPivot.rotation, { y: Math.PI * 3.0, ease: 'none' }, 0.45)
    // Lookbook & FAQ: Sinks cleanly away
    .to(modelPivot.position, { y: -5, z: -1, ease: 'power2.in' }, 0.84)
    .to(modelPivot.scale, { x: 0.05, y: 0.05, z: 0.05, ease: 'power2.in' }, 0.84);
});

/* ==========================================================================
   5. INTERACTIVE 3D CONTROLS (TOUCH-FRIENDLY ROTATE & PARALLAX)
   ========================================================================== */
let isDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;
let pointerStartX = 0;
let pointerStartY = 0;
let isTouchMode = false;
let targetRotY = 0;
let targetRotX = 0;
let mouseParallaxX = 0;
let mouseParallaxY = 0;

window.addEventListener('pointerdown', (e) => {
  // Never hijack clicks on UI, links, buttons or drawer
  if (e.target.closest('button, a, input, .modal-card, .buy-card-modern, .faq-item, .mobile-nav')) return;
  
  pointerStartX = e.clientX;
  pointerStartY = e.clientY;
  isTouchMode = e.pointerType === 'touch';

  if (!isTouchMode) {
    isDragging = true;
    previousPointerX = e.clientX;
    previousPointerY = e.clientY;
  }
});

window.addEventListener('pointermove', (e) => {
  // Track normalized pointer for subtle ambient tilt
  mouseParallaxX = (e.clientX / window.innerWidth - 0.5) * 0.25;
  mouseParallaxY = (e.clientY / window.innerHeight - 0.5) * 0.15;

  // On touch devices: only engage 3D rotation if gesture is predominantly horizontal
  // This allows smooth natural vertical page scrolling!
  if (isTouchMode && !isDragging) {
    const diffX = Math.abs(e.clientX - pointerStartX);
    const diffY = Math.abs(e.clientY - pointerStartY);
    if (diffX > 12 && diffX > diffY * 1.3) {
      isDragging = true;
      previousPointerX = e.clientX;
      previousPointerY = e.clientY;
    }
  }

  if (!isDragging) return;
  const deltaX = e.clientX - previousPointerX;
  const deltaY = e.clientY - previousPointerY;

  targetRotY += deltaX * 0.008;
  targetRotX += deltaY * 0.005;
  targetRotX = Math.max(-0.4, Math.min(0.4, targetRotX));

  previousPointerX = e.clientX;
  previousPointerY = e.clientY;
});

window.addEventListener('pointerup', () => {
  isDragging = false;
  isTouchMode = false;
});

// View Angle Switcher Buttons
const viewButtons = document.querySelectorAll('.view-btn');
const spinToggleBtn = document.getElementById('spin-toggle');

viewButtons.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const view = e.currentTarget.dataset.view;

    if (view === 'spin') {
      autoSpin = !autoSpin;
      e.currentTarget.classList.toggle('active', autoSpin);
      return;
    }

    autoSpin = false;
    if (spinToggleBtn) spinToggleBtn.classList.remove('active');

    viewButtons.forEach((b) => {
      if (b.dataset.view !== 'spin') b.classList.remove('active');
    });
    e.currentTarget.classList.add('active');

    if (view === 'front') {
      gsap.to(modelPivot.rotation, { y: 0, x: 0, duration: 1, ease: 'power2.inOut' });
      gsap.to(camera.position, { z: 4.8, y: 0, duration: 1 });
    } else if (view === 'back') {
      gsap.to(modelPivot.rotation, { y: Math.PI, x: 0, duration: 1, ease: 'power2.inOut' });
      gsap.to(camera.position, { z: 4.8, y: 0, duration: 1 });
    } else if (view === 'detail') {
      gsap.to(modelPivot.rotation, { y: 0.35, x: 0.1, duration: 1, ease: 'power2.inOut' });
      gsap.to(camera.position, { z: 3.6, y: 0.2, duration: 1 });
    }
  });
});

// Colorway Switcher
const colorSwatches = document.querySelectorAll('.color-swatch');
const selectedColorNameEl = document.getElementById('selected-color-name');

colorSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    colorSwatches.forEach((s) => s.classList.remove('active'));
    swatch.classList.add('active');

    const colorHex = swatch.dataset.color;
    const colorName = swatch.dataset.name;
    if (selectedColorNameEl) selectedColorNameEl.textContent = colorName;

    // Tween material colors
    tshirtMeshes.forEach((mat) => {
      gsap.to(mat.color, {
        r: new THREE.Color(colorHex).r,
        g: new THREE.Color(colorHex).g,
        b: new THREE.Color(colorHex).b,
        duration: 0.6,
        ease: 'power2.out',
      });
    });
  });
});

/* ==========================================================================
   6. RENDER LOOP
   ========================================================================== */
function animate() {
  requestAnimationFrame(animate);

  if (isModelLoaded) {
    if (autoSpin) {
      modelPivot.rotation.y += 0.015;
    } else {
      // Smooth interpolation for manual drag & parallax
      modelPivot.rotation.y += (targetRotY - modelPivot.rotation.y) * 0.08;
      modelPivot.rotation.x += (targetRotX - modelPivot.rotation.x) * 0.08;
    }

    // Gentle camera floating parallax
    camera.position.x += (mouseParallaxX - camera.position.x) * 0.05;
    camera.position.y += (-mouseParallaxY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  }

  renderer.render(scene, camera);
}
animate();

// Responsive Resize Handler
window.addEventListener('resize', () => {
  const isSmall = window.innerWidth <= 480;
  const isMobile = window.innerWidth <= 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.position.z = isSmall ? 5.8 : (isMobile ? 5.2 : 4.8);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  ScrollTrigger.refresh();
});

/* ==========================================================================
   7. UI INTERACTIONS & E-COMMERCE LOGIC
   ========================================================================== */

// Size Pills Selection
const sizePills = document.querySelectorAll('.size-pill');
let selectedSize = 'M';
let selectedVariantId = 'VARIANTE_ID_M';

sizePills.forEach((pill) => {
  pill.addEventListener('click', () => {
    sizePills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    selectedSize = pill.dataset.size;
    selectedVariantId = pill.dataset.variant;
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

// Size Guide Modal
const openSizeGuideBtn = document.getElementById('open-size-guide');
const closeSizeModalBtn = document.getElementById('close-modal');
const sizeModal = document.getElementById('size-modal');

if (openSizeGuideBtn && sizeModal && closeSizeModalBtn) {
  openSizeGuideBtn.addEventListener('click', () => {
    sizeModal.classList.add('open');
    sizeModal.setAttribute('aria-hidden', 'false');
  });

  closeSizeModalBtn.addEventListener('click', () => {
    sizeModal.classList.remove('open');
    sizeModal.setAttribute('aria-hidden', 'true');
  });

  sizeModal.addEventListener('click', (e) => {
    if (e.target === sizeModal) {
      sizeModal.classList.remove('open');
      sizeModal.setAttribute('aria-hidden', 'true');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sizeModal.classList.contains('open')) {
      sizeModal.classList.remove('open');
      sizeModal.setAttribute('aria-hidden', 'true');
    }
  });
}

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  const questionBtn = item.querySelector('.faq-question');
  if (questionBtn) {
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach((i) => i.classList.remove('active'));
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  }
});

// Cart & Buy Button Logic
const buyBtn = document.getElementById('buy-btn');
const cartCounter = document.getElementById('cart-counter');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
let cartCount = 0;

function showToast(message) {
  if (toast && toastMessage) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }
}

if (buyBtn) {
  buyBtn.addEventListener('click', () => {
    cartCount += quantity;
    if (cartCounter) {
      cartCounter.textContent = cartCount;
      gsap.fromTo(cartCounter, { scale: 1.6 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    }

    showToast(`Aggiunto al carrello: T-Shirt Boxy (${selectedSize}) x${quantity}`);

    // If Shopify/Stripe redirect is desired in production:
    // const shopifyDomain = 'tuo-negozio.myshopify.com';
    // const checkoutUrl = `https://${shopifyDomain}/cart/${selectedVariantId}:${quantity}?checkout`;
    // window.location.href = checkoutUrl;
  });
}

// Newsletter Form
const newsletterForm = document.getElementById('newsletter-form');
const newsletterSuccess = document.getElementById('newsletter-success');

if (newsletterForm && newsletterSuccess) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    newsletterSuccess.style.display = 'block';
    newsletterForm.reset();
  });
}

/* ==========================================================================
   8. AMBIENT AUDIO VIBE GENERATOR (WEB AUDIO API)
   ========================================================================== */
const audioToggleBtn = document.getElementById('audio-toggle');
let audioCtx = null;
let isAudioPlaying = false;
let synthOsc1 = null;
let synthOsc2 = null;
let synthGain = null;

function initAmbientSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  synthGain = audioCtx.createGain();
  synthGain.gain.setValueAtTime(0.001, audioCtx.currentTime);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(260, audioCtx.currentTime);

  // Sub bass drone oscillator (48 Hz)
  synthOsc1 = audioCtx.createOscillator();
  synthOsc1.type = 'sawtooth';
  synthOsc1.frequency.setValueAtTime(48.99, audioCtx.currentTime); // G1

  // Warm atmospheric harmonic oscillator (98 Hz)
  synthOsc2 = audioCtx.createOscillator();
  synthOsc2.type = 'sine';
  synthOsc2.frequency.setValueAtTime(97.99, audioCtx.currentTime); // G2

  synthOsc1.connect(filter);
  synthOsc2.connect(filter);
  filter.connect(synthGain);
  synthGain.connect(audioCtx.destination);

  synthOsc1.start();
  synthOsc2.start();
}

if (audioToggleBtn) {
  audioToggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      initAmbientSound();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isAudioPlaying) {
      synthGain.gain.setTargetAtTime(0.08, audioCtx.currentTime, 0.5);
      isAudioPlaying = true;
      audioToggleBtn.classList.add('playing');
    } else {
      synthGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.3);
      isAudioPlaying = false;
      audioToggleBtn.classList.remove('playing');
    }
  });
}

/* ==========================================================================
   9. MOBILE NAVIGATION DRAWER CONTROLLER
   ========================================================================== */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const mobileNavClose = document.getElementById('mobile-nav-close');
const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link, .mobile-cta-link');

function openMobileMenu() {
  if (mobileNav && mobileMenuBtn) {
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    mobileMenuBtn.classList.add('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileMenu() {
  if (mobileNav && mobileMenuBtn) {
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileMenuBtn.classList.remove('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mobileNav && mobileNav.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

if (mobileNavClose) {
  mobileNavClose.addEventListener('click', closeMobileMenu);
}

if (mobileNavBackdrop) {
  mobileNavBackdrop.addEventListener('click', closeMobileMenu);
}

mobileNavLinks.forEach((link) => {
  link.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    closeMobileMenu();
    if (targetId && targetId !== '#') {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        setTimeout(() => {
          lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
        }, 150);
      }
    }
  });
});