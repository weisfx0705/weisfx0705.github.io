class TransitionEffect {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.particles = [];
        this.isAnimating = false;

        this.init();
    }

    init() {
        // 設置渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '1000';
        this.renderer.domElement.style.pointerEvents = 'none';

        // 設置相機位置
        this.camera.position.z = 5;

        // 創建粒子
        this.createParticles();

        // 監聽視窗大小變化
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const sizes = [];

        // 創建 1000 個粒子
        for (let i = 0; i < 1000; i++) {
            vertices.push(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            sizes.push(Math.random() * 0.1 + 0.05);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: 0x8800ff,
            size: 0.1,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    animate() {
        if (!this.isAnimating) return;

        requestAnimationFrame(() => this.animate());

        // 加快旋轉速度
        this.particleSystem.rotation.x += 0.005;
        this.particleSystem.rotation.y += 0.008;

        // 渲染場景
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startTransition() {
        this.isAnimating = true;
        this.renderer.domElement.style.display = 'block';
        
        // 加快淡入動畫
        const fadeIn = () => {
            if (this.particleSystem.material.opacity < 1) {
                this.particleSystem.material.opacity += 0.05;
                requestAnimationFrame(fadeIn);
            }
        };
        fadeIn();
        this.animate();

        // 1秒後開始淡出（原本是2秒）
        setTimeout(() => {
            const fadeOut = () => {
                if (this.particleSystem.material.opacity > 0) {
                    this.particleSystem.material.opacity -= 0.05;
                    requestAnimationFrame(fadeOut);
                } else {
                    this.isAnimating = false;
                    this.renderer.domElement.style.display = 'none';
                }
            };
            fadeOut();
        }, 1000);
    }
}

// 創建轉場效果實例
const transitionEffect = new TransitionEffect();

// 修改開始按鈕的點擊事件，縮短切換時間
document.getElementById('startButton').addEventListener('click', function() {
    transitionEffect.startTransition();
    setTimeout(() => {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
    }, 500); // 從1000ms縮短到500ms
}); 