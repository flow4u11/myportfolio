/**
 * NOTIFICATIONS SYSTEM
 * Completely isolated to ensure no conflicts.
 */
(function () {
    console.log("🔔 Notifications System Initializing...");

    // 1. Core Styles - Injected directly to avoid CSS file cache issues
    const css = `
        .toast-notification-container {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            z-index: 2147483647; /* Max Z-Index */
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
            opacity: 0;
        }

        .toast-notification-container.active {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
            pointer-events: auto;
        }

        .toast-content {
            background: rgba(15, 15, 15, 0.95);
            color: #fff;
            padding: 14px 28px;
            border-radius: 50px;
            font-family: 'Inter', sans-serif;
            font-size: 0.95rem;
            font-weight: 500;
            border: 1px solid rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            white-space: nowrap;
        }
    `;

    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    // 2. Toast Function
    window.showToast = function (message) {
        console.log("🔔 Showing Toast:", message);

        // Remove existing
        const existing = document.querySelector('.toast-notification-container');
        if (existing) existing.remove();

        // Create Container
        const container = document.createElement('div');
        container.className = 'toast-notification-container';

        // Create Content
        const content = document.createElement('div');
        content.className = 'toast-content';
        content.textContent = message;

        container.appendChild(content);
        document.body.appendChild(container);

        // Force Reflow
        window.getComputedStyle(container).opacity;

        // Animate In
        requestAnimationFrame(() => {
            container.classList.add('active');
        });

        // Remove Timer
        setTimeout(() => {
            container.classList.remove('active');
            setTimeout(() => {
                if (container.parentNode) container.remove();
            }, 600); // Wait for transition
        }, 4000); // 4s display time
    };

    // 3. Logic Sequence
    function initLogic() {
        console.log("🔔 Logic Start. Window Width:", window.innerWidth);
        const isMobile = window.innerWidth < 768;

        // 1. Mobile Alert
        if (isMobile) {
            setTimeout(() => {
                window.showToast("Best experience on Desktop");
            }, 1000);
        }

        // HW Acceleration Warning
        // Desktop: 1.5s, Mobile: 4.5s
        const delay = isMobile ? 4500 : 1500;
        setTimeout(() => {
            window.showToast("Enable Hardware Acceleration for smoothness");
        }, delay);
    }

    // 4. Execution
    if (document.readyState === 'complete') {
        initLogic();
    } else {
        window.addEventListener('load', initLogic);
    }

})();
