import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgram} from '../src/render-workbench.ts';
function context(failure:'compile'|'link'|null){
  let shaders=0,deletedShaders=0,deletedPrograms=0;
  const gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
    createShader:()=>({id:++shaders}),shaderSource:()=>{},compileShader:()=>{},getShaderParameter:(s:{id:number})=>failure!=='compile'||s.id===1,
    getShaderInfoLog:()=> 'expected compile failure',deleteShader:()=>deletedShaders++,createProgram:()=>({}),attachShader:()=>{},linkProgram:()=>{},
    getProgramParameter:()=>failure!=='link',getProgramInfoLog:()=> 'expected link failure',deleteProgram:()=>deletedPrograms++};
  return {gl:gl as unknown as WebGL2RenderingContext,stats:()=>({shaders,deletedShaders,deletedPrograms})};
}
test('compile/link errors clean all allocated objects; successful program retains only linked program',()=>{
  for(const failure of ['compile','link'] as const){const c=context(failure);assert.throws(()=>createProgram(c.gl,'vertex','fragment'));assert.deepEqual(c.stats(),{shaders:2,deletedShaders:2,deletedPrograms:failure==='link'?1:0});}
  const c=context(null);assert.ok(createProgram(c.gl,'vertex','fragment'));assert.deepEqual(c.stats(),{shaders:2,deletedShaders:2,deletedPrograms:0});
});
