// Network architecture configuration
export interface NetworkConfig {
  inputSize: number;
  hiddenLayers: number[];
  outputSize: number;
}

// Snapshot of network state at a given moment
export interface NetworkSnapshot {
  inputImage: Float32Array;
  label: number;
  activations: Float32Array[];
  weights: Float32Array[];
  biases: Float32Array[];
  prediction: number;
  probabilities: Float32Array;
  loss: number;
  accuracy: number;
  epoch: number;
  batch: number;
  isCorrect: boolean;
}

// Training hyperparameters
export interface Hyperparameters {
  learningRate: number;
  batchSize: number;
  epochs: number;
}

// Training state
export type TrainingState = 'idle' | 'loading' | 'training' | 'paused' | 'complete';

// Animation state for forward/backward pass
export interface AnimationState {
  phase: 'idle' | 'forward' | 'backward';
  layerProgress: number; // 0-1 progress through layers
  pulseTime: number;
}

// Metrics history for charts
export interface MetricsHistory {
  losses: number[];
  accuracies: number[];
  epochs: number[];
}

// Default network configuration
export const DEFAULT_CONFIG: NetworkConfig = {
  inputSize: 784,
  hiddenLayers: [128, 64],
  outputSize: 10,
};

export const DEFAULT_HYPERPARAMETERS: Hyperparameters = {
  learningRate: 0.01,
  batchSize: 32,
  epochs: 10,
};

// Layer positions in 3D space
export const LAYER_POSITIONS = {
  input: -8,
  hidden1: -2,
  hidden2: 3,
  output: 8,
};

// Visual constants
export const COLORS = {
  positiveWeight: '#00ffff', // Cyan
  negativeWeight: '#ff00ff', // Magenta
  neuronBase: '#00d4aa',     // Teal
  neuronActive: '#00ffff',   // Bright cyan
  correct: '#00ff88',        // Green
  incorrect: '#ff4466',      // Red
  inputVoxel: '#4488ff',     // Blue
};

