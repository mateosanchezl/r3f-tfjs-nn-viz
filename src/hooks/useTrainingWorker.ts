import { useEffect, useRef, useCallback } from 'react';
import { useNetworkStore } from '../store/networkStore';
import type { NetworkSnapshot, TrainingState } from '../types';

export function useTrainingWorker() {
  const workerRef = useRef<Worker | null>(null);
  
  const {
    hyperparameters,
    setSnapshot,
    setTrainingState,
    addMetrics,
    setDataLoaded,
  } = useNetworkStore();

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/training.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    // Handle messages from worker
    const handleMessage = (e: MessageEvent) => {
      const { type, data } = e.data;
      
      switch (type) {
        case 'snapshot':
          setSnapshot(data as NetworkSnapshot);
          break;
        case 'metrics':
          addMetrics(data.loss, data.accuracy, data.epoch);
          break;
        case 'state':
          setTrainingState(data as TrainingState);
          if (data === 'idle') {
            setDataLoaded(true);
          }
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, [setSnapshot, setTrainingState, addMetrics, setDataLoaded]);

  const initialize = useCallback(() => {
    if (!workerRef.current) return;
    setTrainingState('loading');
    workerRef.current.postMessage({ type: 'initialize', data: hyperparameters });
  }, [hyperparameters, setTrainingState]);

  const train = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'train', data: hyperparameters });
  }, [hyperparameters]);

  const step = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'step' });
  }, []);

  const pause = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'pause' });
  }, []);

  const reset = useCallback(() => {
    if (!workerRef.current) return;
    useNetworkStore.getState().reset();
    workerRef.current.postMessage({ type: 'reset', data: hyperparameters });
  }, [hyperparameters]);

  return {
    initialize,
    train,
    step,
    pause,
    reset,
    isReady: !!workerRef.current,
  };
}
