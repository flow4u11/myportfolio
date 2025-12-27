document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CONFIG = {
        maxDistance: 300,  // Distance at which effect starts
        minWeight: 700,    // Base font weight (Bold) - tweaked to match "old" thickness
        maxWeight: 950,    // Max font weight (Extra Black)
        attenuation: 2,    // How fast the effect drops off
    };

    // --- HELPER: Split Text into Chars ---
    function splitTextToChars(element) {
        if (!element) return;

        // If already split (check for .var-char class), skip
        if (element.querySelector('.var-char')) return;

        const nodes = Array.from(element.childNodes);

        element.innerHTML = ''; // Clear content to rebuild

        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Split text node
                const chars = node.textContent.split('');
                chars.forEach(char => {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.className = 'var-char';
                    span.style.display = 'inline-block';
                    span.style.transition = 'font-weight 0.1s ease-out';
                    span.style.willChange = 'font-weight';
                    if (char === ' ') span.style.width = '0.3em'; // Preserve space width
                    element.appendChild(span);
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Recursively split elements (like .depth-word or .word)
                // We clone the element to preserve its classes/styles, but empty it first
                const clone = node.cloneNode(false);
                splitTextToCharsChildren(node, clone);
                element.appendChild(clone);
            }
        });
    }

    function splitTextToCharsChildren(sourceNode, targetNode) {
        const text = sourceNode.textContent;
        const chars = text.split('');
        chars.forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'var-char';
            span.style.display = 'inline-block';
            span.style.transition = 'font-weight 0.1s ease-out';
            if (char === ' ') span.style.width = '0.3em';
            targetNode.appendChild(span);
        });
    }

    // --- TARGETS ---
    const headline = document.querySelector('.hero-text h1');
    const aboutText = document.querySelector('.scroll-reveal-text');

    // Wait for other scripts (like GSAP splitter) to finish?
    // GSAP split in script.js happens on DOMContentLoaded.
    // We can run this after a short delay or ensure this script runs last.
    // For now, let's try running immediately but handling existing structure.

    if (headline) splitTextToChars(headline);

    // For scroll-reveal-text, script.js might have already split it into .word
    // We should target the .word elements if they exist, or the text itself.
    if (aboutText) {
        // Check if words exist
        // We use a MutationObserver to wait for script.js to do its job if needed
        const observer = new MutationObserver(() => {
            if (aboutText.querySelectorAll('.word').length > 0) {
                observer.disconnect();
                aboutText.querySelectorAll('.word').forEach(word => {
                    splitTextToChars(word);
                });
            }
        });
        observer.observe(aboutText, { childList: true, subtree: true });

        // Fallback if already done
        if (aboutText.querySelectorAll('.word').length > 0) {
            aboutText.querySelectorAll('.word').forEach(word => {
                splitTextToChars(word);
            });
        }
    }

    // --- MOUSE MOVE HANDLER ---
    const allChars = [];

    // Refresh char list periodically or after split
    function updateCharList() {
        allChars.length = 0; // Clear
        document.querySelectorAll('.var-char').forEach(char => {
            allChars.push({
                element: char,
                rect: char.getBoundingClientRect()
            });
        });
    }

    // Update rects on scroll/resize since they move
    window.addEventListener('resize', () => setTimeout(updateCharList, 100));
    window.addEventListener('scroll', () => {
        // Throttle?
        updateCharList();
    }, { capture: true, passive: true });

    // Initial update after a delay to ensure layout
    setTimeout(updateCharList, 500);
    setTimeout(updateCharList, 1500); // Audit

    document.addEventListener('mousemove', (e) => {
        if (allChars.length === 0) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        allChars.forEach(charData => {
            const rect = charData.rect;
            const charCenterWgX = rect.left + rect.width / 2;
            const charCenterWgY = rect.top + rect.height / 2;

            const dist = Math.sqrt(Math.pow(mouseX - charCenterWgX, 2) + Math.pow(mouseY - charCenterWgY, 2));

            let weight = CONFIG.minWeight;

            if (dist < CONFIG.maxDistance) {
                // Calculate weight based on distance (Gaussian-ish or Linear)
                const factor = 1 - Math.min(dist / CONFIG.maxDistance, 1);
                // Non-linear for better feeling
                const curvedFactor = Math.pow(factor, CONFIG.attenuation);
                weight = CONFIG.minWeight + (curvedFactor * (CONFIG.maxWeight - CONFIG.minWeight));
            }

            // Snap to nearest 100 if var font not smooth, 
            // but Inter var supports smooth. Let's just set raw.
            charData.element.style.fontWeight = Math.floor(weight);
        });
    });
});
