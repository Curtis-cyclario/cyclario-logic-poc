
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Lattice3D, ThermalLattice3D } from '../types';

const SIZE_X = 9;
const SIZE_Y = 9;
const SIZE_Z = 6;
const TOTAL_INSTANCES = SIZE_X * SIZE_Y * SIZE_Z;
const CUBE_SIZE = 1;
const CUBE_GAP = 0.05;

const COLORS = [
    new THREE.Color(0x00ffff), // c1 = 0 (cyan)
    new THREE.Color(0xff00ff), // c1 = 1 (magenta)
];
const HOT_COLOR = new THREE.Color(0xffaa00);

const SCALES = {
    norm: [0.25, 0.9],
    high: [0.35, 1.1],
};

interface Lattice3DViewProps {
  lattice: Lattice3D;
  thermalLattice: ThermalLattice3D;
  highlightedSlice: number;
}

const Lattice3DView: React.FC<Lattice3DViewProps> = ({ lattice, thermalLattice, highlightedSlice }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const positionsRef = useRef<THREE.Vector3[]>([]);
  const dummyObject = useRef(new THREE.Object3D()).current;
  const colorHelper = useRef(new THREE.Color()).current;

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = null; 

    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 100);
    camera.position.set(18, 16, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.9 });
    const mesh = new THREE.InstancedMesh(geometry, material, TOTAL_INSTANCES);
    instancedMeshRef.current = mesh;

    const totalW = SIZE_X * (CUBE_SIZE + CUBE_GAP);
    const totalH = SIZE_Z * (CUBE_SIZE + CUBE_GAP);
    const totalD = SIZE_Y * (CUBE_SIZE + CUBE_GAP);
    
    positionsRef.current = new Array(TOTAL_INSTANCES);
    let i = 0;
    for (let z = 0; z < SIZE_Z; z++) {
      for (let x = 0; x < SIZE_X; x++) {
        for (let y = 0; y < SIZE_Y; y++) {
          const pos = new THREE.Vector3(
            (x * (CUBE_SIZE + CUBE_GAP)) - totalW / 2,
            (z * (CUBE_SIZE + CUBE_GAP)) - totalH / 2,
            (y * (CUBE_SIZE + CUBE_GAP)) - totalD / 2
          );
          positionsRef.current[i] = pos;
          dummyObject.position.copy(pos);
          dummyObject.updateMatrix();
          mesh.setMatrixAt(i++, dummyObject.matrix);
        }
      }
    }
    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      currentMount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useEffect(() => {
    if (!instancedMeshRef.current || positionsRef.current.length === 0) return;
    const mesh = instancedMeshRef.current;
    
    let i = 0;
    for (let z = 0; z < SIZE_Z; z++) {
      const isHigh = z === highlightedSlice;
      const scaleSet = isHigh ? SCALES.high : SCALES.norm;
      const layer = lattice[z];
      const thermalLayer = thermalLattice[z];
      
      for (let x = 0; x < SIZE_X; x++) {
        const row = layer[x];
        const thermalRow = thermalLayer[x];
        for (let y = 0; y < SIZE_Y; y++) {
          const state = row[y];
          const temp = thermalRow[y];
          
          colorHelper.copy(COLORS[state[1]]).lerp(HOT_COLOR, Math.min(1, temp / 1.5));
          mesh.setColorAt(i, colorHelper);
          
          const s = scaleSet[state[0]];
          dummyObject.position.copy(positionsRef.current[i]);
          dummyObject.scale.setScalar(s);
          dummyObject.updateMatrix();
          mesh.setMatrixAt(i++, dummyObject.matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [lattice, thermalLattice, highlightedSlice]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Lattice3DView;
