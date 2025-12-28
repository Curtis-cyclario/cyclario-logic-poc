
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Card from './Card';
import { MetricSet, Lattice3D } from '../types';

interface RoverDemoProps {
    metrics: MetricSet;
    lattice: Lattice3D;
}

interface Geomass { id: number; mesh: THREE.Mesh; pos: THREE.Vector3; energy: number; }
interface Trailer { id: number; mesh: THREE.Mesh; pos: THREE.Vector3; type: 'CORE' | 'CHAINLINK'; }
interface Bomb { id: number; mesh: THREE.Mesh; pos: THREE.Vector3; vel: THREE.Vector3; }

const GEOMETRIES = [
    new THREE.TetrahedronGeometry(0.7),
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.OctahedronGeometry(0.7),
    new THREE.DodecahedronGeometry(0.7),
    new THREE.IcosahedronGeometry(0.7),
];

const playTone = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1, volume: number = 0.05) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
};

const createVaporwaveHorizon = (scene: THREE.Scene) => {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const segments = 60;
    const radius = 150;
    const heightScale = 12;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const y = (Math.sin(theta * 3) * 0.5 + 0.5) * heightScale + (Math.random() * 2);
        points.push(new THREE.Vector3(x, 0, z));
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    group.add(line);
    scene.add(group);
};

const createScaleReference = (scene: THREE.Scene) => {
    const human = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
    head.position.y = 1.65;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
    body.position.y = 0.8;
    human.add(head, body);
    human.position.set(15, 0, 10);
    scene.add(human);

    const scalePoints = [];
    for (let i = -40; i <= 40; i += 5) {
        scalePoints.push(new THREE.Vector3(i, 0, 38));
        scalePoints.push(new THREE.Vector3(i, 0.5, 38));
        scalePoints.push(new THREE.Vector3(i, 0, 38));
    }
    const scaleLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(scalePoints), new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.2 }));
    scene.add(scaleLine);
};

