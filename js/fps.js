// --- FPS COUNTER 2.0 ---
class FPSCounter {
    constructor() {
        this.frame = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        this.active = true; // Enabled by default? User asked to "make it enable/disable". Let's default to visible or let user toggle. 

        this.createUI();
        this.loop();
    }

    createUI() {
        // Container
        this.el = document.createElement('div');
        this.el.id = 'fps-counter';
        this.el.className = 'fps-pill';

        // Text
        this.text = document.createElement('span');
        this.text.textContent = 'FPS: --';
        this.el.appendChild(this.text);

        document.body.appendChild(this.el);

        // Toggle on click
        this.el.addEventListener('click', () => {
            this.active = !this.active;
            this.el.classList.toggle('disabled', !this.active);
            if (!this.active) {
                this.text.textContent = 'FPS: OFF';
            }
        });
    }

    loop() {
        if (!this.active) {
            // Still loop to catch up logic or just pause?
            // If we pause, we can't count frames. 
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        const now = performance.now();
        this.frame++;

        if (now - this.lastTime >= 500) { // Update every 500ms
            this.fps = Math.round((this.frame * 1000) / (now - this.lastTime));

            // Color Logic
            if (this.fps >= 55) {
                this.el.style.color = 'var(--text-primary, #fff)';
                this.el.style.borderColor = 'rgba(0, 255, 0, 0.5)';
            } else if (this.fps >= 30) {
                this.el.style.color = '#ffff00';
                this.el.style.borderColor = 'rgba(255, 255, 0, 0.5)';
            } else {
                this.el.style.color = '#ff0000';
                this.el.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            }

            this.text.textContent = `FPS: ${this.fps}`;

            this.frame = 0;
            this.lastTime = now;
        }

        requestAnimationFrame(this.loop.bind(this));
    }
}

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FPSCounter());
} else {
    new FPSCounter();
}
