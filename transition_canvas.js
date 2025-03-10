class TransitionEffect {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.isAnimating = false;
        this.hue = 0;
        this.diceSize = 35; // 增加骰子大小
        this.scale = 0.1; // 初始縮放比例
        this.targetScale = 1; // 目標縮放比例
        
        this.init();
    }

    init() {
        // 設置 canvas
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.zIndex = '1000';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);

        // 監聽視窗大小變化
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createParticles() {
        this.particles = [];
        
        const colors = [
            '#FF6B6B', // 紅色
            '#4ECDC4', // 青色
            '#45B7D1', // 藍色
            '#96CEB4', // 綠色
            '#FFEEAD', // 黃色
            '#D4A5A5', // 粉色
            '#FFB347', // 橙色
            '#B19CD9'  // 紫色
        ];
        
        // 增加骰子數量到120個
        for (let i = 0; i < 120; i++) {
            this.particles.push({
                x: Math.random() * (this.canvas.width - this.diceSize),
                y: Math.random() * (this.canvas.height - this.diceSize),
                size: this.diceSize + (Math.random() * 10 - 5), // 添加一些大小變化
                speedX: (Math.random() - 0.5) * 8, // 稍微增加速度
                speedY: (Math.random() - 0.5) * 8,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
                trail: [],
                maxTrail: 5
            });
        }
    }

    drawDice(x, y, size, rotation, color, opacity) {
        this.ctx.save();
        this.ctx.translate(x + size/2, y + size/2);
        this.ctx.rotate(rotation);
        
        // 添加陰影效果
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        
        // 繪製骰子主體
        this.ctx.fillStyle = `rgba(${this.hexToRgb(color)}, ${opacity})`;
        this.ctx.fillRect(-size/2, -size/2, size, size);
        
        // 移除陰影效果（避免影響點點）
        this.ctx.shadowBlur = 0;
        
        // 繪製骰子點點
        this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        const dotSize = size / 7; // 稍微調整點的大小比例
        
        // 中心點
        this.ctx.beginPath();
        this.ctx.arc(0, 0, dotSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 四角的點
        const offset = size/3.5; // 調整點的位置
        [[-1,-1], [-1,1], [1,-1], [1,1]].forEach(([x, y]) => {
            this.ctx.beginPath();
            this.ctx.arc(x * offset, y * offset, dotSize, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '255, 255, 255';
    }

    animate() {
        if (!this.isAnimating) return;

        requestAnimationFrame(() => this.animate());

        // 更新縮放
        this.scale += (this.targetScale - this.scale) * 0.1;

        // 清除畫布
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和繪製粒子
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // 計算縮放後的位置
            const scaledX = (particle.x - this.canvas.width/2) * this.scale + this.canvas.width/2;
            const scaledY = (particle.y - this.canvas.height/2) * this.scale + this.canvas.height/2;
            
            // 更新位置
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;

            // 碰撞檢測和反彈
            if (particle.x <= 0 || particle.x >= this.canvas.width - particle.size) {
                particle.speedX *= -0.8;
                particle.x = Math.max(0, Math.min(this.canvas.width - particle.size, particle.x));
            }
            if (particle.y <= 0 || particle.y >= this.canvas.height - particle.size) {
                particle.speedY *= -0.8;
                particle.y = Math.max(0, Math.min(this.canvas.height - particle.size, particle.y));
            }

            // 粒子之間的碰撞
            for (let j = i + 1; j < this.particles.length; j++) {
                const other = this.particles[j];
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < particle.size) {
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    const tempSpeedX = particle.speedX;
                    const tempSpeedY = particle.speedY;
                    particle.speedX = other.speedX * 0.95;
                    particle.speedY = other.speedY * 0.95;
                    other.speedX = tempSpeedX * 0.95;
                    other.speedY = tempSpeedY * 0.95;

                    particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
                    other.rotationSpeed = (Math.random() - 0.5) * 0.2;
                }
            }

            // 繪製縮放後的骰子
            this.drawDice(
                scaledX, 
                scaledY, 
                particle.size * this.scale, 
                particle.rotation, 
                particle.color, 
                this.particleOpacity
            );
        }
    }

    onWindowResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startTransition() {
        this.isAnimating = true;
        this.canvas.style.display = 'block';
        this.particleOpacity = 0;
        this.scale = 0.1; // 開始時很小
        this.targetScale = 1; // 目標是原始大小
        this.createParticles();

        // 快速放大並淡入
        const zoomIn = () => {
            if (this.particleOpacity < 1) {
                this.particleOpacity += 0.05;
                requestAnimationFrame(zoomIn);
            }
        };
        zoomIn();
        this.animate();

        // 1.2秒後開始縮小並淡出
        setTimeout(() => {
            this.targetScale = 0.1; // 設置縮小目標
            const zoomOut = () => {
                if (this.particleOpacity > 0) {
                    this.particleOpacity -= 0.05;
                    requestAnimationFrame(zoomOut);
                } else {
                    this.isAnimating = false;
                    this.canvas.style.display = 'none';
                }
            };
            zoomOut();
        }, 1200);
    }
}

// 創建轉場效果實例
const transitionEffect = new TransitionEffect();

// 修改開始按鈕的點擊事件
document.getElementById('startButton').addEventListener('click', function() {
    transitionEffect.startTransition();
    setTimeout(() => {
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatContainer').style.display = 'block';
    }, 400);
}); 