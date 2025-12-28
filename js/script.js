// --- 1. CARD INTERACTION & PHYSICS ---
const card = document.getElementById('profileCard');
const cardContainer = document.querySelector('.card-container');

let cardState = {
    mouseX: 0,
    mouseY: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    isHovering: false,
    expanded: false
};

// CLICK LISTENER
if (card) {
    card.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('.social-icon')) return;
        cardState.expanded = !cardState.expanded;
        card.classList.toggle('expanded');
    });
}

// HERO READ MORE TOGGLE
const readMoreBtn = document.getElementById('readMoreBtn');
const extraDesc = document.querySelector('.extra-desc');

if (readMoreBtn) {
    readMoreBtn.addEventListener('click', () => {
        extraDesc.classList.toggle('visible');
        readMoreBtn.classList.toggle('active');
    });
}

// MOUSE MOVE: Calculate Tilt
if (cardContainer) {
    cardContainer.addEventListener('mousemove', (e) => {
        if (cardState.expanded) return;
        cardState.isHovering = true;
        const rect = cardContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        cardState.mouseX = (x - centerX) / 15;
        cardState.mouseY = (y - centerY) / 15;
    });

    cardContainer.addEventListener('mouseleave', () => {
        cardState.isHovering = false;
        cardState.mouseX = 0;
        cardState.mouseY = 0;
    });
}

// --- PHYSICS ENGINE LOOP ---
function animateCard() {
    if (!card) return;
    const targetX = (cardState.isHovering && !cardState.expanded) ? -cardState.mouseY : 0;
    const targetY = (cardState.isHovering && !cardState.expanded) ? cardState.mouseX : 0;

    cardState.rotateX += (targetX - cardState.rotateX) * 0.1;
    cardState.rotateY += (targetY - cardState.rotateY) * 0.1;

    let targetScale = 1;
    if (cardState.expanded) targetScale = 1.05;
    else if (cardState.isHovering) targetScale = 1.05;

    cardState.scale += (targetScale - cardState.scale) * 0.1;

    card.style.transform = `perspective(1000px) rotateX(${cardState.rotateX}deg) rotateY(${cardState.rotateY}deg) scale(${cardState.scale})`;
    requestAnimationFrame(animateCard);
}
animateCard();

// --- 3. INTRO ANIMATION ---
window.addEventListener('load', () => {
    const overlay = document.getElementById('intro-overlay');
    const textElement = document.querySelector('.intro-text');
    if (!textElement || !overlay) return;

    // Check Session Storage
    if (sessionStorage.getItem('siteVisited')) {
        // Already visited: Hide immediately
        overlay.style.display = 'none';
        document.body.classList.add('hero-visible');
        return;
    }

    // First visit: Mark as visited
    sessionStorage.setItem('siteVisited', 'true');

    const textContent = "Welcome to my PORTFOLIO";
    textElement.textContent = '';
    textElement.classList.add('shiny-text');

    const chars = [];
    for (let i = 0; i < textContent.length; i++) {
        const char = textContent[i];
        const span = document.createElement('span');
        if (char === ' ') {
            span.innerHTML = '&nbsp;';
            span.style.display = 'inline-block';
        } else {
            span.textContent = char;
        }
        span.className = 'split-char';
        if (i >= textContent.indexOf('PORTFOLIO')) {
            span.classList.add('thick-char');
        }
        textElement.appendChild(span);
        chars.push(span);
    }

    const initialDelay = 100;
    const stagger = 30;

    chars.forEach((span, index) => {
        setTimeout(() => span.classList.add('visible'), initialDelay + (index * stagger));
    });

    const totalAnimationTime = initialDelay + (chars.length * stagger) + 600;
    setTimeout(() => {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.classList.add('hero-visible');
        }, 1000);
    }, totalAnimationTime + 200);
});

