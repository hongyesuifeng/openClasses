/**
 * Platformer - 平台跳跃游戏
 *
 * 技术:
 * - 重力和跳跃物理
 * - 瓦片地图
 * - AABB 碰撞
 * - 简单关卡
 */

// 关卡数据 (1=平台, 2=金币, 3=终点)
const LEVEL = [
  '                                        ',
  '                                        ',
  '        2                               ',
  '      #####                             ',
  '                  2                      ',
  '               #####                    ',
  '     2                          2       ',
  '   #####      2      #####     ###   333',
  '              ###                      3',
  '########################################',
];

const TILE_SIZE = 40;
const GRAVITY = 1200;
const JUMP_FORCE = -500;
const MOVE_SPEED = 250;

class Vec2 {
  constructor(public x = 0, public y = 0) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
}

class PlatformerGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private player = {
    pos: new Vec2(100, 100),
    vel: new Vec2(),
    size: { x: 24, y: 32 },
    grounded: false,
    facingRight: true,
  };

  private platforms: { x: number; y: number; w: number; h: number }[] = [];
  private coins: { x: number; y: number; collected: boolean }[] = [];
  private goal = { x: 0, y: 0, w: TILE_SIZE * 3, h: TILE_SIZE * 2 };

  private score = 0;
  private won = false;
  private keys = new Set<string>();
  private animTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.parseLevel();
    this.setupInput();
  }

  private parseLevel(): void {
    for (let row = 0; row < LEVEL.length; row++) {
      for (let col = 0; col < LEVEL[row].length; col++) {
        const char = LEVEL[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (char === '#') {
          this.platforms.push({ x, y, w: TILE_SIZE, h: TILE_SIZE });
        } else if (char === '2') {
          this.coins.push({ x: x + 12, y: y + 12, collected: false });
        } else if (char === '3') {
          this.goal.x = x;
          this.goal.y = y;
        }
      }
    }
  }

  private setupInput(): void {
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
  }

  update(dt: number): void {
    if (this.won) return;

    this.animTime += dt;

    // 输入
    let moveX = 0;
    if (this.keys.has('ArrowLeft')) { moveX = -1; this.player.facingRight = false; }
    if (this.keys.has('ArrowRight')) { moveX = 1; this.player.facingRight = true; }

    if (this.keys.has('Space') && this.player.grounded) {
      this.player.vel.y = JUMP_FORCE;
      this.player.grounded = false;
    }

    // 物理
    this.player.vel.x = moveX * MOVE_SPEED;
    this.player.vel.y += GRAVITY * dt;

    // 移动 X
    this.player.pos.x += this.player.vel.x * dt;
    this.resolveCollisions('x');

    // 移动 Y
    this.player.pos.y += this.player.vel.y * dt;
    this.player.grounded = false;
    this.resolveCollisions('y');

    // 边界
    this.player.pos.x = Math.max(0, Math.min(this.width - this.player.size.x, this.player.pos.x));

    // 收集金币
    for (const coin of this.coins) {
      if (!coin.collected) {
        const dx = (this.player.pos.x + this.player.size.x / 2) - coin.x;
        const dy = (this.player.pos.y + this.player.size.y / 2) - coin.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          coin.collected = true;
          this.score += 100;
        }
      }
    }

    // 检查终点
    if (this.player.pos.x + this.player.size.x > this.goal.x &&
        this.player.pos.x < this.goal.x + this.goal.w &&
        this.player.pos.y + this.player.size.y > this.goal.y) {
      this.won = true;
    }
  }

  private resolveCollisions(axis: 'x' | 'y'): void {
    const p = this.player;

    for (const plat of this.platforms) {
      if (p.pos.x + p.size.x > plat.x &&
          p.pos.x < plat.x + plat.w &&
          p.pos.y + p.size.y > plat.y &&
          p.pos.y < plat.y + plat.h) {

        if (axis === 'x') {
          if (p.vel.x > 0) p.pos.x = plat.x - p.size.x;
          else p.pos.x = plat.x + plat.w;
          p.vel.x = 0;
        } else {
          if (p.vel.y > 0) {
            p.pos.y = plat.y - p.size.y;
            p.grounded = true;
          } else {
            p.pos.y = plat.y + plat.h;
          }
          p.vel.y = 0;
        }
      }
    }
  }

  render(): void {
    const ctx = this.ctx;

    // 背景
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // 平台
    for (const plat of this.platforms) {
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(plat.x + 2, plat.y + 2, plat.w - 4, 4);
    }

    // 终点
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.goal.x + 5, this.goal.y + 5, this.goal.w - 10, 10);

    // 金币
    for (const coin of this.coins) {
      if (!coin.collected) {
        const bounce = Math.sin(this.animTime * 5) * 3;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y + bounce, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 玩家
    const p = this.player;
    ctx.save();
    ctx.translate(p.pos.x + p.size.x / 2, p.pos.y + p.size.y / 2);
    if (!p.facingRight) ctx.scale(-1, 1);

    // 身体
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(-p.size.x / 2, -p.size.y / 2, p.size.x, p.size.y);

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(2, -p.size.y / 2 + 6, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(5, -p.size.y / 2 + 8, 3, 3);

    ctx.restore();

    // 分数
    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Coins: ${this.score}`, 20, 30);

    // 胜利
    if (this.won) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 48px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('YOU WIN!', this.width / 2, this.height / 2);
      ctx.fillStyle = '#fff';
      ctx.font = '20px Courier New';
      ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 40);
    }
  }
}

// 启动
const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new PlatformerGame(canvas);
let lastTime = performance.now();

function loop() {
  const now = performance.now();
  game.update((now - lastTime) / 1000);
  lastTime = now;
  game.render();
  requestAnimationFrame(loop);
}

loop();
