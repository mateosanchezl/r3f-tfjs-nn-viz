// MNIST data loading utilities
// Using a simplified approach - loading pre-processed MNIST data

const MNIST_URL = 'https://storage.googleapis.com/tfjs-tutorials/mnist_data';

interface MNISTData {
  trainImages: Float32Array;
  trainLabels: Uint8Array;
  testImages: Float32Array;
  testLabels: Uint8Array;
  numTrainSamples: number;
  numTestSamples: number;
}

let cachedData: MNISTData | null = null;

async function loadMNISTImages(url: string): Promise<Float32Array> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // Skip 16-byte header for images
  const headerSize = 16;
  const data = new Uint8Array(buffer, headerSize);
  
  // Normalize to 0-1 range
  const normalized = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    normalized[i] = data[i] / 255;
  }
  
  return normalized;
}

async function loadMNISTLabels(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // Skip 8-byte header for labels
  const headerSize = 8;
  return new Uint8Array(buffer, headerSize);
}

export async function loadMNIST(): Promise<MNISTData> {
  if (cachedData) return cachedData;
  
  console.log('Loading MNIST dataset...');
  
  try {
    const [trainImages, trainLabels, testImages, testLabels] = await Promise.all([
      loadMNISTImages(`${MNIST_URL}/train-images-idx3-ubyte`),
      loadMNISTLabels(`${MNIST_URL}/train-labels-idx1-ubyte`),
      loadMNISTImages(`${MNIST_URL}/t10k-images-idx3-ubyte`),
      loadMNISTLabels(`${MNIST_URL}/t10k-labels-idx1-ubyte`),
    ]);
    
    cachedData = {
      trainImages,
      trainLabels,
      testImages,
      testLabels,
      numTrainSamples: trainLabels.length,
      numTestSamples: testLabels.length,
    };
    
    console.log(`MNIST loaded: ${cachedData.numTrainSamples} train, ${cachedData.numTestSamples} test samples`);
    
    return cachedData;
  } catch (error) {
    console.error('Failed to load MNIST:', error);
    throw error;
  }
}

export function getTrainSample(data: MNISTData, index: number): { image: Float32Array; label: number } {
  const start = index * 784;
  const image = data.trainImages.slice(start, start + 784);
  const label = data.trainLabels[index];
  return { image, label };
}

export function getTestSample(data: MNISTData, index: number): { image: Float32Array; label: number } {
  const start = index * 784;
  const image = data.testImages.slice(start, start + 784);
  const label = data.testLabels[index];
  return { image, label };
}

export function getRandomTrainSample(data: MNISTData): { image: Float32Array; label: number; index: number } {
  const index = Math.floor(Math.random() * data.numTrainSamples);
  return { ...getTrainSample(data, index), index };
}

// Get a batch of training samples
export function getTrainBatch(
  data: MNISTData,
  startIndex: number,
  batchSize: number
): { images: Float32Array; labels: Uint8Array } {
  const endIndex = Math.min(startIndex + batchSize, data.numTrainSamples);
  const actualBatchSize = endIndex - startIndex;
  
  const images = new Float32Array(actualBatchSize * 784);
  const labels = new Uint8Array(actualBatchSize);
  
  for (let i = 0; i < actualBatchSize; i++) {
    const srcStart = (startIndex + i) * 784;
    images.set(data.trainImages.subarray(srcStart, srcStart + 784), i * 784);
    labels[i] = data.trainLabels[startIndex + i];
  }
  
  return { images, labels };
}

