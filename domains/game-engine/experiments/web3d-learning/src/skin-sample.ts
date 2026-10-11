import * as T from 'three';
export function createSkinSample(){
  const positions:number[]=[],indices:number[]=[],skinIndices:number[]=[];
  for(let y=0;y<=12;y++)for(let x=0;x<2;x++){positions.push(x===0?-.38:.38,2*y/12,0);skinIndices.push(0,1,0,0);}
  for(let y=0;y<12;y++){const a=2*y;indices.push(a,a+1,a+3,a,a+3,a+2);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(new Float32Array(positions.length/3*4),4));
  setSkinWeights(geometry,false);
  const material=new T.MeshLambertMaterial({color:0xe9c773,side:T.DoubleSide});
  const skin=new T.SkinnedMesh(geometry,material),bone0=new T.Bone(),bone1=new T.Bone();
  bone0.name='Root';bone1.name='Joint';bone1.position.y=1;bone0.add(bone1);skin.add(bone0);
  const skeleton=new T.Skeleton([bone0,bone1]);skin.bind(skeleton);skin.frustumCulled=false;
  const mixer=new T.AnimationMixer(skin);
  const clip=(name:string,amplitude:number)=>new T.AnimationClip(name,2,[new T.QuaternionKeyframeTrack('.bones[Joint].quaternion',[0,.5,1,1.5,2],[-1,0,1,0,-1].flatMap(a=>new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),a*amplitude).toArray()))]);
  const idle=mixer.clipAction(clip('Idle',.04)).play(),move=mixer.clipAction(clip('Move',.65)).play();
  return {geometry,skin,skeleton,bone0,bone1,mixer,idle,move};
}
export function setSkinWeights(geometry:T.BufferGeometry,hard:boolean){
  const position=geometry.getAttribute('position'),weight=geometry.getAttribute('skinWeight');
  for(let i=0;i<position.count;i++){const y=position.getY(i),w=hard?(y>=1?1:0):T.MathUtils.clamp(y-.5,0,1);weight.setXYZW(i,1-w,w,0,0);}
  weight.needsUpdate=true;
}
