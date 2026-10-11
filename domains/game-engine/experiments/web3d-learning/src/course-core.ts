export interface AttackConfig { id: string; damage: number; range: number; windup: number; activeEnd: number; duration: number }
export const attacks: AttackConfig[] = [
  { id:'普通',damage:10,range:2,windup:0.3,activeEnd:0.5,duration:0.9 },
  { id:'重击',damage:25,range:2,windup:0.6,activeEnd:0.8,duration:1.3 },
];
export function validAttack(a: AttackConfig) {
  return [a.damage,a.range,a.windup,a.activeEnd,a.duration].every(Number.isFinite) &&
    a.damage > 0 && a.range > 0 && a.windup >= 0 && a.windup < a.activeEnd && a.activeEnd < a.duration;
}
export class Combat {
  time=0; hp=100; targetHp=40; distance=1.5; xp=0; consumed=false; buffEnd=0;
  attack: { id:number; age:number; config:AttackConfig; hits:Set<string> } | null=null;
  events: string[]=[]; nextId=1; enemyState:'Idle'|'Chase'|'Dead'='Idle';
  get level() { return 1+Math.floor(this.xp/2); }
  get state() {
    if (this.hp<=0) return 'Dead';
    if (!this.attack) return 'Idle';
    const {age,config:a}=this.attack;
    return age<a.windup?'Windup':age<a.activeEnd?'Active':'Recovery';
  }
  log(event:string) { this.events.push(`${this.time.toFixed(2)}s ${event}`); this.events=this.events.slice(-14); }
  request(config:AttackConfig) {
    if (!validAttack(config)) throw new Error('攻击配置无效');
    if(this.hp<=0||this.attack) { this.log('拒绝攻击：当前状态不允许'); return false; }
    this.attack={id:this.nextId++,age:0,config:{...config},hits:new Set()};
    this.log(`攻击 #${this.attack.id} ${config.id} 开始`); return true;
  }
  tick(dt:number, ai=false) {
    if(!Number.isFinite(dt)||dt<0) throw new Error('时间步长必须为有限非负数');
    const start=this.time; this.time+=dt;
    if(this.hp<=0) return;
    const attack=this.attack;
    if(attack) {
      const prev=attack.age,next=prev+dt,a=attack.config;
      // Check the swept TIME interval, even when the end of a large step is Recovery/Idle.
      if(next>a.windup && prev<a.activeEnd && this.targetHp>0 &&
        this.distance<=a.range+0.1*(this.level-1) && !attack.hits.has('target')) {
        attack.hits.add('target');
        const hitTime=start+Math.max(0,a.windup-prev);
        const buff=hitTime<this.buffEnd?2:1;
        const damage=(a.damage+2*(this.level-1))*buff;
        this.targetHp=Math.max(0,this.targetHp-damage);
        this.log(`命中 #${attack.id}：−${damage}，目标 HP=${this.targetHp}（命中时刻 ${hitTime.toFixed(2)}s）`);
        if(!this.targetHp) this.log('目标死亡');
      }
      attack.age=next;
      if(next>=a.duration) { this.attack=null; this.log(`攻击 #${attack.id} 结束`); }
    }
    if(this.targetHp<=0) this.enemyState='Dead';
    else if(ai) {
      if(this.enemyState==='Idle'&&this.distance<4) this.enemyState='Chase';
      else if(this.enemyState==='Chase'&&this.distance>5) this.enemyState='Idle';
      if(this.enemyState==='Chase') this.distance=Math.max(0.8,this.distance-0.8*dt);
    }
  }
  cancel() { if(this.attack) { this.log(`取消 #${this.attack.id}`); this.attack=null; } }
  die() { this.cancel(); this.hp=0; this.log('角色死亡：停止攻击与 AI'); }
  buff() { this.buffEnd=this.time+2; this.log('Buff 生效至 '+this.buffEnd.toFixed(2)+'s'); }
  consume() {
    if(this.targetHp>0||this.consumed||this.hp<=0) { this.log('拒绝吞噬：目标未死亡、已消费或角色死亡'); return false; }
    this.consumed=true; this.xp++; this.log(`吞噬 +1 XP；等级 ${this.level}`); return true;
  }
  respawnTarget() { this.targetHp=40; this.consumed=false; this.enemyState='Idle'; this.log('新目标'); }
}

export class LeaseCache<T> {
  private entries=new Map<string,{refs:number; state:'loading'|'ready'|'failed'; value?:T; ready:Promise<T>}>();
  private load:(key:string)=>Promise<T>;
  private destroy:(value:T)=>void;
  constructor(load:(key:string)=>Promise<T>,destroy:(value:T)=>void) {this.load=load;this.destroy=destroy;}
  acquire(key:string) {
    let entry=this.entries.get(key);
    if(!entry) {
      const created:{refs:number;state:'loading'|'ready'|'failed';value?:T;ready:Promise<T>}={refs:0,state:'loading',ready:Promise.resolve(undefined as T) as Promise<T>};
      created.ready=Promise.resolve().then(()=>this.load(key)).then(value=>{
        created.state='ready'; created.value=value;
        if(!created.refs) { this.destroy(value); this.entries.delete(key); }
        return value;
      },error=>{ created.state='failed'; if(this.entries.get(key)===created) this.entries.delete(key); throw error; });
      entry=created; this.entries.set(key,entry);
    }
    entry.refs++; let released=false; const owned=entry;
    return { ready:owned.ready, release:()=>{
      if(released) return; released=true; owned.refs--;
      if(!owned.refs&&owned.state==='ready') {
        this.destroy(owned.value!);
        if(this.entries.get(key)===owned) this.entries.delete(key);
      }
    }};
  }
  inspect() { return [...this.entries].map(([key,e])=>({key,refs:e.refs,state:e.state})); }
}

export interface Particle { id:number; active:boolean; age:number }
export class ParticlePool {
  readonly items:Particle[]=[]; created=0;
  readonly capacity:number;
  constructor(capacity=20) {this.capacity=capacity;}
  take() {
    let p=this.items.find(p=>!p.active);
    if(!p&&this.items.length<this.capacity) { p={id:++this.created,active:false,age:0}; this.items.push(p); }
    if(!p) return null; p.active=true; p.age=0; return p;
  }
  put(p:Particle) { if(!this.items.includes(p)||!p.active) return false; p.active=false;p.age=0;return true; }
  tick(dt:number) { for(const p of this.items) if(p.active) p.age+=dt; }
  clear() { for(const p of this.items){p.active=false;p.age=0;}this.items.length=0; }
}
export function summarize(values:number[]) {
  if(!values.length) return {mean:0,p95:0};
  const sorted=[...values].sort((a,b)=>a-b);
  return {mean:values.reduce((a,b)=>a+b,0)/values.length,p95:sorted[Math.ceil(sorted.length*.95)-1]};
}
