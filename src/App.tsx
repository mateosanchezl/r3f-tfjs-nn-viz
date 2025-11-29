import { Canvas } from '@react-three/fiber';
import { NetworkScene } from './components/scene/NetworkScene';
import { HUD } from './components/hud/HUD';
import { Analytics } from '@vercel/analytics/react';

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
      <Analytics />
    </>
  );
}

export default App;
