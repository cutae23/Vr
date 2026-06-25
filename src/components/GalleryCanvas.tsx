import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Artwork, ExhibitionHall, HallType, PlayerPosition } from '../types';
import { Eye, HelpCircle, Move, RotateCw, RotateCcw, Sparkles, ZoomIn, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

interface GalleryCanvasProps {
  hall: ExhibitionHall;
  artworks: Artwork[];
  activeWallId: string | null;
  onWallClick: (wallId: string) => void;
  onPlayerMove: (pos: PlayerPosition) => void;
  focusArtworkId: string | null;
  onClearFocus: () => void;
  dpadControl: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
  };
  nearestArtworkId?: string | null;
  onSelectHall?: (hallId: HallType) => void;
  prevHallId?: HallType | null;
  nextHallId?: HallType | null;
  prevHallName?: string;
  nextHallName?: string;
}

export default function GalleryCanvas({
  hall,
  artworks,
  activeWallId,
  onWallClick,
  onPlayerMove,
  focusArtworkId,
  onClearFocus,
  dpadControl,
  nearestArtworkId,
  onSelectHall,
  prevHallId,
  nextHallId,
  prevHallName,
  nextHallName
}: GalleryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep mutables in ref to avoid re-initializing the entire WebGL Context
  const stateRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    artMeshes: Map<string, THREE.Group>;
    wallMeshes: Map<string, THREE.Mesh>;
    lights: THREE.Light[];
    docentLights: THREE.SpotLight[];
    player: {
      x: number;
      z: number;
      yaw: number;
      targetYaw: number;
      pitch: number;
    };
    keys: Record<string, boolean>;
    mouse: {
      isDown: boolean;
      prevX: number;
      prevY: number;
    };
    roomBoundaries: { minX: number; maxX: number; minZ: number; maxZ: number };
    animationFrameId: number | null;
    activeHallId: HallType | null;
    activeWallCount: number | null;
    videoElements: Map<string, HTMLVideoElement>;
    portalMeshes: THREE.Object3D[];
  }>({
    scene: null,
    camera: null,
    renderer: null,
    artMeshes: new Map(),
    wallMeshes: new Map(),
    lights: [],
    docentLights: [],
    player: { x: 0, z: 6, yaw: 0, targetYaw: 0, pitch: 0 },
    keys: {},
    mouse: { isDown: false, prevX: 0, prevY: 0 },
    roomBoundaries: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
    animationFrameId: null,
    activeHallId: null,
    activeWallCount: null,
    videoElements: new Map(),
    portalMeshes: []
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [controlsGuide, setControlsGuide] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Trigger canvas resize update on fullscreen change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          (containerRef.current as any).webkitRequestFullscreen();
        } else {
          // Fallback if APIs are not supported in this nested preview iframe environment
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else {
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn("Fullscreen request failed, applying high-fidelity layout fallback:", e);
      setIsFullscreen(!isFullscreen);
    }
  };

  // Synchronize dpad control state and callback to avoid stale closures under empty dependency array of WebGL mount
  const dpadRef = useRef(dpadControl);
  useEffect(() => {
    dpadRef.current = dpadControl;
  }, [dpadControl]);

  const onPlayerMoveRef = useRef(onPlayerMove);
  useEffect(() => {
    onPlayerMoveRef.current = onPlayerMove;
  }, [onPlayerMove]);

  const onSelectHallRef = useRef(onSelectHall);
  const prevHallIdRef = useRef(prevHallId);
  const nextHallIdRef = useRef(nextHallId);

  useEffect(() => {
    onSelectHallRef.current = onSelectHall;
    prevHallIdRef.current = prevHallId;
    nextHallIdRef.current = nextHallId;
  }, [onSelectHall, prevHallId, nextHallId]);

  // Initialize ThreeJS once
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);
    stateRef.current.scene = scene;

    // 2. Camera
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    // Position camera at default human height (1.68m)
    camera.position.set(0, 1.68, 6);
    stateRef.current.camera = camera;

    // 3. Renderer with shadows and high DPI support
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping for beautiful colors
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    stateRef.current.renderer = renderer;

    setLoading(false);
    setIsInitialized(true);

    // 4. Mouse click raycaster for interactive wall selections
    const raycaster = new THREE.Raycaster();
    const ndcMouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      // Focus the canvas so keyboard events are captured reliably inside the preview iframe!
      canvasRef.current?.focus();
      
      // Prevent raycasting if we dragged too far (distinguished click vs drag look around)
      const rect = renderer.domElement.getBoundingClientRect();
      ndcMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndcMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(ndcMouse, camera);
      const interactableTargets: THREE.Object3D[] = [];
      stateRef.current.artMeshes.forEach(meshGroup => {
        interactableTargets.push(...meshGroup.children);
      });
      stateRef.current.wallMeshes.forEach(mesh => {
        interactableTargets.push(mesh);
      });
      if (stateRef.current.portalMeshes) {
        interactableTargets.push(...stateRef.current.portalMeshes);
      }

      const intersects = raycaster.intersectObjects(interactableTargets, true);
      if (intersects.length > 0) {
        // Find ancestor or associated user data to fetch Wall ID or Portal Action
        let currentObj: THREE.Object3D | null = intersects[0].object;
        let detectedWallId: string | null = null;
        let detectedPortalAction: 'prev' | 'next' | null = null;

        while (currentObj) {
          if (currentObj.userData && currentObj.userData.portalAction) {
            detectedPortalAction = currentObj.userData.portalAction;
            break;
          }
          if (currentObj.userData && currentObj.userData.wallId) {
            detectedWallId = currentObj.userData.wallId;
            break;
          }
          currentObj = currentObj.parent;
        }

        if (detectedPortalAction) {
          const action = detectedPortalAction;
          if (action === 'prev' && prevHallIdRef.current && onSelectHallRef.current) {
            onSelectHallRef.current(prevHallIdRef.current);
          } else if (action === 'next' && nextHallIdRef.current && onSelectHallRef.current) {
            onSelectHallRef.current(nextHallIdRef.current);
          }
        } else if (detectedWallId) {
          onWallClick(detectedWallId);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleCanvasClick);

    // 5. Handling Resize dynamically using ResizeObserver (robust stage sizing)
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return; // Prevent NaN in aspect ratio during initial zero-height render
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    // 6. Handle Mouse/Touch Lock & Look-around Click/Swipe safely inside iframe
    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.mouse.isDown = true;
      stateRef.current.mouse.prevX = e.clientX;
      stateRef.current.mouse.prevY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.mouse.isDown) return;
      const deltaX = e.clientX - stateRef.current.mouse.prevX;
      const deltaY = e.clientY - stateRef.current.mouse.prevY;

      stateRef.current.mouse.prevX = e.clientX;
      stateRef.current.mouse.prevY = e.clientY;

      // Adjust camera yaw/pitch angles
      stateRef.current.player.yaw -= deltaX * 0.0035;
      stateRef.current.player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, stateRef.current.player.pitch - deltaY * 0.0035));
    };

    const handleMouseUp = () => {
      stateRef.current.mouse.isDown = false;
    };

    // Touch handlers for mobile swipe rotation
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        stateRef.current.mouse.isDown = true;
        stateRef.current.mouse.prevX = e.touches[0].clientX;
        stateRef.current.mouse.prevY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.mouse.isDown || e.touches.length === 0) return;
      // Prevent browser visual pull-to-refresh / scrolling when swiping inside the canvas
      e.preventDefault();
      const deltaX = e.touches[0].clientX - stateRef.current.mouse.prevX;
      const deltaY = e.touches[0].clientY - stateRef.current.mouse.prevY;

      stateRef.current.mouse.prevX = e.touches[0].clientX;
      stateRef.current.mouse.prevY = e.touches[0].clientY;

      // Adjust camera yaw/pitch angles with minor mobile adjustments
      stateRef.current.player.yaw -= deltaX * 0.0045;
      stateRef.current.player.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, stateRef.current.player.pitch - deltaY * 0.0045));
    };

    const handleTouchEnd = () => {
      stateRef.current.mouse.isDown = false;
    };

    // Keyboard bindings
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      stateRef.current.keys[key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      stateRef.current.keys[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // 7. Core Render & physics tick loop
    const clock = new THREE.Clock();
    const tick = () => {
      // Guard render loop if scene/renderer is cleaned up or component unmounted
      if (!stateRef.current.scene || !stateRef.current.renderer) {
        return;
      }
      const delta = Math.min(clock.getDelta(), 0.1); // cap frame interval to prevent physics clipping
      const player = stateRef.current.player;
      const keys = stateRef.current.keys;

      // Camera Keyboard Motion
      const moveSpeed = 4.2 * delta;
      const turnSpeed = 1.8 * delta;

      // Calculate vector look-direction
      const forwardX = Math.sin(player.yaw);
      const forwardZ = Math.cos(player.yaw);

      let dx = 0;
      let dz = 0;

      // WASD/Arrows Movement
      if (keys['w'] || keys['arrowup'] || dpadRef.current.forward) {
        dx -= forwardX * moveSpeed;
        dz -= forwardZ * moveSpeed;
      }
      if (keys['s'] || keys['arrowdown'] || dpadRef.current.backward) {
        dx += forwardX * moveSpeed;
        dz += forwardZ * moveSpeed;
      }
      if (keys['a'] || dpadRef.current.left) {
        // Sidestep left
        dx -= forwardZ * moveSpeed;
        dz += forwardX * moveSpeed;
      }
      if (keys['d'] || dpadRef.current.right) {
        // Sidestep right
        dx += forwardZ * moveSpeed;
        dz -= forwardX * moveSpeed;
      }

      // Continuous rotation
      if (keys['q'] || dpadRef.current.turnLeft) {
        player.yaw += turnSpeed;
      }
      if (keys['e'] || dpadRef.current.turnRight) {
        player.yaw -= turnSpeed;
      }

      // Apply displacement
      player.x += dx;
      player.z += dz;

      // Enforce room wall boundaries to prevent falling into the void
      const bounds = stateRef.current.roomBoundaries;
      player.x = Math.max(bounds.minX + 1.2, Math.min(bounds.maxX - 1.2, player.x));
      player.z = Math.max(bounds.minZ + 1.2, Math.min(bounds.maxZ - 1.2, player.z));

      // Report player coordinates back to React (throttle slightly to avoid blocking UI)
      onPlayerMoveRef.current({ x: player.x, z: player.z, angle: player.yaw });

      // Apply camera positioning
      if (camera) {
        // Human eye-level offset
        camera.position.x = player.x;
        camera.position.z = player.z;
        camera.position.y = 1.68 + Math.sin(Date.now() * 0.0035) * (dx || dz ? 0.04 : 0); // Gentle bobbing step effect

        // Rotate camera matching yaw/pitch Euler angles
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), player.pitch);
        camera.quaternion.copy(qYaw).multiply(qPitch);
      }

      // Render Scene
      if (scene && camera) {
        renderer.render(scene, camera);
      }

      stateRef.current.animationFrameId = requestAnimationFrame(tick);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(tick);

    // Cleanup resources
    return () => {
      if (stateRef.current.animationFrameId) {
        cancelAnimationFrame(stateRef.current.animationFrameId);
      }
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      stateRef.current.videoElements.forEach(video => {
        try {
          video.pause();
          video.src = "";
          video.load();
        } catch (err) {}
      });
      stateRef.current.videoElements.clear();

      renderer.dispose();

      // Clean up state ref completely to support StrictMode unmount-remount
      stateRef.current.scene = null;
      stateRef.current.activeHallId = null;
      stateRef.current.artMeshes.clear();
      stateRef.current.wallMeshes.clear();
      setIsInitialized(false);
    };
  }, []);

  // Update Hall theme structures and active walls (Triggered when hall changes or artwork limits change)
  useEffect(() => {
    const scene = stateRef.current.scene;
    const player = stateRef.current.player;
    if (!scene) return;

    // Prevent duplicate reload
    if (
      stateRef.current.activeHallId === hall.id &&
      stateRef.current.activeWallCount === hall.wallPositions.length
    ) {
      return;
    }

    const isDifferentHall = stateRef.current.activeHallId !== hall.id;

    stateRef.current.activeHallId = hall.id;
    stateRef.current.activeWallCount = hall.wallPositions.length;

    // 1. Remove older objects to reset space
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(child => {
      // Keep only system objects if any or remove all
      toRemove.push(child);
    });
    toRemove.forEach(child => scene.remove(child));

    if (isDifferentHall) {
      // Reset player position safely on hall transition only
      player.x = 0;
      player.z = 7;
      player.yaw = 0;
      player.pitch = 0;
    }

    // Reset collections
    stateRef.current.artMeshes.clear();
    stateRef.current.wallMeshes.clear();

    // 2. Set beautiful Fog and background uniquely tuned for each of the 10 halls
    let bgColor = 0x0a0a14;
    let fogDensity = 0.022;
    if (hall.id === 'classic') {
      bgColor = 0x150b04; // dark warm terracotta brown
      fogDensity = 0.018;
    } else if (hall.id === 'modern') {
      bgColor = 0xe2e8f0; // ultra premium studio light neutral grey
      fogDensity = 0.015;
    } else if (hall.id === 'neon') {
      bgColor = 0x03030c; // obsidian cyber deep void
      fogDensity = 0.035;
    } else if (hall.id === 'nordic') {
      bgColor = 0xf3ede2; // birch forest warm cream mist
      fogDensity = 0.022;
    } else if (hall.id === 'retro') {
      bgColor = 0x190824; // vaporwave violet twilight
      fogDensity = 0.026;
    } else if (hall.id === 'monochrome') {
      bgColor = 0x0e0e10; // pure minimalist charcoal black/slate
      fogDensity = 0.025;
    } else if (hall.id === 'vanguard') {
      bgColor = 0x070b12; // deep industrial steel navy blue
      fogDensity = 0.02;
    } else if (hall.id === 'cyberpunk') {
      bgColor = 0x05010a; // techno acid dark void
      fogDensity = 0.032;
    } else if (hall.id === 'zen') {
      bgColor = 0x0c110b; // deep serene garden moss fog
      fogDensity = 0.028;
    } else if (hall.id === 'renaissance') {
      bgColor = 0x0f0702; // sacred cathedral warm dark shadow
      fogDensity = 0.018;
    }

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, fogDensity);

    // 3. Construct Floor & Ceiling dynamically based on custom synthesized textures for EACH of the 10 halls
    let floorMat: THREE.Material;
    let ceilingMat: THREE.Material;

    if (hall.id === 'classic') {
      // Classic wood parquet oak texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#3e250f'; // elegant warm mahogany/oak tone
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#231305';
      ctx.lineWidth = 3;
      // Draw procedural wooden planks
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        for (let j = 0; j < 512; j += 128) {
          const shift = (i / 64) % 2 === 0 ? 0 : 64;
          ctx.beginPath();
          ctx.moveTo(i, j + shift);
          ctx.lineTo(i + 64, j + shift);
          ctx.stroke();
        }
      }
      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(6, 6);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.25,
        metalness: 0.12
      });

      // Vaulted Ceiling material
      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x24180d, // Dark mahogany wood beams style
        roughness: 0.85
      });

    } else if (hall.id === 'modern') {
      // Modern slate/concrete tiles
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f1f5f9'; // sleek light gray studio floor
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#cbd5e1';
      // Noise grain
      for (let k = 0; k < 400; k++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const s = Math.random() * 1.5;
        ctx.fillRect(x, y, s, s);
      }
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 256, 256);

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(8, 8);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.35,
        metalness: 0.05
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.95
      });

    } else if (hall.id === 'neon') {
      // Cyber Neon grid floor
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#05050f';
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#f72585'; // pulsing pink grid
      ctx.lineWidth = 2.5;
      ctx.strokeRect(0, 0, 128, 128);

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(12, 12);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        emissiveMap: floorTex,
        emissive: new THREE.Color(0xf72585),
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.75
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x080812,
        roughness: 0.4,
        metalness: 0.85
      });

    } else if (hall.id === 'nordic') {
      // Natural Swedish Blonde Ash Parquet texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f7f4ee'; // ash wood beige
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#e6dcce';
      ctx.lineWidth = 4;
      for (let y = 0; y < 256; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(215,200,180,0.4)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * 512, Math.random() * 256, 40, 6, Math.random() * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(6, 12);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.65,
        metalness: 0.05
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0xfbfbf9,
        roughness: 0.95
      });

    } else if (hall.id === 'retro') {
      // Atari retro citypop checkerboard grid floor
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1e052d'; // vapor violet-plum
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#390b59';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillRect(64, 64, 64, 64);
      ctx.strokeStyle = '#f59e0b'; // amber neon lines
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 128, 128);

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(10, 10);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        emissiveMap: floorTex,
        emissive: new THREE.Color(0xf59e0b),
        emissiveIntensity: 0.15,
        roughness: 0.1,
        metalness: 0.9
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x11021c,
        roughness: 0.6,
        metalness: 0.8
      });

    } else if (hall.id === 'monochrome') {
      // Brutalist raw cast concrete tiles
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#09090b'; // deep charcoal
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#18181b';
      // Noise gravel
      for (let k = 0; k < 600; k++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const s = Math.random() * 2.5;
        ctx.fillRect(x, y, s, s);
      }
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, 256, 256);

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(12, 12);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.85,
        metalness: 0.05
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.95
      });

    } else if (hall.id === 'vanguard') {
      // Industrial metal plate floor
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#1e293b'; // space steel gray
      ctx.fillRect(0, 0, 128, 128);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 128, 128);
      // Tread diagonal pattern
      ctx.strokeStyle = 'rgba(71,85,105,0.4)';
      ctx.lineWidth = 3;
      for (let i = -128; i < 128; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 128, 128);
        ctx.stroke();
      }

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(14, 14);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.2,
        metalness: 0.95
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x090d10,
        roughness: 0.4,
        metalness: 0.9
      });

    } else if (hall.id === 'cyberpunk') {
      // Green neon circuits board tech plate
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#06010a'; // pure black
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // bright acid emerald green
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const startX = 32 + i * 64;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, 96);
        ctx.lineTo(startX + 32, 128);
        ctx.lineTo(startX + 32, 256);
        ctx.stroke();
        
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(startX + 32, 128, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(8, 8);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        emissiveMap: floorTex,
        emissive: new THREE.Color(0x10b981),
        emissiveIntensity: 0.3,
        roughness: 0.1,
        metalness: 0.8
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x09050d,
        roughness: 0.5,
        metalness: 0.9
      });

    } else if (hall.id === 'zen') {
      // Asian tranquil raked sand gravel
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fefaf2'; // rich organic cream sand
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = 'rgba(180, 160, 130, 0.3)';
      ctx.lineWidth = 4;
      for (let r = 20; r < 240; r += 24) {
        ctx.beginPath();
        ctx.arc(128, 128, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(8, 8);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.85,
        metalness: 0.0
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0xfdf6ea,
        roughness: 0.95
      });

    } else if (hall.id === 'renaissance') {
      // Chess board Vatican marble checker tiles
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#f3e8ff'; // white royal carrara marble
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#450a0a'; // imperial cardinal burgundy wine marble
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillRect(256, 256, 256, 256);
      ctx.strokeStyle = '#92400e'; // golden copper lines
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 512, 512);

      const floorTex = new THREE.CanvasTexture(canvas);
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(5, 5);

      floorMat = new THREE.MeshStandardMaterial({
        map: floorTex,
        roughness: 0.12, // extremely polished glossy marble slabs
        metalness: 0.25
      });

      ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x1a0701,
        roughness: 0.75
      });

    } else {
      // Fallback
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, 128, 128);
      const floorTex = new THREE.CanvasTexture(canvas);
      floorMat = new THREE.MeshStandardMaterial({ map: floorTex });
      ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0a0a14 });
    }

    // Main floor mesh
    const roomSize = 24;
    const floorGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Ceiling Mesh
    const ceilingGeo = new THREE.PlaneGeometry(roomSize, roomSize);
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.position.y = hall.ceilingHeight;
    ceilingMesh.rotation.x = Math.PI / 2;
    scene.add(ceilingMesh);

    // Store room bounds for physics collisions
    stateRef.current.roomBoundaries = {
      minX: -roomSize / 2,
      maxX: roomSize / 2,
      minZ: -roomSize / 2,
      maxZ: roomSize / 2
    };

    // 4. Construct Decorative architectural geometries & Curation Spaces uniquely tailored for EACH of the 10 halls
    if (hall.id === 'classic') {
      // Elegant golden molding lines around wall edges
      const moldingGeo = new THREE.BoxGeometry(0.15, 0.15, roomSize);
      const moldingMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });
      const leftMolding = new THREE.Mesh(moldingGeo, moldingMat);
      leftMolding.position.set(-11.9, 0.1, 0);
      scene.add(leftMolding);

      const rightMolding = leftMolding.clone();
      rightMolding.position.x = 11.9;
      scene.add(rightMolding);

      // Fluted Greek Corinthian columns in the corners
      const colGeo = new THREE.CylinderGeometry(0.35, 0.35, hall.ceilingHeight, 12);
      const colMat = new THREE.MeshStandardMaterial({ color: 0xf5ebd5, roughness: 0.5 });
      const corners = [
        [-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]
      ];
      corners.forEach(([cx, cz]) => {
        const pillar = new THREE.Mesh(colGeo, colMat);
        pillar.position.set(cx, hall.ceilingHeight / 2, cz);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);
      });

    } else if (hall.id === 'modern') {
      // Sleek floating rectangular ceiling track suspension
      const trackGeo = new THREE.BoxGeometry(16, 0.1, 16);
      const trackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const floatingTrack = new THREE.Mesh(trackGeo, trackMat);
      floatingTrack.position.set(0, hall.ceilingHeight - 0.4, 0);
      scene.add(floatingTrack);

      // Minimalist glass/brushed steel central partition pedestal display
      const pedestalGeo = new THREE.BoxGeometry(1.2, 0.9, 1.2);
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
      pedestal.position.set(0, 0.45, -1.0);
      pedestal.castShadow = true;
      scene.add(pedestal);

      const glassGeo = new THREE.BoxGeometry(1.0, 0.6, 1.0);
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, roughness: 0.1, transmission: 0.9 });
      const glassCase = new THREE.Mesh(glassGeo, glassMat);
      glassCase.position.set(0, 1.2, -1.0);
      scene.add(glassCase);

    } else if (hall.id === 'neon') {
      // Luminous LED grid rails on the ceiling plus central cyber holographic rings
      const railMat = new THREE.MeshBasicMaterial({ color: 0x00f5d4 });
      for (let rx = -10; rx <= 10; rx += 5) {
        const lineGeo = new THREE.BoxGeometry(0.08, 0.08, roomSize);
        const line = new THREE.Mesh(lineGeo, railMat);
        line.position.set(rx, hall.ceilingHeight - 0.05, 0);
        scene.add(line);
      }

      // Deep Space neon double toruses at central zone
      const torusGeo = new THREE.TorusGeometry(1.8, 0.05, 8, 32);
      const torusMatMat = new THREE.MeshBasicMaterial({ color: 0xf72585 });
      const ring1 = new THREE.Mesh(torusGeo, torusMatMat);
      ring1.position.set(0, 2.0, -1.5);
      ring1.rotation.x = Math.PI / 4;
      scene.add(ring1);

      const ring2 = new THREE.Mesh(torusGeo, new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      ring2.position.set(0, 2.0, -1.5);
      ring2.rotation.y = Math.PI / 4;
      scene.add(ring2);

    } else if (hall.id === 'nordic') {
      // Warm Nordic structural logs (wooden columns)
      const logGeo = new THREE.CylinderGeometry(0.24, 0.24, hall.ceilingHeight, 8);
      const logMat = new THREE.MeshStandardMaterial({ color: 0xd6c2a5, roughness: 0.8 });
      const logs = [
        [-11.5, -11.5], [11.5, -11.5], [-11.5, 11.5], [11.5, 11.5]
      ];
      logs.forEach(([lx, lz]) => {
        const log = new THREE.Mesh(logGeo, logMat);
        log.position.set(lx, hall.ceilingHeight / 2, lz);
        log.castShadow = true;
        scene.add(log);
      });

      // Warm birch ceiling beam grids
      for (let bx = -9; bx <= 9; bx += 4.5) {
        const beamGeo = new THREE.BoxGeometry(0.12, 0.25, roomSize);
        const beamMesh = new THREE.Mesh(beamGeo, logMat);
        beamMesh.position.set(bx, hall.ceilingHeight - 0.125, 0);
        scene.add(beamMesh);
      }

    } else if (hall.id === 'retro') {
      // Atari vaporwave floating gold octahedrons at sides and orange light strips
      const dMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
      const octGeo = new THREE.OctahedronGeometry(0.4, 0);
      for (let k = 0; k < 4; k++) {
        const oct = new THREE.Mesh(octGeo, dMat);
        oct.position.set(-8 + k * 5, 2.8, k % 2 === 0 ? -4 : 4);
        scene.add(oct);
      }

      // Orange neon floor linings
      const liningGeo = new THREE.BoxGeometry(roomSize, 0.05, 0.05);
      const liningMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const backLining = new THREE.Mesh(liningGeo, liningMat);
      backLining.position.set(0, 0.025, -11.9);
      scene.add(backLining);

    } else if (hall.id === 'monochrome') {
      // Massive Brutalist concrete pillars flanking the central area
      const bigColGeo = new THREE.BoxGeometry(1.6, hall.ceilingHeight, 1.6);
      const bigColMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
      
      const pillar1 = new THREE.Mesh(bigColGeo, bigColMat);
      pillar1.position.set(-6, hall.ceilingHeight / 2, -4);
      pillar1.castShadow = true;
      pillar1.receiveShadow = true;
      scene.add(pillar1);

      const pillar2 = pillar1.clone();
      pillar2.position.set(6, hall.ceilingHeight / 2, -4);
      scene.add(pillar2);

    } else if (hall.id === 'vanguard') {
      // Industrial ceiling truss work
      const pipeGeo = new THREE.BoxGeometry(0.08, 0.08, roomSize);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.1 });
      for (let ty = 3.5; ty <= hall.ceilingHeight; ty += 1.0) {
        const pipeLeft = new THREE.Mesh(pipeGeo, pipeMat);
        pipeLeft.position.set(-8, ty, 0);
        scene.add(pipeLeft);
        
        const pipeRight = pipeLeft.clone();
        pipeRight.position.x = 8;
        scene.add(pipeRight);
      }

      // Diagonal cross-trussing beams
      const crossGeo = new THREE.BoxGeometry(0.05, 0.05, 12);
      const crossMesh = new THREE.Mesh(crossGeo, pipeMat);
      crossMesh.position.set(0, hall.ceilingHeight - 0.5, 0);
      crossMesh.rotation.y = Math.PI / 4;
      scene.add(crossMesh);

    } else if (hall.id === 'cyberpunk') {
      // Glow-green glass columns pulsing power lines
      const cyberColGeo = new THREE.CylinderGeometry(0.15, 0.15, hall.ceilingHeight, 6);
      const cyberColMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });
      
      const cCorners = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
      cCorners.forEach(([cx, cz]) => {
        const cyl = new THREE.Mesh(cyberColGeo, cyberColMat);
        cyl.position.set(cx, hall.ceilingHeight / 2, cz);
        scene.add(cyl);
        
        // Add neon central core rod
        const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, hall.ceilingHeight, 4);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(cx, hall.ceilingHeight / 2, cz);
        scene.add(core);
      });

    } else if (hall.id === 'zen') {
      // Central serene circular sand gravel bed platform
      const circleBedGeo = new THREE.CylinderGeometry(3.0, 3.2, 0.1, 24);
      const circleBedMat = new THREE.MeshStandardMaterial({ color: 0xdfd8ca, roughness: 0.95 });
      const bed = new THREE.Mesh(circleBedGeo, circleBedMat);
      bed.position.set(0, 0.05, -1.0);
      bed.receiveShadow = true;
      scene.add(bed);

      // Simple low-poly natural stone rock in center of sand
      const rockGeo = new THREE.DodecahedronGeometry(0.45, 0);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const centralRock = new THREE.Mesh(rockGeo, rockMat);
      centralRock.position.set(0, 0.45, -1.0);
      centralRock.castShadow = true;
      scene.add(centralRock);

    } else if (hall.id === 'renaissance') {
      // Vatican majestic cathedral arch ribs spanning the high 9m ceiling
      const archLogMat = new THREE.MeshStandardMaterial({ color: 0x4c2912, roughness: 0.75 }); // luxury polished wood
      for (let az = -9; az <= 9; az += 6) {
        // Left Column support
        const colG = new THREE.CylinderGeometry(0.24, 0.35, hall.ceilingHeight, 8);
        const colL = new THREE.Mesh(colG, archLogMat);
        colL.position.set(-11.5, hall.ceilingHeight / 2, az);
        colL.castShadow = true;
        scene.add(colL);

        // Right Column support
        const colR = colL.clone();
        colR.position.x = 11.5;
        scene.add(colR);

        // Ceiling cross arch beam
        const archBeamG = new THREE.BoxGeometry(roomSize, 0.25, 0.25);
        const archBeam = new THREE.Mesh(archBeamG, archLogMat);
        archBeam.position.set(0, hall.ceilingHeight - 0.125, az);
        scene.add(archBeam);
      }
    }

    // 5. Ambient & Directional Lights
    // Fine-tuned chroma colors and extreme premium spotlights for all 10 halls to make artworks stand out perfectly
    let ambientColor = 0xffeed5;
    let ambientIntensity = 0.95;
    let skyLightColor = 0xffffff;
    let skyLightIntensity = 1.15;

    if (hall.id === 'classic') {
      ambientColor = 0xfff3e0;
      ambientIntensity = 0.95;
      skyLightColor = 0xfffae6;
      skyLightIntensity = 1.1;
    } else if (hall.id === 'modern') {
      ambientColor = 0xf1f5f9;
      ambientIntensity = 1.1;
      skyLightColor = 0xffffff;
      skyLightIntensity = 1.35;
    } else if (hall.id === 'neon') {
      ambientColor = 0x3b1c55;
      ambientIntensity = 1.25;
      skyLightColor = 0x00f5d4;
      skyLightIntensity = 0.9;
    } else if (hall.id === 'nordic') {
      ambientColor = 0xfffaf0;
      ambientIntensity = 1.05;
      skyLightColor = 0xe0f2fe;
      skyLightIntensity = 1.4; // super bright natural window wash
    } else if (hall.id === 'retro') {
      ambientColor = 0xfdf4ff;
      ambientIntensity = 1.05;
      skyLightColor = 0xf59e0b;
      skyLightIntensity = 1.2;
    } else if (hall.id === 'monochrome') {
      ambientColor = 0xd1d5db;
      ambientIntensity = 0.8;
      skyLightColor = 0xffffff;
      skyLightIntensity = 1.3;
    } else if (hall.id === 'vanguard') {
      ambientColor = 0xe0f2fe;
      ambientIntensity = 1.0;
      skyLightColor = 0x38bdf8;
      skyLightIntensity = 1.3;
    } else if (hall.id === 'cyberpunk') {
      ambientColor = 0x111827;
      ambientIntensity = 1.25;
      skyLightColor = 0x10b981;
      skyLightIntensity = 1.1;
    } else if (hall.id === 'zen') {
      ambientColor = 0xecfdf5;
      ambientIntensity = 1.1;
      skyLightColor = 0xa3e635;
      skyLightIntensity = 1.25;
    } else if (hall.id === 'renaissance') {
      ambientColor = 0xfef3c7;
      ambientIntensity = 0.75; // candle drama
      skyLightColor = 0xf59e0b;
      skyLightIntensity = 1.4; // divine beam downwards
    }

    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const skyLight = new THREE.DirectionalLight(skyLightColor, skyLightIntensity);
    skyLight.position.set(5, 12, 3);
    skyLight.castShadow = true;
    skyLight.shadow.mapSize.width = 1024;
    skyLight.shadow.mapSize.height = 1024;
    scene.add(skyLight);

    // 6. Draw actual exhibition partition walls corresponding to the Hall config
    const wallMat = new THREE.MeshStandardMaterial({
      color: 
        hall.id === 'classic' ? 0xecdcb5 : 
        hall.id === 'modern' ? 0xf8fafc : 
        hall.id === 'neon' ? 0x0c0c17 : 
        hall.id === 'nordic' ? 0xfbfbf9 : 
        0x141212, // retro
      roughness: hall.id === 'classic' ? 0.7 : hall.id === 'modern' ? 0.9 : hall.id === 'neon' ? 0.5 : 0.8,
      metalness: hall.id === 'neon' ? 0.4 : hall.id === 'retro' ? 0.3 : 0.1
    });

    hall.wallPositions.forEach(wallDef => {
      // Wall Geometry
      const wallW = wallDef.maxDimensions.width + 1.2;
      const wallH = hall.ceilingHeight;
      const wallThickness = 0.45;

      const wallGeo = new THREE.BoxGeometry(wallW, wallH, wallThickness);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(wallDef.position[0], wallDef.position[1] + (wallH / 4), wallDef.position[2]); // adjust base offset
      wallMesh.position.y = wallH / 2; // rest on ground
      wallMesh.rotation.set(wallDef.rotation[0], wallDef.rotation[1], wallDef.rotation[2]);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;

      // Tag wall ID securely in user data for Raycaster lookup clicks
      wallMesh.userData = { wallId: wallDef.id };

      scene.add(wallMesh);
      stateRef.current.wallMeshes.set(wallDef.id, wallMesh);

      // Create a small Spotlight over the wall directing at center
      const spotLight = new THREE.SpotLight(
        hall.id === 'classic' ? 0xffdfaa : 
        hall.id === 'modern' ? 0xffffff : 
        hall.id === 'neon' ? 0xf72585 : 
        hall.id === 'nordic' ? 0xfffcf5 : 
        0xf59e0b, // retro

        hall.id === 'classic' ? 5.2 : 
        hall.id === 'modern' ? 6.0 : 
        hall.id === 'neon' ? 5.0 : 
        hall.id === 'nordic' ? 4.8 : 
        5.5, // retro

        20,
        Math.PI / 3.8,
        0.5,
        1
      );
      // Place spotlight slightly away from wall, hanging from ceiling
      const angle = wallDef.rotation[1];
      const distance = 2.5;
      const sx = wallDef.position[0] + Math.sin(angle) * distance;
      const sz = wallDef.position[2] + Math.cos(angle) * distance;
      
      spotLight.position.set(sx, hall.ceilingHeight - 0.5, sz);

      // Point at center of the wall
      const targetObj = new THREE.Object3D();
      targetObj.position.set(wallDef.position[0], 1.68, wallDef.position[2]);
      scene.add(targetObj);
      spotLight.target = targetObj;

      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 512;
      spotLight.shadow.mapSize.height = 512;

      scene.add(spotLight);
    });

    // 6.5. Generate physical next/previous hall portals/doors in the 3D VR space!
    stateRef.current.portalMeshes = [];

    const createPortalTexture = (title: string, subtitle: string, isNext: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Premium background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      if (isNext) {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#4f46e5');
        grad.addColorStop(1, '#818cf8');
      } else {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#0d9488');
        grad.addColorStop(1, '#2dd4bf');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1024);

      // Border frame glow stroke
      ctx.strokeStyle = isNext ? '#c7d2fe' : '#99f6e4';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 512 - 20, 1024 - 20);

      // Add cyber horizontal grids
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      for (let y = 140; y < 1024; y += 120) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(512 - 20, y);
        ctx.stroke();
      }

      // Draw Action Arrow icon
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 96px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isNext ? '▶' : '◀', 256, 250);

      // Draw Portal title
      ctx.font = 'bold 38px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(title, 256, 430);

      // Draw Hall subtitle name
      ctx.font = 'bold 42px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      const cleanSub = subtitle.split(' : ')[1] || subtitle;
      const slicedSub = cleanSub.length > 12 ? cleanSub.slice(0, 11) + '...' : cleanSub;
      ctx.fillText(slicedSub, 256, 520);

      // Draw instruction
      ctx.font = 'bold 28px Inter, sans-serif';
      ctx.fillStyle = isNext ? '#a5b4fc' : '#5eead4';
      ctx.fillText('워프 게이트 클릭', 256, 760);
      ctx.font = 'normal 24px sans-serif';
      ctx.fillText('(Click to Enter)', 256, 810);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.15
    });

    // Helper to spawn a full portal in the scene
    const spawnPortal = (isNext: boolean, targetHallId: HallType | null | undefined, targetHallName: string) => {
      if (!targetHallId) return;

      const portalGroup = new THREE.Group();
      
      const title = isNext ? '다음 전시관' : '이전 전시관';
      const portalTex = createPortalTexture(title, targetHallName, isNext);
      
      // Portal central glowing screen mesh
      const paneGeo = new THREE.PlaneGeometry(2.2, 3.2);
      const paneMat = new THREE.MeshBasicMaterial({
        map: portalTex,
        transparent: true,
        opacity: 0.90,
        side: THREE.DoubleSide
      });
      const paneMesh = new THREE.Mesh(paneGeo, paneMat);
      paneMesh.position.set(0, 1.6, 0);
      portalGroup.add(paneMesh);

      // Left post
      const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.4, 0.35), frameMat);
      leftPost.position.set(-1.19, 1.7, 0);
      leftPost.castShadow = true;
      leftPost.receiveShadow = true;
      portalGroup.add(leftPost);

      // Right post
      const rightPost = leftPost.clone();
      rightPost.position.x = 1.19;
      portalGroup.add(rightPost);

      // Top beam
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.18, 0.35), frameMat);
      topBeam.position.set(0, 3.4 + 0.09, 0);
      topBeam.castShadow = true;
      topBeam.receiveShadow = true;
      portalGroup.add(topBeam);

      // Glowing light inside the portal
      const gateLight = new THREE.PointLight(isNext ? 0x4f46e5 : 0x0d9488, 3.0, 7);
      gateLight.position.set(0, 1.6, 0.2);
      portalGroup.add(gateLight);

      // Position the Portal Group dynamically in the back corners:
      const px = isNext ? 10.8 : -10.8;
      const pz = 7.5;
      const rotY = isNext ? -Math.PI / 2 : Math.PI / 2;

      portalGroup.position.set(px, 0, pz);
      portalGroup.rotation.y = rotY;

      // Assign click metadata to all children so raycaster captures them perfectly
      const actionTag = isNext ? 'next' : 'prev';
      portalGroup.userData = { portalAction: actionTag };
      paneMesh.userData = { portalAction: actionTag };
      leftPost.userData = { portalAction: actionTag };
      rightPost.userData = { portalAction: actionTag };
      topBeam.userData = { portalAction: actionTag };

      stateRef.current.portalMeshes.push(paneMesh, leftPost, rightPost, topBeam);
      scene.add(portalGroup);
    };

    // SPAWN PREVIOUS & NEXT PORTALS
    spawnPortal(false, prevHallId, prevHallName || '이전관');
    spawnPortal(true, nextHallId, nextHallName || '다음관');

    // 7. Clean initial load trigger
    forceRefreshArtworks();
  }, [hall, prevHallId, nextHallId, prevHallName, nextHallName]);

  // Synchronize artworks dynamically when state additions occur
  useEffect(() => {
    const scene = stateRef.current.scene;
    if (!scene) return;
    forceRefreshArtworks();
  }, [artworks, activeWallId]);

  // Docent Curation Tour: Glide player smoothly directly in front of the artwork click selection
  useEffect(() => {
    if (focusArtworkId) {
      const activeArtDef = artworks.find(art => art.id === focusArtworkId);
      const wallDef = hall.wallPositions.find(w => w.id === focusArtworkId);

      if (activeArtDef && wallDef) {
        // Find safe coordinate ~2m in front of wall matching wall angle rotation
        const yawAngle = wallDef.rotation[1];
        const distanceOffset = 2.4; // 2.4 meters stand back

        const targetX = wallDef.position[0] + Math.sin(yawAngle) * distanceOffset;
        const targetZ = wallDef.position[2] + Math.cos(yawAngle) * distanceOffset;

        // Smooth glide transition over 20-30 ticks
        const animRef = {
          ticks: 0,
          maxTicks: 25,
          startX: stateRef.current.player.x,
          startZ: stateRef.current.player.z,
          startYaw: stateRef.current.player.yaw
        };

        // Align camera look-direction rotation perfectly directly facing wall
        let targetYaw = yawAngle + Math.PI;
        // Normalize angle pathing
        while (targetYaw - animRef.startYaw > Math.PI) targetYaw -= Math.PI * 2;
        while (targetYaw - animRef.startYaw < -Math.PI) targetYaw += Math.PI * 2;

        const intervalId = window.setInterval(() => {
          animRef.ticks++;
          const t = animRef.ticks / animRef.maxTicks;
          // smooth cosine easing
          const ease = (1 - Math.cos(t * Math.PI)) / 2;

          stateRef.current.player.x = animRef.startX + (targetX - animRef.startX) * ease;
          stateRef.current.player.z = animRef.startZ + (targetZ - animRef.startZ) * ease;
          stateRef.current.player.yaw = animRef.startYaw + (targetYaw - animRef.startYaw) * ease;
          stateRef.current.player.pitch = -0.05 * ease; // flat normal gaze level

          if (animRef.ticks >= animRef.maxTicks) {
            clearInterval(intervalId);
            onClearFocus();
          }
        }, 16);
      }
    }
  }, [focusArtworkId]);

  // Helper to create safe dynamic fallback texture if asynchronous load lacks or fails
  const createFallbackTexture = (title: string, style: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Background gradient matching gallery vibe
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    if (style === 'classic') {
      grad.addColorStop(0, '#5c3a21');
      grad.addColorStop(0.5, '#2c1b10');
      grad.addColorStop(1, '#150d08');
    } else if (style === 'modern') {
      grad.addColorStop(0, '#1a2238');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
    } else {
      grad.addColorStop(0, '#0a0515');
      grad.addColorStop(0.5, '#3b0a2c');
      grad.addColorStop(1, '#f72585');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Dynamic graphic lines
    ctx.strokeStyle = style === 'neon' ? 'rgba(247, 37, 133, 0.45)' : 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.strokeStyle = style === 'neon' ? 'rgba(0, 245, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(256, 256, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Text rendering with automatic word-wrap for title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw wrapped title text
    const words = title.split(' ');
    let line = '';
    let y = 220;
    const lineHeight = 38;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > 420 && n > 0) {
        ctx.fillText(line, 256, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 256, y);

    // Subtle credits or instructions
    ctx.fillStyle = style === 'neon' ? '#00f5d4' : '#d4af37';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('Interactive Gallerist Canvas', 256, y + 60);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // Helper routine to refresh and draw paintings onto designated wall meshes
  const forceRefreshArtworks = () => {
    const scene = stateRef.current.scene;
    if (!scene) return;

    // 1. Remove all existing painting meshes and pause video layers
    stateRef.current.artMeshes.forEach(meshGroup => {
      scene.remove(meshGroup);
    });
    stateRef.current.artMeshes.clear();

    stateRef.current.videoElements.forEach(video => {
      try {
        video.pause();
        video.src = "";
        video.load();
      } catch (err) {
        console.warn("Error cleaning up video element during dynamic refresh:", err);
      }
    });
    stateRef.current.videoElements.clear();

    const textureLoader = new THREE.TextureLoader();

    // 2. Map and mount only matching artworks to matching walls
    artworks.forEach(art => {
      const wallDef = hall.wallPositions.find(w => w.id === art.id);
      if (!wallDef) return;

      const artGroup = new THREE.Group();

      const pW = art.width;
      const pH = art.height;

      // Unify & prevent clipping/z-fighting offset
      const depth = 0.08;
      const thickness = 0.06;

      // Create local painting mesh geometry
      const artGeo = new THREE.PlaneGeometry(pW, pH);

      // Create a nice placeholder canvas material synchronously so there's NO asynchronous blank delay
      const placeholderTex = createFallbackTexture(art.title, hall.id);
      const artMat = new THREE.MeshStandardMaterial({
        map: placeholderTex,
        side: THREE.DoubleSide,
        roughness: 0.2,
        bumpScale: 0.1,
        emissiveMap: placeholderTex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.28,
        // Pro-level Z-fighting preventive offset
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });

      const artMesh = new THREE.Mesh(artGeo, artMat);
      artMesh.castShadow = true;
      artMesh.receiveShadow = true;
      artGroup.add(artMesh);

      // Build elegant 3D Frames synchronously
      let frameColor = 0x111111;
      let metallic = 0.1;
      let rough = 0.8;
      let isNeon = false;

      if (art.frameType === 'ornate-gold') {
        frameColor = 0xd4af37;
        metallic = 0.95;
        rough = 0.15;
      } else if (art.frameType === 'wooden') {
        frameColor = 0x5c3a21;
        metallic = 0.15;
        rough = 0.65;
      } else if (art.frameType === 'cyber-neon') {
        frameColor = 0xf72585;
        isNeon = true;
      } else if (art.frameType === 'thin-black') {
        frameColor = 0x111111;
        metallic = 0.5;
        rough = 0.3;
      }

      if (art.frameType !== 'none') {
        const frameMat = isNeon 
          ? new THREE.MeshBasicMaterial({ color: frameColor }) 
          : new THREE.MeshStandardMaterial({
              color: frameColor,
              metalness: metallic,
              roughness: rough
            });

        // Top frame
        const fTop = new THREE.Mesh(new THREE.BoxGeometry(pW + thickness * 2, thickness, depth), frameMat);
        fTop.position.set(0, pH / 2 + thickness / 2, -depth / 2);
        artGroup.add(fTop);

        // Bottom frame
        const fBot = fTop.clone();
        fBot.position.y = -(pH / 2 + thickness / 2);
        artGroup.add(fBot);

        // Left frame
        const fLeft = new THREE.Mesh(new THREE.BoxGeometry(thickness, pH + thickness * 2, depth), frameMat);
        fLeft.position.set(-(pW / 2 + thickness / 2), 0, -depth / 2);
        artGroup.add(fLeft);

        // Right frame
        const fRight = fLeft.clone();
        fRight.position.x = pW / 2 + thickness / 2;
        artGroup.add(fRight);

        // If neon frame, append a bright, responsive glow strip
        if (isNeon) {
          const neonLight = new THREE.PointLight(0xf72585, 1.2, 5);
          neonLight.position.set(0, 0, 0.4);
          artGroup.add(neonLight);
        }
      }

      // Title and plaque plate below artwork (in museum, description panel is super elegant)
      if (hall.id === 'classic' || hall.id === 'modern') {
        const plaqueCanvas = document.createElement('canvas');
        plaqueCanvas.width = 256;
        plaqueCanvas.height = 96;
        const plCtx = plaqueCanvas.getContext('2d')!;
        plCtx.fillStyle = '#f8fafc';
        plCtx.fillRect(0, 0, 256, 96);
        plCtx.fillStyle = '#0f171c';
        plCtx.font = 'bold 16px Inter, sans-serif';
        plCtx.fillText(art.title.slice(0, 16), 14, 28);
        plCtx.font = 'normal 12px Inter, sans-serif';
        plCtx.fillStyle = '#475569';
        plCtx.fillText(`${art.artist} (${art.year})`, 14, 52);
        plCtx.font = 'italic 11px sans-serif';
        plCtx.fillText('Click to swap art', 14, 76);

        const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
        const plaqueMat = new THREE.MeshStandardMaterial({ map: plaqueTex });
        const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.16), plaqueMat);
        // Position plaque right below painting
        plaqueMesh.position.set(0, -(pH / 2 + 0.22), 0.05);
        artGroup.add(plaqueMesh);
      }

      // Position full artwork group relative to designated Wall setup
      // Face painting normal out from wall surface
      const yawAngle = wallDef.rotation[1];
      const wallH = hall.ceilingHeight;

      // Increase safety clearance offset slightly from 0.25 to 0.27 to absolutely prevent wall clipping / z-fighting
      const safeClearance = 0.27;

      // Place at eye-gaze average height (1.74m center)
      artGroup.position.set(
        wallDef.position[0] + Math.sin(yawAngle) * safeClearance,
        1.74, 
        wallDef.position[2] + Math.cos(yawAngle) * safeClearance
      );
      artGroup.rotation.set(wallDef.rotation[0], wallDef.rotation[1], wallDef.rotation[2]);

      // Tag wallId also to Group so clicking paint meshes triggers editor
      artGroup.userData = { wallId: wallDef.id };
      artGroup.children.forEach(child => {
        child.userData = { wallId: wallDef.id };
      });

      // Add to scene synchronously so the frame and plaque are immediately visible!
      scene.add(artGroup);
      stateRef.current.artMeshes.set(art.id, artGroup);

      // Now asynchronously load the actual image or video texture safely
      const applyLoadedTexture = (loadedTexture: THREE.Texture) => {
        try {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          
          // Smoothly assign loaded texture to the existing artwork mesh material!
          const activeMat = new THREE.MeshStandardMaterial({
            map: loadedTexture,
            side: THREE.DoubleSide,
            roughness: 0.12,
            bumpScale: 0.1,
            emissiveMap: loadedTexture,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.28,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
          });
          artMesh.material = activeMat;
          artMesh.material.needsUpdate = true;
          
          // Also set placeholder texture to dispose and free GPU memory safely
          placeholderTex.dispose();
        } catch (updateErr) {
          console.error("Error setting dynamic material texture:", updateErr);
        }
      };

      if (art.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = art.imageUrl;
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // Save to cleanup map
        stateRef.current.videoElements.set(art.id, video);
        
        // Create VideoTexture
        const videoTex = new THREE.VideoTexture(video);
        applyLoadedTexture(videoTex);
        
        // Try audio/video play safely
        video.play().catch(playErr => {
          console.warn("Muted video autoplay deferred on canvas mount:", playErr);
          const playOnAction = () => {
            video.play().catch(() => {});
            window.removeEventListener('click', playOnAction);
            window.removeEventListener('touchstart', playOnAction);
          };
          window.addEventListener('click', playOnAction);
          window.addEventListener('touchstart', playOnAction);
        });
      } else if (art.imageUrl.startsWith('data:')) {
        const img = new Image();
        img.onload = () => {
          try {
            const loadedTexture = new THREE.CanvasTexture(img);
            applyLoadedTexture(loadedTexture);
          } catch (canvasTexErr) {
            console.error("Failed to construct CanvasTexture from Base64 image loaded element:", canvasTexErr);
          }
        };
        img.onerror = (err) => {
          console.warn("Base64 img element load failed, falling back to generative procedural pattern:", err);
        };
        img.src = art.imageUrl;
      } else {
        textureLoader.load(
          art.imageUrl,
          (loadedTexture) => {
            applyLoadedTexture(loadedTexture);
          },
          undefined, // onProgress
          (err) => {
            console.warn("Async texturing failed, using fallback procedural map for:", art.title, err);
            // Keep the beautiful fallback procedural texture that was already mounted
          }
        );
      }
    });
  };

  return (
    <div className={`relative w-full bg-slate-950 overflow-hidden shadow-inner border border-slate-900 transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 w-screen h-screen z-50 rounded-none border-none' 
        : 'h-[460px] sm:h-[540px] md:h-[600px] rounded-2xl'
    }`} ref={containerRef} id="canvas_container">
      
      {/* ThreeJS HTML Canvas target */}
      <canvas className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing outline-none" tabIndex={0} ref={canvasRef} id="gallery_3d_canvas" />

      {/* Loading Cover Spinner Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 z-25">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <h4 className="text-sm font-semibold text-slate-350">3D VR 화실 구축 및 렌더 가동 중...</h4>
        </div>
      )}

      {/* Controls guide HUD overlay and Help icon removed as requested */}

      {/* Dynamic Proximity AI Docent Status indicator */}
      {nearestArtworkId && (() => {
        const nearArt = artworks.find(a => a.id === nearestArtworkId);
        if (!nearArt) return null;
        return (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/30 rounded-xl text-[10px] sm:text-[11px] text-slate-100 flex items-center gap-2 pointer-events-none select-none z-10 animate-bounce shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="font-bold text-pink-400">🔊 AI 도슨트 오디오:</span>
            <span className="truncate max-w-[120px] sm:max-w-xs font-semibold text-slate-200">
              "{nearArt.title}" 감상 분위기 연동 가이드 중
            </span>
          </div>
        );
      })()}

      {/* Visual Indicator HUD overlay on top-right: Showing interactive tag & Fullscreen toggle */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
        <div className="hidden sm:flex px-3 py-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl text-[11px] text-slate-400 items-center gap-2 pointer-events-none select-none">
          <Eye size={12} className="text-[#3b82f6] animate-pulse" />
          <span>마이크로 돔 가상 회전 가동 됨</span>
        </div>
        
        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white backdrop-blur-md border border-indigo-500/30 rounded-xl text-[11px] flex items-center gap-1.5 font-semibold transition shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-pointer"
          title="전체화면 토글 (Toggle Fullscreen)"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? "화면 축소" : "VR 전체화면"}</span>
        </button>
      </div>

      {/* Immersive Beautiful Transparent HUD Virtual Controller (for excellent mobile/phone usability) */}
      <div 
        className="absolute inset-x-0 bottom-0 p-3 flex justify-between items-end pointer-events-none z-20 select-none touch-none" 
        id="hud_virtual_touchpad"
      >
        {/* Left Hand: Positional movement cross - frosted glass look */}
        <div className="pointer-events-auto bg-slate-950/50 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
          {/* Forward */}
          <button
            onPointerDown={() => { stateRef.current.keys['w'] = true; }}
            onPointerUp={() => { stateRef.current.keys['w'] = false; }}
            onPointerCancel={() => { stateRef.current.keys['w'] = false; }}
            className="w-9 h-9 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 border border-white/5 active:scale-95 transition-all select-none touch-none"
            title="앞으로 이동 (W)"
          >
            <ChevronUp size={18} />
          </button>

          <div className="flex gap-1">
            {/* Left */}
            <button
              onPointerDown={() => { stateRef.current.keys['a'] = true; }}
              onPointerUp={() => { stateRef.current.keys['a'] = false; }}
              onPointerCancel={() => { stateRef.current.keys['a'] = false; }}
              className="w-9 h-9 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 border border-white/5 active:scale-95 transition-all select-none touch-none"
              title="왼쪽 게걸음 (A)"
            >
              <ChevronLeft size={18} />
            </button>
            {/* Backward */}
            <button
              onPointerDown={() => { stateRef.current.keys['s'] = true; }}
              onPointerUp={() => { stateRef.current.keys['s'] = false; }}
              onPointerCancel={() => { stateRef.current.keys['s'] = false; }}
              className="w-9 h-9 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 border border-white/5 active:scale-95 transition-all select-none touch-none"
              title="뒤로 이동 (S)"
            >
              <ChevronDown size={18} />
            </button>
            {/* Right */}
            <button
              onPointerDown={() => { stateRef.current.keys['d'] = true; }}
              onPointerUp={() => { stateRef.current.keys['d'] = false; }}
              onPointerCancel={() => { stateRef.current.keys['d'] = false; }}
              className="w-9 h-9 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-lg flex items-center justify-center text-slate-300 border border-white/5 active:scale-95 transition-all select-none touch-none"
              title="오른쪽 게걸음 (D)"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <span className="text-[7px] font-mono text-slate-400 font-bold tracking-widest mt-0.5">MOVE</span>
        </div>

        {/* Right Hand: Rotation camera angle - frosted glass look */}
        <div className="pointer-events-auto bg-slate-950/50 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col items-center gap-1.5 shadow-2xl">
          <div className="flex gap-1.5">
            {/* Turn Left */}
            <button
              onPointerDown={() => { stateRef.current.keys['q'] = true; }}
              onPointerUp={() => { stateRef.current.keys['q'] = false; }}
              onPointerCancel={() => { stateRef.current.keys['q'] = false; }}
              className="h-9 px-2.5 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-l-lg border-y border-l border-white/5 flex items-center gap-1 text-[9px] font-bold text-slate-300 active:scale-95 transition-all select-none touch-none"
              title="왼쪽 회전 (Q)"
            >
              <RotateCcw size={12} className="text-indigo-400 shrink-0" />
              <span>Turn L</span>
            </button>
            {/* Turn Right */}
            <button
              onPointerDown={() => { stateRef.current.keys['e'] = true; }}
              onPointerUp={() => { stateRef.current.keys['e'] = false; }}
              onPointerCancel={() => { stateRef.current.keys['e'] = false; }}
              className="h-9 px-2.5 bg-slate-950/80 hover:bg-slate-800 active:bg-white/10 rounded-r-lg border border-white/5 flex items-center gap-1 text-[9px] font-bold text-slate-300 active:scale-95 transition-all select-none touch-none"
              title="오른쪽 회전 (E)"
            >
              <span>Turn R</span>
              <RotateCw size={12} className="text-pink-400 shrink-0" />
            </button>
          </div>
          <span className="text-[7px] font-mono text-slate-400 font-bold tracking-widest">CAMERA SEEK</span>
        </div>
      </div>

    </div>
  );
}
