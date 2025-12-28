// --- THEME SYSTEM MODULE ---
function initThemeSystem() {
    const themeBtn = document.getElementById('themeBtn');
    const themeItems = document.querySelectorAll('.theme-item');
    const body = document.body;

    if (!themeBtn) return;

    // Load saved theme
    // const savedTheme = localStorage.getItem('site-theme') || 'default';

    // [REQUESTED BEHAVIOR] Force Default on Refresh
    // We ignore saved theme and always start fresh.
    setTheme('default');

    // Toggle Menu
    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = themeBtn.closest('.theme-wrapper');
        wrapper.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('themeBtn').closest('.theme-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
            wrapper.classList.remove('active');
        }
    });

    themeItems.forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.getAttribute('data-theme');

            // DEVELOPMENT MODE: Disable Light/Christmas (Allow p5)
            if (theme !== 'default' && theme !== 'p5') {
                if (window.showToast) {
                    window.showToast("Theme is in development");
                } else {
                    alert("Theme is in development");
                }
                return; // Stop execution
            }

            setTheme(theme);
            localStorage.setItem('site-theme', theme);
        });
    });

    function setTheme(theme) {
        // 1. Reset Body Classes
        body.classList.remove('theme-light', 'theme-christmas', 'theme-p5');

        if (theme === 'light') body.classList.add('theme-light');
        if (theme === 'christmas') body.classList.add('theme-christmas');
        if (theme === 'p5') body.classList.add('theme-p5');

        // 2. HEADLINE STATE ENFORCER
        // We do NOT use backups. We forcefully write the correct HTML for the active theme.
        const headlineContainer = document.querySelector('.hero-text h1');

        if (headlineContainer) {
            if (theme === 'p5') {
                // --- PERSONA 5 STATE ---
                // Remove Default Gradient
                headlineContainer.classList.remove('smooth-text');

                // Inject P5 Structure (Spans for styling)
                headlineContainer.innerHTML = `
                    <span class="p5-word">Designing</span> 
                    <span class="p5-word">With</span><br>
                    <span class="p5-word">Depth.</span>
                `;

                // Clear any inline styles (Hard reset)
                headlineContainer.style.cssText = '';

            } else {
                // --- DEFAULT STATE ---
                // Add Default Gradient
                headlineContainer.classList.add('smooth-text');

                // Inject Default Structure (Clean Text, No Spans)
                // This fixes the "broken layout" issue by holding standard text.
                headlineContainer.innerHTML = `Designing With<br>Depth.`;

                // CRITICAL: Clear P5 transforms (Skew, Rotate) so Default text sits flat
                headlineContainer.style.cssText = '';
            }
        }

        // Dispatch Event
        const event = new CustomEvent('themeChange', { detail: theme });
        window.dispatchEvent(event);
    }
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSystem);
} else {
    initThemeSystem();
}
