import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  NetworkSnapshot,
  Hyperparameters,
  TrainingState,
  AnimationState,
  MetricsHistory,
} from '../types';

interface NetworkStore {
  // Current snapshot (updated frequently, read via refs)
  snapshot: NetworkSnapshot | null;
  snapshotQueue: NetworkSnapshot[];
  
  // Training state
  trainingState: TrainingState;
  hyperparameters: Hyperparameters;
  
  // Animation
  animationState: AnimationState;
  animationSpeed: number; // 0.1 = slow motion, 1 = normal, 5 = fast
  
  // Metrics history
  metricsHistory: MetricsHistory;
  
  // Data loading
  dataLoaded: boolean;
  
  // Actions
  setSnapshot: (snapshot: NetworkSnapshot) => void;
  pushSnapshot: (snapshot: NetworkSnapshot) => void;
  popSnapshot: () => NetworkSnapshot | null;
  setTrainingState: (state: TrainingState) => void;
  setHyperparameters: (params: Partial<Hyperparameters>) => void;
  setAnimationState: (state: Partial<AnimationState>) => void;
  setAnimationSpeed: (speed: number) => void;
  addMetrics: (loss: number, accuracy: number, epoch: number) => void;
  setDataLoaded: (loaded: boolean) => void;
  reset: () => void;
}

const initialAnimationState: AnimationState = {
  phase: 'idle',
  layerProgress: 0,
  pulseTime: 0,
};

const initialMetricsHistory: MetricsHistory = {
  losses: [],
  accuracies: [],
  epochs: [],
};

const initialHyperparameters: Hyperparameters = {
  learningRate: 0.01,
  batchSize: 32,
  epochs: 10,
};

export const useNetworkStore = create<NetworkStore>()(
  subscribeWithSelector((set, get) => ({
    snapshot: null,
    snapshotQueue: [],
    trainingState: 'idle',
    hyperparameters: initialHyperparameters,
    animationState: initialAnimationState,
    animationSpeed: 1,
    metricsHistory: initialMetricsHistory,
    dataLoaded: false,

    setSnapshot: (snapshot) => set({ snapshot }),
    
    pushSnapshot: (snapshot) => set((state) => ({
      snapshotQueue: [...state.snapshotQueue.slice(-20), snapshot], // Keep last 20
    })),
    
    popSnapshot: () => {
      const { snapshotQueue } = get();
      if (snapshotQueue.length === 0) return null;
      const [next, ...rest] = snapshotQueue;
      set({ snapshotQueue: rest, snapshot: next });
      return next;
    },
    
    setTrainingState: (trainingState) => set({ trainingState }),
    
    setHyperparameters: (params) => set((state) => ({
      hyperparameters: { ...state.hyperparameters, ...params },
    })),
    
    setAnimationState: (animState) => set((state) => ({
      animationState: { ...state.animationState, ...animState },
    })),
    
    setAnimationSpeed: (animationSpeed) => set({ animationSpeed }),
    
    addMetrics: (loss, accuracy, epoch) => set((state) => ({
      metricsHistory: {
        losses: [...state.metricsHistory.losses, loss],
        accuracies: [...state.metricsHistory.accuracies, accuracy],
        epochs: [...state.metricsHistory.epochs, epoch],
      },
    })),
    
    setDataLoaded: (dataLoaded) => set({ dataLoaded }),
    
    reset: () => set({
      snapshot: null,
      snapshotQueue: [],
      trainingState: 'idle',
      animationState: initialAnimationState,
      metricsHistory: initialMetricsHistory,
    }),
  }))
);

// Non-reactive getters for use in render loops
export const getSnapshot = () => useNetworkStore.getState().snapshot;
export const getAnimationState = () => useNetworkStore.getState().animationState;
export const getAnimationSpeed = () => useNetworkStore.getState().animationSpeed;

