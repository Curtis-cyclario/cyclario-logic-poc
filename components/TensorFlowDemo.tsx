import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Card from './Card';
import { MetricSet } from '../types';

interface TensorFlowDemoProps {
    metrics: MetricSet;
}

const TensorFlowDemo: React.FC<TensorFlowDemoProps> = ({ metrics }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    // Fixed: Initialized useRef with null to prevent "Expected 1 arguments" error
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const targetsRef = useRef<THREE.Group | null>(null);
    
    const [selectedTarget, setSelectedTarget] = useState<THREE.Object3D | null>(null);
    const [isXray, setIsXray] = useState(true);
    const [isSurveyComplete, setIsSurveyComplete] = useState(false);
    
    const xrayMaterialRef = useRef(new THREE.MeshPhongMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.7 }));
    const solidMaterialRef = useRef(new THREE.MeshPhongMaterial({ color: 0x966c4a, shininess: 0 }));
    // Fixed: Initialized useRef with null to prevent "Expected 1 arguments" error
    const terrainRef = useRef<THREE.Mesh | null>(null);

    const updateTargetPredictions = useCallback((stability: number) => {
        if (!targetsRef.current) return;
        
        const normalizedStability = Math.min(1, stability / 100);

        targetsRef.current.children.forEach(target => {
            const groundTruthYield = (target.userData.baseYield || (Math.random() * 50 + 10));
            if (!target.userData.baseYield) target.userData.baseYield = groundTruthYield;

            const predictionErrorMargin = groundTruthYield * normalizedStability;
            const predictionNoise = (Math.random() - 0.5) * 2 * predictionErrorMargin;
            const predictedYield = Math.max(0, groundTruthYield + predictionNoise);

            target.userData.predictedYield = predictedYield.toFixed(2);
            target.userData.groundTruthYield = groundTruthYield.toFixed(2);
            
            // Reset visual state
            delete target.userData.errorColor;
            (target as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0xffff00, toneMapped: false });
        });
    }, []);

    const handleRecalibrate = useCallback(() => {
        setIsSurveyComplete(false);
        setSelectedTarget(null);
        updateTargetPredictions(metrics.deltaSymmetry);
    }, [metrics.deltaSymmetry, updateTargetPredictions]);

    useEffect(() => {
        if (!mountRef.current) return;
        const currentMount = mountRef.current;

        // --- Initialize Scene, Camera, Renderer, Controls (runs only once) ---
        sceneRef.current = new THREE.Scene();
        sceneRef.current.background = new THREE.Color(0x111827); // bg-gray-900

        cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        cameraRef.current.position.set(40, 50, 40);

        rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(rendererRef.current.domElement);

        controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
        controlsRef.current.enableDamping = true;
        controlsRef.current.minDistance = 20;
        controlsRef.current.maxDistance = 150;
        controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.1;

        // Lighting
        sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.8));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(50, 50, 20);
        sceneRef.current.add(directionalLight);

        // Terrain Generation
        const terrainSize = 100;
        const segments = 50;
        const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
        const vertices = geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const height = (Math.sin(x / 15) * Math.cos(y / 10)) * 6 + (Math.sin(y / 5) * Math.cos(x / 8)) * 4;
            vertices[i + 2] = height;
        }
        geometry.computeVertexNormals();
        
        terrainRef.current = new THREE.Mesh(geometry, xrayMaterialRef.current);
        terrainRef.current.rotation.x = -Math.PI / 2;
        sceneRef.current.add(terrainRef.current);

        // Target Generation
        targetsRef.current = new THREE.Group();
        const targetGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        for (let i = 0; i < 30; i++) {
            const material = new THREE.MeshBasicMaterial({ color: 0xffff00, toneMapped: false });
            const target = new THREE.Mesh(targetGeometry, material);
            const posX = (Math.random() - 0.5) * terrainSize * 0.8;
            const posZ = (Math.random() - 0.5) * terrainSize * 0.8;
            const terrainHeight = (Math.sin(posX / 15) * Math.cos(posZ / 10)) * 6 + (Math.sin(posZ / 5) * Math.cos(posX / 8)) * 4;
            const posY = terrainHeight - 2 - Math.random() * 8;
            target.position.set(posX, posY, posZ);
            target.userData = { id: `TGT-${(i + 1).toString().padStart(3, '0')}` };
            targetsRef.current.add(target);
        }
        sceneRef.current.add(targetsRef.current);


        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        let selected: THREE.Object3D | null = null;
        
        const onClick = (event: MouseEvent) => {
            const bounds = currentMount.getBoundingClientRect();
            mouse.x = ((event.clientX - bounds.left) / currentMount.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - bounds.top) / currentMount.clientHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, cameraRef.current!);
            const intersects = raycaster.intersectObjects(targetsRef.current!.children);

            if (selected) {
                const revertColor = selected.userData.errorColor || 0xffff00;
                (selected as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: revertColor, toneMapped: false });
            }

            if (intersects.length > 0) {
                selected = intersects[0].object;
                (selected as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: 0xff00ff, toneMapped: false });
                setSelectedTarget(selected);
            } else {
                setSelectedTarget(null);
                selected = null;
            }
        };
        currentMount.addEventListener('click', onClick);
        
        // --- Animation Loop ---
        let animationFrameId: number;
        const animate = () => {
            controlsRef.current!.update();
            rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        // --- Resize Handler ---
        const onResize = () => {
            if (!cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', onResize);

        // --- Cleanup ---
        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onResize);
            currentMount.removeEventListener('click', onClick);
            if (currentMount.contains(rendererRef.current!.domElement)) {
              currentMount.removeChild(rendererRef.current!.domElement);
            }
            sceneRef.current!.traverse(object => {
                if (object instanceof THREE.Mesh) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else if (object.material) {
                        object.material.dispose();
                    }
                }
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount

    // This effect handles updates when the core simulation's metrics change.
    // It recalibrates the predictions and resets the survey state to reflect the new data.
    useEffect(() => {
        if (targetsRef.current) {
            updateTargetPredictions(metrics.deltaSymmetry);
            // Resetting survey completion and selection ensures the UI state
            // is consistent when the underlying prediction data changes.
            setIsSurveyComplete(false);
            setSelectedTarget(null);
        }
    }, [metrics.deltaSymmetry, updateTargetPredictions]);

    // Effect to update terrain material on isXray change
    useEffect(() => {
        if (terrainRef.current) {
            terrainRef.current.material = isXray ? xrayMaterialRef.current : solidMaterialRef.current;
        }
    }, [isXray]);
    
    // Effect to update targets' colors when survey is completed
    useEffect(() => {
        if (!isSurveyComplete || !targetsRef.current) return;

        targetsRef.current.children.forEach(target => {
            if (selectedTarget && target.id === selectedTarget.id) return;
            const pred = parseFloat(target.userData.predictedYield);
            const actual = parseFloat(target.userData.groundTruthYield);
            const errorPercent = actual > 0 ? Math.abs(pred - actual) / actual : 0;
            
            let errorColor = 0xffff00; // Yellow (medium error)
            if (errorPercent < 0.05) errorColor = 0x00ff00; // Green (low error)
            else if (errorPercent > 0.15) errorColor = 0xff0000; // Red (high error)

            (target as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: errorColor, toneMapped: false });
            target.userData.errorColor = errorColor;
        });
    }, [isSurveyComplete, selectedTarget]);

    const surveyMetrics = useMemo(() => {
        if (!isSurveyComplete || !targetsRef.current || targetsRef.current.children.length === 0) {
            return { mae: 0, count: 0 };
        }
        let totalAbsoluteError = 0;
        targetsRef.current.children.forEach(target => {
            const pred = parseFloat(target.userData.predictedYield);
            const actual = parseFloat(target.userData.groundTruthYield);
            totalAbsoluteError += Math.abs(pred - actual);
        });
        return {
            mae: totalAbsoluteError / targetsRef.current.children.length,
            count: targetsRef.current.children.length
        };
    }, [isSurveyComplete]);

    const { stabilityValue, stabilityLabel, stabilityColor, stabilityColorBg, stabilityPercent } = useMemo(() => {
        const value = metrics.deltaSymmetry;
        let label = "Optimal";
        let color = "text-green-400";
        let colorBg = "bg-green-500";
        if (value > 50) {
            label = "Chaotic";
            color = "text-red-400";
            colorBg = "bg-red-500";
        } else if (value > 20) {
            label = "Stable";
            color = "text-yellow-400";
            colorBg = "bg-yellow-500";
        }
        const percent = Math.min(100, (value / 100) * 100);
        return { stabilityValue: value, stabilityLabel: label, stabilityColor: color, stabilityColorBg: colorBg, stabilityPercent: percent };
    }, [metrics.deltaSymmetry]);


    return (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-cyan-300 mb-2 flex-shrink-0">Application Layer: TensorFlow.js</h2>
            <p className="text-gray-400 mb-6 max-w-4xl flex-shrink-0">
                This is an interactive 3D prototype of the "The Magnum" prospecting tool. The photonic architecture's output is visualized by a TensorFlow.js model, highlighting high-potential targets within the geological landscape.
            </p>

            <div className="flex-grow flex gap-8 min-h-0">
                <div ref={mountRef} className="flex-grow h-full w-2/3 rounded-lg overflow-hidden border-2 border-cyan-500/20 shadow-lg shadow-cyan-500/20" />
                
                <div className="w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
                    <Card>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Core Engine Link</h3>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-300">System Stability ({stabilityLabel}):</span>
                            <span className={`font-mono font-bold text-lg ${stabilityColor}`}>{stabilityValue.toFixed(0)}</span>
                        </div>
                         <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                            <div className={`h-2.5 rounded-full ${stabilityColorBg}`} style={{ width: `${stabilityPercent}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                           Prediction accuracy is coupled to the core simulation's stability (Δ-Symmetry). A chaotic state leads to less reliable results.
                        </p>
                        <button onClick={handleRecalibrate} className="w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors bg-purple-600 hover:bg-purple-500 text-white">
                            Recalibrate Predictions
                        </button>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Controls</h3>
                        <div className="flex items-center justify-between">
                            <label htmlFor="xrayToggle" className="text-sm font-medium text-gray-300">X-Ray Vision</label>
                            <button onClick={() => setIsXray(p => !p)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${isXray ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isXray ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                         <p className="text-xs text-gray-400 mt-2">Toggle to view targets beneath the terrain surface.</p>
                    </Card>

                    <Card>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Accuracy Justification</h3>
                        <div className="flex items-center justify-between">
                            <label htmlFor="surveyToggle" className="text-sm font-medium text-gray-300">Reveal Ground Truth</label>
                            <button id="surveyToggle" onClick={() => setIsSurveyComplete(true)} disabled={isSurveyComplete} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${isSurveyComplete ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                                {isSurveyComplete ? 'Complete' : 'Run Survey'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {isSurveyComplete ? "Ground truth data revealed. Targets are color-coded by prediction accuracy." : "Simulate a geological survey to compare predictions against actual values."}
                        </p>
                    </Card>

                    {isSurveyComplete && (
                        <Card>
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Survey Results</h3>
                            <div className="font-mono">
                                <p className="text-cyan-400">Mean Absolute Error (MAE):</p>
                                <p className="text-lg font-bold text-yellow-300">{surveyMetrics.mae.toFixed(3)} g/t</p>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-4 pt-2 border-t border-cyan-500/20">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#00ff00'}}></div><span>&lt;5% Error</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#ffff00'}}></div><span>5-15%</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: '#ff0000'}}></div><span>&gt;15% Error</span></div>
                            </div>
                        </Card>
                    )}

                    <Card className="flex-grow">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Target Inspector</h3>
                        {selectedTarget ? (
                            <div className="space-y-3 text-sm font-mono">
                                <div>
                                    <p className="text-cyan-400">ID:</p>
                                    <p className="text-yellow-300">{selectedTarget.userData.id}</p>
                                </div>
                                <div>
                                    <p className="text-cyan-400">Predicted Yield (Au g/t):</p>
                                    <p className="text-lg font-bold text-yellow-300">{selectedTarget.userData.predictedYield}</p>
                                </div>
                                {isSurveyComplete && (
                                  <>
                                    <div>
                                        <p className="text-cyan-400">Actual Yield (Ground Truth):</p>
                                        <p className="text-lg font-bold text-green-400">{selectedTarget.userData.groundTruthYield}</p>
                                    </div>
                                     <div>
                                        <p className="text-cyan-400">Prediction Error:</p>
                                        {/* FIX: Corrected typo 'selectedTarg' and completed the truncated logic. This now calculates the prediction error and applies a color based on its magnitude. */}
                                        <p className={`text-base font-bold ${(() => {
                                            const pred = parseFloat(selectedTarget.userData.predictedYield);
                                            const actual = parseFloat(selectedTarget.userData.groundTruthYield);
                                            const errorPercent = actual > 0 ? Math.abs(pred - actual) / actual : 0;
                                            if (errorPercent < 0.05) return 'text-green-400';
                                            if (errorPercent > 0.15) return 'text-red-400';
                                            return 'text-yellow-400';
                                        })()}`}>
                                            {(Math.abs(parseFloat(selectedTarget.userData.predictedYield) - parseFloat(selectedTarget.userData.groundTruthYield))).toFixed(3)} g/t
                                        </p>
                                    </div>
                                  </>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Select a target on the map to inspect its predicted yield.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TensorFlowDemo;