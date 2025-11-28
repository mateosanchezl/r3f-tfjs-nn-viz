import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSnapshot, getAnimationState } from '../../store/networkStore';
import { LAYER_POSITIONS, COLORS } from '../../types';

interface HiddenLayerProps {
  layerIndex: number; // 0 for first hidden, 1 for second
  neuronCount: number;
  position: number; // Z position
}

const NEURON_RADIUS = 0.08;
const LAYER_WIDTH = 3.5;
const LAYER_HEIGHT = 3.5;

export function HiddenLayer({ layerIndex, neuronCount, position }: HiddenLayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Compute neuron positions in a grid layout
  const neuronPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const cols = Math.ceil(Math.sqrt(neuronCount));
    const rows = Math.ceil(neuronCount / cols);
    
    const spacingX = LAYER_WIDTH / cols;
    const spacingY = LAYER_HEIGHT / rows;
    
    for (let i = 0; i < neuronCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      positions.push([
        col * spacingX - LAYER_WIDTH / 2 + spacingX / 2,
        row * spacingY - LAYER_HEIGHT / 2 + spacingY / 2,
        position,
      ]);
    }
    
    return positions;
  }, [neuronCount, position]);

  const geometry = useMemo(
    () => new THREE.SphereGeometry(NEURON_RADIUS, 16, 12),
    []
  );
  
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.neuronBase,
        emissive: COLORS.neuronBase,
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.3,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  useFrame(() => {
    if (!meshRef.current) return;
    
    const snapshot = getSnapshot();
    const animState = getAnimationState();
    
    // Determine if this layer should be active based on animation progress
    const layerStart = (layerIndex + 1) * 0.25; // 0.25 for layer 0, 0.5 for layer 1
    const layerEnd = layerStart + 0.25;
    const isActive = 
      animState.phase === 'forward' && 
      animState.layerProgress >= layerStart && 
      animState.layerProgress < layerEnd;
    
    const activePulse = isActive ? 0.5 + 0.5 * Math.sin(animState.pulseTime * 15) : 0;
    
    // Get activations for this layer
    const activations = snapshot?.activations?.[layerIndex];
    
    for (let i = 0; i < neuronCount; i++) {
      const [x, y, z] = neuronPositions[i];
      
      // Get activation value (0-1 range after ReLU)
      const activation = activations ? Math.min(1, activations[i] / 2) : 0.1;
      
      // Scale neuron based on activation
      const scale = 0.8 + activation * 0.8;
      
      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      
      // Color based on activation level
      const baseColor = new THREE.Color(COLORS.neuronBase);
      const activeColor = new THREE.Color(COLORS.neuronActive);
      
      tempColor.lerpColors(baseColor, activeColor, activation + activePulse * 0.3);
      meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, neuronCount]}
      frustumCulled={false}
    />
  );
}

// Wrapper for both hidden layers
export function HiddenLayers() {
  return (
    <>
      <HiddenLayer 
        layerIndex={0} 
        neuronCount={128} 
        position={LAYER_POSITIONS.hidden1} 
      />
      <HiddenLayer 
        layerIndex={1} 
        neuronCount={64} 
        position={LAYER_POSITIONS.hidden2} 
      />
    </>
  );
}

