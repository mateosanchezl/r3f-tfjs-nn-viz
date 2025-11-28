import { useEffect, useCallback } from 'react';
import { useNetworkStore } from '../../store/networkStore';
import { useTrainingWorker } from '../../hooks/useTrainingWorker';
import styles from './HUD.module.css';

export function TrainingControls() {
  const { trainingState, dataLoaded } = useNetworkStore();
  const { initialize, train, step, pause, reset } = useTrainingWorker();
  
  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  const handlePlay = useCallback(() => {
    if (trainingState === 'idle' || trainingState === 'paused') {
      train();
    }
  }, [trainingState, train]);
  
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);
  
  const handleStep = useCallback(() => {
    step();
  }, [step]);
  
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);
  
  const isTraining = trainingState === 'training';
  const isLoading = trainingState === 'loading';
  const isComplete = trainingState === 'complete';
  
  return (
    <div className={styles.controlsPanel}>
      <h3 className={styles.panelTitle}>Training Controls</h3>
      
      <div className={styles.statusIndicator}>
        <span className={`${styles.statusDot} ${styles[trainingState]}`} />
        <span className={styles.statusText}>
          {isLoading ? 'Loading MNIST...' : 
           isTraining ? 'Training...' : 
           isComplete ? 'Complete' :
           trainingState === 'paused' ? 'Paused' : 'Ready'}
        </span>
      </div>
      
      <div className={styles.buttonGroup}>
        {!isTraining ? (
          <button 
            className={`${styles.button} ${styles.playButton}`}
            onClick={handlePlay}
            disabled={isLoading || !dataLoaded}
          >
            <PlayIcon />
            {trainingState === 'paused' ? 'Resume' : 'Train'}
          </button>
        ) : (
          <button 
            className={`${styles.button} ${styles.pauseButton}`}
            onClick={handlePause}
          >
            <PauseIcon />
            Pause
          </button>
        )}
        
        <button 
          className={`${styles.button} ${styles.stepButton}`}
          onClick={handleStep}
          disabled={isLoading || isTraining || !dataLoaded}
        >
          <StepIcon />
          Step
        </button>
        
        <button 
          className={`${styles.button} ${styles.resetButton}`}
          onClick={handleReset}
          disabled={isLoading}
        >
          <ResetIcon />
          Reset
        </button>
      </div>
    </div>
  );
}

// SVG Icons
function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function StepIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

