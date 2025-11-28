import { TrainingControls } from './TrainingControls';
import { HyperparameterPanel } from './HyperparameterPanel';
import { MetricsDisplay } from './MetricsDisplay';
import styles from './HUD.module.css';

export function HUD() {
  return (
    <div className={styles.hudContainer}>
      {/* Title */}
      <div className={styles.titleBar}>
        <h1 className={styles.title}>MNIST Neural Network</h1>
        <p className={styles.subtitle}>3D Visualizer</p>
      </div>
      
      {/* Left Panel - Controls */}
      <div className={styles.leftPanel}>
        <TrainingControls />
        <HyperparameterPanel />
      </div>
      
      {/* Right Panel - Metrics */}
      <div className={styles.rightPanel}>
        <MetricsDisplay />
      </div>
      
      {/* Network Architecture Info */}
      <div className={styles.networkInfo}>
        <div className={styles.layerInfo}>
          <div className={styles.layerName}>Input</div>
          <div className={styles.layerSize}>784</div>
        </div>
        <div className={styles.layerInfo}>
          <div className={styles.layerName}>Hidden 1</div>
          <div className={styles.layerSize}>128</div>
        </div>
        <div className={styles.layerInfo}>
          <div className={styles.layerName}>Hidden 2</div>
          <div className={styles.layerSize}>64</div>
        </div>
        <div className={styles.layerInfo}>
          <div className={styles.layerName}>Output</div>
          <div className={styles.layerSize}>10</div>
        </div>
      </div>
      
      {/* Controls Hint */}
      <div className={styles.controlsHint}>
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}

