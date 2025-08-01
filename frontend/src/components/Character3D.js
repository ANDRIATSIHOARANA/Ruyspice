import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Model cache to avoid reloading the same models
const modelCache = new Map();

// Loading component to display while the model is loading - memoized to avoid re-renders
const LoadingModel = React.memo(() => {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gray" wireframe />
    </mesh>
  );
});

// Error boundary for model loading failures
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error loading 3D model:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Rotation controls component
const RotationControls = ({ onRotateLeft, onRotateRight, onRotateFront }) => {
  return (
    <Html position={[0, -2, 0]} center>
      <div className="rotation-controls">
        <button onClick={onRotateLeft} className="rotation-btn left-btn">
          ⟲
        </button>
        <button onClick={onRotateFront} className="rotation-btn front-btn">
          ⟳
        </button>
        <button onClick={onRotateRight} className="rotation-btn right-btn">
          ⟳
        </button>
      </div>
    </Html>
  );
};

// Component for the FBX model with proper error handling and caching
function Model({ url, animation, position, scale, rotation, initialFacingFront = true }) {
  const group = useRef();
  const [modelError, setModelError] = useState(null);
  const [model, setModel] = useState(null);
  const [mixer, setMixer] = useState(null);
  const [animationAction, setAnimationAction] = useState(null);
  const { camera } = useThree();
  
  // Function to rotate the model
  const rotateModel = (angle) => {
    if (model) {
      model.rotation.y += angle;
    }
  };

  // Function to set the model facing front
  const setModelFacingFront = () => {
    if (model) {
      // Set the model to face the camera
      model.rotation.y = initialFacingFront ? Math.PI : 0;
    }
  };
  
  // Expose rotation functions to parent via ref
  useEffect(() => {
    if (group.current) {
      group.current.rotateLeft = () => rotateModel(-Math.PI / 4);
      group.current.rotateRight = () => rotateModel(Math.PI / 4);
      group.current.faceFront = setModelFacingFront;
    }
  }, [model, initialFacingFront]);
  
  // Load the FBX model with explicit error handling and caching
  useEffect(() => {
    // Check if model is already in cache
    if (modelCache.has(url)) {
      const cachedModel = modelCache.get(url).clone();
      setModel(cachedModel);
      return;
    }
    
    const loader = new FBXLoader();
    
    loader.load(
      url,
      (fbx) => {
        // Success callback
        modelCache.set(url, fbx.clone()); // Store in cache
        setModel(fbx);
      },
      (xhr) => {
        // Progress callback - simplified for performance
        if (xhr.lengthComputable && xhr.loaded % (xhr.total / 4) < 1) {
          // Only log progress at 25%, 50%, 75% to reduce console spam
          const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
          console.log(`${percentComplete}% loaded`);
        }
      },
      (error) => {
        // Error callback
        console.error('Error loading model:', error);
        setModelError(error);
      }
    );
    
    // Cleanup function
    return () => {
      // Stop any animations
      if (animationAction) {
        animationAction.stop();
      }
      
      // Clear mixer
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [url]);
  
  // Handle animations once model is loaded
  useEffect(() => {
    if (model && animation) {
      // Set up animations if they exist
      if (model.animations && model.animations.length > 0) {
        // Create a new mixer only if it doesn't exist
        const newMixer = mixer || new THREE.AnimationMixer(model);
        if (!mixer) {
          setMixer(newMixer);
        }
        
        // Stop any existing animation
        if (animationAction) {
          animationAction.stop();
        }
        
        // Find the requested animation or use the first one
        const clip = model.animations.find(anim => 
          anim.name.toLowerCase() === animation.toLowerCase()
        ) || model.animations[0];
        
        if (clip) {
          // Stop any running animations
          newMixer.stopAllAction();
          
          // Start the new animation
          const action = newMixer.clipAction(clip);
          action.reset().fadeIn(0.5).play();
          setAnimationAction(action);
        }
      }
    }
  }, [model, animation, mixer, animationAction]);
  
  // Update animation mixer on each frame - optimized with delta time clamping
  useFrame((_, delta) => {
    if (mixer) {
      // Clamp delta to prevent large jumps if frame rate drops
      const clampedDelta = Math.min(delta, 0.05);
      mixer.update(clampedDelta);
    }
  });
  
  // If there's an error loading the model, show an error mesh
  if (modelError) {
    console.error('Model loading error:', modelError);
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.8, 1.6, 0.4]} />
          <meshStandardMaterial color="#4A90E2" />
        </mesh>
        <mesh position={[0, 0.9, 0.1]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#FFB6C1" />
        </mesh>
        <Html position={[0, -1, 0]} center>
          <div style={{ 
            color: 'red', 
            fontSize: '12px', 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.8)',
            padding: '4px',
            borderRadius: '4px'
          }}>
            Modèle 3D indisponible
          </div>
        </Html>
      </group>
    );
  }
  
  // If model is still loading, return null (the Suspense fallback will show)
  if (!model) {
    return null;
  }
  
  // Apply position, scale, and rotation to the model
  model.position.set(position[0], position[1], position[2]);
  model.scale.set(scale, scale, scale);
  
  // Set initial rotation - if initialFacingFront is true, make the model face the camera
  if (!model.initialRotationApplied) {
    model.rotation.set(rotation[0], initialFacingFront ? Math.PI : rotation[1], rotation[2]);
    model.initialRotationApplied = true;
  }
  
  // Apply shadows to all meshes in the model - optimized to run only once
  if (!model.shadowsApplied) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Optimize materials
        if (child.material) {
          child.material.needsUpdate = true;
          // Reduce material complexity for better performance
          child.material.flatShading = true;
        }
      }
    });
    model.shadowsApplied = true;
  }
  
  return (
    <group ref={group}>
      <primitive object={model} />
      <RotationControls 
        onRotateLeft={() => rotateModel(-Math.PI / 4)}
        onRotateRight={() => rotateModel(Math.PI / 4)}
        onRotateFront={setModelFacingFront}
      />
    </group>
  );
}

