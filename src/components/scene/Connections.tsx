import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSnapshot, getAnimationState } from '../../store/networkStore';
import { LAYER_POSITIONS } from '../../types';

// Network dimensions
const INPUT_SIZE = 784;
const HIDDEN1_SIZE = 128;
const HIDDEN2_SIZE = 64;
const OUTPUT_SIZE = 10;

// Visual parameters
const WEIGHT_THRESHOLD = 0.1;
const MAX_CONNECTIONS_PER_LAYER = 8000; // Limit for performance

// Grid dimensions for neuron positions
const INPUT_GRID = 28;
const INPUT_SPACING = 0.14;

interface LayerConnectionsProps {
  fromCount: number;
  toCount: number;
  layerIndex: number;
  fromPositions: THREE.Vector3[];
  toPositions: THREE.Vector3[];
  maxConnections: number;
}

function LayerConnections({
  fromCount,
  toCount,
  layerIndex,
  fromPositions,
  toPositions,
  maxConnections,
}: LayerConnectionsProps) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  // Pre-compute which connections to show (subsample if too many)
  const connectionInfo = useMemo(() => {
    const totalConnections = fromCount * toCount;
    const step = Math.max(1, Math.floor(totalConnections / maxConnections));
    const connections: { from: number; to: number; index: number }[] = [];
    
    let idx = 0;
    for (let i = 0; i < fromCount; i += Math.ceil(Math.sqrt(step))) {
      for (let j = 0; j < toCount; j += Math.ceil(Math.sqrt(step))) {
        connections.push({ from: i, to: j, index: i * toCount + j });
        idx++;
        if (idx >= maxConnections) break;
      }
      if (idx >= maxConnections) break;
    }
    
    return connections;
  }, [fromCount, toCount, maxConnections]);
  
  // Create geometry with positions for all potential connections
  const { positions, colors } = useMemo(() => {
    const numConnections = connectionInfo.length;
    const posArray = new Float32Array(numConnections * 6); // 2 vertices per line, 3 coords each
    const colorArray = new Float32Array(numConnections * 6); // RGB for each vertex
    
    for (let c = 0; c < numConnections; c++) {
      const { from, to } = connectionInfo[c];
      const fromPos = fromPositions[from];
      const toPos = toPositions[to];
      
      // Start vertex
      posArray[c * 6 + 0] = fromPos.x;
      posArray[c * 6 + 1] = fromPos.y;
      posArray[c * 6 + 2] = fromPos.z;
      
      // End vertex
      posArray[c * 6 + 3] = toPos.x;
      posArray[c * 6 + 4] = toPos.y;
      posArray[c * 6 + 5] = toPos.z;
      
      // Initial colors (will be updated in useFrame)
      colorArray[c * 6 + 0] = 0.5;
      colorArray[c * 6 + 1] = 0.5;
      colorArray[c * 6 + 2] = 0.5;
      colorArray[c * 6 + 3] = 0.5;
      colorArray[c * 6 + 4] = 0.5;
      colorArray[c * 6 + 5] = 0.5;
      
    }
    
    return { positions: posArray, colors: colorArray };
  }, [connectionInfo, fromPositions, toPositions]);
  
  // Create geometry
  useEffect(() => {
    if (!geometryRef.current) return;
    
    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometryRef.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
  }, [positions, colors]);
  
  // Update colors based on weights
  useFrame(() => {
    if (!geometryRef.current) return;
    
    const snapshot = getSnapshot();
    const animState = getAnimationState();
    
    const weights = snapshot?.weights?.[layerIndex];
    const colorAttr = geometryRef.current.getAttribute('color') as THREE.BufferAttribute;
    
    if (!colorAttr) return;
    
    const colorArray = colorAttr.array as Float32Array;
    
    // Animation pulse calculation
    const layerStart = layerIndex * 0.33;
    const layerEnd = layerStart + 0.33;
    const isPulsing = 
      animState.phase === 'forward' && 
      animState.layerProgress >= layerStart && 
      animState.layerProgress < layerEnd;
    const isBackward = animState.phase === 'backward';
    
    const pulse = isPulsing ? 0.5 + 0.5 * Math.sin(animState.pulseTime * 20) : 0;
    
    for (let c = 0; c < connectionInfo.length; c++) {
      const { index } = connectionInfo[c];
      
      // Get weight value
      const weight = weights ? weights[index % weights.length] : 0;
      const absWeight = Math.abs(weight);
      
      // Apply threshold - set to very dim if below
      if (absWeight < WEIGHT_THRESHOLD) {
        // Nearly invisible
        colorArray[c * 6 + 0] = 0.1;
        colorArray[c * 6 + 1] = 0.1;
        colorArray[c * 6 + 2] = 0.15;
        colorArray[c * 6 + 3] = 0.1;
        colorArray[c * 6 + 4] = 0.1;
        colorArray[c * 6 + 5] = 0.15;
        continue;
      }
      
      // Color based on weight sign
      let r: number, g: number, b: number;
      
      if (weight > 0) {
        // Cyan for positive
        r = 0.0 + pulse * 0.3;
        g = 0.6 + absWeight * 0.4 + pulse * 0.3;
        b = 0.6 + absWeight * 0.4 + pulse * 0.3;
      } else {
        // Magenta for negative
        r = 0.6 + absWeight * 0.4 + pulse * 0.3;
        g = 0.0 + pulse * 0.2;
        b = 0.6 + absWeight * 0.4 + pulse * 0.3;
      }
      
      // Backward pass - red tint
      if (isBackward) {
        r = Math.min(1, r + 0.3);
        g *= 0.5;
        b *= 0.5;
      }
      
      // Apply to both vertices
      colorArray[c * 6 + 0] = r;
      colorArray[c * 6 + 1] = g;
      colorArray[c * 6 + 2] = b;
      colorArray[c * 6 + 3] = r;
      colorArray[c * 6 + 4] = g;
      colorArray[c * 6 + 5] = b;
    }
    
    colorAttr.needsUpdate = true;
  });
  
  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

