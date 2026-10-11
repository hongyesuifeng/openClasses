import { Combat,attacks } from './course-core.ts';
import { controlButton as button,selectControl as select,type WorkbenchFactory } from './workbench.ts';
export const createGameplay:WorkbenchFactory=(host,controls,lesson)=>{
  let game=new Combat(),config=attacks[0];
  controls.innerHTML=button('attack','发起攻击')+button('cancel','取消攻击')+button('die','角色死亡')+
    select('attackConfig','下次攻击',[['0','普通'],['1','重击']])+select('distance','目标距离',[['1.5','1.5 单位'],['3','3 单位'],['4.5','4.5 单位'],['6','6 单位']])+
    button('bigstep','跨过 1 秒')+(lesson==='buff'?button('buff','添加 2 秒 Buff')+button('consume','吞噬死亡目标')+button('respawn','生成新目标'):'');
  let disposed=false;
  function update(dt:number) {
    if(disposed)return;game.tick(dt,lesson==='ai');
    const a=game.attack,c=a?.config||config,age=a?.age||0;
    const targetX=250+Math.min(game.distance,6)*65;
    const playerColor=game.hp<=0?'#89979d':'#328e77',targetColor=game.targetHp<=0?'#89979d':'#e2a052';
    host.innerHTML=`<svg viewBox="0 0 760 390" role="img" aria-label="攻击状态与命中窗口"><path d="M60 245H710" stroke="#72848c"/>
      <circle cx="250" cy="210" r="${28+3*(game.level-1)}" fill="${playerColor}"/><text x="205" y="275" fill="#d9eee9">角色 ${game.state}</text>
      <circle cx="${targetX}" cy="210" r="25" fill="${targetColor}"/><text x="${targetX-30}" y="275" fill="#d9eee9">HP ${game.targetHp}</text>
      <line x1="250" x2="${targetX}" y1="145" y2="145" stroke="#d8c48c" stroke-dasharray="5 5"/><text x="270" y="130" fill="#d8c48c">距离 ${game.distance.toFixed(2)} / 范围 ${(c.range+.1*(game.level-1)).toFixed(1)}</text>
      <text x="55" y="42" fill="#c5e8dc">${c.id} · 前摇 → 命中窗口 → 后摇</text>
      <rect x="55" y="66" width="650" height="22" rx="4" fill="#455e6d"/><rect x="${55+650*c.windup/c.duration}" y="66" width="${650*(c.activeEnd-c.windup)/c.duration}" height="22" fill="#a2d176"/>
      <circle cx="${55+650*Math.min(age/c.duration,1)}" cy="77" r="9" fill="#ffd879"/>
      <text x="55" y="335" fill="#bdd6d6">${a?'攻击 #'+a.id+' · 已命中 '+a.hits.size+' 个目标':'没有有效攻击实例'} · 敌人 ${game.enemyState}</text>
      <text x="55" y="365" fill="#bdd6d6">事件由规则产生；图形读取当前状态绘制。</text></svg>`;
  }
  update(0);
  return {update,act(action,value){if(action==='attack')game.request(config);if(action==='cancel')game.cancel();if(action==='die')game.die();
    if(action==='attackConfig')config=attacks[Number(value)];if(action==='distance')game.distance=Number(value);
    if(action==='bigstep')game.tick(1,lesson==='ai');if(action==='buff')game.buff();if(action==='consume')game.consume();if(action==='respawn')game.respawnTarget();update(0);},
    reset(){game=new Combat();},snapshot(){return {metrics:{'规则时间':game.time.toFixed(2)+' s','角色状态':game.state,'目标生命':game.targetHp,'去重集合':game.attack?.hits.size||0,'XP / 等级':game.xp+' / '+game.level,'Buff 剩余':Math.max(0,game.buffEnd-game.time).toFixed(2)+' s','敌人状态':game.enemyState},note:'独立 TypeScript 规则驱动 SVG；不依赖动画播放来结算伤害。',events:game.events};},dispose(){disposed=true;host.replaceChildren();}};
};
