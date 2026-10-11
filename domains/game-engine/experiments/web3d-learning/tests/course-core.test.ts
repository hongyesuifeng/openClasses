import test from 'node:test';
import assert from 'node:assert/strict';
import {Combat,attacks,validAttack,LeaseCache,ParticlePool,summarize} from '../src/course-core.ts';
test('attack requests reject busy/dead and invalid configurations',()=>{
  const g=new Combat();assert.ok(g.request(attacks[0]));assert.equal(g.request(attacks[1]),false);g.die();assert.equal(g.request(attacks[0]),false);
  for(const invalid of [{windup:-1},{activeEnd:.1},{duration:NaN},{damage:0},{range:Infinity}])assert.equal(validAttack({...attacks[0],...invalid}),false);
});
test('one big step and many small steps settle exactly one hit',()=>{
  for(const steps of [[1],Array(10).fill(.1)]){const g=new Combat();g.request(attacks[0]);steps.forEach(dt=>g.tick(dt));assert.equal(g.targetHp,30);assert.equal(g.state,'Idle');assert.equal(g.events.filter(e=>e.includes('命中 #')).length,1);}
});
test('window start is half-open and old hits do not carry into a new attack',()=>{
  const g=new Combat();g.request(attacks[0]);g.tick(.3);assert.equal(g.targetHp,40);g.tick(.01);assert.equal(g.targetHp,30);g.tick(.7);g.request(attacks[0]);g.tick(1);assert.equal(g.targetHp,20);
});
test('out-of-range and dead target cannot be hit; cancel before/after hit has different results',()=>{
  const g=new Combat();g.distance=3;g.request(attacks[0]);g.tick(1);assert.equal(g.targetHp,40);g.distance=1.5;g.request(attacks[0]);g.cancel();g.tick(1);assert.equal(g.targetHp,40);
  g.request(attacks[0]);g.tick(.4);g.cancel();g.tick(1);assert.equal(g.targetHp,30);g.targetHp=0;g.request(attacks[0]);g.tick(1);assert.equal(g.targetHp,0);
});
test('config snapshot cannot be mutated through the original config',()=>{
  const g=new Combat(),config={...attacks[0]};g.request(config);config.damage=999;g.tick(1);assert.equal(g.targetHp,30);
});
test('buff is checked at actual hit time even across a large step',()=>{
  const g=new Combat();g.buff();g.tick(1.6);g.request(attacks[0]);g.tick(1);assert.equal(g.targetHp,20);
  const h=new Combat();h.buff();h.tick(1.7);h.request(attacks[0]);h.tick(1);assert.equal(h.targetHp,30);
});
test('consume validates life and single consumption, permanent XP survives buff expiry',()=>{
  const g=new Combat();assert.equal(g.consume(),false);g.targetHp=0;assert.ok(g.consume());assert.equal(g.consume(),false);g.respawnTarget();g.targetHp=0;g.consume();assert.equal(g.level,2);g.buff();g.tick(3);assert.equal(g.level,2);g.die();g.respawnTarget();g.targetHp=0;assert.equal(g.consume(),false);
});
test('AI retains state in hysteresis band and stops on death',()=>{
  const g=new Combat();g.distance=3;g.tick(0,true);assert.equal(g.enemyState,'Chase');g.distance=4.5;g.tick(0,true);assert.equal(g.enemyState,'Chase');g.distance=6;g.tick(0,true);assert.equal(g.enemyState,'Idle');g.distance=4.5;g.tick(0,true);assert.equal(g.enemyState,'Idle');g.die();const d=g.distance;g.tick(1,true);assert.equal(g.distance,d);
});
test('cache shares pending request; last release destroys once; duplicate release is safe',async()=>{
  let loads=0,destroyed=0;const cache=new LeaseCache(async()=>{loads++;return {id:1};},()=>destroyed++);
  const a=cache.acquire('x'),b=cache.acquire('x');assert.strictEqual(await a.ready,await b.ready);assert.equal(loads,1);a.release();assert.equal(destroyed,0);b.release();b.release();assert.equal(destroyed,1);assert.deepEqual(cache.inspect(),[]);
});
test('release during load cleans up late result instead of retaining it',async()=>{
  let resolve!:(value:number)=>void,destroyed=0;const cache=new LeaseCache(()=>new Promise<number>(r=>resolve=r),()=>destroyed++);
  const lease=cache.acquire('x');await Promise.resolve();lease.release();resolve(42);await lease.ready;assert.equal(destroyed,1);assert.deepEqual(cache.inspect(),[]);
});
test('failed load is removed and can be retried without stale lease deleting new entry',async()=>{
  let calls=0,destroyed=0;const cache=new LeaseCache(async()=>{if(!calls++)throw new Error('expected');return 2;},()=>destroyed++);
  const old=cache.acquire('x');await assert.rejects(old.ready);const current=cache.acquire('x');await current.ready;old.release();assert.equal(cache.inspect()[0].refs,1);current.release();assert.equal(destroyed,1);
});
test('pool enforces capacity, clears age and rejects duplicate/foreign return',()=>{
  const pool=new ParticlePool(2),a=pool.take()!,b=pool.take()!;assert.equal(pool.take(),null);pool.tick(1);pool.put(a);assert.equal(a.age,0);assert.equal(pool.put(a),false);assert.strictEqual(pool.take(),a);assert.equal(pool.created,2);assert.equal(pool.put({id:3,active:true,age:0}),false);pool.put(b);assert.equal(pool.items.filter(p=>p.active).length,1);pool.clear();assert.equal(pool.items.length,0);
});
test('sample statistics use nearest-rank p95 without modifying source data',()=>{
  const values=[3,1,2];assert.deepEqual(summarize(values),{mean:2,p95:3});assert.deepEqual(values,[3,1,2]);assert.deepEqual(summarize([]),{mean:0,p95:0});
});
