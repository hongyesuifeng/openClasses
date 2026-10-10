import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const COLORS = { point: 0x79c9ff, destination: 0xffc56b, direction: 0xad9aff, cross: 0x77e0ba };
export interface WorldLabel { text: string; position: THREE.Vector3; color: string }

function releaseObjects(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse(object => {
    const item = object as THREE.Mesh;
    if (item.geometry) geometries.add(item.geometry);
    if (item.material) for (const material of Array.isArray(item.material) ? item.material : [item.material]) materials.add(material);
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export function pointMarker(position: THREE.Vector3, color: number): THREE.Object3D {
  const object = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color }));
  object.position.copy(position);
  return object;
}

export function arrow(origin: THREE.Vector3, displacement: THREE.Vector3, color: number): THREE.Object3D {
  const length = displacement.length();
  return length > 1e-10
    ? new THREE.ArrowHelper(displacement.clone().divideScalar(length), origin, length, color, Math.min(0.3, length * 0.25), Math.min(0.16, length * 0.15))
    : new THREE.Group();
}

export function createSpaceView(host: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', '世界坐标中的点、向量与坐标轴；拖动改变观察视角');
  const context = canvas.getContext('webgl2', { antialias: true });
  if (!context) throw new Error('此浏览器未能创建 WebGL2 上下文。');
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setClearColor(0x172532);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.append(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.minDistance = 0.5;
  controls.maxDistance = 300;
  const grid = new THREE.GridHelper(24, 24, 0x536773, 0x293e4b);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid, new THREE.AxesHelper(3));
  const content = new THREE.Group();
  scene.add(content);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'world-labels';
  host.append(labelLayer);
  let labels: WorldLabel[] = [];
  let disposed = false;

  function render(): void {
    if (disposed) return;
    renderer.render(scene, camera);
    const { width, height } = host.getBoundingClientRect();
    labels.forEach((label, index) => {
      const projected = label.position.clone().project(camera);
      const element = labelLayer.children[index] as HTMLElement;
      element.hidden = projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1;
      element.style.left = `${(projected.x + 1) * width / 2}px`;
      element.style.top = `${(1 - projected.y) * height / 2}px`;
    });
  }

  function resize(): void {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(Math.max(1, width), Math.max(1, height), false);
    camera.aspect = Math.max(1, width) / Math.max(1, height);
    camera.updateProjectionMatrix();
    render();
  }

  function resetCamera(front = false): void {
    camera.position.set(front ? 2 : 11, front ? 2 : 9, front ? 18 : 15);
    controls.target.set(2, 2, 0);
    controls.update(); render();
  }

  function setObjects(objects: THREE.Object3D[], nextLabels: WorldLabel[]): void {
    if (disposed) return;
    releaseObjects(content); content.clear(); content.add(...objects);
    labels = nextLabels;
    labelLayer.replaceChildren(...labels.map(label => {
      const element = document.createElement('span');
      element.textContent = label.text; element.style.color = label.color;
      return element;
    }));
    render();
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    controls.removeEventListener('change', render); controls.dispose();
    releaseObjects(scene); scene.clear();
    renderer.dispose(); renderer.forceContextLoss();
    canvas.remove(); labelLayer.remove();
  }

  controls.addEventListener('change', render);
  resetCamera(); resize();
  return { canvas, resize, setObjects, resetCamera, dispose };
}
