import { Canvas } from '@react-three/fiber';
import { NetworkScene } from './components/scene/NetworkScene';
import { HUD } from './components/hud/HUD';

function App() {
  return (
    <>
      <Canvas
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
      >
        <NetworkScene />
      </Canvas>
      <HUD />
    </>
  );
}

export default App;
