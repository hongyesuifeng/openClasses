import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { createSkinSample,setSkinWeights } from './skin-sample.ts';
import { controlButton as button, rangeControl as range, type WorkbenchFactory } from './workbench.ts';

function releaseObject(root:T.Object3D,extraMaterials:T.Material[]=[],extraTextures:T.Texture[]=[]) {
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(extraMaterials),textures=new Set<T.Texture>(extraTextures);
  root.traverse(o=>{ const mesh=o as T.Mesh; if(mesh.geometry) geometries.add(mesh.geometry); if(mesh.material) (Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>materials.add(m)); });
  geometries.forEach(g=>g.dispose());materials.forEach(m=>{Object.values(m).forEach(value=>{if(value instanceof T.Texture)textures.add(value);});m.dispose();});textures.forEach(t=>t.dispose());
}
export const createAssets:WorkbenchFactory=(host,controls,lesson)=>{
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#162a36');
  const camera=new T.PerspectiveCamera(42,1,.1,100);camera.position.set(0,1,5);camera.lookAt(0,1,0);
  scene.add(new T.AmbientLight(0xffffff,.65));const light=new T.DirectionalLight(0xffffff,2);light.position.set(3,3,5);scene.add(light);
  const root=new T.Group();scene.add(root);
  const planeGeometry=new T.BufferGeometry();
  planeGeometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));
  planeGeometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  planeGeometry.setIndex([0,1,2,0,2,3]);planeGeometry.computeVertexNormals();
  const pixels=new Uint8Array(8*8*4);for(let y=0;y<8;y++)for(let x=0;x<8;x++){
    const i=(y*8+x)*4,c=(x+y)%2? [225,193,95]:[35,137,118];pixels.set([...c,255],i);
  }
  const texture=new T.DataTexture(pixels,8,8);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.needsUpdate=true;
  const material=new T.MeshLambertMaterial({color:0x5cd4ad,side:T.DoubleSide});
  const flat=new T.MeshBasicMaterial({color:0x5cd4ad,side:T.DoubleSide});
  const plane=new T.Mesh<T.BufferGeometry,T.Material>(planeGeometry,material);plane.position.y=1;root.add(plane);
  const vertexOverlay=document.createElement('div');vertexOverlay.className='course-vertex-overlay';vertexOverlay.hidden=lesson!=='mesh'&&lesson!=='uv';
  vertexOverlay.innerHTML=[0,1,2,3].map(i=>`<span title="顶点 ${i}">${i}</span>`).join('');host.append(vertexOverlay);
  const normals=new VertexNormalsHelper(plane,.3,0xffcc63);scene.add(normals);normals.visible=false;
  const {geometry,skin,skeleton,bone1,mixer,idle,move}=createSkinSample();root.add(skin);
  const helper=new T.SkeletonHelper(skin);scene.add(helper);
  let blend=1,hard=false,wire=false,unlit=false,showNormals=false,showBones=true,scale=1,angle=0,disposed=false,loadId=0;
  let imported:T.Group|null=null,loadState='未请求',note='';
  let character=false,robot:T.Group|null=null,robotMixer:T.AnimationMixer|null=null,robotHelper:T.SkeletonHelper|null=null;
  let robotIdle:T.AnimationAction|null=null,robotMove:T.AnimationAction|null=null,robotClips:string[]=[],robotBones=0;
  const loader=new GLTFLoader();
  function releaseRobot(){
    if(robot){robotMixer?.stopAllAction();robotMixer?.uncacheRoot(robot);root.remove(robot);releaseObject(robot);robot.traverse(o=>{if((o as T.SkinnedMesh).isSkinnedMesh)(o as T.SkinnedMesh).skeleton.dispose();});}
    if(robotHelper){scene.remove(robotHelper);releaseObject(robotHelper);}robot=null;robotMixer=null;robotHelper=null;robotIdle=null;robotMove=null;
  }
  async function loadRobot(){
    const id=++loadId;loadState='加载中';note='加载已固定来源的 CC0 角色…';
    try{
      const gltf=await loader.loadAsync('/assets/robot-expressive.glb');
      if(disposed||id!==loadId){releaseObject(gltf.scene);gltf.scene.traverse(o=>{if((o as T.SkinnedMesh).isSkinnedMesh)(o as T.SkinnedMesh).skeleton.dispose();});return;}
      robot=gltf.scene;const box=new T.Box3().setFromObject(robot),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      const fit=2/Math.max(size.y,.01);robot.scale.setScalar(fit);robot.position.set(-center.x*fit,1-center.y*fit,-center.z*fit);root.add(robot);
      robotClips=gltf.animations.map(c=>c.name);robotBones=0;robot.traverse(o=>{if((o as T.Bone).isBone)robotBones++;});
      robotMixer=new T.AnimationMixer(robot);robotIdle=robotMixer.clipAction(gltf.animations.find(c=>c.name==='Idle')||gltf.animations[0]).play();
      robotMove=robotMixer.clipAction(gltf.animations.find(c=>c.name==='Walking')||gltf.animations[1]).play();
      robotHelper=new T.SkeletonHelper(robot);scene.add(robotHelper);loadState='已加载现成角色';note='RobotExpressive · Tomás Laulhé / Quaternius · CC0 1.0；真实角色的 Idle / Walking 轨道由 Mixer 采样。';
      const weightsControl=controls.querySelector<HTMLButtonElement>('[data-action="weights"]');if(weightsControl)weightsControl.disabled=true;
    }catch{if(!disposed&&id===loadId){character=false;loadState='角色加载失败';note='角色资源无法加载，已返回两骨教学样本。';}}
  }
  async function load(missing=false) {
    const id=++loadId;loadState='加载中';note='';if(imported){root.remove(imported);releaseObject(imported);imported=null;}
    try {
      const gltf=await loader.loadAsync(missing?'/assets/missing-learning-model.gltf':'/assets/tiny.gltf');
      if(disposed||id!==loadId) {releaseObject(gltf.scene);return;}
      imported=gltf.scene;imported.position.y=1;root.add(imported);
      loadState=`已加载：${gltf.animations.length} Clip`;note='实际 GLTFLoader 解析本地文件；不依赖外部资产。';
    } catch {if(!disposed&&id===loadId){loadState='失败';note='资源无法解析或不存在。点击恢复模型可重新加载。';}}
  }
  if(lesson==='import') void load();
  controls.innerHTML=lesson==='import'?range('scale','根节点比例',.25,2,.25,1)+button('rotate','根节点转向 90°')+button('missing','模拟资源缺失')+button('restore','恢复模型'):
    lesson==='mesh'?button('wire','切换线框'):
    lesson==='uv'?range('repeat','贴图重复次数',1,4,1,1):
    lesson==='normal'?button('normals','显示 / 隐藏法线')+button('unlit','切换受光 / 不受光'):
    button('bones','显示 / 隐藏骨架')+button('character','对照现成角色 / 两骨样本')+(lesson==='skin'?button('weights','切换渐变 / 硬权重'):'')+(lesson==='blend'?range('blend','动作混合权重',0,1,.05,1):'');
  let lastTime=0;
  const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();update(0,lastTime);});observer.observe(host);
  function update(dt:number,time:number) {
    if(disposed)return;lastTime=time;
    const rig=['bones','skin','blend'].includes(lesson);plane.visible=!rig&&lesson!=='import';skin.visible=rig&&!character;helper.visible=rig&&showBones&&!character;normals.visible=lesson==='normal'&&showNormals;
    idle.setEffectiveWeight(1-blend);move.setEffectiveWeight(blend);mixer.update(dt);
    if(robotMixer){robotIdle!.setEffectiveWeight(1-blend);robotMove!.setEffectiveWeight(blend);robotMixer.update(dt);}if(robotHelper)robotHelper.visible=showBones;
    plane.material=unlit?flat:material;const map=lesson==='uv'?texture:null;if(material.map!==map){material.map=map;material.needsUpdate=true;}material.wireframe=wire;
    root.scale.setScalar(scale);root.rotation.y=angle;const lightTime=lesson==='normal'?time:0;light.position.set(Math.sin(lightTime)*4,2,Math.cos(lightTime)*4);normals.update();
    renderer.render(scene,camera);
    if(!vertexOverlay.hidden){
      const position=planeGeometry.getAttribute('position');vertexOverlay.querySelectorAll<HTMLElement>('span').forEach((label,i)=>{
        const p=new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(plane.matrixWorld).project(camera);
        label.style.left=`${(p.x+1)*.5*host.clientWidth}px`;label.style.top=`${(1-p.y)*.5*host.clientHeight}px`;
      });
    }
  }
  return {update,act(action,value){
    if(action==='wire')wire=!wire;if(action==='normals')showNormals=!showNormals;if(action==='unlit')unlit=!unlit;
    if(action==='bones')showBones=!showBones;if(action==='blend')blend=Number(value);
    if(action==='repeat')texture.repeat.setScalar(Number(value));if(action==='scale')scale=Number(value);if(action==='rotate')angle+=Math.PI/2;
    if(action==='missing')void load(true);if(action==='restore')void load();
    if(action==='character'){
      character=!character;if(character)void loadRobot();else{loadId++;releaseRobot();note='返回两骨教学样本；硬/渐变权重只改变该样本。';const weightsControl=controls.querySelector<HTMLButtonElement>('[data-action="weights"]');if(weightsControl)weightsControl.disabled=false;}
    }
    if(action==='weights'){hard=!hard;setSkinWeights(geometry,hard);}
  },reset(){mixer.setTime(0);},snapshot(){
    const rig=['bones','skin','blend'].includes(lesson);const box=new T.Box3();if(imported)box.setFromObject(imported);
    const metrics:Record<string,string|number>=rig?{'顶点':geometry.getAttribute('position').count,'骨骼':2,'权重模式':hard?'硬权重':'渐变权重','Idle 权重':idle.getEffectiveWeight().toFixed(2),'Move 权重':move.getEffectiveWeight().toFixed(2),'动作时间':move.time.toFixed(2)+' s','关节旋转':(bone1.rotation.z*180/Math.PI).toFixed(1)+'°'}:
      lesson==='import'?{'加载状态':loadState,'根节点':imported?.children.map(c=>c.name).join(', ')||'无','比例':scale,'包围盒宽度':imported?box.getSize(new T.Vector3()).x.toFixed(2):'无','方向':Math.round(angle*180/Math.PI)+'°'}:
      {'position 顶点':4,'index':Array.from(planeGeometry.index!.array).join(','),'三角形':2,'UV 重复':texture.repeat.x,'材质':unlit?'Basic':'Lambert','线框':wire?'开':'关'};
    if(lesson==='normal')metrics['法线显示']=showNormals?'开':'关';
    if(character){for(const key of Object.keys(metrics))delete metrics[key];Object.assign(metrics,{'模型':loadState,'骨骼数量':robotBones,'Idle 权重':robotIdle?.getEffectiveWeight().toFixed(2)||'加载中','Walking 权重':robotMove?.getEffectiveWeight().toFixed(2)||'加载中','动作时间':robotMove?robotMove.time.toFixed(2)+' s':'加载中','Clips':robotClips.join(', ')});}
    return {metrics,note:note||'实际 Three.js 几何、材质、骨骼与 Mixer；骨骼模型为内置两骨教学样本。'};
  },dispose(){disposed=true;loadId++;observer.disconnect();mixer.stopAllAction();mixer.uncacheRoot(skin);skeleton.dispose();releaseRobot();releaseObject(root,[material,flat],[texture]);releaseObject(normals);releaseObject(helper);renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
};
