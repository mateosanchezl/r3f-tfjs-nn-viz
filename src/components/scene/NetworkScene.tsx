import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { InputLayer } from './InputLayer';
import { HiddenLayers } from './HiddenLayer';
import { OutputLayer } from './OutputLayer';
import { Connections } from './Connections';
import { useNetworkStore } from '../../store/networkStore';

// Animation controller - updates animation state based on training
function AnimationController() {
  const animationPhase = useRef<'idle' | 'forward' | 'backward'>('idle');
  const phaseStartTime = useRef(0);
  
  const { setAnimationState, animationSpeed, trainingState, snapshot } = useNetworkStore();
  
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Only animate during training
    if (trainingState !== 'training') {
      setAnimationState({ phase: 'idle', layerProgress: 0, pulseTime: time });
      return;
    }
    
    // Check if we have a new snapshot (triggers animation)
    if (snapshot && snapshot.epoch !== undefined) {
      const timeSincePhaseStart = time - phaseStartTime.current;
      const phaseDuration = 2.0 / animationSpeed; // Duration of forward/backward pass
      
      if (animationPhase.current === 'idle') {
        // Start forward pass
        animationPhase.current = 'forward';
        phaseStartTime.current = time;
      } else if (animationPhase.current === 'forward') {
        const progress = Math.min(1, timeSincePhaseStart / phaseDuration);
        setAnimationState({ phase: 'forward', layerProgress: progress, pulseTime: time });
        
        if (progress >= 1) {
          // Check if prediction is wrong - start backward pass
          if (!snapshot.isCorrect) {
            animationPhase.current = 'backward';
            phaseStartTime.current = time;
          } else {
            animationPhase.current = 'idle';
          }
        }
      } else if (animationPhase.current === 'backward') {
        const progress = Math.min(1, timeSincePhaseStart / (phaseDuration * 0.5));
        setAnimationState({ phase: 'backward', layerProgress: 1 - progress, pulseTime: time });
        
        if (progress >= 1) {
          animationPhase.current = 'idle';
        }
      }
    }
  });
  
  return null;
}

// Scene lighting
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.4} color="#00aaff" />
      <pointLight position={[0, 0, -10]} intensity={0.3} color="#ff00ff" />
      <spotLight
        position={[0, 15, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={0.5}
        color="#00ffff"
      />
    </>
  );
}

// Grid helper for visual reference
function SceneGrid() {
  return (
    <gridHelper
      args={[30, 30, '#1a1a3a', '#0a0a1f']}
      rotation={[Math.PI / 2, 0, 0]}
      position={[0, -4, 0]}
    />
  );
}

export function NetworkScene() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 3, 18);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return (
    <>
      <PerspectiveCamera makeDefault fov={60} near={0.1} far={100} />
      
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={40}
        maxPolarAngle={Math.PI * 0.9}
        target={[0, 0, 0]}
      />
      
      {/* Background */}
      <color attach="background" args={['#0a0a0f']} />
      <Stars radius={50} depth={50} count={2000} factor={3} saturation={0.5} fade speed={0.5} />
      
      <Lighting />
      <SceneGrid />
      <AnimationController />
      
      {/* Neural Network Layers */}
      <group>
        <InputLayer />
        <HiddenLayers />
        <OutputLayer />
        <Connections />
      </group>
    </>
  );
}

