import { HallType } from '../types';

/**
 * Generates beautiful, responsive dynamic artwork patterns using HTML Canvas
 * to prevent CORS and standard asset loading issues.
 */
export function generateProceduralArt(style: HallType, title: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Generate deterministic-like random numbers based on title string
  let seed = 0;
  for (let i = 0; i < title.length; i++) {
    seed += title.charCodeAt(i) * (i + 1);
  }
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  if (style === 'classic') {
    // Elegant warm gradients representing landscape / oil painting
    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, `hsl(${random() * 30 + 15}, 60%, 25%)`); // Warm sunset sky
    grad.addColorStop(0.4, `hsl(${random() * 30 + 25}, 50%, 40%)`);
    grad.addColorStop(0.7, `hsl(${random() * 30 + 100}, 30%, 15%)`); // Golden fields
    grad.addColorStop(1, `hsl(${random() * 30 + 120}, 40%, 8%)`); // Deep forest ground
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Dynamic sun or glowing moon
    const sunX = 300 + random() * 200;
    const sunY = 200 + random() * 100;
    const sunRad = 50 + random() * 40;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRad * 2);
    sunGrad.addColorStop(0, 'rgba(255, 245, 210, 0.9)');
    sunGrad.addColorStop(0.5, 'rgba(253, 184, 99, 0.3)');
    sunGrad.addColorStop(1, 'rgba(253, 184, 99, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRad * 2, 0, Math.PI * 2);
    ctx.fill();

    // Impasto layered mountains or forests
    for (let layer = 0; layer < 4; layer++) {
      ctx.fillStyle = `rgba(${(20 - layer * 4)}, ${(40 - layer * 7)}, ${(20 - layer * 3)}, ${0.45 + layer * 0.15})`;
      ctx.beginPath();
      ctx.moveTo(0, 600);
      let currY = 350 + layer * 50 + random() * 30;
      ctx.lineTo(0, currY);
      for (let px = 0; px <= 800; px += 40) {
        currY += (random() - 0.5) * 25;
        if (currY < 200) currY = 200;
        if (currY > 580) currY = 580;
        ctx.lineTo(px, currY);
      }
      ctx.lineTo(800, 600);
      ctx.fill();
    }

    // Classic fine art craquelure (cracks) effect for texture
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c < 25; c++) {
      ctx.beginPath();
      ctx.moveTo(random() * 800, random() * 600);
      for (let step = 0; step < 5; step++) {
        ctx.lineTo(ctx.lineWidth + random() * 800, random() * 600);
      }
      ctx.stroke();
    }

    // Smooth vignette
    const vigGrad = ctx.createRadialGradient(400, 300, 300, 400, 300, 500);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, 'rgba(35,21,10,0.85)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 800, 600);

  } else if (style === 'modern') {
    // -------------------------------------------------------------------------
    // Modern White Minimalist - Warm white gallery canvas, luxury brass gold & grey
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#fbfbfc'; // Crisp high-end luxurious pure gallery white
    ctx.fillRect(0, 0, 800, 600);

    // Pale, high-class architectural tints
    const whitesPalette = [
      '#f3f4f6', // Light slate white
      '#fafaf9', // Oatmeal warm white
      '#e5e7eb', // Modern soft grey
      '#fcfbf7', // Pearl ivory
      '#decbaa'  // Soft brass gold/sand
    ];

    // Select 3 random light shapes
    ctx.globalAlpha = 0.85;

    // Element 1: Dynamic large floating circles in white/sand hues
    ctx.fillStyle = whitesPalette[Math.floor(random() * whitesPalette.length)];
    ctx.beginPath();
    ctx.arc(320 + random() * 200, 250 + random() * 120, 130 + random() * 90, 0, Math.PI * 2);
    ctx.fill();

    // Element 2: Intersecting modern warm cream/gold block
    ctx.fillStyle = '#eadeca'; // Royal cream milk
    ctx.fillRect(150 + random() * 150, 150 + random() * 150, 200 + random() * 200, 150 + random() * 200);

    // Element 3: Luxurious thin metallic brass gold accent rings/plates
    ctx.strokeStyle = '#d4af37'; // Luxury Brass Gold leaf
    ctx.lineWidth = 1.5 + random() * 1.5;
    ctx.beginPath();
    ctx.arc(430 + random() * 100, 270 + random() * 80, 80 + random() * 50, 0, Math.PI * 2);
    ctx.stroke();

    // Element 4: Floating elegant absolute pure white slab
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
    ctx.shadowBlur = 10;
    ctx.fillRect(200 + random() * 250, 180 + random() * 140, 140 + random() * 150, 140 + random() * 150);
    ctx.shadowBlur = 0; // Reset shadow

    // Delicate artistic hand sketch ink line for high-contrast balance
    ctx.strokeStyle = '#374151'; // Charcoal grey
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(100 + random() * 100, 480);
    ctx.quadraticCurveTo(
      380 + (random() - 0.5) * 100,
      120 + random() * 80,
      600 + random() * 100,
      140 + random() * 85
    );
    ctx.stroke();

    // Splattered gold and charcoal micro fine particles
    ctx.fillStyle = '#d4af37';
    for (let di = 0; di < 18; di++) {
      ctx.beginPath();
      ctx.arc(400 + (random() - 0.5) * 350, 300 + (random() - 0.5) * 250, 1 + random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#4b5563';
    for (let di = 0; di < 10; di++) {
      ctx.beginPath();
      ctx.arc(400 + (random() - 0.5) * 350, 300 + (random() - 0.5) * 250, 1 + random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // High fidelity subtle canvas cross-stitch texture
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.012)';
    ctx.lineWidth = 1;
    for (let tx = 0; tx < 800; tx += 6) {
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, 600);
      ctx.stroke();
    }
    for (let ty = 0; ty < 600; ty += 6) {
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(800, ty);
      ctx.stroke();
    }

  } else if (style === 'nordic') {
    // -------------------------------------------------------------------------
    // Nordic Minimal - Earthy geometric silence, organic warm white canvas
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#faf8f5'; // Light oatmeal/warm porcelain
    ctx.fillRect(0, 0, 800, 600);

    // Warm earth tones
    const earthPalette = [
      '#c28469', // Soft Terracotta
      '#596c68', // Nordic Sage
      '#d1ac64', // Mustard Gold
      '#2d3e46', // Deep Spruce Blue
      '#decbb7'  // Clay Sand
    ];

    // Distribute 4-5 elegant interlocking shapes with organic transparency
    ctx.globalAlpha = 0.8;
    for (let shape = 0; shape < 4; shape++) {
      ctx.fillStyle = earthPalette[Math.floor(random() * earthPalette.length)];
      ctx.beginPath();
      const st = random();
      if (st < 0.3) {
        // Soft balancing half circle
        ctx.arc(300 + random() * 200, 250 + random() * 150, 80 + random() * 100, Math.PI, Math.PI * 2);
      } else if (st < 0.65) {
        // Minimalist elongated oval
        ctx.ellipse(350 + random() * 120, 280 + random() * 100, 60 + random() * 70, 110 + random() * 80, (random() - 0.5) * 0.5, 0, Math.PI * 2);
      } else {
        // Clean offset square
        ctx.rect(200 + random() * 300, 180 + random() * 150, 120 + random() * 145, 120 + random() * 145);
      }
      ctx.fill();
    }

    // Single hand-sketched structural black line of grace
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#2b2a29';
    ctx.lineWidth = 1.8 + random() * 2.0;
    ctx.beginPath();
    ctx.moveTo(150 + random() * 100, 480);
    // Draw a graceful minimalist bezier curve rising upwards
    ctx.quadraticCurveTo(
      380 + (random() - 0.5) * 120, 
      120 + random() * 100,
      500 + random() * 160, 
      150 + random() * 100
    );
    ctx.stroke();

    // Dotted Zen-zen balancing particles
    ctx.fillStyle = '#2b2a29';
    ctx.globalAlpha = 0.85;
    const dotCX = 250 + random() * 300;
    const dotCY = 150 + random() * 100;
    for (let di = 0; di < 12; di++) {
      ctx.beginPath();
      ctx.arc(dotCX + Math.cos(di) * (15 + di * 4), dotCY + Math.sin(di) * (15 + di * 4), 2 + random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Delicate subtle paper fabric overlay
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.025)';
    ctx.lineWidth = 1;
    for (let y = 0; y < 600; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

  } else if (style === 'retro') {
    // -------------------------------------------------------------------------
    // Atari Retro Future - neon synthwave space, laser grids, magenta dusk
    // -------------------------------------------------------------------------
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#10051d'); // Night shade purple
    bgGrad.addColorStop(0.5, '#2e0842'); // Sunset Violet
    bgGrad.addColorStop(0.75, '#5c053f'); // Dusk Magenta
    bgGrad.addColorStop(1, '#ff6e00'); // Orange Horizon Glow
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Glowing retro sun at center
    const sunR = 120;
    const sunX = 400;
    const sunY = 280;
    const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
    sunGrad.addColorStop(0, '#ffff00'); // Deep yellow
    sunGrad.addColorStop(0.7, '#ff007f'); // Bright hot-pink
    sunGrad.addColorStop(1, '#330055'); // Deep night purple

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI, true); // upper half
    ctx.arc(sunX, sunY, sunR, 0, Math.PI, false); // lower half
    ctx.fill();

    // Laser sunset lines slice cutouts
    ctx.fillStyle = '#1a0429';
    for (let sy = sunY - 15; sy < sunY + sunR + 10; sy += 16) {
      const h = 2 + (sy - sunY) * 0.08;
      ctx.fillRect(sunX - sunR - 10, sy, sunR * 2 + 20, Math.max(1.5, h));
    }

    // Classic retro vector grid perspective lanes
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    const gY = 320;
    for (let x = -300; x <= 1100; x += 75) {
      ctx.beginPath();
      ctx.moveTo(400, gY);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let cy = gY; cy <= 600; cy += (600 - cy) * 0.16 + 2) {
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(800, cy);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset gloss effects

    // Outline neon mountains silhouettes
    ctx.fillStyle = '#0f051c';
    ctx.strokeStyle = '#f72585';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 320);
    ctx.lineTo(120, 210);
    ctx.lineTo(260, 290);
    ctx.lineTo(390, 150);
    ctx.lineTo(540, 260);
    ctx.lineTo(650, 180);
    ctx.lineTo(800, 320);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bright pixel stars
    ctx.fillStyle = '#ffffff';
    for (let st = 0; st < 30; st++) {
      const rx = random() * 800;
      const ry = random() * 220;
      ctx.fillRect(rx, ry, 2.5, 2.5);
    }

  } else if (style === 'monochrome') {
    // -------------------------------------------------------------------------
    // Monochrome Minimalist - Concrete gray, pitch charcoal, pure geometric circles
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#f1f1f1'; // Smooth concrete gray
    ctx.fillRect(0, 0, 800, 600);

    // Dynamic horizontal and vertical division lines
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    for (let x = 100; x < 800; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 100; y < 600; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Heavy pitch industrial black circles
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#171717'; // Deep carbon black
    ctx.beginPath();
    ctx.arc(400, 300, 110 + random() * 40, 0, Math.PI * 2);
    ctx.fill();

    // High balance white overlapping slice
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(380 + random() * 40, 280 + random() * 40, 60 + random() * 30, 0, Math.PI * 2);
    ctx.fill();

    // Fine graphite details
    ctx.strokeStyle = '#3e3e3e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(150, 450);
    ctx.lineTo(650, 150);
    ctx.stroke();

    // Spattered carbon ink dust
    ctx.fillStyle = '#171717';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.arc(200 + random() * 400, 150 + random() * 300, 1 + random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (style === 'vanguard') {
    // -------------------------------------------------------------------------
    // Vanguard - Industrial metal plate, brass screws, structural blueprints
    // -------------------------------------------------------------------------
    const mGrad = ctx.createLinearGradient(0, 0, 800, 600);
    mGrad.addColorStop(0, '#2e3d44'); // Blue metallic
    mGrad.addColorStop(0.5, '#1e2528'); // Steel body
    mGrad.addColorStop(1, '#111617'); // Dark cast iron
    ctx.fillStyle = mGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Grid wire structure
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'; // Gold wiring
    ctx.lineWidth = 1;
    for (let c = 0; c < 8; c++) {
      ctx.beginPath();
      ctx.arc(400, 300, c * 60, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Blueprint vector spikes
    ctx.strokeStyle = '#38bdf8'; // Laser blueprint blue
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 15; i++) {
      const theta = (i * Math.PI * 2) / 15 + seed;
      ctx.moveTo(400, 300);
      ctx.lineTo(400 + Math.cos(theta) * 250, 300 + Math.sin(theta) * 250);
    }
    ctx.stroke();

    // Floating copper panels
    ctx.fillStyle = 'rgba(194, 120, 3, 0.7)'; // Warm copper
    ctx.fillRect(280, 200, 240, 200);

    // Hot molten core element
    const coreGrad = ctx.createRadialGradient(400, 300, 5, 400, 300, 60);
    coreGrad.addColorStop(0, '#fff');
    coreGrad.addColorStop(0.3, '#f97316'); // Radiant orange
    coreGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(400, 300, 60, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'cyberpunk') {
    // -------------------------------------------------------------------------
    // Cyberpunk Club - Dynamic glitched noise, acid green and intense violet glows
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#05020a'; 
    ctx.fillRect(0, 0, 800, 600);

    // Neon strobe ribbons
    const ribbonCount = 20;
    for (let r = 0; r < ribbonCount; r++) {
      ctx.fillStyle = r % 2 === 0 ? 'rgba(22, 242, 182, 0.15)' : 'rgba(244, 63, 94, 0.15)'; // Green / Fuchsia glow
      ctx.fillRect(0, r * 30, 800, 15 + random() * 10);
    }

    // Digital glitch text vectors
    ctx.fillStyle = '#16f2b6';
    ctx.font = '700 36px monospace';
    ctx.fillText("CORRUPT_STATE_909", 120 + random() * 100, 220 + random() * 40);

    ctx.fillStyle = '#f43f5e';
    ctx.font = '700 24px monospace';
    ctx.fillText("HOST_SYS : OK", 220 + random() * 80, 350 + random() * 40);

    // Audio frequency line representations
    ctx.strokeStyle = '#a855f7'; // Purple laser
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 480);
    for (let waveX = 0; waveX <= 800; waveX += 20) {
      const waveY = 460 + Math.sin(waveX * 0.1) * 80 + (random() - 0.5) * 50;
      ctx.lineTo(waveX, waveY);
    }
    ctx.stroke();

    // Pixel digital grid noise
    ctx.fillStyle = '#ffffff';
    for (let p = 0; p < 120; p++) {
      ctx.fillRect(random() * 800, random() * 600, 3, 3);
    }

  } else if (style === 'zen') {
    // -------------------------------------------------------------------------
    // Zen Meditation - moss green, quiet stone circles, sand wave wash
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#f4f0e6'; // Warm calming sand cream
    ctx.fillRect(0, 0, 800, 600);

    // Raked sand ripples (concentric water curves)
    ctx.strokeStyle = 'rgba(44, 85, 34, 0.08)'; // Fine forest ink
    ctx.lineWidth = 2.5;
    for (let cw = 0; cw < 20; cw++) {
      ctx.beginPath();
      ctx.arc(450, 300, cw * 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Soft moss-green organic balancing stones
    const mossColors = ['#556b2f', '#46523c', '#608066', '#a1b490'];
    ctx.globalAlpha = 0.88;
    for (let st = 0; st < 3; st++) {
      ctx.fillStyle = mossColors[Math.floor(random() * mossColors.length)];
      ctx.beginPath();
      ctx.ellipse(
        220 + st * 160 + (random() - 0.5) * 40,
        280 + st * 40 + (random() - 0.5) * 30,
        50 + random() * 30,
        70 + random() * 45,
        (random() - 0.5) * 0.8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Single hand sketched bamboo leaf branch
    ctx.strokeStyle = '#2d3319';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(600, 600);
    ctx.quadraticCurveTo(550, 350, 450, 180);
    ctx.stroke();

    // Balancing ink drops
    ctx.fillStyle = '#222513';
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(450, 140, 6, 0, Math.PI * 2);
    ctx.fill();

  } else if (style === 'renaissance') {
    // -------------------------------------------------------------------------
    // Renaissance - Dramatic oil clouds, deep mahogany shadows, theatrical spotlight
    // -------------------------------------------------------------------------
    const rGrad = ctx.createLinearGradient(0, 0, 0, 600);
    rGrad.addColorStop(0, '#1c0d02'); // Amber charcoal
    rGrad.addColorStop(0.4, '#4c2512'); // Rich deep clay sienna
    rGrad.addColorStop(0.8, '#2a0c0c'); // Royal dramatic crimson
    rGrad.addColorStop(1, '#0e0404'); // Pitch shadow
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Warm candle lights shining through religious-like ceiling archway
    const candleCX = 400 + (random() - 0.5) * 150;
    const candleCY = 180 + (random() - 0.5) * 85;
    const glowRad = 150 + random() * 100;
    const lightGlow = ctx.createRadialGradient(candleCX, candleCY, 5, candleCX, candleCY, glowRad);
    lightGlow.addColorStop(0, 'rgba(254, 215, 170, 0.9)'); // Warm amber gold
    lightGlow.addColorStop(0.4, 'rgba(234, 88, 12, 0.45)'); // Fire glow
    lightGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = lightGlow;
    ctx.beginPath();
    ctx.arc(candleCX, candleCY, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // Heavy baroque impasto texture clouds
    ctx.globalAlpha = 0.45;
    for (let c = 0; c < 5; c++) {
      ctx.fillStyle = c % 2 === 0 ? '#451a03' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(200 + random() * 400, 250 + random() * 200, 80 + random() * 110, 0, Math.PI * 2);
      ctx.fill();
    }

    // Classic circular halo of sacred light
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.28)'; // Golden sacred halo
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(candleCX, candleCY, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Majestic dark oil craquelure cracks
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 0.65;
    for (let crack = 0; crack < 30; crack++) {
      ctx.beginPath();
      ctx.moveTo(random() * 800, random() * 600);
      ctx.lineTo(random() * 800, random() * 600);
      ctx.stroke();
    }

  } else {
    // -------------------------------------------------------------------------
    // Neon Cyber Grid - High-tech futuristic holographic digital pulses (Fallback Neon)
    // -------------------------------------------------------------------------
    ctx.fillStyle = '#0a0a14'; // Extreme deep violet-black
    ctx.fillRect(0, 0, 800, 600);

    // Laser Grid perspective lines from horizon
    const horizonY = 320;
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.35)';
    ctx.lineWidth = 1.5;
    for (let x = -400; x <= 1200; x += 60) {
      ctx.beginPath();
      ctx.moveTo(400, horizonY);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    // Horizontal converging lines
    for (let h = horizonY; h <= 600; h += (600 - h) * 0.18 + 2) {
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(800, h);
      ctx.stroke();
    }

    // Glowing wireframe sun
    const sunRadius = 140;
    const sunCX = 400;
    const sunCY = 260;
    const sunGrad = ctx.createLinearGradient(0, sunCY - sunRadius, 0, sunCY + sunRadius);
    sunGrad.addColorStop(0, '#f72585'); // Intense pink
    sunGrad.addColorStop(0.5, '#7209b7'); // Neon violet
    sunGrad.addColorStop(1, '#3a0ca3'); // Purple-blue

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunCX, sunCY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dark slice grooves
    ctx.fillStyle = '#0a0a14';
    for (let sliceY = sunCY - sunRadius; sliceY < sunCY + sunRadius; sliceY += 24) {
      const height = (sliceY - (sunCY - sunRadius)) / 30 + 1.5;
      if (sliceY > sunCY - 40) {
        ctx.fillRect(sunCX - sunRadius - 10, sliceY, sunRadius * 2 + 20, height);
      }
    }

    // Electric digital mountain peaks
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 245, 255, 0.6)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 320);
    let neonY = 320;
    for (let nx = 0; nx <= 800; nx += 50) {
      neonY = 240 + Math.sin(nx * 0.05 + seed) * 60 + random() * 40;
      ctx.lineTo(nx, neonY);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // Digital nodes
    ctx.fillStyle = '#ffffff';
    for (let nx = 0; nx <= 800; nx += 100) {
      ctx.beginPath();
      const nodeY = 240 + Math.sin(nx * 0.05 + seed) * 60 + random() * 40;
      ctx.arc(nx, nodeY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
