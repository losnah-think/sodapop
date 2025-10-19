// 게임 상태
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    STAGE_CLEAR: 'stage_clear',
    GAME_OVER: 'game_over'
};

// 공 타입 정의
const BallTypes = {
    NORMAL: { name: '⚪ 일반공', emoji: '⚪', color: '#4facfe', size: 8, speed: 1.0, penetration: false },
    TENNIS: { name: '🎾 테니스공', emoji: '🎾', color: '#90EE90', size: 10, speed: 1.2, penetration: true },
    PING_PONG: { name: '🏓 탁구공', emoji: '🏓', color: '#FFD700', size: 6, speed: 1.4, penetration: false },
    SHUTTLECOCK: { name: '🏸 셔틀콕', emoji: '🏸', color: '#FF69B4', size: 7, speed: 0.8, penetration: true },
    BASEBALL: { name: '⚾ 야구공', emoji: '⚾', color: '#FF6347', size: 9, speed: 1.1, penetration: false },
    BILLIARD: { name: '🎱 당구공', emoji: '🎱', color: '#000000', size: 11, speed: 0.9, penetration: true },
    BOWLING: { name: '🎳 볼링공', emoji: '🎳', color: '#8B0000', size: 14, speed: 0.7, penetration: true }
};

// 게임 클래스
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 게임 변수
        this.state = GameState.START;
        this.score = 0;
        this.level = 1;
        this.exp = 0;
        this.expToLevelUp = Math.floor(100 * (1.2 ** (this.level - 1)));  // 레벨업에 필요한 경험치 (지수적 증가)
        this.bricks = [];
        this.balls = [];
        this.particles = [];
        
        // 플레이어 스탯
        this.damage = 1;
        this.fireRate = 1.0;
        this.multiShot = 1;
        this.explosionRadius = 0;
        this.critChance = 0;
        this.ballType = BallTypes.NORMAL;  // 공 타입
        
        // 드롭 아이템 시스템
        this.dropItems = [];
        this.slowTimeEnd = 0;  // 슬로우 타임 종료 시간
        this.maxItems = 50;
        this.itemFeedback = [];  // 아이템 수집 피드백 UI
        
        // 현재 레벨업 옵션 (선택 전까지 유지)
        this.currentUpgrades = [];
        
        // 발사 시스템
        this.isCharging = false;
        this.chargeAmount = 0;
        this.maxCharge = 100;
        this.chargeSpeed = 4;
        this.lastFireTime = 0;
        this.autoFireInterval = 25;
        
        // 난이도 설정
        this.brickSpeed = 1.2;
        this.brickSpawnInterval = 1200;
        this.lastBrickSpawn = 0;
        this.shooterSpeed = 10;
        
        // 캔버스 크기 설정
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 초기화 완료 후 마우스/터치 위치 설정
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height - 100;
        this.shooterX = this.canvas.width / 2;
        
        this.init();
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    init() {
        // 이벤트 리스너
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());
        if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
        
        // 마우스/터치 이벤트
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.onPointerDown(e);
        }, {passive: false});
        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            this.onPointerMove(e);
        }, {passive: false});
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.onPointerUp(e);
        }, {passive: false});
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.onPointerDown(e.touches[0]);
        }, {passive: false});
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.onPointerMove(e.touches[0]);
        }, {passive: false});
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp(e);
        }, {passive: false});
        
        // 게임 루프
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
        
        console.log('게임 초기화 완료');
    }
    
    startGame() {
        console.log('게임 시작!');
        document.getElementById('start-screen').classList.add('hidden');
        this.state = GameState.PLAYING;
        this.lastBrickSpawn = Date.now();
    }
    
    restartGame() {
        document.getElementById('gameover-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.score = 0;
        this.level = 1;
        this.exp = 0;
        this.expToLevelUp = Math.floor(100 * (1.2 ** (this.level - 1)));  // 레벨업에 필요한 경험치 (지수적 증가)
    this.bricks = [];
    this.balls = [];
    this.particles = [];
    this.dropItems = [];  // 드롭 아이템 초기화
    this.damage = 1;
    this.fireRate = 1.0;
    this.multiShot = 1;
    this.explosionRadius = 0;
    this.critChance = 0;
    this.slowTimeEnd = 0;  // 슬로우 타임 초기화
    this.itemFeedback = [];  // 아이템 피드백 초기화
    this.brickSpeed = 1.2;
    this.brickSpawnInterval = 1200;
    this.shooterX = this.canvas.width / 2;
        this.lastFireTime = 0;
        this.ballType = BallTypes.NORMAL;  // 공 타입 초기화
        this.updateUI();
    }
    
    onPointerDown(e) {
        if (this.state !== GameState.PLAYING) return;
    }
    
    onPointerMove(e) {
        if (this.state !== GameState.PLAYING) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        // 마우스/터치 위치로 발사기를 직접 이동 (양쪽 끝에서 30px 떨어진 곳)
        this.shooterX = Math.max(30, Math.min(this.canvas.width - 30, x));
    }
    
    onPointerUp(e) {
        if (this.state !== GameState.PLAYING) return;
    }
    
    fire() {
        const shooterY = this.canvas.height - 50;
        const damage = Math.floor(this.damage);
        
        // 멀티샷 구현 - 각도로 발사
        const angleSpread = 0.3;  // 각도 간격
        for (let i = 0; i < this.multiShot; i++) {
            const angle = (i - (this.multiShot - 1) / 2) * angleSpread;
            const vx = Math.sin(angle) * 5;
            const vy = -15 * Math.cos(angle);
            
            // 공 타입 속도 적용
            const speedMultiplier = this.ballType.speed || 1.0;
            
            this.balls.push({
                x: this.shooterX,
                y: shooterY,
                vx: vx * speedMultiplier,
                vy: vy * speedMultiplier,
                radius: this.ballType.size || 8,
                damage: damage,
                type: this.ballType,
                color: this.ballType.color
            });
        }
    }
    
    spawnBrick() {
        // 최대 벽돌 개수 제한 - 성능 최적화
        const MAX_BRICKS = 50;
        if (this.bricks.length >= MAX_BRICKS) return;
        
        const minWidth = 60;
        const maxWidth = 120;
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const x = Math.random() * (this.canvas.width - width);
        
        // 레벨에 따라 체력 조정
        let baseHP = Math.max(1, Math.floor(this.level * 0.5));  // 레벨이 높을수록 더 강함
        let hp = baseHP + Math.floor(Math.random() * (this.level + 1));
        
        // 15% 확률로 아이템 포함
        let item = null;
        if (Math.random() < 0.15) {
            const items = ['slowTime'];
            item = items[Math.floor(Math.random() * items.length)];
        }
        
        this.bricks.push({
            x: x,
            y: -50,
            width: width,
            height: 40,
            hp: hp,
            maxHP: hp,
            speed: this.brickSpeed,
            item: item  // 아이템 포함
        });
    }
    
    update(deltaTime) {
        if (this.state !== GameState.PLAYING) return;
        
        // 드롭 아이템 업데이트
        this.updateDropItems();
        
        // 자동 발사
        const currentTime = Date.now();
        if (currentTime - this.lastFireTime >= (1000 / this.fireRate)) {
            this.fire();
            this.lastFireTime = currentTime;
        }
        
        // 벽돌 생성
        if (currentTime - this.lastBrickSpawn >= this.brickSpawnInterval) {
            this.spawnBrick();
            this.lastBrickSpawn = currentTime;
        }
        
        // 벽돌 이동
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            const brick = this.bricks[i];
            
            // 슬로우 타임 적용 (70% 느려짐 = 30% 속도)
            let brickSpeed = brick.speed;
            if (currentTime < this.slowTimeEnd) {
                brickSpeed *= 0.3;
            }
            
            brick.y += brickSpeed;
            
            // 화면 아래로 나가면 게임 오버
            if (brick.y > this.canvas.height) {
                this.gameOver();
                return;
            }
        }
        
        // 구슬 이동 및 충돌
        const MAX_BALLS = 100;  // 최대 구슬 개수 제한
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // 화면 밖으로 나가면 제거
            if (ball.x < 0 || ball.x > this.canvas.width || 
                ball.y < 0 || ball.y > this.canvas.height) {
                this.balls.splice(i, 1);
                continue;
            }
            
                        // 벽돌과 충돌 내최
            let hit = false;
            for (let j = this.bricks.length - 1; j >= 0; j--) {
                const brick = this.bricks[j];
                
                if (this.checkCollision(ball, brick)) {
                    // 크리티컬 확인
                    const isCrit = Math.random() < this.critChance;
                    let actualDamage = isCrit ? ball.damage * 2 : ball.damage;
                    
                    brick.hp -= actualDamage;
                    
                    // 파티클 생성
                    this.createParticles(ball.x, ball.y, isCrit ? '#ffff00' : '#ffffff');
                    
                    if (brick.hp <= 0) {
                        // 벽돌 파괴
                        
                        const now = Date.now();
                        let baseScore = 10 * (1 + this.level * 0.5);  // 레벨에 따라 점수 증가
                        this.score += Math.floor(baseScore);
                        
                        // 경험치 획득
                        const expGain = Math.floor(10 + this.level * 2);  // 레벨에 따라 경험치 증가
                        this.exp += expGain;
                        
                        // 레벨업 확인
                        if (this.exp >= this.expToLevelUp) {
                            this.levelUp();
                        }
                        
                        this.updateUI();
                        
                        // 아이템이 포함된 벽돌이면 바로 효과 적용
                        if (brick.item) {
                            this.collectItem(brick.item);
                            // 아이템 획득 파티클
                            this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00ff00', 15);
                        }
                        
                        // 폭발 효과
                        if (this.explosionRadius > 0) {
                            this.explode(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        }
                        
                        this.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff6b6b', 20);
                        this.bricks.splice(j, 1);
                    }
                    
                    hit = true;
                    
                    hit = true;
                    // 관통이 없으므로 공 제거
                    this.balls.splice(i, 1);
                    break;
                }
            }
        }
        
                // 파티클 업데이트 - 최적화
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime / 1000;
            
            // 수명이 다하면 즉시 제거
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollision(ball, brick) {
        // 최적화된 축이 점단 충돌 감지
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        
        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        
        // 조기 반환 - 더 빠른 추적
        return dx * dx + dy * dy < ball.radius * ball.radius;
    }
    
    explode(x, y) {
        for (const brick of this.bricks) {
            const dx = (brick.x + brick.width / 2) - x;
            const dy = (brick.y + brick.height / 2) - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= this.explosionRadius) {
                brick.hp -= this.damage * 0.5;
            }
        }
    }
    
    createParticles(x, y, color = '#ffffff', count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: color,
                life: 0.5 + Math.random() * 0.5
            });
        }
    }
    
    draw() {
        // 백그라운드
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state !== GameState.PLAYING) return;
        
        // 벽돌 렌더링 (아이템 없는 벽돌 먼저)
        const bricksWithItem = [];
        
        for (const brick of this.bricks) {
            if (brick.item) {
                bricksWithItem.push(brick);
                continue;
            }
            
            // 아이템 없는 벽돌 렌더링
            this.drawBrick(brick);
        }
        
        // 구슬
        for (const ball of this.balls) {
            this.drawBall(ball);
        }
        
        // 파티클
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // 아이템 있는 벽돌 (전면에 표시)
        for (const brick of bricksWithItem) {
            this.drawBrickWithItem(brick);
        }
        
        // 드롭 아이템 렌더링
        for (const item of this.dropItems) {
            let emoji = '';
            let color = '';
            
            // 현재 아이템 종류: slowTime 만 사용
            if (item.type === 'slowTime') {
                emoji = '⏸️';
                color = '#00d4ff';
            }
            
            // 아이템 원형 표시
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 이모지 표시
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(emoji, item.x, item.y);
            
            // HP 표시 (아이템이 HP를 가지고 있으면)
            if (item.hp && item.hp > 1) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillText(`${item.hp}`, item.x, item.y + item.radius + 12);
            }
        }
        
        // 버프 상태 표시
        const now = Date.now();
        let buffY = 20;
        
        if (now < this.slowTimeEnd) {
            this.ctx.fillStyle = '#00d4ff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('⏸️ Slow Time', 15, buffY);
            buffY += 25;
        }
        
        // 발사기
        const shooterY = this.canvas.height - 50;
        
        // 조준선
        if (this.isCharging) {
            this.ctx.strokeStyle = 'rgba(79, 172, 254, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.shooterX, shooterY);
            this.ctx.lineTo(this.shooterX, 50);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // 아이템 피드백 UI 렌더링
        let feedbackY = 50;
        for (let i = this.itemFeedback.length - 1; i >= 0; i--) {
            const feedback = this.itemFeedback[i];
            const elapsed = now - feedback.time;
            const progress = Math.min(1, elapsed / feedback.duration);
            
            // 페이드아웃 효과
            const alpha = Math.max(0, 1 - progress);
            
            if (alpha > 0) {
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';
                
                // 이모지 + 메시지
                const text = `${feedback.emoji} ${feedback.message}`;
                this.ctx.fillText(text, this.canvas.width / 2, feedbackY);
                feedbackY += 35;
            }
            
            this.ctx.globalAlpha = 1;
            
            // 시간 초과된 피드백 제거
            if (elapsed >= feedback.duration) {
                this.itemFeedback.splice(i, 1);
            }
        }
        
        // 발사기
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(this.shooterX, shooterY, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }
    
    showUpgradeCards() {
        const cardContainer = document.getElementById('card-container');
        
        // 이미 생성된 업그레이드가 없으면 새로 생성
        if (this.currentUpgrades.length === 0) {
            cardContainer.innerHTML = '';
            
            // 강화 옵션만 (진화 시스템 제거)
            const upgrades = [
                { icon: '🔥', title: '데미지 증가', description: '+2 데미지', effect: () => this.damage += 2 },
                { icon: '⚡', title: '발사 속도', description: '+0.5 발사 속도', effect: () => this.fireRate += 0.5 },
                { icon: '', title: '멀티 샷', description: '+1 동시 발사', effect: () => this.multiShot++ },
                { icon: '💥', title: '폭발 범위', description: '+50 폭발 반경', effect: () => this.explosionRadius += 50 },
                { icon: '✨', title: '크리티컬', description: '+15% 크리티컬', effect: () => this.critChance += 0.15 }
            ];
            
            // 랜덤 3개 선택
            const shuffled = upgrades.sort(() => 0.5 - Math.random());
            this.currentUpgrades = shuffled.slice(0, 3);
            
            // 카드 생성
            this.currentUpgrades.forEach(upgrade => {
                const card = document.createElement('div');
                card.className = 'upgrade-card';
                card.innerHTML = `
                    <div class="card-icon">${upgrade.icon}</div>
                    <div class="card-title">${upgrade.title}</div>
                    <div class="card-description">${upgrade.description}</div>
                `;
                
                card.addEventListener('click', (e) => {
                    // 이벤트 전파 방지 및 중복 클릭 방지
                    card.style.pointerEvents = 'none';
                    upgrade.effect();
                    // 선택한 업그레이드 초기화 (다음 레벨업을 위해)
                    this.currentUpgrades = [];
                    // 카드 선택 후 바로 게임 계속
                    document.getElementById('stageclear-screen').classList.add('hidden');
                    this.state = GameState.PLAYING;
                    this.lastBrickSpawn = Date.now();
                });
                
                cardContainer.appendChild(card);
            });
        }
        
        // 카드 선택 불가능 상태
        const allCards = document.querySelectorAll('.upgrade-card');
        allCards.forEach(card => card.style.pointerEvents = 'none');
        
        // 2초 후 카드 선택 가능
        setTimeout(() => {
            const cards = document.querySelectorAll('.upgrade-card');
            cards.forEach(card => card.style.pointerEvents = 'auto');
        }, 1000);
    }
    
    gameOver() {
        this.state = GameState.GAME_OVER;
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('final-stage').textContent = this.level;  // 레벨 표시
        document.getElementById('gameover-screen').classList.remove('hidden');
    }
    
    // 드롭 아이템 업데이트
    updateDropItems() {
        const now = Date.now();
        
        for (let i = this.dropItems.length - 1; i >= 0; i--) {
            const item = this.dropItems[i];
            
            // 아이템 이동 (중력)
            if (item.vy !== undefined) {
                item.y += item.vy;
                item.vy = Math.min(item.vy + 0.2, 5);  // 중력 적용
            } else {
                item.y += 1;  // 기본 하강
            }
            
            // 수평 이동
            if (item.vx !== undefined) {
                item.x += item.vx;
            }
            
            // 공과의 충돌 확인
            let hit = false;
            for (let j = this.balls.length - 1; j >= 0; j--) {
                const ball = this.balls[j];
                
                const dx = ball.x - item.x;
                const dy = ball.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < ball.radius + item.radius) {
                    // 아이템 HP 감소
                    item.hp--;
                    
                    this.createParticles(item.x, item.y, '#ffff00');
                    
                    if (item.hp <= 0) {
                        // 아이템 수집
                        this.collectItem(item.type);
                        this.dropItems.splice(i, 1);
                        hit = true;
                        
                        // 공 제거 (아이템과 충돌 시)
                        this.balls.splice(j, 1);
                        break;
                    } else {
                        // 공 제거
                        this.balls.splice(j, 1);
                        break;
                    }
                }
            }
            
            // 화면 밖 제거
            if (item.y > this.canvas.height) {
                this.dropItems.splice(i, 1);
            }
        }
    }
    
    // 아이템 수집 처리
    collectItem(type) {
        const now = Date.now();
        
        // UI 피드백 - 화면 상단에 표시
        let message = '';
        let emoji = '';
        
        switch (type) {
            case 'slowTime':
                this.slowTimeEnd = now + 5000;  // 5초
                message = '⏸️ 슬로우 타임!';
                emoji = '⏸️';
                break;
        }
        
        // 화면 상단에 피드백 표시 (canvas에 그리기)
        if (message) {
            this.showItemFeedback(emoji, message);
        }
    }
    
    // 아이템 피드백 표시
    showItemFeedback(emoji, message) {
        // 임시 피드백 저장 (draw()에서 그려짐)
        if (!this.itemFeedback) {
            this.itemFeedback = [];
        }
        
        this.itemFeedback.push({
            emoji: emoji,
            message: message,
            time: Date.now(),
            duration: 1500  // 1.5초
        });
        
        // 최대 3개까지만 표시
        if (this.itemFeedback.length > 3) {
            this.itemFeedback.shift();
        }
    }
    
    // 드롭 아이템 업데이트
    levelUp() {
        this.level++;
        this.exp = 0;
        this.expToLevelUp = Math.floor(100 * (1.2 ** (this.level - 1)));  // 지수적으로 증가
        
        // 난이도 증가
        this.brickSpeed += 0.15;
        this.brickSpawnInterval = Math.max(600, this.brickSpawnInterval - 50);
        
        // 레벨업 화면 표시
        this.showLevelUpRewards();
    }
    
    // 레벨업 보상 화면
    showLevelUpRewards() {
        this.state = GameState.STAGE_CLEAR;
        document.getElementById('stageclear-screen').classList.remove('hidden');
        
        // 1초 후 카드 표시
        setTimeout(() => this.showUpgradeCards(), 1000);
    }
    
    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('level').textContent = this.level;
        document.getElementById('damage').textContent = Math.floor(this.damage);
        document.getElementById('fireRate').textContent = this.fireRate.toFixed(1) + 'x';
        
        // 경험치 표시
        const expPercent = (this.exp / this.expToLevelUp) * 100;
        const expBar = document.getElementById('exp-bar');
        if (expBar) {
            expBar.style.width = Math.min(expPercent, 100) + '%';
        }
    }
    
    // 벽돌 렌더링 (최적화)
    drawBrick(brick) {
        const hpPercent = brick.hp / brick.maxHP;
        const color = `hsl(${hpPercent * 120}, 70%, 50%)`;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // HP 표시
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(brick.hp, brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
    
    // 아이템이 있는 벽돌 렌더링 (전면)
    drawBrickWithItem(brick) {
        const hpPercent = brick.hp / brick.maxHP;
        const color = `hsl(${hpPercent * 120}, 70%, 50%)`;
        
        // 아이템 있는 벽돌은 더 밝게
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.9;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.globalAlpha = 1;
        
        // 굵은 테두리
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        
        // HP 표시
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(brick.hp, brick.x + brick.width / 2, brick.y + brick.height / 2 - 10);
        
        // 아이템 이모지 표시
        let emoji = '';
        if (brick.item === 'slowTime') {
            emoji = '⏸️';
        }
        
        if (emoji) {
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText(emoji, brick.x + brick.width / 2, brick.y + brick.height / 2 + 12);
        }
    }
    
    // 공 렌더링 (최적화)
    drawBall(ball) {
        const gradient = this.ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        const ballColor = ball.color || '#4facfe';
        gradient.addColorStop(0, ballColor);
        gradient.addColorStop(1, ballColor);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 공 타입 이모지 표시
        if (ball.radius > 8 && ball.type && ball.type.emoji) {
            this.ctx.font = `${Math.floor(ball.radius * 1.5)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ball.type.emoji, ball.x, ball.y);
        }
    }
    
    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// 게임 시작
function initGame() {
    try {
        console.log('Game initialization starting...');
        const canvas = document.getElementById('gameCanvas');
        const startBtn = document.getElementById('start-btn');
        
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }
        if (!startBtn) {
            console.error('Start button not found!');
            return;
        }
        
        console.log('Elements found, creating Game instance...');
        new Game();
        console.log('Game instance created successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

// DOM이 준비되었을 때 게임 시작
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
