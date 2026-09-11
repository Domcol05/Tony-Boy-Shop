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
   3. UNIFIED PACKSHOT & 3D VIEWER (VIEW 3D, FRONT, BACK, ZOOM)
   ========================================================================== */
const packshotFrame = document.getElementById('packshot-frame');
const frontImg = document.getElementById('packshot-img-front');
const backImg = document.getElementById('packshot-img-back');
const packshotBadge = document.getElementById('packshot-badge');
const canvasContainer = document.getElementById('canvas-container');
const canvas3d = document.getElementById('webgl');

const btnMode3D = document.getElementById('btn-mode-3d');
const btnModeFront = document.getElementById('btn-mode-front');
const btnModeBack = document.getElementById('btn-mode-back');
const btnModeZoom = document.getElementById('btn-mode-zoom');

let currentMode = 'back'; // 'back' (default upon opening), 'front', 'view3d'
let isZoomed = false;

// 3D Three.js State
let scene3d, camera3d, renderer3d, controls3d, modelPivot;
let is3dInitialized = false;
let is3dLoading = false;

function init3D() {
  if (is3dInitialized || !canvas3d || !canvasContainer) return;
  is3dLoading = true;

  const width = canvasContainer.clientWidth || 500;
  const height = canvasContainer.clientHeight || 500;

  scene3d = new THREE.Scene();

  camera3d = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera3d.position.set(0, 0, 4.8);

  renderer3d = new THREE.WebGLRenderer({
    canvas: canvas3d,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer3d.setSize(width, height);
  renderer3d.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer3d.toneMapping = THREE.ACESFilmicToneMapping;
  renderer3d.toneMappingExposure = 1.35;
  renderer3d.outputColorSpace = THREE.SRGBColorSpace;

  // Orbit controls for free touch/mouse rotation
  controls3d = new OrbitControls(camera3d, canvas3d);
  controls3d.enableDamping = true;
  controls3d.dampingFactor = 0.06;
  controls3d.enablePan = false;
  controls3d.minDistance = 2.4;
  controls3d.maxDistance = 5.8;

  // Studio lighting setup - noir dark streetwear mood
  const ambientLight = new THREE.AmbientLight(0x280d16, 1.4);
  scene3d.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0x7dd3fc, 3.2);
  keyLight.position.set(3, 3.5, 4.5);
  scene3d.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
  fillLight.position.set(-4, 1.5, 3);
  scene3d.add(fillLight);

  const rimLightCrimson = new THREE.DirectionalLight(0xff1744, 4.2);
  rimLightCrimson.position.set(0, 3, -4);
  scene3d.add(rimLightCrimson);

  const rimLightRose = new THREE.DirectionalLight(0xf43f5e, 2.2);
  rimLightRose.position.set(4, -1.5, -2.5);
  scene3d.add(rimLightRose);

  modelPivot = new THREE.Group();
  modelPivot.position.set(0, -0.05, 0);
  scene3d.add(modelPivot);

  const loader = new GLTFLoader();
  const modelUrl = `${import.meta.env.BASE_URL}models/tshirt.glb`;

  loader.load(
    modelUrl,
    (gltf) => {
      const tshirt = gltf.scene;
      const box = new THREE.Box3().setFromObject(tshirt);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.45;
      const scaleFactor = targetSize / maxDim;

      tshirt.scale.setScalar(scaleFactor);
      tshirt.position.x = -center.x * scaleFactor;
      tshirt.position.y = -center.y * scaleFactor;
      tshirt.position.z = -center.z * scaleFactor;

      tshirt.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.82;
          child.material.metalness = 0.12;
          child.material.color.set('#141418');
        }
      });

      // Default back orientation so retro is visible
      modelPivot.rotation.y = Math.PI;
      modelPivot.add(tshirt);

      is3dInitialized = true;
      is3dLoading = false;
    },
    undefined,
    (error) => {
      console.warn('Notice: 3D model loading:', error);
      is3dLoading = false;
    }
  );

  function animate3D() {
    requestAnimationFrame(animate3D);
    if (controls3d) controls3d.update();
    if (renderer3d && scene3d && camera3d) {
      renderer3d.render(scene3d, camera3d);
    }
  }
  animate3D();

  window.addEventListener('resize', onResize3D);
}

function onResize3D() {
  if (!renderer3d || !camera3d || !canvasContainer) return;
  const width = canvasContainer.clientWidth;
  const height = canvasContainer.clientHeight;
  if (width && height) {
    camera3d.aspect = width / height;
    camera3d.updateProjectionMatrix();
    renderer3d.setSize(width, height);
  }
}