const RoverDemo: React.FC<RoverDemoProps> = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    
    const [health, setHealth] = useState(100);
    const [hunger, setHunger] = useState(100);
    const [geomassCount, setGeomassCount] = useState(0);
    const [deliveredCount, setDeliveredCount] = useState(0);
    const [decisionMode, setDecisionMode] = useState('IDLE');
    const [cameraMode, setCameraMode] = useState<'ORBIT' | 'THIRD_PERSON'>('ORBIT');
    const [speedKmh, setSpeedKmh] = useState(0);

    const state = useRef({
        roverPos: new THREE.Vector3(0, 0, 0),
        roverRot: 0,
        health: 100,
        hunger: 100,
        geomassCollected: 0,
        deliveredTrailers: 0,
        speedBoost: 1.0,
        geomassEntities: [] as Geomass[],
        trailers: [] as Trailer[],
        bombs: [] as Bomb[],
        lastTime: 0,
        targetGeomass: null as Geomass | null,
        isGameOver: false,
        homingBeaconPos: new THREE.Vector3(35, 0, 35),
        lastBombSpawn: 0,
        lastShootTime: 0
    });

    const roverGroupRef = useRef<THREE.Group | null>(null);
    const coreMeshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010204);
        scene.fog = new THREE.Fog(0x010204, 50, 200);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(55, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(35, 45, 35);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        createVaporwaveHorizon(scene);
        createScaleReference(scene);
        scene.add(new THREE.AmbientLight(0xffffff, 0.15));
        const grid = new THREE.GridHelper(100, 50, 0x1e293b, 0x05070a);
        grid.position.y = 0.01;
        scene.add(grid);

        const roverGroup = new THREE.Group();
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        chassis.position.y = 0.4;
        roverGroup.add(chassis);
        
        const turret = new THREE.Group();
        turret.position.y = 1.2;
        roverGroup.add(turret);
        
        const coreMesh = new THREE.Mesh(GEOMETRIES[0], new THREE.MeshStandardMaterial({ 
            color: 0x22d3ee, emissive: 0x22d3ee, emissiveIntensity: 1 
        }));
        turret.add(coreMesh);
        coreMeshRef.current = coreMesh;

        scene.add(roverGroup);
        roverGroupRef.current = roverGroup;

        const beaconGroup = new THREE.Group();
        const beaconCyl = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.2, 32), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.2 }));
        const beaconLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 150, 16), new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.2 }));
        beaconLight.position.y = 75;
        beaconGroup.add(beaconCyl, beaconLight);
        beaconGroup.position.copy(state.current.homingBeaconPos);
        scene.add(beaconGroup);

        const spawnGeomass = () => {
            const SPAWN_RANGE = 35; 
            const pos = new THREE.Vector3((Math.random() - 0.5) * 2 * SPAWN_RANGE, 0.5, (Math.random() - 0.5) * 2 * SPAWN_RANGE);
            const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x22d3ee }));
            mesh.position.copy(pos);
            scene.add(mesh);
            state.current.geomassEntities.push({ id: Math.random(), mesh, pos, energy: 30 });
        };
        for (let i = 0; i < 15; i++) spawnGeomass();

        let frameId: number;
        let lastMoveSoundTime = 0;

        const animate = (time: number) => {
            frameId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, (time - state.current.lastTime) / 1000);
            state.current.lastTime = time;
            if (dt === 0 || state.current.isGameOver) return;

            state.current.hunger -= dt * 1.8;
            if (state.current.hunger <= 0) state.current.health -= dt * 10;
            if (state.current.health <= 0) { state.current.isGameOver = true; setHealth(0); }

            let moveSpeed = 10 * state.current.speedBoost;
            const roverForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.current.roverRot);
            
            if (time - lastMoveSoundTime > 350) {
                playTone(100 + Math.random() * 30, 'sine', 0.2, 0.015);
                lastMoveSoundTime = time;
            }

            // Bomb Spawning: Balanced density
            if (time - state.current.lastBombSpawn > 3500 && state.current.bombs.length < 5) {
                const bombPos = new THREE.Vector3(
                    state.current.roverPos.x + (Math.random() - 0.5) * 35,
                    45,
                    state.current.roverPos.z + (Math.random() - 0.5) * 35
                );
                const bombMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7), new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff0000 }));
                bombMesh.position.copy(bombPos);
                scene.add(bombMesh);
                state.current.bombs.push({ id: Date.now(), mesh: bombMesh, pos: bombPos, vel: new THREE.Vector3(0, -9.5, 0) });
                state.current.lastBombSpawn = time;
            }

            state.current.bombs.forEach((bomb, idx) => {
                bomb.pos.add(bomb.vel.clone().multiplyScalar(dt));
                bomb.mesh.position.copy(bomb.pos);
                bomb.mesh.rotation.x += dt * 3;

                // Defensive Automated Countermeasures: Shooting bombs
                const distToRover = bomb.pos.distanceTo(state.current.roverPos);
                if (distToRover < 10 && bomb.pos.y < 12 && time - state.current.lastShootTime > 600) {
                    const laserLine = new THREE.Line(
                        new THREE.BufferGeometry().setFromPoints([state.current.roverPos.clone().add(new THREE.Vector3(0,1.2,0)), bomb.pos]),
                        new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 1 })
                    );
                    scene.add(laserLine);
                    setTimeout(() => scene.remove(laserLine), 80);
                    
                    playTone(1500, 'square', 0.08, 0.02);
                    scene.remove(bomb.mesh);
                    state.current.bombs.splice(idx, 1);
                    state.current.lastShootTime = time;
                } else if (bomb.pos.y < 0.2) {
                    scene.remove(bomb.mesh);
                    state.current.bombs.splice(idx, 1);
                    playTone(60, 'sine', 0.3, 0.05);
                } else if (distToRover < 2.2) {
                    state.current.health -= 20;
                    scene.remove(bomb.mesh);
                    state.current.bombs.splice(idx, 1);
                    playTone(40, 'square', 0.4, 0.1);
                }
            });

            if (!state.current.targetGeomass && state.current.geomassEntities.length > 0) {
                let nearest = null;
                let minDist = Infinity;
                state.current.geomassEntities.forEach(g => {
                    const d = state.current.roverPos.distanceTo(g.pos);
                    if (d < minDist) { minDist = d; nearest = g; }
                });
                state.current.targetGeomass = nearest;
            }

            let target = state.current.targetGeomass?.pos || new THREE.Vector3(0, 0, 0);
            const shouldHome = state.current.trailers.length >= 8 || state.current.hunger < 25;
            if (shouldHome) target = state.current.homingBeaconPos;

            const toTarget = target.clone().sub(state.current.roverPos).normalize();
            const steerAngle = roverForward.angleTo(toTarget) * (new THREE.Vector3().crossVectors(roverForward, toTarget).y > 0 ? 1 : -1);
            state.current.roverRot += steerAngle * 6.5 * dt;
            state.current.roverPos.add(roverForward.clone().multiplyScalar(moveSpeed * dt));

            if (roverGroupRef.current) {
                roverGroupRef.current.position.copy(state.current.roverPos);
                roverGroupRef.current.rotation.y = state.current.roverRot;
            }

            const distToBeacon = state.current.roverPos.distanceTo(state.current.homingBeaconPos);
            if (distToBeacon < 5.5 && state.current.trailers.length > 0) {
                playTone(400, 'sine', 0.1, 0.1);
                setTimeout(() => playTone(800, 'sine', 0.2, 0.1), 150);
                state.current.deliveredTrailers += state.current.trailers.length;
                setDeliveredCount(state.current.deliveredTrailers);
                state.current.trailers.forEach(t => scene.remove(t.mesh));
                state.current.trailers = [];
                state.current.hunger = Math.min(100, state.current.hunger + 15);
                setDecisionMode('MISSION DEPOSITED');
            }

            state.current.geomassEntities.forEach((g, idx) => {
                if (state.current.roverPos.distanceTo(g.pos) < 2.5) {
                    state.current.geomassCollected++;
                    state.current.hunger = Math.min(100, state.current.hunger + 30);
                    scene.remove(g.mesh);
                    state.current.geomassEntities.splice(idx, 1);
                    setGeomassCount(state.current.geomassCollected);
                    state.current.targetGeomass = null;
                    spawnGeomass();
                    playTone(900 + Math.random() * 500, 'square', 0.08, 0.04);

                    if (state.current.geomassCollected % 5 === 0) {
                        const trailerMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8), new THREE.MeshStandardMaterial({ 
                            color: 0xec4899, emissive: 0xec4899, emissiveIntensity: 0.8 
                        }));
                        scene.add(trailerMesh);
                        state.current.trailers.push({ id: Date.now(), mesh: trailerMesh, pos: state.current.roverPos.clone(), type: 'CHAINLINK' });
                        playTone(300, 'sawtooth', 0.12, 0.06);
                    }
                }
            });

            let prevPos = state.current.roverPos;
            state.current.trailers.forEach((t) => {
                const targetFollow = prevPos.clone().sub(roverForward.clone().multiplyScalar(3));
                t.mesh.position.lerp(targetFollow, 0.12);
                prevPos = t.mesh.position;
            });

            if (cameraMode === 'THIRD_PERSON' && cameraRef.current) {
                controlsRef.current!.enabled = false;
                const camOffset = new THREE.Vector3(0, 6, -18).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.current.roverRot);
                cameraRef.current.position.lerp(state.current.roverPos.clone().add(camOffset), 0.12);
                cameraRef.current.lookAt(state.current.roverPos.clone().add(new THREE.Vector3(0, 2, 0)));
            } else {
                controlsRef.current!.enabled = true;
                controlsRef.current!.update();
            }

            setSpeedKmh(moveSpeed * 3.6);
            if (coreMeshRef.current) coreMeshRef.current.rotation.y += 0.06;
            renderer.render(scene, camera);
        };
        frameId = requestAnimationFrame(animate);
        return () => { cancelAnimationFrame(frameId); currentMount.removeChild(renderer.domElement); };
    }, [cameraMode]);

    return (
        <div className="h-full flex flex-col p-8 relative overflow-hidden bg-black">
            <div className="flex justify-between items-start z-10 pointer-events-none">
                <div className="space-y-4">
                    <h2 className="text-4xl font-black text-white font-orbitron tracking-tighter italic uppercase">ROVER_<span className="text-cyan-400">EVO</span></h2>
                    <div className="flex flex-col gap-1 w-72">
                        <div className="flex justify-between text-[10px] font-mono text-cyan-500 font-black uppercase tracking-widest">
                            <span>Integrity</span>
                            <span>{health.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-950 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" style={{ width: `${health}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 pointer-events-auto">
                    <button onClick={() => setCameraMode(p => p === 'ORBIT' ? 'THIRD_PERSON' : 'ORBIT')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em] shadow-xl backdrop-blur-md">View: {cameraMode === 'ORBIT' ? 'Strategic' : 'Follow'}</button>
                    <div className="px-6 py-2 bg-black/80 rounded-full text-[10px] font-mono font-bold text-gray-400 border border-white/5 uppercase flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${decisionMode.includes('DEPOSITION') ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        Status: {decisionMode}
                    </div>
                </div>

                <div className="text-right">
                    <Card className="p-6 bg-black/80 border-cyan-500/30 w-52 text-center rounded-[2.5rem] shadow-2xl">
                        <p className="text-[11px] text-gray-500 uppercase font-black mb-1 italic tracking-widest">Geomass Collected</p>
                        <p className="text-4xl font-orbitron text-cyan-400 font-black tracking-tighter">{geomassCount.toString().padStart(3, '0')}</p>
                        <p className="text-[9px] text-gray-700 font-mono mt-2 uppercase">SPEED: {speedKmh.toFixed(1)} KM/H</p>
                    </Card>
                </div>
            </div>

            <div className="flex-grow relative mt-4 rounded-[5rem] border-2 border-white/5 bg-black overflow-hidden shadow-[inset_0_0_200px_black] group">
                <div ref={mountRef} className="w-full h-full" />
                <div className="absolute top-12 left-12 flex flex-col gap-4 pointer-events-auto">
                    <div className="p-6 bg-cyan-950/40 border border-cyan-500/20 rounded-3xl backdrop-blur-xl shadow-2xl min-w-[200px]">
                        <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Trailers Delivered</p>
                        <p className="text-3xl font-black font-orbitron text-white leading-none">{deliveredCount.toString().padStart(3, '0')}</p>
                        <div className="mt-3 flex items-center gap-2">
                             <div className="h-1 flex-grow bg-gray-900 rounded-full overflow-hidden">
                                 <div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, deliveredCount * 4)}%` }} />
                             </div>
                             <span className="text-[8px] font-mono text-cyan-600">Goal: 25</span>
                        </div>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md pointer-events-none">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center animate-spin-slow">
                                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Photonic Probe</p>
                                <p className="text-xs font-black font-orbitron text-white italic">Systems nominal? Confirmed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoverDemo;
