// --- VARIABLE PROXIMITY TEXT EFFECT (Smart DOM Preserving) ---

export class VariableProximity {
    constructor(element, options = {}) {
        this.element = element;
        this.options = Object.assign({
            radius: 100,
            falloff: 'linear', // 'linear', 'exponential', 'gaussian'
            fromSettings: "'wght' 900", // Match original weight
            toSettings: "'wght' 700"
        }, options);

        this.letterElements = [];
        this.mouse = { x: 0, y: 0 };
        this.rect = this.element.getBoundingClientRect();
        this.rafId = null;

        // Parsing settings
        this.parsedSettings = this.parseSettings(this.options.fromSettings, this.options.toSettings);

        this.init();
    }

    parseSettings(fromStr, toStr) {
        const parse = (str) => {
            const map = new Map();
            str.split(',').forEach(s => {
                const parts = s.trim().split(' ');
                if (parts.length === 2) {
                    const axis = parts[0].replace(/['"]/g, '');
                    const val = parseFloat(parts[1]);
                    map.set(axis, val);
                }
            });
            return map;
        };

        const from = parse(fromStr);
        const to = parse(toStr);

        return Array.from(from.entries()).map(([axis, fromValue]) => ({
            axis,
            fromValue,
            toValue: to.get(axis) ?? fromValue
        }));
    }

    init() {
        this.splitTextTree(this.element);

        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('scroll', this.onScroll.bind(this));

        this.start();
    }

    // Recursively handle text nodes while preserving structure
    splitTextTree(root) {
        const childNodes = Array.from(root.childNodes);

        // Clear root content to rebuild it
        root.innerHTML = '';

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // It's text, split it
                const text = node.textContent; // Don't trim excessively or we lose spaces?
                // Split logic
                const words = text.split(/(\s+)/);
                words.forEach(word => {
                    if (!word) return;

                    if (word.match(/^\s+$/)) {
                        // Whitespace
                        const s = document.createElement('span');
                        s.innerHTML = '&nbsp;';
                        s.style.display = 'inline-block';
                        root.appendChild(s);
                    } else {
                        // Word
                        const wordSpan = document.createElement('span');
                        wordSpan.style.display = 'inline-block';
                        wordSpan.style.whiteSpace = 'nowrap';

                        word.split('').forEach(char => {
                            const charSpan = document.createElement('span');
                            charSpan.textContent = char;
                            charSpan.style.display = 'inline-block';
                            charSpan.style.transition = 'font-variation-settings 0.1s linear';
                            charSpan.style.fontVariationSettings = this.options.fromSettings;

                            this.letterElements.push(charSpan);
                            wordSpan.appendChild(charSpan);
                        });
                        root.appendChild(wordSpan);
                    }
                });

            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // It's an element (br, span, etc.)
                if (node.tagName === 'BR') {
                    root.appendChild(node.cloneNode(true));
                } else {
                    // Clone the wrapper (e.g. span.depth-word)
                    const clone = node.cloneNode(false); // shallow clone (attributes only)
                    root.appendChild(clone);
                    // Recurse into the original node's children
                    this.splitTextTreeShim(node, clone);
                }
            }
        });
    }

    // Helper to process children from 'source' and append to 'target'
    splitTextTreeShim(source, target) {
        const childNodes = Array.from(source.childNodes);
        // We aren't clearing source because we are reading from it.
        // We are populating target.

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const words = text.split(/(\s+)/);
                words.forEach(word => {
                    if (!word) return;
                    if (word.match(/^\s+$/)) {
                        const s = document.createElement('span');
                        s.innerHTML = '&nbsp;';
                        s.style.display = 'inline-block';
                        target.appendChild(s);
                    } else {
                        const wordSpan = document.createElement('span');
                        wordSpan.style.display = 'inline-block';
                        wordSpan.style.whiteSpace = 'nowrap';
                        word.split('').forEach(char => {
                            const charSpan = document.createElement('span');
                            charSpan.textContent = char;
                            charSpan.style.display = 'inline-block';
                            charSpan.style.transition = 'font-variation-settings 0.1s linear';
                            charSpan.style.fontVariationSettings = this.options.fromSettings;
                            this.letterElements.push(charSpan);
                            wordSpan.appendChild(charSpan);
                        });
                        target.appendChild(wordSpan);
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'BR') {
                    target.appendChild(node.cloneNode(true));
                } else {
                    const clone = node.cloneNode(false);
                    target.appendChild(clone);
                    this.splitTextTreeShim(node, clone);
                }
            }
        });
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onResize() {
        this.rect = this.element.getBoundingClientRect();
    }

    onScroll() {
        this.rect = this.element.getBoundingClientRect();
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    calculateFalloff(dist, radius) {
        const norm = Math.min(Math.max(1 - dist / radius, 0), 1);
        switch (this.options.falloff) {
            case 'exponential': return norm ** 2;
            case 'gaussian': return Math.exp(-((dist / (radius / 2)) ** 2) / 2);
            case 'linear':
            default: return norm;
        }
    }

    update() {
        this.letterElements.forEach(span => {
            const rect = span.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dist = this.calculateDistance(this.mouse.x, this.mouse.y, centerX, centerY);

            if (dist >= this.options.radius) {
                span.style.fontVariationSettings = this.options.fromSettings;
                return;
            }

            const falloffVal = this.calculateFalloff(dist, this.options.radius);

            const newSettings = this.parsedSettings.map(({ axis, fromValue, toValue }) => {
                const val = fromValue + (toValue - fromValue) * falloffVal;
                return `'${axis}' ${val}`;
            }).join(', ');

            span.style.fontVariationSettings = newSettings;
        });

        this.rafId = requestAnimationFrame(this.update.bind(this));
    }

    start() {
        if (!this.rafId) this.update();
    }

    stop() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}
