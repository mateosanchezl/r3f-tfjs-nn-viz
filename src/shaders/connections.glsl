// Vertex shader for neural network connections
// Uses DataTexture to read weight values

uniform sampler2D weightTexture;
uniform float weightTextureSize;
uniform float threshold;
uniform float time;
uniform float pulseProgress;
uniform float pulsePhase; // 0 = idle, 1 = forward, 2 = backward

attribute float weightIndex;
attribute float layerIndex;

varying vec3 vColor;
varying float vOpacity;
varying float vLayerIndex;

void main() {
  // Read weight from texture
  float texX = mod(weightIndex, weightTextureSize) / weightTextureSize;
  float texY = floor(weightIndex / weightTextureSize) / weightTextureSize;
  vec4 weightData = texture2D(weightTexture, vec2(texX, texY));
  float weight = weightData.r;
  float absWeight = abs(weight);
  
  // Apply threshold
  if (absWeight < threshold) {
    vOpacity = 0.0;
    gl_Position = vec4(0.0);
    return;
  }
  
  // Color based on weight sign
  vec3 positiveColor = vec3(0.0, 1.0, 1.0); // Cyan
  vec3 negativeColor = vec3(1.0, 0.0, 1.0); // Magenta
  vColor = weight > 0.0 ? positiveColor : negativeColor;
  
  // Opacity based on weight magnitude
  vOpacity = 0.1 + absWeight * 0.6;
  
  // Pulse animation during forward/backward pass
  if (pulsePhase > 0.0) {
    float layerProgress = layerIndex / 3.0; // Normalize layer (0-3)
    float pulseCenter = pulseProgress;
    float pulseWidth = 0.15;
    
    float distFromPulse = abs(layerProgress - pulseCenter);
    float pulse = smoothstep(pulseWidth, 0.0, distFromPulse);
    
    if (pulsePhase == 2.0) {
      // Backward pass - red tint
      vColor = mix(vColor, vec3(1.0, 0.3, 0.3), pulse * 0.5);
    } else {
      // Forward pass - brighten
      vColor = mix(vColor, vec3(1.0), pulse * 0.5);
    }
    vOpacity += pulse * 0.4;
  }
  
  vLayerIndex = layerIndex;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment shader
// varying vec3 vColor;
// varying float vOpacity;
// 
// void main() {
//   if (vOpacity < 0.01) discard;
//   gl_FragColor = vec4(vColor, vOpacity);
// }

