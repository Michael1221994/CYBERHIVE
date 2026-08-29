/* ============================================================================
   CYBERHIVE // Master Application Script
   Cursor Physics, Canvas Particle Trail, Scroll Velocity & Telemetry State
   ========================================================================== */

import { initScene } from './scene.js';
import { initAudio } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Subsystems
    initPreloader();
    initCustomCursor();
    initCanvasTrail();
    initScrollDynamics();
    initHorizontalScroll();
    initEMFTelemetryController();
    initManifestoReveal();
    initCounterAnimations();
    initMobileMenu();
    initAnomalyModals();

    // 2. Initialize 3D & Audio
    initScene();
    initAudio();
});

/* ===== 1. Preloader ===== */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const percentEl = document.getElementById('loader-percent');
    const barFill = document.getElementById('loader-bar-fill');
    if (!preloader || !percentEl) return;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 8) + 4;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('loaded');
                document.documentElement.classList.add('cursor-ready');
            }, 300);
        }
        percentEl.textContent = `${progress}%`;
        if (barFill) barFill.style.width = `${progress}%`;
    }, 45);
}

/* ===== 2. Fluid Magnetic Custom Cursor ===== */
function initCustomCursor() {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const label = document.getElementById('cursor-view-label');
    if (!dot || !ring) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        if (label) {
            label.style.left = `${mouseX}px`;
            label.style.top = `${mouseY}px`;
        }
    }, { passive: true });

    function renderRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(renderRing);
    }
    renderRing();

    // Hover Elements Interaction
    const interactables = document.querySelectorAll('button, a, input, .anomaly-card, .bio-card, .bento-item, .synth-btn');
    interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            document.body.classList.add('hovering');
            const customLabel = el.getAttribute('data-cursor');
            if (customLabel && label) {
                label.textContent = customLabel;
                label.classList.add('visible');
            }
        });
        el.addEventListener('mouseleave', () => {
            document.body.classList.remove('hovering');
            if (label) label.classList.remove('visible');
        });
    });
}

/* ===== 3. Canvas Trailing Sparks / Pollen Trail ===== */
function initCanvasTrail() {
    const canvas = document.getElementById('cursor-trail');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    window.addEventListener('mousemove', (e) => {
        for (let i = 0; i < 2; i++) {
            particles.push({
                x: e.clientX,
                y: e.clientY,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2.5 + 1,
                alpha: 0.8,
                color: Math.random() > 0.3 ? '245, 158, 11' : '6, 182, 212'
            });
        }
    }, { passive: true });

    function animateTrail() {
        ctx.clearRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.025;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
            ctx.fill();
        }

        requestAnimationFrame(animateTrail);
    }
    animateTrail();
}

/* ===== 4. Scroll Dynamics & Velocity Letterbox ===== */
function initScrollDynamics() {
    let lastScrollY = window.scrollY;
    let velocityTimer = null;
    const nav = document.querySelector('nav');
    const progressFill = document.getElementById('global-progress');

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = Math.abs(currentScrollY - lastScrollY);

        // Velocity Letterbox Trigger
        if (delta > 32) {
            document.body.classList.add('fast-scroll');
            clearTimeout(velocityTimer);
            velocityTimer = setTimeout(() => {
                document.body.classList.remove('fast-scroll');
            }, 350);
        }

        // Nav Glassmorphism
        if (nav) {
            nav.classList.toggle('scrolled', currentScrollY > 60);
        }

        // Global Progress Bar
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0 && progressFill) {
            const progress = (currentScrollY / maxScroll) * 100;
            progressFill.style.width = `${progress}%`;
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
}

