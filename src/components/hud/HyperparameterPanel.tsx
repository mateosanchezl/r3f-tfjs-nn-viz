import { useCallback } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import styles from './HUD.module.css';

export function HyperparameterPanel() {
  const { hyperparameters, setHyperparameters, animationSpeed, setAnimationSpeed, trainingState } = useNetworkStore();
  
  const isTraining = trainingState === 'training';
  
  const handleLearningRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHyperparameters({ learningRate: parseFloat(e.target.value) });
  }, [setHyperparameters]);
  
  const handleBatchSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHyperparameters({ batchSize: parseInt(e.target.value) });
  }, [setHyperparameters]);
  
  const handleEpochsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHyperparameters({ epochs: parseInt(e.target.value) });
  }, [setHyperparameters]);
  
  const handleSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(parseFloat(e.target.value));
  }, [setAnimationSpeed]);
  
  return (
    <div className={styles.hyperparamsPanel}>
      <h3 className={styles.panelTitle}>Hyperparameters</h3>
      
      <div className={styles.sliderGroup}>
        <label className={styles.sliderLabel}>
          <span>Learning Rate</span>
          <span className={styles.sliderValue}>{hyperparameters.learningRate.toFixed(4)}</span>
        </label>
        <input
          type="range"
          min="0.0001"
          max="0.1"
          step="0.0001"
          value={hyperparameters.learningRate}
          onChange={handleLearningRateChange}
          disabled={isTraining}
          className={styles.slider}
        />
      </div>
      
      <div className={styles.sliderGroup}>
        <label className={styles.sliderLabel}>
          <span>Batch Size</span>
          <span className={styles.sliderValue}>{hyperparameters.batchSize}</span>
        </label>
        <input
          type="range"
          min="8"
          max="128"
          step="8"
          value={hyperparameters.batchSize}
          onChange={handleBatchSizeChange}
          disabled={isTraining}
          className={styles.slider}
        />
      </div>
      
      <div className={styles.sliderGroup}>
        <label className={styles.sliderLabel}>
          <span>Epochs</span>
          <span className={styles.sliderValue}>{hyperparameters.epochs}</span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={hyperparameters.epochs}
          onChange={handleEpochsChange}
          disabled={isTraining}
          className={styles.slider}
        />
      </div>
      
      <div className={styles.divider} />
      
      <div className={styles.sliderGroup}>
        <label className={styles.sliderLabel}>
          <span>Animation Speed</span>
          <span className={styles.sliderValue}>
            {animationSpeed < 1 ? 'Slow' : animationSpeed > 2 ? 'Fast' : 'Normal'}
          </span>
        </label>
        <input
          type="range"
          min="0.2"
          max="5"
          step="0.1"
          value={animationSpeed}
          onChange={handleSpeedChange}
          className={styles.slider}
        />
      </div>
    </div>
  );
}

