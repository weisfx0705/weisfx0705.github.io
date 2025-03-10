class StarField {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.stars = [];
        this.starCount = 400; // 增加星星數量，讓天空更豐富
        
        this.init();
    }

    init() {
        // 設置渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '-1';
        this.renderer.domElement.style.pointerEvents = 'none';

        // 設置相機位置
        this.camera.position.z = 5;

        // 創建星星
        this.createStars();

        // 監聽視窗大小變化
        window.addEventListener('resize', () => this.onWindowResize(), false);

        // 開始動畫
        this.animate();
    }

    createStars() {
        // 創建不同大小的星星，整體尺寸減小
        const starGeometries = [
            new THREE.SphereGeometry(0.005, 8, 8),  // 微小星星
            new THREE.SphereGeometry(0.008, 8, 8),  // 小星星
            new THREE.SphereGeometry(0.012, 8, 8)   // 中等星星
        ];

        // 創建發光材質
        const createStarMaterial = () => {
            const color = new THREE.Color();
            // 隨機添加一點藍白色調
            color.setHSL(0.55 + Math.random() * 0.1, 0.1, 0.9 + Math.random() * 0.1);
            
            return new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            });
        };

        // 添加星星到場景
        for (let i = 0; i < this.starCount; i++) {
            const geometryIndex = Math.floor(Math.random() * 3);
            const geometry = starGeometries[geometryIndex];
            const material = createStarMaterial();
            const star = new THREE.Mesh(geometry, material);

            // 隨機位置，增加深度感
            star.position.x = Math.random() * 24 - 12;
            star.position.y = Math.random() * 24 - 12;
            star.position.z = Math.random() * 12 - 6;

            // 為每顆星星添加閃爍動畫參數
            star.userData = {
                twinkleSpeed: Math.random() * 3 + 1,      // 適中的閃爍速度
                baseOpacity: 0.2 + Math.random() * 0.4,   // 降低基礎亮度
                opacityRange: 0.6 + Math.random() * 0.4,  // 增加透明度變化範圍
                phase: Math.random() * Math.PI * 2,
                baseScale: 0.6 + Math.random() * 0.4,     // 基礎大小
                scaleRange: 0.3 + Math.random() * 0.3,    // 大小變化範圍
                sizeClass: geometryIndex
            };

            this.stars.push(star);
            this.scene.add(star);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // 更新星星閃爍效果
        const time = Date.now() * 0.001;
        this.stars.forEach(star => {
            const { twinkleSpeed, baseOpacity, opacityRange, phase, baseScale, scaleRange, sizeClass } = star.userData;
            
            // 使用多個正弦波疊加製造更自然的閃爍效果
            const flicker = Math.sin(time * twinkleSpeed + phase) * 0.5 +
                          Math.sin(time * (twinkleSpeed * 0.7) + phase) * 0.3 +
                          Math.sin(time * (twinkleSpeed * 0.2) + phase) * 0.2;

            // 更新透明度
            star.material.opacity = baseOpacity + Math.max(0, flicker * opacityRange);

            // 更新大小，減小變化幅度
            const scaleMultiplier = sizeClass === 2 ? 1.2 : (sizeClass === 1 ? 1.1 : 1.0);
            const scale = (baseScale + flicker * scaleRange) * scaleMultiplier;
            star.scale.setScalar(scale);
        });

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// 創建星空效果實例
const starField = new StarField(); 