// --- 4. SCROLL ANIMATIONS ---
const heroSection = document.querySelector('.hero');
const worksSection = document.querySelector('.works-section');
const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target === heroSection) {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                heroSection.style.opacity = '0';
                heroSection.style.filter = 'blur(10px)';
                heroSection.style.transform = 'scale(0.95)';
            } else {
                heroSection.style.opacity = '1';
                heroSection.style.filter = 'blur(0)';
                heroSection.style.transform = 'scale(1)';
            }
        }
        if (entry.target === worksSection) {
            if (entry.isIntersecting) worksSection.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

if (heroSection) {
    heroSection.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    scrollObserver.observe(heroSection);
}
if (worksSection) scrollObserver.observe(worksSection);

// --- 5. SCROLL REVEAL (GSAP) ---
// Function removed as section was deleted
function initScrollReveal() { }

// --- 6. LENIS ---
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    window.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        smooth: true,
        smoothTouch: false
    });
    window.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => window.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
}

// --- 7. NAVIGATION ---
// --- 7. NAVIGATION ---
const allLinks = document.querySelectorAll('a[href^="#"]');
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');

if (navLinks.length > 0) {
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-links a[href="#home"]')?.classList.add('active');
}

allLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                // Update active state only for main nav links
                if (link.closest('.nav-links')) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }

                if (typeof Lenis !== 'undefined' && window.lenis) {
                    window.lenis.scrollTo(target, { duration: 2.0, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// SMOOTH SCROLL SHORTCUT HELPER
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        if (typeof Lenis !== 'undefined' && window.lenis) {
            window.lenis.scrollTo(el, { duration: 2.0, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        } else {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        }
    });
}, { threshold: 0.2 });
sections.forEach(sec => { if (sec.id) sectionObserver.observe(sec); });

// --- 8. SCROLL FLOAT ---
function initScrollFloat() {
    gsap.registerPlugin(ScrollTrigger);
    const floatContainers = document.querySelectorAll('.scroll-float-text');
    floatContainers.forEach(textEl => {
        const text = textEl.innerText;
        textEl.innerHTML = '';
        const chars = text.split('').map(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'char';
            textEl.appendChild(span);
            return span;
        });
        gsap.fromTo(chars,
            { opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7, transformOrigin: '50% 0%' },
            { opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1, stagger: 0.03, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: textEl, start: 'top bottom-=10%', end: 'bottom center', scrub: 1 } }
        );
    });
}

// --- 9. BACK TO TOP ---
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    let timeout;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');

            // Clear previous timeout and set new one to hide after 2.5s of inactivity
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // If we are still scrolled down, but user stopped scrolling
                if (window.scrollY > 500) {
                    btn.classList.remove('visible');
                }
            }, 2500);
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        if (window.lenis) {
            window.lenis.scrollTo(0, { duration: 2 });
        }
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- 10. FADE UP ---
function initFadeUpObserver() {
    const fadeElements = document.querySelectorAll('.fade-up-observ');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    fadeElements.forEach(el => observer.observe(el));
}

// --- 12. DOT NAV & CREDITS ---
function initDotNav() {
    const dots = document.querySelectorAll('.dot');
    const dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                dots.forEach(d => d.classList.remove('active'));
                const id = entry.target.getAttribute('id');
                const activeDot = document.querySelector(`.dot[href="#${id}"]`);
                if (activeDot) activeDot.classList.add('active');
            }
        });
    }, { threshold: 0.5 });
    sections.forEach(sec => { if (sec.id) dotObserver.observe(sec); });
}

function initCredits() {
    const creditsBtn = document.querySelector('.btn-credits');
    const creditsWrapper = document.querySelector('.credits-wrapper');
    if (creditsBtn && creditsWrapper) {
        creditsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            creditsWrapper.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!creditsWrapper.contains(e.target)) creditsWrapper.classList.remove('active');
        });
    }
}

// --- INIT ---
const initAll = () => {
    initScrollReveal();
    initLenis();
    initScrollFloat();
    initBackToTop();
    initFadeUpObserver();
    initDotNav();
    initCredits();

    // START ALERTS handled in notifications.js
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

// Force scroll top
if (history.scrollRestoration) history.scrollRestoration = 'manual';
window.onbeforeunload = () => window.scrollTo(0, 0);
window.addEventListener('load', () => setTimeout(() => window.scrollTo(0, 0), 10));