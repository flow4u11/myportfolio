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
        // ถ้ากดที่ปุ่ม Social หรือ Link ไม่ต้องย่อขยาย
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

// MOUSE MOVE: Calculate Tilt & SHINE EFFECT
if (cardContainer) {
    cardContainer.addEventListener('mousemove', (e) => {
        if (cardState.expanded) return;

        cardState.isHovering = true;
        const rect = cardContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Physics Target
        cardState.mouseX = (x - centerX) / 15;
        cardState.mouseY = (y - centerY) / 15;


    });

    cardContainer.addEventListener('mouseleave', () => {
        cardState.isHovering = false;
        cardState.mouseX = 0;
        cardState.mouseY = 0;


    });
}

// --- PHYSICS ENGINE LOOP (60FPS Smoothness) ---
function animateCard() {
    if (!card) return;

    // Logic: ถ้า Hover ให้หมุน, ถ้า Expanded ให้หยุดหมุนและตั้งตรง
    const targetX = (cardState.isHovering && !cardState.expanded) ? -cardState.mouseY : 0;
    const targetY = (cardState.isHovering && !cardState.expanded) ? cardState.mouseX : 0;

    // Linear Interpolation (Lerp) for Apple-like smoothness (0.1 is the weight)
    cardState.rotateX += (targetX - cardState.rotateX) * 0.1;
    cardState.rotateY += (targetY - cardState.rotateY) * 0.1;

    let targetScale = 1;
    if (cardState.expanded) targetScale = 1.05;
    else if (cardState.isHovering) targetScale = 1.05;

    cardState.scale += (targetScale - cardState.scale) * 0.1;

    const transformString = `
        perspective(1000px) 
        rotateX(${cardState.rotateX}deg) 
        rotateY(${cardState.rotateY}deg) 
        scale(${cardState.scale})
    `;

    card.style.transform = transformString;

    requestAnimationFrame(animateCard);
}
animateCard();





// --- 3. INTRO ANIMATION (Split Text) ---
window.addEventListener('load', () => {
    const overlay = document.getElementById('intro-overlay');
    const textElement = document.querySelector('.intro-text');

    if (!textElement || !overlay) return;

    const textContent = textElement.textContent;
    textElement.textContent = ''; // Clear text

    // Apply Shiny Effect to Container
    textElement.classList.add('shiny-text');

    // Create Spans
    const chars = [];
    // We need to identify the "PORTFOLIO" part. 
    // "Welcome to my PORTFOLIO" -> The last 9 characters are PORTFOLIO.
    // Or we can just check if char is uppercase and specific? 
    // Let's use index based since the string is fixed.
    const fullString = "Welcome to my PORTFOLIO";
    // Index of P in PORTFOLIO is 14 (if W is 0)
    // W(0) e(1) l(2) c(3) o(4) m(5) e(6)  (7) t(8) o(9)  (10) m(11) y(12)  (13) P(14)...

    // NOTE: The element might have slightly different text content if user changed logical HTML...
    // But assuming strict text "Welcome to my PORTFOLIO"

    // Let's track the "PORTFOLIO" word state if logic gets dynamic.
    // For now simple regex check or just index if we iterate textContent

    let isPortfolioWord = false;

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

        // Check for Thickness (simple check: is this part of "PORTFOLIO"?)
        // We know "PORTFOLIO" is at the end.
        if (i >= textContent.indexOf('PORTFOLIO')) {
            span.classList.add('thick-char');
        }

        textElement.appendChild(span);
        chars.push(span);
    }

    // Animate
    // User requested: delay 100ms, duration 0.6s, simple stagger (implied)
    const initialDelay = 100;
    const stagger = 30; // Make it fast and smooth

    chars.forEach((span, index) => {
        setTimeout(() => {
            span.classList.add('visible');
        }, initialDelay + (index * stagger));
    });

    // Handle Completion to fade out overlay
    // 600ms is the CSS transition duration
    const totalAnimationTime = initialDelay + (chars.length * stagger) + 600;

    setTimeout(() => {
        console.log('All letters have animated!');

        // Start fading out the overlay slightly after text finishes
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.classList.add('hero-visible');
        }, 1000); // Match CSS transition for overlay opacity
    }, totalAnimationTime + 200);
});


// --- 4. SCROLL ANIMATIONS ---
const heroSection = document.querySelector('.hero');
const worksSection = document.querySelector('.works-section');

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.target === heroSection) {
            // Hero fade out effect
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
            if (entry.isIntersecting) {
                worksSection.classList.add('visible');
            }
        }
    });
}, { threshold: 0.1 });

