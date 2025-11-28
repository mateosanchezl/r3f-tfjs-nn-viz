import * as tf from "@tensorflow/tfjs";
import type { NetworkSnapshot, Hyperparameters, NetworkConfig } from "../types";

// MNIST data
interface MNISTData {
  trainImages: Float32Array;
  trainLabels: Uint8Array;
  testImages: Float32Array;
  testLabels: Uint8Array;
  numTrainSamples: number;
  numTestSamples: number;
}

let mnistData: MNISTData | null = null;
let model: tf.Sequential | null = null;
let isTraining = false;
let shouldPause = false;
let currentEpoch = 0;
let currentBatch = 0;

const config: NetworkConfig = {
  inputSize: 784,
  hiddenLayers: [128, 64],
  outputSize: 10,
};

// Local MNIST data path
const MNIST_URL = "/data";

// Helper to send messages to main thread
function postSnapshot(snapshot: NetworkSnapshot) {
  self.postMessage({ type: "snapshot", data: snapshot });
}

function postMetrics(loss: number, accuracy: number, epoch: number) {
  self.postMessage({ type: "metrics", data: { loss, accuracy, epoch } });
}

function postState(state: string) {
  self.postMessage({ type: "state", data: state });
}

async function loadMNISTImages(url: string): Promise<Float32Array> {
  console.log(`[Worker] Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  console.log(`[Worker] Received ${buffer.byteLength} bytes`);

  const headerSize = 16;
  const dataView = new DataView(buffer);

  // Read MNIST header to get dimensions
  const magic = dataView.getInt32(0, false);
  const numImages = dataView.getInt32(4, false);
  const rows = dataView.getInt32(8, false);
  const cols = dataView.getInt32(12, false);
  console.log(`[Worker] MNIST images: magic=${magic}, count=${numImages}, ${rows}x${cols}`);

  const data = new Uint8Array(buffer, headerSize);
  const normalized = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    normalized[i] = data[i] / 255;
  }
  console.log(`[Worker] Normalized ${normalized.length} pixel values`);
  return normalized;
}

async function loadMNISTLabels(url: string): Promise<Uint8Array> {
  console.log(`[Worker] Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  console.log(`[Worker] Received ${buffer.byteLength} bytes`);

  const headerSize = 8;
  const labels = new Uint8Array(buffer, headerSize);
  console.log(`[Worker] Loaded ${labels.length} labels`);
  return labels;
}

async function loadData(): Promise<void> {
  if (mnistData) return;

  postState("loading");
  console.log("[Worker] Loading MNIST dataset...");

  try {
    const [trainImages, trainLabels, testImages, testLabels] = await Promise.all([
      loadMNISTImages(`${MNIST_URL}/train-images.idx3-ubyte`),
      loadMNISTLabels(`${MNIST_URL}/train-labels.idx1-ubyte`),
      loadMNISTImages(`${MNIST_URL}/t10k-images.idx3-ubyte`),
      loadMNISTLabels(`${MNIST_URL}/t10k-labels.idx1-ubyte`),
    ]);

    mnistData = {
      trainImages,
      trainLabels,
      testImages,
      testLabels,
      numTrainSamples: trainLabels.length,
      numTestSamples: testLabels.length,
    };

    console.log(`[Worker] MNIST loaded: ${mnistData.numTrainSamples} train samples`);
  } catch (error) {
    console.error("[Worker] Failed to load MNIST:", error);
    throw error;
  }
}

function createModel(learningRate: number): tf.Sequential {
  const newModel = tf.sequential();

  newModel.add(
    tf.layers.dense({
      inputShape: [config.inputSize],
      units: config.hiddenLayers[0],
      activation: "relu",
      kernelInitializer: "glorotNormal",
    })
  );

  newModel.add(
    tf.layers.dense({
      units: config.hiddenLayers[1],
      activation: "relu",
      kernelInitializer: "glorotNormal",
    })
  );

  newModel.add(
    tf.layers.dense({
      units: config.outputSize,
      activation: "softmax",
      kernelInitializer: "glorotNormal",
    })
  );

  newModel.compile({
    optimizer: tf.train.sgd(learningRate),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return newModel;
}

function extractWeights(): Float32Array[] {
  if (!model) return [];

  const weights: Float32Array[] = [];
  for (const layer of model.layers) {
    const layerWeights = layer.getWeights();
    if (layerWeights.length > 0) {
      const kernelData = layerWeights[0].dataSync() as Float32Array;
      weights.push(new Float32Array(kernelData));
    }
  }
  return weights;
}

function extractBiases(): Float32Array[] {
  if (!model) return [];

  const biases: Float32Array[] = [];
  for (const layer of model.layers) {
    const layerWeights = layer.getWeights();
    if (layerWeights.length > 1) {
      const biasData = layerWeights[1].dataSync() as Float32Array;
      biases.push(new Float32Array(biasData));
    }
  }
  return biases;
}

function getActivations(input: tf.Tensor2D): Float32Array[] {
  if (!model) return [];

  const activations: Float32Array[] = [];
  let currentInput: tf.Tensor = input;

  for (const layer of model.layers) {
    const output = layer.apply(currentInput) as tf.Tensor;
    const data = output.dataSync() as Float32Array;
    activations.push(new Float32Array(data));
    if (currentInput !== input) {
      currentInput.dispose();
    }
    currentInput = output;
  }

  if (currentInput !== input) {
    currentInput.dispose();
  }

  return activations;
}

function createSnapshot(
  inputImage: Float32Array,
  label: number,
  loss: number,
  accuracy: number
): NetworkSnapshot {
  // Validate input
  if (!inputImage || inputImage.length !== 784) {
    console.error(`[Worker] Invalid inputImage: length=${inputImage?.length}, expected 784`);
    // Create empty placeholder
    inputImage = new Float32Array(784);
  }

  const inputTensor = tf.tensor2d([Array.from(inputImage)], [1, 784]);
  const activations = getActivations(inputTensor);
  inputTensor.dispose();

  const outputActivation = activations[activations.length - 1];
  const prediction = outputActivation.indexOf(Math.max(...outputActivation));

  return {
    inputImage: new Float32Array(inputImage),
    label,
    activations,
    weights: extractWeights(),
    biases: extractBiases(),
    prediction,
    probabilities: new Float32Array(outputActivation),
    loss,
    accuracy,
    epoch: currentEpoch,
    batch: currentBatch,
    isCorrect: prediction === label,
  };
}

async function initialize(hyperparams: Hyperparameters): Promise<void> {
  try {
    await tf.ready();
    console.log("[Worker] TensorFlow.js backend:", tf.getBackend());

    await loadData();
    model = createModel(hyperparams.learningRate);

    // Send initial snapshot with random sample
    if (mnistData) {
      const idx = Math.floor(Math.random() * mnistData.numTrainSamples);
      const start = idx * 784;
      const image = mnistData.trainImages.slice(start, start + 784);
      const label = mnistData.trainLabels[idx];

      const snapshot = createSnapshot(image, label, 2.3, 0.1);
      postSnapshot(snapshot);
    }

    postState("idle");
  } catch (error) {
    console.error("[Worker] Initialize failed:", error);
    postState("idle");
  }
}

async function train(hyperparams: Hyperparameters): Promise<void> {
  if (!mnistData || !model || isTraining) {
    console.warn(
      "[Worker] Cannot train: mnistData=",
      !!mnistData,
      "model=",
      !!model,
      "isTraining=",
      isTraining
    );
    return;
  }

  // Validate data is actually loaded
  if (mnistData.trainImages.length === 0) {
    console.error("[Worker] Training images not loaded!");
    return;
  }

  console.log(
    `[Worker] Starting training with ${mnistData.trainImages.length} pixels (${mnistData.numTrainSamples} samples)`
  );

  isTraining = true;
  shouldPause = false;
  postState("training");

  const { batchSize, epochs } = hyperparams;
  const numBatches = Math.floor(mnistData.numTrainSamples / batchSize);

  for (let epoch = 0; epoch < epochs && !shouldPause; epoch++) {
    currentEpoch = epoch;
    let epochLoss = 0;
    let epochAcc = 0;

    // Shuffle training data indices
    const indices = Array.from({ length: mnistData.numTrainSamples }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let batch = 0; batch < numBatches && !shouldPause; batch++) {
      currentBatch = batch;

      const batchIndices = indices.slice(batch * batchSize, (batch + 1) * batchSize);
      const batchImages = new Float32Array(batchSize * 784);
      const batchLabels = new Float32Array(batchSize * 10);

      for (let i = 0; i < batchSize; i++) {
        const idx = batchIndices[i];
        const start = idx * 784;
        batchImages.set(mnistData.trainImages.subarray(start, start + 784), i * 784);

        const label = mnistData.trainLabels[idx];
        batchLabels[i * 10 + label] = 1;
      }

      const xs = tf.tensor2d(batchImages, [batchSize, 784]);
      const ys = tf.tensor2d(batchLabels, [batchSize, 10]);

      const result = await model.trainOnBatch(xs, ys);
      const loss = Array.isArray(result) ? (result[0] as number) : (result as number);
      const acc = Array.isArray(result) ? (result[1] as number) : 0;

      epochLoss += loss;
      epochAcc += acc;

      xs.dispose();
      ys.dispose();

      // Send snapshot every few batches
      if (batch % 10 === 0) {
        const sampleIdx = batchIndices[0];
        const sampleStart = sampleIdx * 784;
        const sampleImage = mnistData.trainImages.slice(sampleStart, sampleStart + 784);
        const sampleLabel = mnistData.trainLabels[sampleIdx];

        const snapshot = createSnapshot(sampleImage, sampleLabel, loss, acc);
        postSnapshot(snapshot);
      }

      // Yield to prevent blocking
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const avgLoss = epochLoss / numBatches;
    const avgAcc = epochAcc / numBatches;

    console.log(
      `[Worker] Epoch ${epoch + 1}/${epochs} - Loss: ${avgLoss.toFixed(4)}, Acc: ${avgAcc.toFixed(
        4
      )}`
    );

    postMetrics(avgLoss, avgAcc, epoch);
  }

  isTraining = false;
  postState(shouldPause ? "paused" : "complete");
}

async function step(): Promise<void> {
  if (!mnistData || !model) return;

  const idx = Math.floor(Math.random() * mnistData.numTrainSamples);
  const start = idx * 784;
  const image = mnistData.trainImages.slice(start, start + 784);
  const label = mnistData.trainLabels[idx];

  const labelOneHot = new Float32Array(10);
  labelOneHot[label] = 1;

  const xs = tf.tensor2d([Array.from(image)], [1, 784]);
  const ys = tf.tensor2d([Array.from(labelOneHot)], [1, 10]);

  const result = await model.trainOnBatch(xs, ys);
  const loss = Array.isArray(result) ? (result[0] as number) : (result as number);
  const acc = Array.isArray(result) ? (result[1] as number) : 0;

  xs.dispose();
  ys.dispose();

  const snapshot = createSnapshot(image, label, loss, acc);
  postSnapshot(snapshot);
}

function pause(): void {
  shouldPause = true;
  postState("paused");
}

async function reset(hyperparams: Hyperparameters): Promise<void> {
  shouldPause = true;
  isTraining = false;
  currentEpoch = 0;
  currentBatch = 0;

  if (model) {
    model.dispose();
  }
  model = createModel(hyperparams.learningRate);

  if (mnistData) {
    const idx = Math.floor(Math.random() * mnistData.numTrainSamples);
    const start = idx * 784;
    const image = mnistData.trainImages.slice(start, start + 784);
    const label = mnistData.trainLabels[idx];

    const snapshot = createSnapshot(image, label, 2.3, 0.1);
    postSnapshot(snapshot);
  }

  postState("idle");
}

// Message handler
self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  try {
    switch (type) {
      case "initialize":
        await initialize(data);
        break;
      case "train":
        await train(data);
        break;
      case "step":
        await step();
        break;
      case "pause":
        pause();
        break;
      case "reset":
        await reset(data);
        break;
      default:
        console.warn("[Worker] Unknown message type:", type);
    }
  } catch (error) {
    console.error("[Worker] Error handling message:", type, error);
  }
};

console.log("[Worker] Training worker initialized");
