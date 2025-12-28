// --- TARGET CURSOR MODULE ---
(function () {
    // 1. Device Check
    const isMobile = (() => {
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        return hasTouchScreen && isSmallScreen;
    })();

    if (isMobile) return;

    // Use a slight delay to ensure DOM is ready, though defer/bottom script helps
    window.addEventListener('DOMContentLoaded', () => {
        const cursorWrapper = document.getElementById('customCursor');
        if (!cursorWrapper) {
            console.error("Target Cursor: Element #customCursor not found.");
            return;
        }

        const cursorInner = cursorWrapper.querySelector('.target-cursor-inner');
        const dot = cursorWrapper.querySelector('.target-cursor-dot');
        const corners = Array.from(cursorWrapper.querySelectorAll('.target-cursor-corner'));

        if (!cursorInner || !dot || corners.length !== 4) {
            console.error("Target Cursor: Missing internal elements.");
            return;
        }

        const constants = { borderWidth: 2, cornerSize: 12 };
        const restOffset = 18;

        // Initial Positions
        const restPositions = [
            { x: -restOffset, y: -restOffset }, // TL
            { x: restOffset - constants.cornerSize, y: -restOffset },  // TR
            { x: restOffset - constants.cornerSize, y: restOffset - constants.cornerSize },   // BR
            { x: -restOffset, y: restOffset - constants.cornerSize }   // BL
        ];

        // 2. Setup GSAP
        // Wrapper handles Position (X, Y)
        const xTo = gsap.quickTo(cursorWrapper, "x", { duration: 0.1, ease: "power3.out" });
        const yTo = gsap.quickTo(cursorWrapper, "y", { duration: 0.1, ease: "power3.out" });

        // Initialize state
        gsap.set(cursorWrapper, {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            opacity: 1,
            autoAlpha: 1,
            display: 'block'
        });

        gsap.set(cursorInner, { rotation: 0 });

        corners.forEach((corner, i) => {
            gsap.set(corner, { x: restPositions[i].x, y: restPositions[i].y });
        });

        // 3. State Tracking
        let activeTarget = null;
        let isActive = false;
        const targetCornerPositions = [];
        const activeStrength = { current: 0 };
        let spinTween = null;

        // 4. Mouse Listener
        document.body.classList.add('custom-cursor-active');

        window.addEventListener('mousemove', (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        });

        // 5. Spin Animation (On INNER)
        const createSpinAnimation = () => {
            if (spinTween) spinTween.kill();
            spinTween = gsap.to(cursorInner, {
                rotation: '+=360',
                duration: 3,
                ease: 'none',
                repeat: -1
            });
        };
        createSpinAnimation();

        // 6. Unified Physics Ticker
        const tickerFn = () => {
            // 1. Continuous Tracking (Fix for resizing elements like Cards)
            if (isActive && activeTarget) {
                updateTargetPositions(activeTarget);
            }

            const rot = gsap.getProperty(cursorInner, 'rotation') * Math.PI / 180;
            const cos = Math.cos(-rot);
            const sin = Math.sin(-rot);

            // Lerp Factor: Higher = Snappier, Lower = Smoother
            // We can adjust this dynamically relative to distance if we want, but 0.15 is a good Apple-like feel
            const lerpFactor = 0.2;

            corners.forEach((corner, i) => {
                let destX, destY;

                if (isActive && targetCornerPositions[i]) {
                    // --- ACTIVE STATE: Track Target (Rotation Compensated) ---
                    const globalOffX = targetCornerPositions[i].x - gsap.getProperty(cursorWrapper, 'x');
                    const globalOffY = targetCornerPositions[i].y - gsap.getProperty(cursorWrapper, 'y');

                    // Project to local space
                    destX = globalOffX * cos - globalOffY * sin;
                    destY = globalOffX * sin + globalOffY * cos;
                } else {
                    // --- IDLE STATE: Return to Rest ---
                    destX = restPositions[i].x;
                    destY = restPositions[i].y;
                }

                // Apply Smooth Interpolation (Lerp)
                const curX = gsap.getProperty(corner, 'x');
                const curY = gsap.getProperty(corner, 'y');

                // If massive distance (e.g. init), snap. Otherwise smooth.
                // Doing simple lerp always
                const nextX = curX + (destX - curX) * lerpFactor;
                const nextY = curY + (destY - curY) * lerpFactor;

                // Optimization: Stop updating if minimal movement
                if (Math.abs(destX - curX) < 0.1 && Math.abs(destY - curY) < 0.1) {
                    gsap.set(corner, { x: destX, y: destY });
                } else {
                    gsap.set(corner, { x: nextX, y: nextY });
                }
            });
        };
        gsap.ticker.add(tickerFn);

        // 7. Click Feedback
        window.addEventListener('mousedown', () => {
            gsap.to(dot, { scale: 0.5, duration: 0.2 });
        });
        window.addEventListener('mouseup', () => {
            gsap.to(dot, { scale: 1, duration: 0.2 });
        });

        // 8. Hover Logic (Magnetic Stick) - Simplified
        const targetSelector = 'a, button, input, textarea, .cursor-target, .work-item, .mono-card, .btn-contact, .toggle-btn, .btn-primary, .btn-read-more, .contact-item, .logo';

        const cleanUpTarget = () => {
            isActive = false;
            activeTarget = null;

            // Resume Spin on INNER
            const currentRot = gsap.getProperty(cursorInner, 'rotation');
            const nextRot = Math.round(currentRot / 360) * 360 + 360;

            // Smoothly spin up
            gsap.to(cursorInner, {
                rotation: nextRot,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    gsap.set(cursorInner, { rotation: nextRot % 360 });
                    if (!isActive) createSpinAnimation();
                }
            });
        };

        const updateTargetPositions = (target) => {
            const rect = target.getBoundingClientRect();
            const pad = 10; // Comfortable padding
            const cSize = constants.cornerSize;

            targetCornerPositions[0] = { x: rect.left - pad, y: rect.top - pad };
            targetCornerPositions[1] = { x: rect.right + pad - cSize, y: rect.top - pad };
            targetCornerPositions[2] = { x: rect.right + pad - cSize, y: rect.bottom + pad - cSize };
            targetCornerPositions[3] = { x: rect.left - pad, y: rect.bottom + pad - cSize };
        };

        const onEnter = (e) => {
            const target = e.target.closest(targetSelector);
            if (!target) {
                if (activeTarget) cleanUpTarget();
                return;
            }

            if (activeTarget === target) return;

            activeTarget = target;
            isActive = true;
            updateTargetPositions(target);

            // Stop spin on INNER
            if (spinTween) spinTween.kill();

            // Snap Rotation to nearest upright orientation
            const curRot = gsap.getProperty(cursorInner, 'rotation');
            const snapRot = Math.round(curRot / 360) * 360;

            gsap.to(cursorInner, {
                rotation: snapRot,
                duration: 0.4,
                ease: 'expo.out' // Snappy but smooth entry
            });
        };

        window.addEventListener('mouseover', onEnter, { passive: true });
        window.addEventListener('scroll', () => {
            if (activeTarget && isActive) updateTargetPositions(activeTarget);
        }, { passive: true });

        console.log("Modular Target Cursor Initialized");
    });
})();