if (heroSection) {
    heroSection.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    scrollObserver.observe(heroSection);
}
if (worksSection) {
    scrollObserver.observe(worksSection);
}

// --- 5. SCROLL REVEAL ANIMATION (GSAP) ---
// Mimics the React component logic provided by user
function initScrollReveal() {
    // Check if GSAP is loaded
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn('GSAP or ScrollTrigger not found');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const revealElements = document.querySelectorAll('.scroll-reveal');

    revealElements.forEach(container => {
        const textElement = container.querySelector('.scroll-reveal-text');
        if (!textElement) return;

        // 1. Split Text Logic
        const textContent = textElement.textContent; // Using textContent to be safe
        const words = textContent.split(/(\s+)/); // Split by whitespace but keep delimiters to preserve spacing structure if needed

        textElement.innerHTML = ''; // Clear content

        const wordSpans = [];

        words.forEach(word => {
            if (word.match(/^\s+$/)) {
                // If it's just whitespace, add it as text node or non-breaking space
                textElement.appendChild(document.createTextNode(word));
            } else if (word.trim().length > 0) {
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word';
                // Initial styles mimic the "from" state, but we handle it via GSAP fromTo
                textElement.appendChild(span);
                wordSpans.push(span);
            }
        });

        // 2. Container Rotation Animation
        // "baseRotation = 3" -> 0
        gsap.fromTo(container,
            {
                transformOrigin: '0% 50%',
                rotate: 3,
                opacity: 0.5 // Start slightly transparent
            },
            {
                ease: 'none',
                rotate: 0,
                opacity: 1, // Fade in container too
                scrollTrigger: {
                    trigger: container,
                    start: 'top bottom',
                    end: 'center centeer', // Rotate until it's centered
                    scrub: true
                }
            }
        );

        // 3. Word Animation (Opacity & Blur)
        const baseOpacity = 0.1;
        const blurStrength = 4;

        gsap.fromTo(wordSpans,
            {
                opacity: baseOpacity,
                filter: `blur(${blurStrength}px)`,
                willChange: 'opacity, filter'
            },
            {
                ease: 'none',
                opacity: 1,
                filter: 'blur(0px)',
                stagger: 0.05,
                scrollTrigger: {
                    trigger: container,
                    start: 'top bottom-=10%', // Start slightly later
                    end: 'bottom center', // Finish when bottom is at center
                    scrub: true
                }
            }
        );
    });
}

// --- 6. LENIS SMOOTH SCROLL ---
function initLenis() {
    if (typeof Lenis === 'undefined') {
        console.warn('Lenis not found');
        return;
    }

    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like ease
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // GSAP ScrollTrigger needs to know when Lenis scrolls to update positions
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Disable GSAP's native lag smoothing to avoid conflicts
    gsap.ticker.lagSmoothing(0);

    // Optional: standard RAF loop if not using GSAP ticker (but GSAP ticker is better here)
    // function raf(time) {
    //     lenis.raf(time);
    //     requestAnimationFrame(raf);
    // }
    // requestAnimationFrame(raf);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initScrollReveal();
        initLenis();
    });
} else {
    initLenis();
}


// --- 5. NAVIGATION LOGIC (Redesign) ---
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section');

// Activate "Home" on load
if (navLinks.length > 0) {
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-links a[href="#home"]')?.classList.add('active');
}

// Click Handler
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(href);
            if (targetSection) {
                // Remove active from all immediately for feedback
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                if (typeof Lenis !== 'undefined' && window.lenis) {
                    window.lenis.scrollTo(targetSection, {
                        duration: 1.5, // Fast smooth scroll
                        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) // Apple-like ease
                    });
                } else {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// Scroll Spy
const observerOptions = {
    threshold: 0.2 // Trigger when 20% visible
};

const observerCallback = (entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) {
                // Remove active from all
                navLinks.forEach(link => link.classList.remove('active'));
                // Add to current
                const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        }
    });
};

const sectionObserver = new IntersectionObserver(observerCallback, observerOptions);
sections.forEach(sec => {
    // Only observe sections with IDs
    if (sec.id) sectionObserver.observe(sec);
});