function setVisualizerMode(mode) {
  if (mode === 'zoom') {
    toggleZoom();
    return;
  }

  currentMode = mode;

  // Update nav buttons
  if (btnMode3D) btnMode3D.classList.toggle('active', mode === 'view3d');
  if (btnModeFront) btnModeFront.classList.toggle('active', mode === 'front');
  if (btnModeBack) btnModeBack.classList.toggle('active', mode === 'back');

  if (mode === 'view3d') {
    if (packshotFrame) packshotFrame.classList.add('mode-3d');
    if (packshotBadge) packshotBadge.textContent = '3D // INTERACTIVE 360° VIEW';
    if (!is3dInitialized) {
      init3D();
    } else {
      onResize3D();
    }
  } else {
    if (packshotFrame) packshotFrame.classList.remove('mode-3d');

    if (mode === 'front') {
      if (frontImg) frontImg.classList.add('active');
      if (backImg) backImg.classList.remove('active');
      if (packshotBadge) packshotBadge.textContent = 'FRONTE // MINIMAL CUT';
    } else {
      // Default: back
      if (frontImg) frontImg.classList.remove('active');
      if (backImg) backImg.classList.add('active');
      if (packshotBadge) packshotBadge.textContent = 'RETRO // GOING HARD SERIGRAFIA';
    }
  }

  if (isZoomed) {
    if (packshotBadge) packshotBadge.textContent += ' [ZOOM 165%]';
  }
}

function toggleZoom() {
  isZoomed = !isZoomed;
  if (btnModeZoom) btnModeZoom.classList.toggle('active', isZoomed);
  if (packshotFrame) packshotFrame.classList.toggle('is-zoomed', isZoomed);

  if (isZoomed) {
    if (packshotBadge) packshotBadge.textContent += ' [ZOOM 165%]';
  } else {
    if (currentMode === 'view3d') {
      if (packshotBadge) packshotBadge.textContent = '3D // INTERACTIVE 360° VIEW';
    } else if (currentMode === 'front') {
      if (packshotBadge) packshotBadge.textContent = 'FRONTE // MINIMAL CUT';
    } else {
      if (packshotBadge) packshotBadge.textContent = 'RETRO // GOING HARD SERIGRAFIA';
    }
    const activeImg = currentMode === 'front' ? frontImg : backImg;
    if (activeImg) {
      activeImg.style.transform = '';
    }
  }
}

// Attach click listeners to menu bar buttons
if (btnMode3D) btnMode3D.addEventListener('click', () => setVisualizerMode('view3d'));
if (btnModeFront) btnModeFront.addEventListener('click', () => setVisualizerMode('front'));
if (btnModeBack) btnModeBack.addEventListener('click', () => setVisualizerMode('back'));
if (btnModeZoom) btnModeZoom.addEventListener('click', toggleZoom);

// Pre-init 3D after idle so clicking VIEW 3D is instantaneous
window.addEventListener('load', () => {
  setTimeout(init3D, 900);
});

// Click directly on the packshot image flips between front and back
if (packshotFrame) {
  packshotFrame.addEventListener('click', () => {
    if (isZoomed) {
      toggleZoom();
      return;
    }
    const nextMode = currentMode === 'front' ? 'back' : 'front';
    setVisualizerMode(nextMode);
  });

  // Dynamic interactive pan in zoom mode, subtle 3D tilt when unzoomed
  packshotFrame.addEventListener('mousemove', (e) => {
    const rect = packshotFrame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const activeImg = currentMode === 'front' ? frontImg : backImg;

    if (activeImg) {
      if (isZoomed) {
        const panX = (0.5 - x) * 110;
        const panY = (0.5 - y) * 110;
        activeImg.style.transform = `scale(1.65) translate(${panX}px, ${panY}px)`;
      } else {
        const moveX = (x - 0.5) * 12;
        const moveY = (y - 0.5) * 12;
        activeImg.style.transform = `scale(1.02) translate(${moveX}px, ${moveY}px)`;
      }
    }
  });

  packshotFrame.addEventListener('mouseleave', () => {
    const activeImg = currentMode === 'front' ? frontImg : backImg;
    if (activeImg) {
      if (isZoomed) {
        activeImg.style.transform = 'scale(1.65) translate(0px, 0px)';
      } else {
        activeImg.style.transform = 'scale(1) translate(0px, 0px)';
      }
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