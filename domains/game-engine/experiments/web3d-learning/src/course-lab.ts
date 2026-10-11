import './course.css';
import { lessons,stages,type Lesson } from './course-data.ts';
import { escapeHtml as esc,type Workbench } from './workbench.ts';
document.title='3D 客户端系统课程 · openClasses';
const app=document.querySelector<HTMLElement>('#app')!;app.classList.add('course-page');
const query=new URLSearchParams(location.search);
const aliases:Record<string,string>={assets:'mesh',gameplay:'state',render:'pipeline',performance:'loading'};
let current=lessons.find(l=>l.id===query.get('lesson'))||lessons.find(l=>l.id===aliases[query.get('lab')||''])||lessons[0];
let bookmark='';try{bookmark=localStorage.getItem('web3d-course-bookmark')||'';}catch{/* Storage is optional. */}
const abort=new AbortController(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let running=!reduced.matches,time=0,last=0,raf=0,epoch=0,bench:Workbench|null=null,disposed=false,lastReadout=0;
app.innerHTML=`<header class="page-header"><div class="brand"><span class="brand-mark">3D</span> openClasses <span class="separator">/</span> 系统课程</div>
  <nav class="lab-navigation" aria-label="学习实验"><a href="?lab=time">0 帧循环</a><a href="?lab=space">1 空间数学</a><a href="?lab=motion">2 场景与运动</a><a href="?lab=course" aria-current="page">3—6 系统课程</a></nav></header>
  <section class="intro" id="course-start"><p class="eyebrow">先备好整套内容，再按自己的节奏学习</p><h1>从模型到规则，从像素到成本。</h1><p class="lead">[课程范围] 四阶段、28 课，图解配合可操作实验。已有的阶段 0—2 可从顶部进入；当前阅读位置仅作书签。</p></section>
  <nav class="course-stages" aria-label="课程阶段">${stages.map(s=>`<button data-lesson="${s.first}" data-stage="${s.id}"><span>阶段 ${s.id}</span><strong>${s.title}</strong><small>${s.description}</small></button>`).join('')}</nav>
  <div class="course-resume"><span id="course-position"></span>${lessons.some(l=>l.id===bookmark)?`<button data-lesson="${esc(bookmark)}" class="text-button">回到上次阅读位置</button>`:''}<a href="#course-catalog">查看完整目录 ↓</a></div>
  <section class="course-layout"><main class="course-lesson"><p class="eyebrow" id="lesson-index"></p><h2 id="lesson-title"></h2><p class="course-question" id="lesson-question"></p>
    <div class="demo-card"><div class="demo-toolbar"><span id="workbench-label"></span><button id="course-pause">暂停演示</button></div><div id="course-viewport" class="course-viewport"></div>
      <div id="course-controls" class="course-controls"></div><div class="course-playback"><button id="course-step">逐步 0.1 秒</button><button id="course-reset">恢复初始状态</button><span id="course-clock"></span></div>
      <p class="course-note" id="workbench-note"></p></div>
    <p id="lesson-observe" class="course-observe"></p>
    <section class="course-data-panel"><h3>[实时数据] 中间状态</h3><dl id="course-metrics"></dl><ol id="course-events" class="course-events"></ol></section>
    <section class="course-theory"><p class="eyebrow">机制与过程</p><h3 id="lesson-principle"></h3><p id="lesson-why"></p><div id="lesson-flow" class="process-strip"></div><code id="lesson-formula"></code><p id="lesson-variables"></p><p id="lesson-boundary" class="course-boundary"></p></section>
    <section class="demo-connection"><span>放进游戏里</span><p id="lesson-game"></p></section>
    <details class="course-mapping" open><summary>Cocos 机制与资料入口</summary><p id="lesson-cocos"></p><div id="lesson-sources"></div></details>
    <nav class="course-next" aria-label="学习顺序"><button id="course-prev">上一课</button><a href="#course-start">回到阶段导航 ↑</a><button id="course-next" class="primary">下一课</button></nav>
  </main><aside class="course-sidebar"><h3 id="sidebar-stage"></h3><nav id="course-lessons" aria-label="本阶段课程"></nav><p>[学习方式] 看演示 → 切换对照 → 看机制与条件 → 下一课。公式与资料可反复查阅，无需填写或提交答案。</p></aside></section>
  <section class="course-catalog" id="course-catalog"><h2>完整目录</h2><p>[课程安排] 每阶段有七课；可顺序学习，也可直接回看一个问题。</p><div>${stages.map(s=>`<article><h3>${s.id} ${s.title}</h3>${lessons.filter(l=>l.stage===s.id).map(l=>`<button data-lesson="${l.id}">${l.title}</button>`).join('')}</article>`).join('')}</div></section>
  <footer>[范围] 本课程使用明确边界的教学实验；不是完整角色控制器、商业战斗系统或跨设备性能结论。个人理解与实验验证分别记录。</footer>`;
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
function readout(){
  el('course-clock').textContent=`演示 ${time.toFixed(2)} s · ${running?'运行中':'已暂停'}`;el('course-pause').textContent=running?'暂停演示':'继续演示';
  if(!bench)return;const snapshot=bench.snapshot();
  el('course-metrics').innerHTML=Object.entries(snapshot.metrics).map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(String(value))}</dd></div>`).join('');
  el('workbench-note').textContent='[实验说明] '+snapshot.note;
  const events=el('course-events');events.hidden=!snapshot.events?.length;events.innerHTML=(snapshot.events||[]).map(e=>`<li>${esc(e)}</li>`).join('');
}
async function choose(lesson:Lesson,writeHistory=true){
  current=lesson;const id=++epoch;bench?.dispose();bench=null;time=0;last=0;
  const host=el('course-viewport'),controls=el('course-controls');host.replaceChildren();controls.replaceChildren();
  const index=lessons.indexOf(lesson),stage=stages.find(s=>s.id===lesson.stage)!;
  if(writeHistory)history.replaceState(null,'',`?lab=course&lesson=${lesson.id}`);
  try{localStorage.setItem('web3d-course-bookmark',lesson.id);}catch{/* Optional bookmark. */}
  el('course-position').textContent=`[阅读位置] 第 ${index+1}/28 课 · ${stage.title}`;
  el('lesson-index').textContent=`阶段 ${lesson.stage} · 第 ${index+1}/28 课`;
  el('lesson-title').textContent=lesson.title;el('lesson-question').textContent=lesson.question;
  el('workbench-label').textContent=['','','','模型与动画检查器','吞噬规则实验','原生 WebGL2 实验','资源与性能实验'][lesson.stage];
  el('lesson-observe').textContent='[操作观察] '+lesson.observe;
  el('lesson-principle').textContent=lesson.question;el('lesson-why').textContent='[原理 / 本例机制] '+lesson.why;
  el('lesson-formula').textContent=lesson.formula;el('lesson-variables').textContent='[变量与约定] '+lesson.variables;
  el('lesson-flow').innerHTML=lesson.steps.map((s,i)=>`<div><span>步骤 ${i+1}</span>[过程] ${esc(s)}</div>`).join('');
  el('lesson-boundary').textContent='[适用条件] '+lesson.boundary;el('lesson-game').textContent='[应用示例] '+lesson.game;
  el('lesson-cocos').textContent='[机制映射] '+lesson.cocos;
  el('lesson-sources').innerHTML=lesson.sources.map((s,i)=>`<a href="${esc(s)}" target="_blank" rel="noopener noreferrer">${s.includes('threejs')?'Three.js':s.includes('cocos')?'Cocos 3.8':s.includes('khronos')?'glTF 2.0':s.includes('github')?'模型出处':'MDN'} · 资料 ${i+1} ↗</a>`).join('');
  el('sidebar-stage').textContent=stage.title;el('course-lessons').innerHTML=lessons.filter(l=>l.stage===lesson.stage).map(l=>`<button data-lesson="${l.id}" aria-current="${l.id===lesson.id?'step':'false'}">${l.title}</button>`).join('');
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===lesson.stage)));
  el<HTMLButtonElement>('course-prev').disabled=index===0;el<HTMLButtonElement>('course-next').disabled=index===lessons.length-1;
  el('course-metrics').replaceChildren();el('course-events').replaceChildren();el('workbench-note').textContent='[运行状态] 初始化实验…';
  try{
    const factory=lesson.stage===3?(await import('./assets-workbench.ts')).createAssets:
      lesson.stage===4?(await import('./gameplay-workbench.ts')).createGameplay:
      lesson.stage===5?(await import('./render-workbench.ts')).createRender:(await import('./performance-workbench.ts')).createPerformance;
    if(disposed||id!==epoch)return;bench=factory(host,controls,lesson.id);bench.update(0,time);readout();
    if(writeHistory)el('lesson-index').scrollIntoView({block:'start',behavior:'instant'});
  }catch(error){if(disposed||id!==epoch)return;host.innerHTML=`<p class="course-error" role="alert">[运行错误] ${esc(String(error))}</p>`;el('workbench-note').textContent='[学习入口] 文字、机制图与资料仍可阅读；恢复图形环境后点击恢复初始状态。';}
}
function frame(now:number){
  if(disposed||document.hidden)return;
  const dt=last?Math.min((now-last)/1000,.1):0;last=now;
  if(running){time+=dt;bench?.update(dt,time);}
  if(now-lastReadout>150){readout();lastReadout=now;}
  raf=requestAnimationFrame(frame);
}
app.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;
  const id=button.dataset.lesson;if(id){const lesson=lessons.find(l=>l.id===id);if(lesson)void choose(lesson);return;}
  if(button.dataset.action){bench?.act(button.dataset.action);bench?.update(0,time);readout();return;}
  if(button.id==='course-pause'){running=!running;last=0;if(current.stage===6)bench?.act('sample');readout();}
  if(button.id==='course-step'){running=false;time+=.1;if(current.stage===6)bench?.act('manual-step');bench?.update(.1,time);readout();}
  if(button.id==='course-reset')void choose(current);
  if(button.id==='course-prev'||button.id==='course-next'){const next=lessons[lessons.indexOf(current)+(button.id==='course-next'?1:-1)];if(next)void choose(next);}
},{signal:abort.signal});
app.addEventListener('input',event=>{const input=event.target as HTMLInputElement;if(input.tagName==='INPUT'&&input.dataset.control){bench?.act(input.dataset.control,input.value);bench?.update(0,time);readout();}},{signal:abort.signal});
app.addEventListener('change',event=>{const input=event.target as HTMLSelectElement;if(input.tagName==='SELECT'&&input.dataset.control){bench?.act(input.dataset.control,input.value);bench?.update(0,time);readout();}},{signal:abort.signal});
function resumeLoop(){cancelAnimationFrame(raf);last=0;if(!disposed&&!document.hidden)raf=requestAnimationFrame(frame);}
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(current.stage===6)bench?.act('sample');resumeLoop();},{signal:abort.signal});
reduced.addEventListener('change',()=>{if(reduced.matches){running=false;readout();}},{signal:abort.signal});
function dispose(){if(disposed)return;disposed=true;epoch++;cancelAnimationFrame(raf);abort.abort();bench?.dispose();bench=null;}
window.addEventListener('pagehide',dispose,{signal:abort.signal});
const pageShow=(event:PageTransitionEvent)=>{if(event.persisted&&disposed)location.reload();};
window.addEventListener('pageshow',pageShow);
if(import.meta.hot)import.meta.hot.dispose(()=>{dispose();window.removeEventListener('pageshow',pageShow);});
await choose(current,false);resumeLoop();