// --- 6. SCROLL FLOAT ANIMATION (GSAP) ---
function initScrollFloat() {
    gsap.registerPlugin(ScrollTrigger);

    const floatContainers = document.querySelectorAll('.scroll-float-text');

    floatContainers.forEach(textEl => {
        // Split text into chars
        const text = textEl.innerText;
        textEl.innerHTML = '';
        const chars = text.split('').map(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'char';
            textEl.appendChild(span);
            return span;
        });

        // Animation
        // from: opacity: 0, yPercent: 120, scaleY: 2.3, scaleX: 0.7
        // to: opacity: 1, yPercent: 0, scaleY: 1, scaleX: 1

        gsap.fromTo(chars,
            {
                opacity: 0,
                yPercent: 120,
                scaleY: 2.3,
                scaleX: 0.7,
                transformOrigin: '50% 0%'
            },
            {
                opacity: 1,
                yPercent: 0,
                scaleY: 1,
                scaleX: 1,
                stagger: 0.03,
                duration: 1,
                ease: 'back.out(2)', // Use back.out for the finish
                scrollTrigger: {
                    trigger: textEl,
                    start: 'top bottom-=10%', // Start when top of element hits bottom of viewport - 10%
                    end: 'bottom center',
                    scrub: 1, // Smooth scrub
                }
            }
        );
    });
}

// --- 7. BACK TO TOP BUTTON ---
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    // Show/Hide Logic
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    // Click Logic
    btn.addEventListener('click', () => {
        if (window.lenis) {
            window.lenis.scrollTo(0, { duration: 2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// --- 8. FADE UP OBSERVER (Contact Content) ---
function initFadeUpObserver() {
    const fadeElements = document.querySelectorAll('.fade-up-observ');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once visible if you want it to trigger only once
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    fadeElements.forEach(el => observer.observe(el));
}

// --- 9. FORCE SCROLL TO TOP ON LOAD ---
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

window.addEventListener('load', () => {
    // Small timeout to override browser anchor jumping
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (window.location.hash) {
            history.replaceState(null, null, ' '); // Clean URL without reload
        }
    }, 10);
});

// --- 10. GLOBAL TOAST NOTIFICATION ---
window.showToast = function (message) {
    // Remove existing
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate In
    setTimeout(() => toast.classList.add('active'), 10);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Mobile Alert
if (window.innerWidth < 768) {
    window.addEventListener('load', () => {
        setTimeout(() => window.showToast("📱 Best experience on Desktop"), 1500);
    });
}

// --- 11. DOT NAVIGATION ---
function initDotNav() {
    const dots = document.querySelectorAll('.dot');

    // Reuse existing observer logic but target dots
    const dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all dots
                dots.forEach(d => d.classList.remove('active'));
                // Find corresponding dot
                const id = entry.target.getAttribute('id');
                const activeDot = document.querySelector(`.dot[href="#${id}"]`);
                if (activeDot) activeDot.classList.add('active');
            }
        });
    }, { threshold: 0.5 }); // 50% visible

    sections.forEach(sec => {
        if (sec.id) dotObserver.observe(sec);
    });
}

// --- 12. CREDITS TOGGLE ---
function initCredits() {
    const creditsBtn = document.querySelector('.btn-credits');
    const creditsWrapper = document.querySelector('.credits-wrapper');

    if (creditsBtn && creditsWrapper) {
        creditsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            creditsWrapper.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!creditsWrapper.contains(e.target)) {
                creditsWrapper.classList.remove('active');
            }
        });
    }
}

// --- 11. THEME SYSTEM ---
function initThemeSystem() {
    const themeBtn = document.getElementById('themeBtn');
    const themeItems = document.querySelectorAll('.theme-item');
    const body = document.body;

    // Load saved theme
    const savedTheme = localStorage.getItem('site-theme') || 'default';
    setTheme(savedTheme);

    // Toggle Menu (optional specific logic if hover isn't enough for mobile)
    themeBtn.addEventListener('click', (e) => {
        // e.stopPropagation(); // If we add click toggle later
    });

    themeItems.forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.getAttribute('data-theme');
            setTheme(theme);
            localStorage.setItem('site-theme', theme);
        });
    });

    function setTheme(theme) {
        // Reset classes
        body.classList.remove('theme-light', 'theme-christmas');

        if (theme === 'light') body.classList.add('theme-light');
        if (theme === 'christmas') body.classList.add('theme-christmas');

        // Dispatch Event for Particles
        const event = new CustomEvent('themeChange', { detail: theme });
        window.dispatchEvent(event);
    }
}

// Initialize New Features
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initScrollFloat();
        initBackToTop();
        initFadeUpObserver();
        initDotNav();
        initCredits();
        // initThemeSystem handled in theme.js
    });
} else {
    initScrollFloat();
    initBackToTop();
    initFadeUpObserver();
    initDotNav();
    initCredits();
}
