import * as THREE from 'three';

export type CameraView = 'diagonal' | 'front' | 'side';

export function createCubeView(host: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', '绕 Y 轴旋转的立方体与 XYZ 坐标轴');
  const context = canvas.getContext('webgl2', { antialias: true });
  if (!context) throw new Error('此浏览器未能创建 WebGL2 上下文。');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x172532);
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
  const material = new THREE.MeshPhongMaterial({ color: 0x67d0bb, shininess: 45 });
  const cube = new THREE.Mesh(geometry, material);
  const edgeGeometry = new THREE.EdgesGeometry(geometry);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xb9f9e8 });
  cube.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
  scene.add(cube);
  scene.add(new THREE.HemisphereLight(0xd6edff, 0x42515a, 1.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 5, 4);
  scene.add(light);
  const axes = new THREE.AxesHelper(2.4);
  scene.add(axes);
  const grid = new THREE.GridHelper(10, 20, 0x536773, 0x293e4b);
  grid.position.y = -0.72;
  scene.add(grid);
  let disposed = false;

  function setCamera(view: CameraView): void {
    if (view === 'front') camera.position.set(0, 0, 6);
    else if (view === 'side') camera.position.set(6, 0, 0);
    else camera.position.set(4, 3, 5);
    camera.lookAt(0, 0, 0);
  }

  function resize(): void {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    camera.updateProjectionMatrix();
  }

  function render(angleRadians: number): void {
    if (disposed) return;
    cube.rotation.y = angleRadians;
    renderer.render(scene, camera);
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    // 只释放当前实验拥有的资源；本实验没有跨实验共享资源。
    geometry.dispose(); material.dispose();
    edgeGeometry.dispose(); edgeMaterial.dispose();
    axes.dispose();
    grid.dispose();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  setCamera('diagonal');
  resize();
  return { canvas, setCamera, resize, render, dispose };
}
