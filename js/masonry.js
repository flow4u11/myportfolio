/**
 * Masonry Grid Implementation
 * Ports the "Shortest Column" logic and GSAP animations from React to Vanilla JS.
 * Supports colSpan for specific items (like Headers).
 */

class MasonryGrid {
    constructor(containerSelector, items, config = {}) {
        this.container = document.querySelector(containerSelector);
        this.items = items;

        // Configuration with defaults
        this.config = Object.assign({
            columns: {
                1500: 4, // 4 columns on large screens to fit header (span 2) nicely
                1000: 3,
                600: 2,
                0: 1 // Mobile
            },
            gap: 20, // Used for calculation mainly, visuals via CSS
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out'
        }, config);

        this.columnCount = 2; // Will be set by setColumns
        this.isReady = false;
        this.isFirstRender = true;

        // Bind methods
        this.handleResize = this.handleResize.bind(this);

        // Initialize
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error('Masonry container not found');
            return;
        }

        // 1. Preload Images
        await this.preloadImages();

        // 2. Setup Resize Listener
        window.addEventListener('resize', this.handleResize);

        // 3. Initial Render
        this.handleResize(); // Sets columns and triggers render

        this.isReady = true;
    }

    preloadImages() {
        if (!this.items || this.items.length === 0) return Promise.resolve();

        const promises = this.items.map(item => {
            return new Promise((resolve) => {
                if (!item.img) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.src = item.img;
                img.onload = () => {
                    // Calculate aspect ratio (Height / Width)
                    item.aspectRatio = img.naturalHeight / img.naturalWidth;
                    resolve();
                };
                img.onerror = () => resolve(); // Resolve anyway
            });
        });

        return Promise.all(promises);
    }

    determineColumns() {
        const width = window.innerWidth;
        const breakpoints = Object.keys(this.config.columns).map(Number).sort((a, b) => b - a);

        for (let bp of breakpoints) {
            if (width >= bp) {
                return this.config.columns[bp];
            }
        }
        return 1;
    }

    handleResize() {
        const newCols = this.determineColumns();
        this.columnCount = newCols;
        this.render();
    }

    createDOM(gridItems) {
        // Clear container to rebuild (simpler for this refactor)
        this.container.innerHTML = '';

        gridItems.forEach(item => {
            const node = document.createElement('div');
            node.className = 'masonry-item';
            node.setAttribute('data-id', item.id);

            node.innerHTML = `
                <div class="masonry-item-inner cursor-target">
                    ${item.img ?
                    `<img src="${item.img}" class="masonry-image" alt="Project" draggable="false">` :
                    `<div class="masonry-placeholder"></div>`
                }
                    <!-- Glare Effect -->
                    <div class="masonry-glare"></div>

                    <div class="masonry-overlay">
                        <h4 class="masonry-title">${item.name || `Project ${item.id} : Name`}</h4>
                        <p class="masonry-desc">${item.desc || 'Description'}</p>
                        <p class="masonry-full-desc">This is a description of the project. It reveals full detail when the card is active.</p>
                    </div>
                    <div class="click-instruction">Click anywhere to close</div>
                </div>
            `;

            // Add click listener for Active View
            const inner = node.querySelector('.masonry-item-inner');
            inner.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent immediate close
                this.toggleActive(node);
            });

            // Set initial styles for animation
            gsap.set(node, {
                opacity: 0,
                y: 100 // animate from bottom
            });

            this.container.appendChild(node);
        });
    }

    /**
     * Advanced Layout Calculation supporting colSpan
     */
    calculateLayout() {
        if (!this.container) return [];

        const containerWidth = this.container.getBoundingClientRect().width;
        // Subtract gaps from total width to find column width
        // (Cols - 1) * gap
        const totalGapSpace = (this.columnCount - 1) * this.config.gap;
        const columnWidth = (containerWidth - totalGapSpace) / this.columnCount;

        // Array to track current Y position of each column
        let colHeights = new Array(this.columnCount).fill(0);

        return this.items.map(item => {
            let x, y, w, h;
            let targetCol = 0;

            // --- REGULAR ITEMS (Span 1) ---
            // Find shortest column
            const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));

            targetCol = shortestColIndex;
            x = targetCol * (columnWidth + this.config.gap);
            y = colHeights[shortestColIndex];
            w = columnWidth;

            // Height
            if (item.aspectRatio) {
                h = columnWidth * item.aspectRatio;
            } else {
                h = item.height || 300;
            }

            // Update colHeights
            colHeights[shortestColIndex] = y + h + this.config.gap;

            return {
                id: item.id,
                x,
                y,
                w,
                h
            };
        });
    }

    render() {
        // If DOM empty, create it first
        if (this.container.children.length === 0) {
            this.createDOM(this.items);
        }

        const positionedItems = this.calculateLayout();

        // Calculate container height
        // We can't just take max(colHeights) because calculateLayout returns positions.
        // Let's deduce from positions.
        let maxH = 0;
        positionedItems.forEach(p => {
            if (p.y + p.h > maxH) maxH = p.y + p.h;
        });

        this.container.style.height = `${maxH}px`;

        // Animate
        positionedItems.forEach((pos, index) => {
            const el = this.container.querySelector(`[data-id="${pos.id}"]`);
            if (!el) return;

            // Skip animation for active item to prevent jumpiness
            if (el.classList.contains('is-active')) return;

            if (this.isFirstRender) {
                // Entrance Animation
                gsap.to(el, {
                    x: pos.x,
                    y: pos.y,
                    width: pos.w,
                    height: pos.h,
                    opacity: 1,
                    duration: this.config.duration,
                    ease: this.config.ease,
                    delay: index * this.config.stagger
                });
            } else {
                // Resize Re-layout
                gsap.to(el, {
                    x: pos.x,
                    y: pos.y,
                    width: pos.w,
                    height: pos.h,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            }
        });

        this.isFirstRender = false;
    }

    toggleActive(clickedNode) {
        // If we are already animating, ignore
        if (this.isAnimating) return;

        const isActive = clickedNode.classList.contains('is-active');

        // 1. CLOSE ACTIVE (if any)
        if (isActive) {
            this.closeActive(clickedNode);
        }
        // 2. OPEN NEW
        else {
            // Close others first if any
            const existingActive = this.container.querySelector('.masonry-item.is-active');
            if (existingActive) {
                this.closeActive(existingActive);
            }
            this.openActive(clickedNode);
        }
    }

    openActive(node) {
        this.isAnimating = true;
        node.classList.add('is-active');
        this.container.classList.add('has-active-item');

        const inner = node.querySelector('.masonry-item-inner');

        // 1. Calculate Bounds
        const rect = node.getBoundingClientRect(); // Current position relative to viewport
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        // 2. Calculate Scale to Fit (e.g., 80% of screen, preserving aspect ratio)
        // We look at the node's dimensions (which might be the column width)
        const targetW = viewportW * 0.85;
        const targetH = viewportH * 0.85;

        const scaleX = targetW / rect.width;
        const scaleY = targetH / rect.height;

        // Choose the smaller scale to fit within BOTH dimensions
        const scale = Math.min(scaleX, scaleY);

        // 3. Calculate Center Position
        // Center of viewport - Center of element
        const viewCenterX = viewportW / 2;
        const viewCenterY = viewportH / 2;
        const itemCenterX = rect.left + (rect.width / 2);
        const itemCenterY = rect.top + (rect.height / 2);

        const x = viewCenterX - itemCenterX;
        const y = viewCenterY - itemCenterY;

        // 4. Animate Inner
        gsap.to(inner, {
            x: x,
            y: y,
            scale: scale,
            duration: 0.3,
            ease: 'expo.inOut',
            onComplete: () => {
                this.isAnimating = false;
                // Add Scroll Listener to close
                this.addScrollListener();

                // ADD GLOBAL CLICK LISTENER (delayed)
                setTimeout(() => {
                    this._docClickCloser = (e) => {
                        this.closeActive(node);
                    };
                    window.addEventListener('click', this._docClickCloser, { once: true, capture: true });
                }, 50);
            }
        });
    }

    closeActive(node) {
        this.isAnimating = true;
        const inner = node.querySelector('.masonry-item-inner');

        // Animate back to 0,0, scale 1
        gsap.to(inner, {
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.2,
            ease: 'expo.out', // Smooth exit
            onComplete: () => {
                node.classList.remove('is-active');
                this.container.classList.remove('has-active-item');
                this.isAnimating = false;

                // Clear inline styles to allow hover effects to resume cleanly
                gsap.set(inner, { clearProps: "all" });
            }
        });

        this.removeScrollListener();
        if (this._docClickCloser) {
            window.removeEventListener('click', this._docClickCloser, { capture: true });
            this._docClickCloser = null;
        }
    }

    addScrollListener() {
        this._scrollCloser = () => {
            const activeNode = this.container.querySelector('.masonry-item.is-active');
            if (activeNode && !this.isAnimating) {
                this.closeActive(activeNode);
            }
        };
        window.addEventListener('scroll', this._scrollCloser, { passive: true });
    }

    removeScrollListener() {
        if (this._scrollCloser) {
            window.removeEventListener('scroll', this._scrollCloser);
            this._scrollCloser = null;
        }
    }
}

// Initialize with sample data when DOM is ready
document.addEventListener('DOMContentLoaded', () => {

    // Define Data
    const sampleItems = [
        // PROJECTS
        { id: 1, url: '#', img: 'assets/showcase/project1.png', name: 'Roblox App Redesign', desc: 'A New Design for Roblox App' },
        { id: 2, height: 400, url: '#' },
        { id: 3, url: '#', img: 'assets/showcase/project2.png', name: 'Food Delivery Website', desc: 'A home page of a food delivery website' },
        { id: 4, height: 280, url: '#' },
        { id: 5, url: '#', img: 'assets/showcase/project3.png', name: 'Food Delivery Website', desc: 'A checkout page of a food delivery website' },
        { id: 6, height: 380, url: '#' },
        { id: 7, height: 320, url: '#' },
        { id: 8, height: 500, url: '#' },
        { id: 9, height: 240, url: '#' },
    ];

    // Only init if the element exists
    if (document.querySelector('#masonry-grid')) {
        new MasonryGrid('#masonry-grid', sampleItems);

        // Global click to close active view
        document.addEventListener('click', (e) => {
            const grid = document.querySelector('#masonry-grid');
            // If clicking outside inner card (and grid has active item)
            // Note: Preventing bubbling on the inner card itself is done in createDOM
            // So this handles clicking the "dimmed" background
            if (grid && !e.target.closest('.masonry-item-inner') && grid.classList.contains('has-active-item')) {
                const active = grid.querySelector('.masonry-item.is-active');
                if (active) {
                    // Try to access the instance if we stored it, 
                    // Or for this simple singleton pattern, we might need a global reference or method on the element.
                    // Ideally, the class handles this internally if we attach listener to Document inside class.
                    // But here we are outside.
                    // Let's rely on the class instance's scroll listener or built-in toggle logic.
                    // BUT: we can trigger a click on the active item to 'toggle' it closed!
                    // active.querySelector('.masonry-item-inner').click(); 
                    // Wait, inner has stopPropagation.
                    // We need a clean way to call closeActive.

                    // We'll leave this Global Click listener mostly for "Clicking Empty Space".
                    // But since we don't have easy access to the 'instance', let's move this logic INTO the class init
                    // OR simple hack: re-instantiate or store instance.
                }
            }
        });
    }
});