export function Connections() {
  // Pre-compute all neuron positions
  const inputPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const offset = (INPUT_GRID * INPUT_SPACING) / 2;
    
    for (let y = 0; y < INPUT_GRID; y++) {
      for (let x = 0; x < INPUT_GRID; x++) {
        positions.push(new THREE.Vector3(
          x * INPUT_SPACING - offset,
          (INPUT_GRID - 1 - y) * INPUT_SPACING - offset,
          LAYER_POSITIONS.input
        ));
      }
    }
    return positions;
  }, []);
  
  const hidden1Positions = useMemo(() => {
    return computeLayerPositions(HIDDEN1_SIZE, LAYER_POSITIONS.hidden1);
  }, []);
  
  const hidden2Positions = useMemo(() => {
    return computeLayerPositions(HIDDEN2_SIZE, LAYER_POSITIONS.hidden2);
  }, []);
  
  const outputPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const spacing = 0.45;
    const totalHeight = (OUTPUT_SIZE - 1) * spacing;
    
    for (let i = 0; i < OUTPUT_SIZE; i++) {
      positions.push(new THREE.Vector3(
        0,
        i * spacing - totalHeight / 2,
        LAYER_POSITIONS.output
      ));
    }
    return positions;
  }, []);
  
  return (
    <group>
      {/* Input -> Hidden1 */}
      <LayerConnections
        fromCount={INPUT_SIZE}
        toCount={HIDDEN1_SIZE}
        layerIndex={0}
        fromPositions={inputPositions}
        toPositions={hidden1Positions}
        maxConnections={MAX_CONNECTIONS_PER_LAYER}
      />
      
      {/* Hidden1 -> Hidden2 */}
      <LayerConnections
        fromCount={HIDDEN1_SIZE}
        toCount={HIDDEN2_SIZE}
        layerIndex={1}
        fromPositions={hidden1Positions}
        toPositions={hidden2Positions}
        maxConnections={MAX_CONNECTIONS_PER_LAYER}
      />
      
      {/* Hidden2 -> Output */}
      <LayerConnections
        fromCount={HIDDEN2_SIZE}
        toCount={OUTPUT_SIZE}
        layerIndex={2}
        fromPositions={hidden2Positions}
        toPositions={outputPositions}
        maxConnections={MAX_CONNECTIONS_PER_LAYER}
      />
    </group>
  );
}

function computeLayerPositions(count: number, z: number): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const layerWidth = 3.5;
  const layerHeight = 3.5;
  
  const spacingX = layerWidth / cols;
  const spacingY = layerHeight / rows;
  
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    positions.push(new THREE.Vector3(
      col * spacingX - layerWidth / 2 + spacingX / 2,
      row * spacingY - layerHeight / 2 + spacingY / 2,
      z
    ));
  }
  
  return positions;
}

