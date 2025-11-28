import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getSnapshot, getAnimationState } from '../../store/networkStore';
import { LAYER_POSITIONS, COLORS } from '../../types';

const GRID_SIZE = 28;
const VOXEL_SIZE = 0.12;
const VOXEL_SPACING = 0.14;
const MAX_HEIGHT = 0.5;

export function InputLayer() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  
  // Pre-compute grid positions
  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    const offset = (GRID_SIZE * VOXEL_SPACING) / 2;
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        pos.push([
          x * VOXEL_SPACING - offset,
          (GRID_SIZE - 1 - y) * VOXEL_SPACING - offset, // Flip Y for correct orientation
          LAYER_POSITIONS.input,
        ]);
      }
    }
    return pos;
  }, []);

  // Create geometry and material
  const geometry = useMemo(() => new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.inputVoxel,
        emissive: COLORS.inputVoxel,
        emissiveIntensity: 0.3,
        metalness: 0.3,
        roughness: 0.7,
      }),
    []
  );

  useFrame(() => {
    if (!meshRef.current) return;
    
    const snapshot = getSnapshot();
    const animState = getAnimationState();
    
    // Pulse effect during forward pass
    const isActive = animState.phase === 'forward' && animState.layerProgress < 0.2;
    const pulseIntensity = isActive ? 0.5 + 0.5 * Math.sin(animState.pulseTime * 10) : 0.3;
    
    for (let i = 0; i < 784; i++) {
      const [x, y, z] = positions[i];
      
      // Get pixel intensity from snapshot or use default
      const intensity = snapshot?.inputImage?.[i] ?? 0;
      
      // Scale height and brightness based on intensity
      const height = VOXEL_SIZE + intensity * MAX_HEIGHT;
      
      tempObject.position.set(x, y, z + height / 2);
      tempObject.scale.set(1, 1, 1 + intensity * 4);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
      
      // Set color based on intensity
      const brightness = 0.2 + intensity * 0.8;
      tempColor.setRGB(
        brightness * 0.3 + pulseIntensity * intensity * 0.2,
        brightness * 0.5 + pulseIntensity * intensity * 0.3,
        brightness * 1.0
      );
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
      args={[geometry, material, 784]}
      frustumCulled={false}
    />
  );
}

