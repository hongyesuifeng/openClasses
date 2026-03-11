/**
 * Pong - 经典乒乓球游戏
 *
 * 技术:
 * - Canvas 2D 渲染
 * - 简单 AABB 碰撞
 * - 键盘输入
 */

// 游戏常量
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 12;
const PADDLE_SPEED = 400;
const BALL_SPEED = 350;
const WIN_SCORE = 5;

// 游戏状态
interface GameState {
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: { y: number; vy: number };
  paddle2: { y: number; vy: number };
  score: { p1: number; p2: number };
  running: boolean;
  winner: number | null;
}

class PongGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  private state: GameState;
  private keys: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.state = this.createInitialState();
    this.setupInput();
  }

  private createInitialState(): GameState {
    return {
      ball: {
        x: this.width / 2,
        y: this.height / 2,
        vx: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
        vy: (Math.random() - 0.5) * BALL_SPEED,
      },
      paddle1: { y: this.height / 2 - PADDLE_HEIGHT / 2, vy: 0 },
      paddle2: { y: this.height / 2 - PADDLE_HEIGHT / 2, vy: 0 },
      score: { p1: 0, p2: 0 },
      running: false,
      winner: null,
    };
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);

      if (e.key === ' ' && !this.state.running && !this.state.winner) {
        this.state.running = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }

  private handleInput(): void {
    const { paddle1, paddle2 } = this.state;

    // 玩家1 (W/S)
    if (this.keys.has('w') || this.keys.has('W')) {
      paddle1.vy = -PADDLE_SPEED;
    } else if (this.keys.has('s') || this.keys.has('S')) {
      paddle1.vy = PADDLE_SPEED;
    } else {
      paddle1.vy = 0;
    }

    // 玩家2 (↑/↓)
    if (this.keys.has('ArrowUp')) {
      paddle2.vy = -PADDLE_SPEED;
    } else if (this.keys.has('ArrowDown')) {
      paddle2.vy = PADDLE_SPEED;
    } else {
      paddle2.vy = 0;
    }
  }

  update(dt: number): void {
    if (!this.state.running) return;

    this.handleInput();

    const { ball, paddle1, paddle2, score } = this.state;

    // 更新球拍位置
    paddle1.y += paddle1.vy * dt;
    paddle2.y += paddle2.vy * dt;

    // 球拍边界
    paddle1.y = Math.max(0, Math.min(this.height - PADDLE_HEIGHT, paddle1.y));
    paddle2.y = Math.max(0, Math.min(this.height - PADDLE_HEIGHT, paddle2.y));

    // 更新球位置
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // 上下边界反弹
    if (ball.y <= 0 || ball.y >= this.height - BALL_SIZE) {
      ball.vy *= -1;
      ball.y = Math.max(0, Math.min(this.height - BALL_SIZE, ball.y));
    }

    // 球拍碰撞检测
    // 球拍1 (左侧)
    if (ball.x <= PADDLE_WIDTH + 20 &&
        ball.y + BALL_SIZE >= paddle1.y &&
        ball.y <= paddle1.y + PADDLE_HEIGHT) {
      ball.vx = Math.abs(ball.vx);
      ball.x = PADDLE_WIDTH + 20;
      // 根据击球位置调整角度
      const hitPos = (ball.y + BALL_SIZE / 2 - paddle1.y) / PADDLE_HEIGHT - 0.5;
      ball.vy = hitPos * BALL_SPEED * 1.5;
    }

    // 球拍2 (右侧)
    if (ball.x + BALL_SIZE >= this.width - PADDLE_WIDTH - 20 &&
        ball.y + BALL_SIZE >= paddle2.y &&
        ball.y <= paddle2.y + PADDLE_HEIGHT) {
      ball.vx = -Math.abs(ball.vx);
      ball.x = this.width - PADDLE_WIDTH - 20 - BALL_SIZE;
      const hitPos = (ball.y + BALL_SIZE / 2 - paddle2.y) / PADDLE_HEIGHT - 0.5;
      ball.vy = hitPos * BALL_SPEED * 1.5;
    }

    // 得分
    if (ball.x < 0) {
      score.p2++;
      this.resetBall(-1);
    } else if (ball.x > this.width) {
      score.p1++;
      this.resetBall(1);
    }

    // 检查胜利
    if (score.p1 >= WIN_SCORE) {
      this.state.winner = 1;
      this.state.running = false;
    } else if (score.p2 >= WIN_SCORE) {
      this.state.winner = 2;
      this.state.running = false;
    }

    // 更新分数显示
    document.getElementById('p1')!.textContent = score.p1.toString();
    document.getElementById('p2')!.textContent = score.p2.toString();
  }

  private resetBall(direction: number): void {
    this.state.ball = {
      x: this.width / 2,
      y: this.height / 2,
      vx: direction * BALL_SPEED,
      vy: (Math.random() - 0.5) * BALL_SPEED,
    };
  }

  render(): void {
    const ctx = this.ctx;
    const { ball, paddle1, paddle2, running, winner } = this.state;

    // 清屏
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);

    // 中线
    ctx.strokeStyle = '#333';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 球拍1
    ctx.fillStyle = '#4a9eff';
    ctx.fillRect(20, paddle1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // 球拍2
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.width - 20 - PADDLE_WIDTH, paddle2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // 球
    ctx.fillStyle = '#fff';
    ctx.fillRect(ball.x - BALL_SIZE / 2, ball.y - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);

    // 提示文字
    if (!running && !winner) {
      ctx.fillStyle = '#666';
      ctx.font = '20px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('按 SPACE 开始', this.width / 2, this.height / 2 + 60);
    }

    // 胜利文字
    if (winner) {
      ctx.fillStyle = winner === 1 ? '#4a9eff' : '#ff6b6b';
      ctx.font = 'bold 48px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(`玩家 ${winner} 获胜!`, this.width / 2, this.height / 2);

      ctx.fillStyle = '#666';
      ctx.font = '16px Courier New';
      ctx.fillText('按 F5 重新开始', this.width / 2, this.height / 2 + 40);
    }
  }
}

// 启动游戏
const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new PongGame(canvas);

let lastTime = performance.now();

function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  game.update(dt);
  game.render();

  requestAnimationFrame(loop);
}

loop();
