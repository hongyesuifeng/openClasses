/**
 * Asteroids - 小行星游戏
 *
 * 技术:
 * - 向量物理
 * - 屏幕环绕
 * - 粒子效果
 * - 简单碰撞
 */

// 向量类
class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vec2): Vec2 { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2): Vec2 { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number): Vec2 { return new Vec2(this.x * s, this.y * s); }
  dot(v: Vec2): number { return this.x * v.x + this.y * v.y; }
  length(): number { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize(): Vec2 { const len = this.length(); return len > 0 ? this.mul(1/len) : new Vec2(); }
  rotate(angle: number): Vec2 {
    const c = Math.cos(angle), s = Math.sin(angle);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }
  clone(): Vec2 { return new Vec2(this.x, this.y); }
}

// 游戏
class AsteroidsGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private ship = {
    pos: new Vec2(),
    vel: new Vec2(),
    angle: -Math.PI / 2,
    thrusting: false,
  };

  private bullets: { pos: Vec2; vel: Vec2; life: number }[] = [];
  private asteroids: { pos: Vec2; vel: Vec2; size: number; verts: Vec2[] }[] = [];
  private particles: { pos: Vec2; vel: Vec2; life: number; color: string }[] = [];

  private score = 0;
  private lives = 3;
  private gameOver = false;
  private invincible = 0;

  private keys = new Set<string>();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.ship.pos = new Vec2(this.width / 2, this.height / 2);
    this.spawnAsteroids(5);

    this.setupInput();
  }

  private setupInput(): void {
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'Space') this.shoot();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
  }

  private spawnAsteroids(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const size = 30 + Math.random() * 30;

      // 随机多边形顶点
      const verts: Vec2[] = [];
      const vertCount = 8 + Math.floor(Math.random() * 5);
      for (let j = 0; j < vertCount; j++) {
        const a = (j / vertCount) * Math.PI * 2;
        const r = size * (0.7 + Math.random() * 0.3);
        verts.push(new Vec2(Math.cos(a) * r, Math.sin(a) * r));
      }

      // 避免在玩家附近生成
      let pos: Vec2;
      do {
        pos = new Vec2(Math.random() * this.width, Math.random() * this.height);
      } while (pos.sub(this.ship.pos).length() < 150);

      this.asteroids.push({
        pos,
        vel: new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        size,
        verts,
      });
    }
  }

  private shoot(): void {
    if (this.gameOver) return;

    const dir = new Vec2(Math.cos(this.ship.angle), Math.sin(this.ship.angle));
    this.bullets.push({
      pos: this.ship.pos.add(dir.mul(15)),
      vel: dir.mul(400),
      life: 1.5,
    });
  }

  private explode(pos: Vec2, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        pos: pos.clone(),
        vel: new Vec2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        life: 0.5 + Math.random() * 0.5,
        color,
      });
    }
  }

  update(dt: number): void {
    if (this.gameOver) return;

    // 无敌时间
    if (this.invincible > 0) this.invincible -= dt;

    // 输入
    if (this.keys.has('ArrowLeft')) this.ship.angle -= 4 * dt;
    if (this.keys.has('ArrowRight')) this.ship.angle += 4 * dt;

    this.ship.thrusting = this.keys.has('ArrowUp');
    if (this.ship.thrusting) {
      const thrust = new Vec2(Math.cos(this.ship.angle), Math.sin(this.ship.angle)).mul(200);
      this.ship.vel = this.ship.vel.add(thrust.mul(dt));
    }

    // 阻力
    this.ship.vel = this.ship.vel.mul(0.995);

    // 更新飞船
    this.ship.pos = this.ship.pos.add(this.ship.vel.mul(dt));
    this.wrapPosition(this.ship.pos);

    // 更新子弹
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos = b.pos.add(b.vel.mul(dt));
      b.life -= dt;
      if (b.life <= 0) this.bullets.splice(i, 1);
      else this.wrapPosition(b.pos);
    }

    // 更新小行星
    for (const a of this.asteroids) {
      a.pos = a.pos.add(a.vel.mul(dt));
      this.wrapPosition(a.pos);
    }

    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos = p.pos.add(p.vel.mul(dt));
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 碰撞检测
    this.checkCollisions();

    // 生成新小行星
    if (this.asteroids.length === 0) {
      this.spawnAsteroids(5);
    }
  }

  private wrapPosition(pos: Vec2): void {
    if (pos.x < 0) pos.x += this.width;
    if (pos.x > this.width) pos.x -= this.width;
    if (pos.y < 0) pos.y += this.height;
    if (pos.y > this.height) pos.y -= this.height;
  }

  private checkCollisions(): void {
    // 子弹 vs 小行星
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const a = this.asteroids[j];
        if (b.pos.sub(a.pos).length() < a.size) {
          this.explode(a.pos, 15, '#4a9eff');
          this.bullets.splice(i, 1);

          // 分裂小行星
          if (a.size > 20) {
            for (let k = 0; k < 2; k++) {
              const angle = Math.random() * Math.PI * 2;
              this.asteroids.push({
                pos: a.pos.clone(),
                vel: new Vec2(Math.cos(angle) * 60, Math.sin(angle) * 60),
                size: a.size * 0.5,
                verts: a.verts.map(v => v.mul(0.5)),
              });
            }
          }

          this.asteroids.splice(j, 1);
          this.score += Math.floor(100 / a.size * 10);
          break;
        }
      }
    }

    // 飞船 vs 小行星
    if (this.invincible <= 0) {
      for (const a of this.asteroids) {
        if (this.ship.pos.sub(a.pos).length() < a.size + 10) {
          this.explode(this.ship.pos, 30, '#ff6b6b');
          this.lives--;
          this.invincible = 2;

          if (this.lives <= 0) {
            this.gameOver = true;
          } else {
            this.ship.pos = new Vec2(this.width / 2, this.height / 2);
            this.ship.vel = new Vec2();
          }
          break;
        }
      }
    }

    // 更新 UI
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('lives')!.textContent = this.lives.toString();
  }

  render(): void {
    const ctx = this.ctx;

    // 清屏
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制粒子
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;

    // 绘制小行星
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    for (const a of this.asteroids) {
      ctx.beginPath();
      ctx.moveTo(a.pos.x + a.verts[0].x, a.pos.y + a.verts[0].y);
      for (let i = 1; i < a.verts.length; i++) {
        ctx.lineTo(a.pos.x + a.verts[i].x, a.pos.y + a.verts[i].y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制子弹
    ctx.fillStyle = '#4a9eff';
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
    }

    // 绘制飞船
    if (!this.gameOver) {
      if (this.invincible <= 0 || Math.floor(this.invincible * 10) % 2 === 0) {
        ctx.save();
        ctx.translate(this.ship.pos.x, this.ship.pos.y);
        ctx.rotate(this.ship.angle);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.stroke();

        // 推进器火焰
        if (this.ship.thrusting) {
          ctx.strokeStyle = '#4a9eff';
          ctx.beginPath();
          ctx.moveTo(-5, -5);
          ctx.lineTo(-15 - Math.random() * 10, 0);
          ctx.lineTo(-5, 5);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // 游戏结束
    if (this.gameOver) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 48px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
      ctx.fillStyle = '#666';
      ctx.font = '16px Courier New';
      ctx.fillText(`最终得分: ${this.score}`, this.width / 2, this.height / 2 + 40);
      ctx.fillText('按 F5 重新开始', this.width / 2, this.height / 2 + 70);
    }
  }
}

// 启动
const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new AsteroidsGame(canvas);
let lastTime = performance.now();

function loop() {
  const now = performance.now();
  game.update((now - lastTime) / 1000);
  lastTime = now;
  game.render();
  requestAnimationFrame(loop);
}

loop();
