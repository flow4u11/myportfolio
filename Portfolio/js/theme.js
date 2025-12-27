// --- THEME SYSTEM MODULE ---
function initThemeSystem() {
    const themeBtn = document.getElementById('themeBtn');
    const themeItems = document.querySelectorAll('.theme-item');
    const body = document.body;

    if (!themeBtn) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('site-theme') || 'default';
    setTheme(savedTheme);

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

            // DEVELOPMENT MODE: Disable Light/Christmas
            if (theme !== 'default') {
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
        // Reset classes
        body.classList.remove('theme-light', 'theme-christmas');

        if (theme === 'light') body.classList.add('theme-light');
        if (theme === 'christmas') body.classList.add('theme-christmas');

        // Dispatch Event for Particles
        const event = new CustomEvent('themeChange', { detail: theme });
        window.dispatchEvent(event);
    }
}

// Auto-init if DOM is ready, or wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSystem);
} else {
    initThemeSystem();
}
