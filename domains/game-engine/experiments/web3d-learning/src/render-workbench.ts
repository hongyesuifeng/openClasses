import { controlButton as button, rangeControl as range, type WorkbenchFactory } from './workbench.ts';
export const vertexSource=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aColor;
layout(location=2) in vec2 aUv;
uniform vec3 uOffset;
uniform float uFit;
out vec3 vColor;
out vec2 vUv;
void main(){vec3 p=aPosition+uOffset;gl_Position=vec4(p.x*uFit,p.yz,1.0);vColor=aColor;vUv=aUv;}`;
export const fragmentSource=`#version 300 es
precision highp float;
in vec3 vColor;
in vec2 vUv;
uniform int uMode;
uniform bool uEnabled;
uniform float uRepeat,uThreshold,uPower,uTime,uAge;
uniform vec4 uColor;
uniform sampler2D uTexture;
out vec4 outColor;
void main(){
  if(uMode==1){outColor=vec4(uEnabled?vColor:uColor.rgb,1.0);return;}
  if(uMode==2){outColor=texture(uTexture,vUv*uRepeat);return;}
  if(uMode==3){outColor=uColor;return;}
  vec2 p=vUv*2.0-1.0;
  if(uMode==7){
    float age=clamp(uAge/0.8,0.0,1.0);
    float ring=1.0-smoothstep(0.02,0.06,abs(length(p)-age*1.3));
    float flash=(1.0-age)*0.7;
    outColor=vec4(mix(vec3(0.08,0.23,0.26),vec3(1.0,0.92,0.55),max(ring*(1.0-age),flash)),1.0);return;
  }
  if(dot(p,p)>1.0) discard;
  vec3 n=normalize(vec3(p,sqrt(max(0.0,1.0-dot(p,p)))));
  vec3 l=normalize(vec3(sin(uTime),0.5,cos(uTime)));
  float diffuse=0.2+0.8*max(0.0,dot(n,l));
  vec3 color=vec3(0.12,0.6,0.46)*diffuse;
  if(uMode==5&&uEnabled){float rim=pow(1.0-max(0.0,n.z),uPower);color+=rim*vec3(0.9,0.65,0.2);}
  if(uMode==6){
    float noise=fract(sin(dot(floor(vUv*30.0),vec2(12.9898,78.233)))*43758.5453);
    if(noise<uThreshold)discard;
    float edge=1.0-smoothstep(uThreshold,uThreshold+0.07,noise);
    color=mix(color,vec3(1.0,0.75,0.2),edge);
  }
  outColor=vec4(color,1.0);
}`;

export function createProgram(gl:WebGL2RenderingContext,vertex:string,fragment:string) {
  const shaders:WebGLShader[]=[];let program:WebGLProgram|null=null;
  try {
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]] as const){
      const shader=gl.createShader(type);if(!shader)throw new Error('无法创建 Shader');shaders.push(shader);
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Shader 编译失败：'+gl.getShaderInfoLog(shader));
    }
    program=gl.createProgram();if(!program)throw new Error('无法创建 Program');shaders.forEach(s=>gl.attachShader(program!,s));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader 链接失败：'+gl.getProgramInfoLog(program));
    return program;
  } catch(error){if(program)gl.deleteProgram(program);throw error;}
  finally {shaders.forEach(s=>gl.deleteShader(s));}
}
export const createRender:WorkbenchFactory=(host,controls,lesson)=>{
  const canvas=document.createElement('canvas');host.append(canvas);const context=canvas.getContext('webgl2',{alpha:false,antialias:true});
  if(!context)throw new Error('WebGL2 不可用：仍可阅读课程图解，交互画面需要支持 WebGL2 的浏览器。');
  const gl:WebGL2RenderingContext=context;
  const program=createProgram(gl,vertexSource,fragmentSource);
  const vao=gl.createVertexArray()!,buffer=gl.createBuffer()!,texture=gl.createTexture()!;
  const triangle=[-.75,-.6,0,1,.35,.2,0,0, .75,-.6,0,.2,1,.65,1,0, 0,.75,0,.2,.55,1,.5,1];
  const quad=[-.65,-.65,0,1,1,1,0,0, .65,-.65,0,1,1,1,1,0, .65,.65,0,1,1,1,1,1,
    -.65,-.65,0,1,1,1,0,0, .65,.65,0,1,1,1,1,1, -.65,.65,0,1,1,1,0,1];
  gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(lesson==='pipeline'?triangle:quad),gl.STATIC_DRAW);
  for(const [index,size,offset] of [[0,3,0],[1,3,12],[2,2,24]]){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,32,offset);}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,2,2,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([230,180,55,255,40,150,125,255,60,115,210,255,220,85,70,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  const uniforms=new Map<string,WebGLUniformLocation|null>();for(const name of ['uOffset','uFit','uMode','uEnabled','uRepeat','uThreshold','uPower','uTime','uAge','uColor','uTexture'])uniforms.set(name,gl.getUniformLocation(program,name));
  const u=(name:string)=>uniforms.get(name)!;
  const mode={pipeline:1,texture:2,depth:3,light:4,rim:5,dissolve:6,feedback:7}[lesson]||1;
  let repeat=1,threshold=.25,power=3,enabled=true,reverse=false,transparent=true,disposed=false,lost=false,age=1,lastTime=0,draws=0,note='';
  controls.innerHTML=lesson==='pipeline'?button('enabled','切换顶点颜色'):
    lesson==='texture'?range('repeat','纹理重复次数',1,4,1,1):
    lesson==='depth'?button('order','切换透明绘制顺序')+button('transparent','切换透明 / 不透明'):
    lesson==='rim'?button('enabled','开关边缘光')+range('power','边缘光幂',1,8,.5,3):
    lesson==='dissolve'?range('threshold','溶解阈值',0,1,.05,.25)+button('badshader','模拟编译错误')+button('restore','恢复提示'):
    lesson==='feedback'?button('feedback','触发命中反馈'):button('freezeLight','固定 / 旋转光源');
  const abort=new AbortController();canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;note='WebGL 上下文丢失，请刷新页面重建；文字课程仍可阅读。';},{signal:abort.signal});
  const resize=new ResizeObserver(()=>{canvas.width=Math.round(host.clientWidth*Math.min(devicePixelRatio,2));canvas.height=Math.round(host.clientHeight*Math.min(devicePixelRatio,2));update(0,lastTime);});resize.observe(host);
  let rotateLight=true;
  function update(dt:number,time:number) {
    age+=dt;lastTime=time;if(disposed||lost)return;
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.07,.14,.19,1);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);gl.bindVertexArray(vao);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LESS);gl.disable(gl.BLEND);
    gl.uniform1i(u('uMode'),mode);gl.uniform1i(u('uEnabled'),enabled?1:0);gl.uniform1f(u('uRepeat'),repeat);gl.uniform1f(u('uThreshold'),threshold);
    gl.uniform1f(u('uFit'),mode>=4?canvas.height/Math.max(1,canvas.width):1);
    gl.uniform1f(u('uPower'),power);gl.uniform1f(u('uTime'),rotateLight?time:0);gl.uniform1f(u('uAge'),age);gl.uniform1i(u('uTexture'),0);
    gl.uniform3f(u('uOffset'),0,0,0);gl.uniform4f(u('uColor'),.25,.8,.65,1);draws=0;
    if(mode===3){
      gl.uniform3f(u('uOffset'),0,0,.75);gl.uniform4f(u('uColor'),.06,.12,.16,1);gl.drawArrays(gl.TRIANGLES,0,6);draws++;
      if(transparent){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
      const planes=reverse?[0,1]:[1,0];for(const i of planes){gl.uniform3f(u('uOffset'),i?-.15:.15,0,i?.25:-.25);gl.uniform4f(u('uColor'),i?.2:1,i?.65:.35,i?1:.2,transparent?.55:1);gl.drawArrays(gl.TRIANGLES,0,6);draws++;}
    }else {gl.drawArrays(gl.TRIANGLES,0,mode===1?3:6);draws++;}
    gl.depthMask(true);
  }
  return {update,act(action,value){if(action==='enabled')enabled=!enabled;if(action==='repeat')repeat=Number(value);if(action==='threshold')threshold=Number(value);if(action==='power')power=Number(value);
    if(action==='order')reverse=!reverse;if(action==='transparent')transparent=!transparent;if(action==='feedback')age=0;if(action==='freezeLight')rotateLight=!rotateLight;
    if(action==='badshader'){try{const invalid=createProgram(gl,vertexSource,'#version 300 es\nTHIS IS INVALID');gl.deleteProgram(invalid);}catch(error){note=String(error);}}
    if(action==='restore')note='有效 Program 保留，继续绘制。';update(0,lastTime);},reset(){age=1;},snapshot(){
    const metrics:Record<string,string|number>={'API':'原生 WebGL2','顶点缓冲':1,'顶点数量':mode===1?3:6,'绘制次数':draws,'画布尺寸':canvas.width+' × '+canvas.height};
    if(mode===1)metrics['顶点颜色']=enabled?'开':'关';if(mode===2)metrics['纹理重复']=repeat;
    if(mode===3){metrics['透明顺序']=reverse?'近→远':'远→近';metrics['材质模式']=transparent?'透明':'不透明';}
    if(mode===4)metrics['光源']=rotateLight?'旋转':'固定';if(mode===5){metrics['边缘光']=enabled?'开':'关';metrics['边缘光幂']=power;}
    if(mode===6)metrics['溶解阈值']=threshold;if(mode===7)metrics['反馈 age']=age.toFixed(2)+' s';
    return {metrics,note:note||'直接编译 GLSL ES 3.00；本页未使用 Three.js 渲染器。'};
  },dispose(){disposed=true;abort.abort();resize.disconnect();gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteVertexArray(vao);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();host.replaceChildren();}};
};
