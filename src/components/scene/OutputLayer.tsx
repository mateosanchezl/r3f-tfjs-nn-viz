import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { getSnapshot, getAnimationState } from '../../store/networkStore';
import { LAYER_POSITIONS, COLORS } from '../../types';

const OUTPUT_COUNT = 10;
const NODE_RADIUS = 0.15;
const NODE_SPACING = 0.45;
const BAR_WIDTH = 0.12;
const BAR_MAX_HEIGHT = 1.5;

export function OutputLayer() {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const barsRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  // Compute node positions
  const nodePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const totalHeight = (OUTPUT_COUNT - 1) * NODE_SPACING;
    
    for (let i = 0; i < OUTPUT_COUNT; i++) {
      positions.push([
        0,
        i * NODE_SPACING - totalHeight / 2,
        LAYER_POSITIONS.output,
      ]);
    }
    return positions;
  }, []);

  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(NODE_RADIUS, 24, 16), []);
  const barGeometry = useMemo(() => new THREE.BoxGeometry(BAR_WIDTH, BAR_WIDTH, 1), []);
  
  const nodeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        emissive: '#ffffff',
        emissiveIntensity: 0.3,
        metalness: 0.4,
        roughness: 0.3,
      }),
    []
  );
  
  const barMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.neuronActive,
        emissive: COLORS.neuronActive,
        emissiveIntensity: 0.5,
        metalness: 0.6,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8,
      }),
    []
  );

  useFrame(() => {
    if (!nodesRef.current || !barsRef.current) return;
    
    const snapshot = getSnapshot();
    const animState = getAnimationState();
    
    // Check if output layer is active in animation
    const isActive = animState.phase === 'forward' && animState.layerProgress >= 0.75;
    const isError = animState.phase === 'backward';
    
    const probabilities = snapshot?.probabilities ?? new Float32Array(10).fill(0.1);
    const prediction = snapshot?.prediction ?? -1;
    const label = snapshot?.label ?? -1;
    const isCorrect = snapshot?.isCorrect ?? true;
    
    for (let i = 0; i < OUTPUT_COUNT; i++) {
      const [x, y, z] = nodePositions[i];
      const prob = probabilities[i] || 0;
      
      // Update node
      const nodeScale = 0.8 + prob * 0.6;
      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(nodeScale);
      tempObject.updateMatrix();
      nodesRef.current.setMatrixAt(i, tempObject.matrix);
      
      // Node color
      let nodeColor: THREE.Color;
      if (i === prediction && !isCorrect && isError) {
        // Wrong prediction - red
        nodeColor = new THREE.Color(COLORS.incorrect);
      } else if (i === label) {
        // Correct label - green
        nodeColor = new THREE.Color(COLORS.correct);
      } else if (i === prediction) {
        // Prediction matches label - bright
        nodeColor = new THREE.Color(COLORS.neuronActive);
      } else {
        nodeColor = new THREE.Color('#666688');
      }
      
      // Pulse effect
      if (isActive && i === prediction) {
        const pulse = 0.5 + 0.5 * Math.sin(animState.pulseTime * 12);
        nodeColor.lerp(new THREE.Color('#ffffff'), pulse * 0.5);
      }
      
      nodesRef.current.setColorAt(i, nodeColor);
      
      // Update probability bar
      const barHeight = Math.max(0.05, prob * BAR_MAX_HEIGHT);
      tempObject.position.set(x + 0.4, y, z + barHeight / 2);
      tempObject.scale.set(1, 1, barHeight);
      tempObject.updateMatrix();
      barsRef.current.setMatrixAt(i, tempObject.matrix);
      
      // Bar color - gradient from blue to cyan based on probability
      const barColor = new THREE.Color().setHSL(0.5 + prob * 0.1, 0.8, 0.4 + prob * 0.3);
      if (i === prediction) {
        barColor.lerp(new THREE.Color(isCorrect ? COLORS.correct : COLORS.incorrect), 0.5);
      }
      barsRef.current.setColorAt(i, barColor);
    }
    
    nodesRef.current.instanceMatrix.needsUpdate = true;
    barsRef.current.instanceMatrix.needsUpdate = true;
    if (nodesRef.current.instanceColor) {
      nodesRef.current.instanceColor.needsUpdate = true;
    }
    if (barsRef.current.instanceColor) {
      barsRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Output nodes */}
      <instancedMesh
        ref={nodesRef}
        args={[sphereGeometry, nodeMaterial, OUTPUT_COUNT]}
        frustumCulled={false}
      />
      
      {/* Probability bars */}
      <instancedMesh
        ref={barsRef}
        args={[barGeometry, barMaterial, OUTPUT_COUNT]}
        frustumCulled={false}
      />
      
      {/* Digit labels */}
      {nodePositions.map(([x, y, z], i) => (
        <Text
          key={i}
          position={[x - 0.35, y, z]}
          fontSize={0.2}
          color="#aaaacc"
          anchorX="center"
          anchorY="middle"
        >
          {i}
        </Text>
      ))}
    </group>
  );
}

