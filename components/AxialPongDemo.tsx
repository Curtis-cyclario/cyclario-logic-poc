
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Card from './Card';
import { MetricSet, Lattice3D } from '../types';

interface Ball { mesh: THREE.Mesh; vel: THREE.Vector2; pos: THREE.Vector2; isSupersonic: boolean; chargeTime: number; speedMultiplier: number; lastHitter: 'ALPHA' | 'OMEGA' | null; }
interface AxialPongDemoProps { metrics: MetricSet; lattice: Lattice3D; }

enum GameStage { DOSSIER_1, READY, PLAYING, RELINKING }

const createVaporwaveHorizon = (scene: THREE.Scene) => {
    const group = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const segments = 50;
    const radius = 150;
    const heightScale = 12;
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        const y = (Math.sin(theta * 4) * 0.3 + 0.7) * heightScale;
        points.push(new THREE.Vector3(x, -2, z));
        points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    group.add(line);
    scene.add(group);
};

const playTone = (freq: number, type: OscillatorType = 'square', duration: number = 0.1, volume: number = 0.1) => {
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

const AxialPongDemo: React.FC<AxialPongDemoProps> = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    const [stage, setStage] = useState<GameStage>(GameStage.DOSSIER_1);
    const [timeScale, setTimeScale] = useState(1.0);
    const [uiScore, setUiScore] = useState({ alpha: 0, omega: 0 });
    const [ballSpeedKmh, setBallSpeedKmh] = useState(0);
    const [isTrident, setIsTrident] = useState(true);

    const alphaPaddles = useRef<THREE.Mesh[]>([]);
    const omegaPaddles = useRef<THREE.Mesh[]>([]);
    const ballsRef = useRef<Ball[]>([]);
    const gameState = useRef({ lastTime: 0, running: false });

    const FIELD_WIDTH = 52, FIELD_HEIGHT = 20, PADDLE_H = 3, SUPERSONIC_THRESHOLD = 55;

    const resetBallPhysics = (ball: Ball, side: 'LEFT' | 'RIGHT') => {
        ball.pos.set(0, 0);
        ball.vel.set(side === 'LEFT' ? -0.2 : 0.2, (Math.random() - 0.5) * 0.15);
        ball.speedMultiplier = 1;
        ball.isSupersonic = false;
        ball.chargeTime = 0;
        ball.lastHitter = null;
    };

    const setupPaddles = (scene: THREE.Scene) => {
        alphaPaddles.current.forEach(p => scene.remove(p));
        omegaPaddles.current.forEach(p => scene.remove(p));
        
        const createPaddle = (x: number, col: number, emissive: number) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, PADDLE_H), new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: emissive }));
            m.position.set(x, 0, 0); 
            scene.add(m); 
            return m;
        };

        if (isTrident) {
            alphaPaddles.current = [createPaddle(-20, 0x22d3ee, 0.9), createPaddle(-22.5, 0x22d3ee, 0.6), createPaddle(-25, 0x22d3ee, 0.3)];
            omegaPaddles.current = [createPaddle(20, 0xec4899, 0.9), createPaddle(22.5, 0xec4899, 0.6), createPaddle(25, 0xec4899, 0.3)];
        } else {
            alphaPaddles.current = [createPaddle(-21, 0x22d3ee, 0.9), createPaddle(-24, 0x22d3ee, 0.4)];
            omegaPaddles.current = [createPaddle(21, 0xec4899, 0.9), createPaddle(24, 0xec4899, 0.4)];
        }
    };

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010204);
        sceneRef.current = scene;

        // Camera pulled back further to resolve 'view winder' visibility bug
        const camera = new THREE.PerspectiveCamera(40, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        camera.position.set(0, 50, 65);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        createVaporwaveHorizon(scene);
        scene.add(new THREE.AmbientLight(0xffffff, 0.3));
        scene.add(new THREE.GridHelper(100, 50, 0x111111, 0x1e293b));

        const createGoalZone = (x: number, col: number) => {
            const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.2 });
            const zone = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, FIELD_HEIGHT), mat);
            zone.position.set(x, -0.4, 0);
            scene.add(zone);
        };
        createGoalZone(-FIELD_WIDTH / 2, 0x22d3ee); 
        createGoalZone(FIELD_WIDTH / 2, 0xec4899);

        setupPaddles(scene);

        const createBall = (x: number, z: number, vx: number) => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x22d3ee }));
            scene.add(mesh);
            return { mesh, pos: new THREE.Vector2(x, z), vel: new THREE.Vector2(vx, 0), isSupersonic: false, chargeTime: 0, speedMultiplier: 1.0, lastHitter: null };
        };
        ballsRef.current = [createBall(-4, -6, 0.2), createBall(4, 6, -0.2), createBall(0, 0, 0.22)];

        let frameId: number;
        const animate = (time: number) => {
            frameId = requestAnimationFrame(animate);
            const dt = Math.min(0.05, (time - gameState.current.lastTime) / 1000) * timeScale;
            gameState.current.lastTime = time;
            if (dt === 0 || !gameState.current.running) { renderer.render(scene, camera); return; }

            let currentMaxSpeed = 0;
            ballsRef.current.forEach(ball => {
                if (ball.chargeTime > 0) {
                    ball.chargeTime -= dt;
                    if (ball.chargeTime <= 0) { ball.speedMultiplier *= 1.4; playTone(1000, 'sine', 0.1, 0.1); }
                } else {
                    ball.pos.x += ball.vel.x * ball.speedMultiplier;
                    ball.pos.y += ball.vel.y * ball.speedMultiplier;
                }

                const speed = Math.sqrt(ball.vel.x**2 + ball.vel.y**2) * ball.speedMultiplier * 60;
                if (speed > currentMaxSpeed) currentMaxSpeed = speed;
                if (speed > SUPERSONIC_THRESHOLD && !ball.isSupersonic) { 
                    ball.isSupersonic = true; 
                    ball.chargeTime = 0.5; 
                    playTone(300, 'sawtooth', 0.5, 0.05); 
                }

                if (Math.abs(ball.pos.y) > FIELD_HEIGHT/2 - 0.5) { 
                    ball.vel.y *= -1; 
                    ball.pos.y = Math.sign(ball.pos.y) * (FIELD_HEIGHT/2 - 0.55); 
                    playTone(400, 'sine', 0.05, 0.02);
                }

                const checkCollision = (pads: THREE.Mesh[], team: 'ALPHA' | 'OMEGA') => {
                    for (let p of pads) {
                        if (Math.abs(ball.pos.x - p.position.x) < 0.9 && Math.abs(ball.pos.y - p.position.z) < PADDLE_H/2 + 0.9) {
                            ball.vel.x *= -1.05; 
                            ball.speedMultiplier *= 1.02; 
                            ball.lastHitter = team;
                            ball.vel.y += (ball.pos.y - p.position.z) * 0.3;
                            playTone(team === 'ALPHA' ? 800 : 400, 'square', 0.1, 0.05);
                            return true;
                        }
                    }
                    return false;
                };
                if (ball.vel.x < 0) checkCollision(alphaPaddles.current, 'ALPHA'); else checkCollision(omegaPaddles.current, 'OMEGA');

                if (Math.abs(ball.pos.x) > FIELD_WIDTH/2) {
                    const side = ball.pos.x > 0 ? 'ALPHA' : 'OMEGA';
                    if (side === 'ALPHA') setUiScore(s => ({...s, alpha: s.alpha+1})); else setUiScore(s => ({...s, omega: s.omega+1}));
                    resetBallPhysics(ball, side === 'ALPHA' ? 'LEFT' : 'RIGHT');
                    playTone(150, 'sine', 0.4, 0.1);
                }
                ball.mesh.position.set(ball.pos.x, 0.2, ball.pos.y);
            });

            setBallSpeedKmh(currentMaxSpeed * 3.6); 
            
            const teamAI = (pads: THREE.Mesh[], isAlpha: boolean) => {
                const incoming = ballsRef.current.filter(b => isAlpha ? b.vel.x < 0 : b.vel.x > 0);
                pads.forEach((p, idx) => {
                    const target = incoming[idx % incoming.length] || ballsRef.current[0];
                    const targetZ = target ? target.pos.y * (1 - idx * 0.1) : 0;
                    p.position.z += (targetZ - p.position.z) * (0.12 + idx * 0.04) * timeScale;
                    p.position.z = THREE.MathUtils.clamp(p.position.z, -FIELD_HEIGHT/2 + PADDLE_H/2, FIELD_HEIGHT/2 - PADDLE_H/2);
                });
            };
            teamAI(alphaPaddles.current, true); teamAI(omegaPaddles.current, false);

            controls.update(); renderer.render(scene, camera);
        };
        frameId = requestAnimationFrame(animate);

        const handleResize = () => {
            camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            currentMount.removeChild(renderer.domElement);
        };
    }, [timeScale, isTrident]);

    const handleRelink = () => {
        setStage(GameStage.RELINKING); gameState.current.running = false;
        setTimeout(() => {
            setUiScore({ alpha: 0, omega: 0 });
            ballsRef.current.forEach((b, i) => resetBallPhysics(b, i % 2 === 0 ? 'LEFT' : 'RIGHT'));
            setStage(GameStage.READY);
        }, 1200);
    };

    return (
        <div className="p-8 h-full flex flex-col gap-4 bg-black relative overflow-hidden">
            {(stage !== GameStage.PLAYING && stage !== GameStage.RELINKING) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
                    <Card className="max-w-xl w-full p-12 text-center border-white/5 bg-gray-950/80 shadow-[0_0_120px_rgba(34,211,238,0.1)]">
                        <h1 className="text-4xl font-black text-white font-orbitron mb-8 italic uppercase leading-none">HYPER_<span className="text-cyan-400">QONG</span></h1>
                        {stage === GameStage.READY ? (
                            <button onClick={() => { gameState.current.running = true; setStage(GameStage.PLAYING); }} className="w-full py-8 bg-cyan-600 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-cyan-500 shadow-xl">Launch Sync</button>
                        ) : (
                            <button onClick={() => setStage(GameStage.READY)} className="w-full py-5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 font-black rounded-xl hover:bg-cyan-900 transition-all uppercase tracking-[0.3em]">Verify Trident Array</button>
                        )}
                    </Card>
                </div>
            )}
            <div className="flex justify-between items-start z-10 pointer-events-none px-6">
                <div className="space-y-2">
                    <h2 className="text-3xl font-orbitron font-black text-cyan-400 italic tracking-tighter">ALPHA_TEAM</h2>
                    <div className="text-7xl font-orbitron font-black text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{uiScore.alpha.toString().padStart(2, '0')}</div>
                </div>
                <div className="px-12 py-5 bg-black/80 border border-white/10 rounded-[2rem] text-center backdrop-blur-xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1 italic tracking-[0.5em]">Kinetic Flux</p>
                    <p className="text-5xl font-orbitron text-yellow-500 font-black tabular-nums">{ballSpeedKmh.toFixed(1)} <span className="text-xs opacity-30">KM/H</span></p>
                    <button 
                        onClick={() => setIsTrident(!isTrident)}
                        className="pointer-events-auto mt-3 px-6 py-2 bg-cyan-950/40 hover:bg-cyan-500 border border-cyan-500/20 rounded-full text-[10px] text-white font-black uppercase tracking-widest transition-all"
                    >
                        Mode: {isTrident ? 'Trident' : 'Deuces'}
                    </button>
                </div>
                <div className="space-y-2 text-right">
                    <h2 className="text-3xl font-orbitron font-black text-pink-500 italic tracking-tighter">OMEGA_TEAM</h2>
                    <div className="text-7xl font-orbitron font-black text-white drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">{uiScore.omega.toString().padStart(2, '0')}</div>
                </div>
            </div>
            <div className="flex-grow relative mt-4 rounded-[5rem] border-2 border-white/5 bg-black overflow-hidden group shadow-[inset_0_0_150px_black]">
                <div ref={mountRef} className="w-full h-full" />
                <div className="absolute top-12 left-12 px-6 py-2 bg-black/40 border border-cyan-500/20 rounded-full backdrop-blur-md transition-opacity">
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.4em]">
                        {isTrident ? 'STAGGERED_DEFENSE_MODE: ENABLED' : 'DUAL_PARITY_ARRAY: ACTIVE'}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center px-6 mb-4">
                <button onClick={() => setStage(GameStage.DOSSIER_1)} className="py-4 bg-red-900/10 text-red-600 border border-red-900/30 font-black rounded-3xl uppercase text-[10px] tracking-[0.4em]">Abort</button>
                <div className="flex items-center gap-6 bg-gray-900/40 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Warp_Speed</div>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={timeScale} onChange={e => setTimeScale(Number(e.target.value))} className="flex-grow custom-range" />
                    <div className="text-2xl font-orbitron text-white font-black">{timeScale.toFixed(1)}x</div>
                </div>
                <button onClick={handleRelink} className="py-5 bg-cyan-950/20 rounded-3xl border border-cyan-500/20 text-cyan-500 font-black uppercase text-[11px] tracking-[0.5em]">Re-Link_Array</button>
            </div>
        </div>
    );
};

export default AxialPongDemo;