// Ground component with proper shadow receiving - memoized
const Ground = React.memo(() => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <shadowMaterial opacity={0.2} />
    </mesh>
  );
});

// Lighting setup component for better organization - memoized
const SceneLighting = React.memo(({ shadowMapSize = 512 }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
      />
    </>
  );
});

// Simple 3D character fallback component
const SimpleCharacter = React.memo(() => {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 1.6, 0.4]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0.1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FFB6C1" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.5, 0.2, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.5, 0.2, 0]}>
        <boxGeometry args={[0.2, 1, 0.2]} />
        <meshStandardMaterial color="#4A90E2" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -1.2, 0]}>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      <mesh position={[0.2, -1.2, 0]}>
        <boxGeometry args={[0.2, 1.2, 0.2]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
    </group>
  );
});

// Main component that encapsulates the Three.js Canvas - optimized with useMemo
const Character3D = ({ 
  url = "/assets/models/character.fbx",
  animation = 'idle', 
  position = [0, 0, 0],
  scale = 0.01, // Adjust based on your model size
  rotation = [0, 0, 0],
  style = {},
  onClick,
  enableControls = true,
  showGround = true,
  backgroundColor = null,
  highPerformance = false, // New prop for performance mode
  shadowMapSize = 1024, // Configurable shadow quality
  initialFacingFront = true, // New prop to control initial facing direction
  useFallback = false // New prop to force using simple character
}) => {
  const modelRef = useRef();
  
  // Memoize canvas props to avoid unnecessary re-renders
  const canvasProps = useMemo(() => ({
    shadows: true,
    camera: { position: [0, 1, 2], fov: 50 },
    gl: { 
      antialias: !highPerformance, // Disable antialiasing in high performance mode
      alpha: !backgroundColor,
      preserveDrawingBuffer: true, // Needed for screenshots
      powerPreference: 'high-performance',
      precision: highPerformance ? 'lowp' : 'highp' // Lower precision in high performance mode
    },
    style: backgroundColor ? { background: backgroundColor } : undefined,
    // Optimize frameloop for static models
    frameloop: animation === 'none' ? 'demand' : 'always'
  }), [backgroundColor, highPerformance, animation]);

  // Use smaller shadow maps in high performance mode
  const actualShadowMapSize = highPerformance ? Math.min(shadowMapSize, 512) : shadowMapSize;
  
  // Add CSS for rotation controls
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .rotation-controls {
        display: flex;
        gap: 10px;
        background: rgba(0, 0, 0, 0.2);
        padding: 5px;
        border-radius: 20px;
      }
      .rotation-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      .rotation-btn:hover {
        background: #f0f0f0;
      }
      .left-btn {
        transform: scaleX(-1);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div 
      className="character-3d-container" 
      style={{ width: '100%', height: '100%', ...style }}
      onClick={onClick}
    >
      <Canvas {...canvasProps}>
        {/* Scene setup */}
        <SceneLighting shadowMapSize={actualShadowMapSize} />
        
        {/* Ground plane to receive shadows - optional */}
        {showGround && <Ground />}
        
        {/* Model with loading suspense */}
        <ErrorBoundary fallback={
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="red" wireframe />
          </mesh>
        }>
          <Suspense fallback={<LoadingModel />}>
            <Model 
              ref={modelRef}
              url={url}
              animation={animation}
              position={position}
              scale={scale}
              rotation={rotation}
              initialFacingFront={initialFacingFront}
            />
          </Suspense>
        </ErrorBoundary>
        
        {/* Orbit controls - enabled based on prop */}
        {enableControls && <OrbitControls 
          makeDefault 
          enableDamping={!highPerformance} // Disable damping in high performance mode
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
        />}
      </Canvas>
    </div>
  );
};

// Export memoized component to prevent unnecessary re-renders
export default React.memo(Character3D);