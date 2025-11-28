# 3D MNIST Neural Network Visualizer

An immersive 3D web application that reveals the inner workings of a deep neural network as it learns to recognize handwritten digits from the MNIST dataset.

## Features

- **3D Visualization**: Explore the neural network as a tangible 3D structure using orbit controls
- **Real-time Training**: Watch the network learn with animated forward propagation and backpropagation
- **Glass Box AI**: See input voxels, hidden neurons, weight connections, and output probabilities
- **Interactive Controls**: Adjust learning rate, batch size, and animation speed
- **Live Metrics**: Track loss and accuracy with real-time charts

## Architecture

```
Input Layer (784 voxels) → Hidden Layer 1 (128 neurons) → Hidden Layer 2 (64 neurons) → Output Layer (10 digits)
```

## Tech Stack

- **React 18** with TypeScript
- **React Three Fiber** for declarative 3D rendering
- **TensorFlow.js** for WebGL-accelerated machine learning
- **Zustand** for high-performance state management
- **Comlink** for Web Worker communication
- **Vite** for fast development builds

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Controls

- **Drag**: Rotate the view
- **Scroll**: Zoom in/out
- **Right-click drag**: Pan the camera

## Visual Encoding

- **Cyan lines**: Positive weights
- **Magenta lines**: Negative weights
- **Line brightness**: Weight magnitude
- **Neuron glow**: Activation intensity
- **Green output**: Correct prediction
- **Red output**: Incorrect prediction

## Performance Notes

Due to the high number of neural connections (~62,000), the visualizer uses:

- Instanced rendering for efficient GPU utilization
- Connection subsampling to maintain 60 FPS
- Weight thresholding to hide weak connections
- Web Worker for training to keep the UI responsive
