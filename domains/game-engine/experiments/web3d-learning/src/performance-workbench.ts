import * as T from 'three';
import { LeaseCache,ParticlePool,summarize } from './course-core.ts';
import { controlButton as button,selectControl as select,type WorkbenchFactory } from './workbench.ts';
export const createPerformance:WorkbenchFactory=(host,controls,lesson)=>{
  const renderer=new T.WebGLRenderer({antialias:false});renderer.setPixelRatio(1);host.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#152935');
  const camera=new T.PerspectiveCamera(45,1,.1,200);camera.position.set(0,0,18);
  let batch=new T.Group();scene.add(batch);let geometry:T.BufferGeometry|null=null,material:T.Material|null=null,instance:T.InstancedMesh|null=null;
  let count=lesson==='overdraw'?10:500,instanced=false,lod=true,far=false,dpr=1,removed=false,disposed=false,lastTime=0,note='';
  const pool=new ParticlePool(20);
  const overlay=document.createElement('div');overlay.className='course-overlay';overlay.hidden=!['loading','pool'].includes(lesson);host.append(overlay);
  const cache=new LeaseCache<T.Texture>(async key=>{
    await new Promise(resolve=>setTimeout(resolve,300));if(key==='fail')throw new Error('教学加载失败');
    const tex=new T.DataTexture(new Uint8Array([70,180,140,255]),1,1);tex.needsUpdate=true;if(!disposed)renderer.initTexture(tex);return tex;
  },tex=>tex.dispose());
  let leases:ReturnType<typeof cache.acquire>[]=[];
  let warmup=0,frames:number[]=[],cpu:number[]=[],lastRaf=0,hasSample=false;
  function resetSamples(){warmup=0;frames=[];cpu=[];lastRaf=0;hasSample=false;}
  function releaseBatch(){scene.remove(batch);instance?.dispose();instance=null;geometry?.dispose();material?.dispose();geometry=null;material=null;batch.clear();removed=true;}
  function rebuild(){
    releaseBatch();batch=new T.Group();scene.add(batch);removed=false;
    const overdraw=lesson==='overdraw';
    geometry=overdraw?new T.PlaneGeometry(12,9):new T.SphereGeometry(.18,lod&&far?4:12,lod&&far?3:8);
    material=new T.MeshBasicMaterial({color:0x62cdb0,transparent:overdraw,opacity:overdraw ? .035 : 1,depthWrite:!overdraw,side:T.FrontSide});
    if(instanced&&!overdraw){
      instance=new T.InstancedMesh(geometry,material,count);instance.frustumCulled=false;
      const matrix=new T.Matrix4();for(let i=0;i<count;i++){matrix.makeTranslation((i%25-12)*.48,(Math.floor(i/25)%20-10)*.48,-Math.floor(i/500)*.5);instance.setMatrixAt(i,matrix);}
      instance.instanceMatrix.needsUpdate=true;batch.add(instance);
    }else for(let i=0;i<count;i++){
      const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;
      mesh.position.set(overdraw?0:(i%25-12)*.48,overdraw?0:(Math.floor(i/25)%20-10)*.48,overdraw?-i*.002:-Math.floor(i/500)*.5);batch.add(mesh);
    }
    camera.position.z=far?35:18;resetSamples();
  }
  if(!['loading','pool'].includes(lesson))rebuild();
  controls.innerHTML=lesson==='loading'?button('acquire','申请一个租约')+button('release','释放一个租约')+button('fail','模拟加载失败'):
    lesson==='pool'?button('emit','发射 5 个对象')+button('return','返还全部对象')+button('clear','清空池'):
    lesson==='dispose'?button('remove','仅移除对象')+button('dispose','完整释放')+button('rebuild','重建批次'):
    select('count',lesson==='overdraw'?'透明层数':'对象数量',lesson==='overdraw'?[['10','10'],['100','100'],['500','500']]:[['500','500'],['100','100'],['1500','1500']])+
    (lesson==='overdraw'?select('dpr','DPR',[['1','1'],['2','2']]):button('instancing','普通 Mesh / 实例化'))+
    (lesson==='lod'?button('distance','近 / 远距离')+button('lod','开关 LOD'):'')+button('sample','重新采样')+button('export','导出原始记录');
  const resize=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();resetSamples();update(0,lastTime);});resize.observe(host);
  function exportData(){
    const blob=new Blob([JSON.stringify({environment:{userAgent:navigator.userAgent,width:renderer.domElement.width,height:renderer.domElement.height,dpr,lesson,count,instanced,lod,far},
      measurements:{warmupFrames:30,sampleFrames:frames.length,rafIntervalsMs:frames,jsSubmissionMs:cpu,raf:summarize(frames),js:summarize(cpu),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},
      limitation:'RAF callback intervals and JS submission duration are NOT GPU time.'},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='web3d-performance.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function update(dt:number,time:number){
    if(disposed)return;lastTime=time;pool.tick(dt);
    const start=performance.now();renderer.render(scene,camera);const cost=performance.now()-start;
    if(lesson==='loading'){
      const rows=cache.inspect();overlay.innerHTML=`<svg viewBox="0 0 760 390" role="img" aria-label="租约与异步资源生命周期"><text x="45" y="48" fill="#bfe8db">消费者 → 共享加载 → 最后一个租约释放 → dispose</text>
        <rect x="50" y="120" width="190" height="130" rx="14" fill="#2c5a60"/><text x="72" y="165" fill="#e7f1eb">持有租约 ${leases.length}</text><text x="72" y="200" fill="#e7f1eb">每次释放一个拥有者</text>
        <path d="M260 185H345" stroke="#8ccfb9" stroke-width="3"/><text x="285" y="168" fill="#8ccfb9">→</text>
        <rect x="360" y="120" width="345" height="130" rx="14" fill="#3f535f"/><text x="382" y="165" fill="#e7f1eb">${rows.length?rows.map(r=>r.key+' · '+r.state+' · refs='+r.refs).join(' / '):'缓存为空'}</text>
        <text x="382" y="205" fill="#d0ded7">GPU 纹理数量 ${renderer.info.memory.textures}</text><text x="50" y="320" fill="#bcd6d2">加载中释放也会在结果到达后清理；失败项允许重试。</text></svg>`;
    }
    if(lesson==='pool')overlay.innerHTML=`<svg viewBox="0 0 760 390" role="img" aria-label="逻辑对象池活动与空闲状态"><text x="45" y="48" fill="#bfe8db">空闲 → 取得并重置 → 活动 → 返还并清零</text>
      ${pool.items.map((p,i)=>`<circle cx="${75+(i%10)*65}" cy="${135+Math.floor(i/10)*95}" r="23" fill="${p.active?'#60bb99':'#526877'}"/><text x="${62+(i%10)*65}" y="${181+Math.floor(i/10)*95}" fill="#d8e8df">#${p.id}</text>`).join('')}
      <text x="45" y="340" fill="#bcd6d2">分配 ${pool.items.length} · 创建累计 ${pool.created} · 绿色为活动对象</text></svg>`;
    if(dt>0&&!['loading','pool','dispose'].includes(lesson)){
      // dt is the shell's bounded simulation step; RAF measurement uses the REAL timestamp.
      const now=performance.now();if(lastRaf){const interval=now-lastRaf;if(warmup<30)warmup++;else if(frames.length<120){frames.push(interval);cpu.push(cost);hasSample=true;}}
      lastRaf=now;
    }
  }
  return {update,act(action,value){
    if(action==='acquire'||action==='fail'){
      const lease=cache.acquire(action==='fail'?'fail':'shared');leases.push(lease);
      void lease.ready.then(()=>{if(!disposed)note='异步加载完成；资源是否保留由租约数量决定。';},()=>{if(!disposed)note='加载失败，失败项已移出缓存，可重新申请。';});
    }
    if(action==='release'){const lease=leases.shift();lease?.release();note=lease?'已释放一个租约。':'没有待释放租约。';}
    if(action==='emit')for(let i=0;i<5;i++)pool.take();if(action==='return')pool.items.forEach(p=>pool.put(p));if(action==='clear')pool.clear();
    if(action==='remove'){scene.remove(batch);removed=true;}if(action==='dispose')releaseBatch();if(action==='rebuild')rebuild();
    if(action==='count'){count=Number(value);rebuild();}if(action==='instancing'){instanced=!instanced;rebuild();}
    if(action==='distance'){far=!far;rebuild();}if(action==='lod'){lod=!lod;rebuild();}
    if(action==='dpr'){dpr=Number(value);renderer.setPixelRatio(dpr);renderer.setSize(host.clientWidth,host.clientHeight,false);resetSamples();}
    if(action==='sample')resetSamples();if(action==='manual-step')lastRaf=0;if(action==='export')exportData();update(0,lastTime);
  },reset(){resetSamples();},snapshot(){
    const raf=summarize(frames),js=summarize(cpu);
    const metrics:Record<string,string|number>=lesson==='loading'?{'缓存':JSON.stringify(cache.inspect()),'持有租约':leases.length,'纹理数量':renderer.info.memory.textures}:
      lesson==='pool'?{'创建累计':pool.created,'池中分配':pool.items.length,'活动':pool.items.filter(p=>p.active).length,'空闲':pool.items.filter(p=>!p.active).length,'最大 age':Math.max(0,...pool.items.map(p=>p.age)).toFixed(2)+' s'}:
      {'模式':instanced?'InstancedMesh':'Mesh','对象数量':count,'Draw Calls':renderer.info.render.calls,'Triangles':renderer.info.render.triangles,'Geometries':renderer.info.memory.geometries,'Textures':renderer.info.memory.textures,'是否移除':removed?'是':'否','相机距离':camera.position.z,'画布尺寸':renderer.domElement.width+' × '+renderer.domElement.height,'DPR':dpr,'采样':warmup<30?'预热 '+warmup+'/30':frames.length+'/120','RAF 平均 / p95':hasSample?raf.mean.toFixed(2)+' / '+raf.p95.toFixed(2)+' ms':'等待采样','JS 提交平均 / p95':hasSample?js.mean.toFixed(2)+' / '+js.p95.toFixed(2)+' ms':'等待采样'};
    return {metrics,note:note||(['loading','pool'].includes(lesson)?'空画布用于保持同一渲染环境；操作结果显示在下面的实际数据中。':'真实 renderer.info 统计；RAF 与 JS 提交耗时不代表 GPU 时间。')};
  },dispose(){disposed=true;resize.disconnect();leases.forEach(l=>l.release());leases=[];pool.clear();releaseBatch();renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
};
