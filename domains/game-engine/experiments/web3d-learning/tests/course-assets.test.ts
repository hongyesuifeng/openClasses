import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSkinSample,setSkinWeights} from '../src/skin-sample.ts';
test('pinned CC0 character hash matches and contains skin data plus Idle/Walking clips',async()=>{
  const data=await readFile(new URL('../public/assets/robot-expressive.glb',import.meta.url)),metadata=JSON.parse(await readFile(new URL('../public/assets/robot-expressive-source.json',import.meta.url),'utf8'));
  assert.equal(createHash('sha256').update(data).digest('hex'),metadata.sha256);assert.equal(metadata.license,'CC0 1.0');
  assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);
  const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString('utf8'));
  assert.ok(json.skins.every((s:{joints:number[]})=>s.joints.length>0));
  for(const name of ['Idle','Walking'])assert.ok(json.animations.find((a:{name:string})=>a.name===name));
});
test('fixture is parsed by real GLTFLoader, contains four vertices/two triangles/one clip',async()=>{
  const original=globalThis.ProgressEvent;
  globalThis.ProgressEvent=class extends Event { constructor(type:string){super(type);} } as typeof ProgressEvent;
  try{
    const json=await readFile(new URL('../public/assets/tiny.gltf',import.meta.url),'utf8');
    const gltf=await new GLTFLoader().parseAsync(json,'');const mesh=gltf.scene.getObjectByName('ImportedPanel') as T.Mesh;
    assert.equal(mesh.geometry.getAttribute('position').count,4);assert.equal(mesh.geometry.index!.count,6);assert.equal(gltf.animations.length,1);
    const mixer=new T.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations[0]).play();mixer.update(1);assert.ok(mesh.rotation.z>.5);
    mixer.stopAllAction();mixer.uncacheRoot(gltf.scene);mesh.geometry.dispose();(mesh.material as T.Material).dispose();
  }finally{if(original)globalThis.ProgressEvent=original;else delete (globalThis as {ProgressEvent?:typeof ProgressEvent}).ProgressEvent;}
});
test('skin weights normalize in both modes and rest pose preserves vertices',()=>{
  const sample=createSkinSample(),{geometry,skin}=sample;
  for(const hard of [false,true]){setSkinWeights(geometry,hard);const w=geometry.getAttribute('skinWeight');for(let i=0;i<w.count;i++)assert.ok(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)<1e-6);}
  skin.updateMatrixWorld(true);const pos=geometry.getAttribute('position');for(let i=0;i<pos.count;i++){const original=new T.Vector3().fromBufferAttribute(pos,i),skinned=skin.applyBoneTransform(i,original.clone());assert.ok(original.distanceTo(skinned)<1e-6);}
  sample.mixer.stopAllAction();sample.mixer.uncacheRoot(skin);sample.skeleton.dispose();geometry.dispose();skin.material.dispose();
});
test('weighted pose changes upper vertices while root stays anchored; Mixer endpoints differ',()=>{
  const sample=createSkinSample();sample.idle.setEffectiveWeight(0);sample.move.setEffectiveWeight(1);sample.mixer.update(1);sample.skin.updateMatrixWorld(true);
  const position=sample.geometry.getAttribute('position'),bottom=new T.Vector3().fromBufferAttribute(position,0),top=new T.Vector3().fromBufferAttribute(position,24);
  assert.ok(sample.skin.applyBoneTransform(0,bottom.clone()).distanceTo(bottom)<1e-6);assert.ok(sample.skin.applyBoneTransform(24,top.clone()).distanceTo(top)>.4);
  sample.idle.setEffectiveWeight(1);sample.move.setEffectiveWeight(0);sample.mixer.setTime(1);assert.ok(Math.abs(sample.bone1.rotation.z)<.1);
  sample.mixer.stopAllAction();sample.mixer.uncacheRoot(sample.skin);sample.skeleton.dispose();sample.geometry.dispose();sample.skin.material.dispose();
});
