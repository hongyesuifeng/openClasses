// Reproducible, original glTF fixture: indexed quad + node rotation animation.
import { mkdir, writeFile } from 'node:fs/promises';
const chunks=[]; const views=[]; let size=0;
function add(array,target) {
  while(size%4) { chunks.push(Buffer.alloc(1));size++; }
  const bytes=Buffer.from(array.buffer);views.push({buffer:0,byteOffset:size,byteLength:bytes.length,...(target?{target}:{})});
  chunks.push(bytes);size+=bytes.length;return views.length-1;
}
const position=add(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),34962);
const normal=add(new Float32Array([0,0,1,0,0,1,0,0,1,0,0,1]),34962);
const uv=add(new Float32Array([0,0,1,0,1,1,0,1]),34962);
const indices=add(new Uint16Array([0,1,2,0,2,3]),34963);
const time=add(new Float32Array([0,1,2]));
const rotations=add(new Float32Array([0,0,0,1,0,0,Math.sin(.3),Math.cos(.3),0,0,0,1]));
const gltf={asset:{version:'2.0',generator:'openClasses original learning fixture'},scene:0,scenes:[{nodes:[0]}],
  nodes:[{name:'ImportedPanel',mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,material:0}]}],
  materials:[{name:'Green',pbrMetallicRoughness:{baseColorFactor:[.18,.65,.5,1],metallicFactor:0,roughnessFactor:.8},doubleSided:true}],
  buffers:[{byteLength:size,uri:'data:application/octet-stream;base64,'+Buffer.concat(chunks).toString('base64')}],bufferViews:views,
  accessors:[{bufferView:position,componentType:5126,count:4,type:'VEC3',min:[-1,-1,0],max:[1,1,0]},
    {bufferView:normal,componentType:5126,count:4,type:'VEC3'},{bufferView:uv,componentType:5126,count:4,type:'VEC2'},
    {bufferView:indices,componentType:5123,count:6,type:'SCALAR'},
    {bufferView:time,componentType:5126,count:3,type:'SCALAR',min:[0],max:[2]},
    {bufferView:rotations,componentType:5126,count:3,type:'VEC4'}],
  animations:[{name:'PanelTurn',samplers:[{input:4,output:5,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:0,path:'rotation'}}]}]};
const destination=new URL('../public/assets/',import.meta.url);
await mkdir(destination,{recursive:true});await writeFile(new URL('tiny.gltf',destination),JSON.stringify(gltf,null,2)+'\n');
console.log('Built original tiny.gltf ('+size+' binary bytes)');
