// --- PARTICLE BACKGROUND MODULE ---
import { Renderer, Camera, Geometry, Program, Mesh } from 'https://unpkg.com/ogl';

(function () {
    const container = document.getElementById('particles-container');
    if (!container) return;

    // Configuration
    const config = {
        particleCount: 200, // Reduced from 200 for maximum stability
        particleSpread: 10,
        speed: 0.1,
        baseSize: 100,
        sizeRandomness: 1,
        colors: ['#ffffff', '#ffffff', '#ffffff'],
        moveParticlesOnHover: true,
        hoverFactor: 1
    };

    // Helper: HEX to RGB
    const hexToRgb = (hex) => {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const int = parseInt(hex, 16);
        return [
            ((int >> 16) & 255) / 255,
            ((int >> 8) & 255) / 255,
            (int & 255) / 255
        ];
    };

    // Shader: Vertex
    const vertex = /* glsl */ `
        attribute vec3 position;
        attribute vec4 random;
        attribute vec3 color;
        
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpread;
        uniform float uBaseSize;
        uniform float uSizeRandomness;
        uniform float uSnowMode; // 0.0 = float, 1.0 = snow
        
        varying vec4 vRandom;
        varying vec3 vColor;
        
        void main() {
            vRandom = random;
            vColor = color;
            
            vec3 pos = position * uSpread;
            pos.z *= 10.0;
            
            vec4 mPos = modelMatrix * vec4(pos, 1.0);
            float t = uTime;
            
            // Default Float
            if (uSnowMode < 0.5) {
                mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
                mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
                mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
            } 
            // Snow Fall
            else {
                // Continuous fall
                float fallSpeed = mix(0.5, 2.0, random.y);
                mPos.y -= mod(t * fallSpeed, 40.0) - 20.0; // Loop vertically
                mPos.x += sin(t * 0.5 + random.z * 10.0) * 0.5; // Gentle sway
            }
            
            vec4 mvPos = viewMatrix * mPos;

            if (uSizeRandomness == 0.0) {
                gl_PointSize = uBaseSize;
            } else {
                gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
            }

            gl_Position = projectionMatrix * mvPos;
        }
    `;

    // Shader: Fragment
    const fragment = /* glsl */ `
        precision highp float;
        
        uniform float uTime;
        varying vec4 vRandom;
        varying vec3 vColor;

    void main() {
            vec2 uv = gl_PointCoord.xy;
            float d = length(uv - vec2(0.5));

        if (d > 0.5) {
            discard;
        }
        gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    }
    `;

    // Renderer Setup
    const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 1.5), // Cap at 1.5 for performance
        alpha: true,
        depth: false
    });

    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, 20);

    const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener('resize', resize, false);
    resize();

    // Mouse Tracking
    const mouse = { x: 0, y: 0 };
    if (config.moveParticlesOnHover) {
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            mouse.x = x;
            mouse.y = y;
        });
    }

    // Geometry Generation
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        let x, y, z, len;
        do {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            len = x * x + y * y + z * z;
        } while (len > 1 || len === 0);

        const r = Math.cbrt(Math.random());
        positions.set([x * r, y * r, z * r], i * 3);
        randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);

        const col = hexToRgb(config.colors[Math.floor(Math.random() * config.colors.length)]);
        colors.set(col, i * 3);
    }

    const geometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        random: { size: 4, data: randoms },
        color: { size: 3, data: colors }
    });

    // Program Setup
    const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
            uTime: { value: 0 },
            uSpread: { value: config.particleSpread },
            uBaseSize: { value: config.baseSize },
            uSizeRandomness: { value: config.sizeRandomness },
            uSnowMode: { value: 0.0 }
        },
        transparent: true,
        depthTest: false
    });

    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program }); // ensure mesh is created

    // Theme Listener
    window.addEventListener('themeChange', (e) => {
        const theme = e.detail;
        if (theme === 'christmas') {
            program.uniforms.uSnowMode.value = 1.0;
        } else {
            program.uniforms.uSnowMode.value = 0.0;
        }
    });

    if (document.body.classList.contains('theme-christmas')) {
        program.uniforms.uSnowMode.value = 1.0;
    }

    // Animation Loop
    let lastTime = performance.now();
    let elapsed = 0;

    const update = (t) => {
        requestAnimationFrame(update);
        const delta = t - lastTime;
        lastTime = t;
        elapsed += delta * config.speed;

        program.uniforms.uTime.value = elapsed * 0.001;

        if (config.moveParticlesOnHover) {
            particles.position.x = -mouse.x * config.hoverFactor;
            particles.position.y = -mouse.y * config.hoverFactor;
        }

        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * config.speed;

        renderer.render({ scene: particles, camera });
    };

    requestAnimationFrame(update);

})();