/* ===== 5. Horizontal Scroll Anomalies Track ===== */
function initHorizontalScroll() {
    const wrapper = document.getElementById('anomalies-wrapper');
    const track = document.querySelector('.anomalies-track');
    if (!wrapper || !track) return;

    window.addEventListener('scroll', () => {
        const rect = wrapper.getBoundingClientRect();
        const wrapperHeight = wrapper.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;

        if (scrolled >= 0 && scrolled <= wrapperHeight) {
            const progress = scrolled / wrapperHeight;
            const maxTranslate = track.scrollWidth - window.innerWidth + (window.innerWidth * 0.15);
            track.style.transform = `translateX(-${progress * maxTranslate}px)`;
        }
    }, { passive: true });

    // 3D Card Hover Perspective Tilt
    const cards = document.querySelectorAll('.anomaly-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            card.style.transform = `perspective(800px) rotateX(${-y * 0.04}deg) rotateY(${x * 0.04}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });
}

/* ===== 6. Interactive EMF Telemetry Controller ===== */
function initEMFTelemetryController() {
    const slider = document.getElementById('emf-slider');
    const readout = document.getElementById('emf-readout');
    const navEmf = document.getElementById('nav-emf-val');
    const btnCalibrate = document.getElementById('btn-calibrate');
    const btnSimulate = document.getElementById('btn-simulate-surge');

    if (!slider) return;

    function updateEMF(val) {
        const mw = parseInt(val, 10);
        const microTesla = (mw * 1.84).toFixed(1);
        if (readout) readout.textContent = `${mw} MW // ${microTesla} µT`;
        if (navEmf) navEmf.textContent = `${mw} MW`;

        const factor = mw / 500;
        if (window.setEMFIntensity) window.setEMFIntensity(factor);
        if (window.setAudioEMFFactor) window.setAudioEMFFactor(factor);
    }

    slider.addEventListener('input', (e) => {
        updateEMF(e.target.value);
    });

    if (btnCalibrate) {
        btnCalibrate.addEventListener('click', () => {
            slider.value = 0;
            updateEMF(0);
        });
    }

    if (btnSimulate) {
        btnSimulate.addEventListener('click', () => {
            slider.value = 500;
            updateEMF(500);
        });
    }
}

/* ===== 7. Manifesto Word-By-Word Reveal ===== */
function initManifestoReveal() {
    const lead = document.querySelector('.manifesto-lead');
    if (!lead) return;

    const words = lead.innerText.trim().split(' ');
    lead.innerHTML = words.map((w, i) => `<span class="m-word" style="--i: ${i}">${w} </span>`).join('');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                lead.classList.add('revealed');
                observer.unobserve(lead);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(lead);
}

/* ===== 8. Animated Counters for Stats Band ===== */
function initCounterAnimations() {
    const numbers = document.querySelectorAll('.stat-number[data-target]');
    if (!numbers.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.getAttribute('data-target'));
                const isFloat = el.getAttribute('data-float') === 'true';
                let count = 0;
                const step = target / 40;

                const timer = setInterval(() => {
                    count += step;
                    if (count >= target) {
                        count = target;
                        clearInterval(timer);
                    }
                    el.textContent = isFloat ? count.toFixed(1) : Math.floor(count);
                }, 30);

                observer.unobserve(el);
            }
        });
    }, { threshold: 0.4 });

    numbers.forEach(num => observer.observe(num));
}

/* ===== 9. Mobile Menu ===== */
function initMobileMenu() {
    const ham = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!ham || !menu) return;

    function toggleMenu(open) {
        const isOpen = typeof open === 'boolean' ? open : !menu.classList.contains('open');
        menu.classList.toggle('open', isOpen);
        ham.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    ham.addEventListener('click', () => toggleMenu());
    
    // Close button inside the mobile menu
    const closeBtn = document.getElementById('mobile-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleMenu(false));
    }
    
    menu.querySelectorAll('.m-nav-item').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) toggleMenu(false);
    });
}

/* ===== 10. Anomaly Deep Dive Modals ===== */
function initAnomalyModals() {
    const cards = document.querySelectorAll('.anomaly-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('.card-title')?.textContent || 'Anomaly';
            const desc = card.querySelector('.card-desc')?.textContent || '';
            const code = card.querySelector('.card-code')?.textContent || '';
            alert(`[DEEP-DIVE TELEMETRY: ${code}]\n\n${title}\n\n${desc}\n\nStatus: Under Active Investigation by Biomagnetic Field Stations.`);
        });
    });
}
