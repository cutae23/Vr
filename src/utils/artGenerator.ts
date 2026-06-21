/**
 * Generates beautiful, responsive dynamic artwork patterns using HTML Canvas
 * to prevent CORS and standard asset loading issues.
 */
export function generateProceduralArt(style: 'classic' | 'modern' | 'neon' | 'nordic' | 'retro', title: string): string {
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
    // Avant-garde minimalist abstract
    ctx.fillStyle = '#f5f2eb'; // Warm off-white paper canvas
    ctx.fillRect(0, 0, 800, 600);

    // Large abstract color fields
    const colors = [
      '#e63946', // Fire red
      '#1d3557', // Prussian Blue
      '#ffb703', // Mustard Yellow
      '#00f5d4', // Teal Abstract
      '#2a9d8f', // Forest Sage
      '#111111'  // Ink Black
    ];

    // Select 3 random distinct colors
    const activeColors = [
      colors[Math.floor(random() * colors.length)],
      colors[Math.floor(random() * colors.length)],
      colors[Math.floor(random() * colors.length)]
    ];

    // Dynamic geometric elements
    ctx.globalAlpha = 0.85;

    // Element 1: Large overlapping circle
    ctx.fillStyle = activeColors[0];
    ctx.beginPath();
    ctx.arc(250 + random() * 300, 200 + random() * 200, 100 + random() * 120, 0, Math.PI * 2);
    ctx.fill();

    // Element 2: Giant diagonal bar
    ctx.fillStyle = activeColors[1];
    ctx.save();
    ctx.translate(400, 300);
    ctx.rotate((random() - 0.5) * Math.PI);
    ctx.fillRect(-350, -30 - random() * 50, 700, 60 + random() * 100);
    ctx.restore();

    // Element 3: Abstract block structure
    ctx.fillStyle = activeColors[2];
    ctx.fillRect(100 + random() * 200, 100 + random() * 200, 150 + random() * 200, 150 + random() * 200);

    // Splatters & lines
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5 + random() * 4;
    for (let l = 0; l < 4; l++) {
      ctx.beginPath();
      ctx.moveTo(random() * 800, random() * 600);
      ctx.bezierCurveTo(
        random() * 800, random() * 600,
        random() * 800, random() * 600,
        random() * 800, random() * 600
      );
      ctx.stroke();
    }

    // Splatter dots
    ctx.fillStyle = '#111111';
    for (let d = 0; d < 30; d++) {
      ctx.beginPath();
      ctx.arc(random() * 800, random() * 600, 1.5 + random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beautiful canvas texture
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 600);
      ctx.stroke();
    }
    for (let j = 0; j < 600; j += 8) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
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

  } else {
    // -------------------------------------------------------------------------
    // Neon Cyber Grid - High-tech futuristic holographic digital pulses
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

    // Dark slice grooves (classic synthwave sun slices)
    ctx.fillStyle = '#0a0a14';
    for (let sliceY = sunCY - sunRadius; sliceY < sunCY + sunRadius; sliceY += 24) {
      const height = (sliceY - (sunCY - sunRadius)) / 30 + 1.5;
      if (sliceY > sunCY - 40) {
        ctx.fillRect(sunCX - sunRadius - 10, sliceY, sunRadius * 2 + 20, height);
      }
    }

    // Electric digital mountain peaks or equalizer lines
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

    // Neon dust stars
    ctx.fillStyle = '#00f5d4';
    for (let sd = 0; sd < 40; sd++) {
      ctx.beginPath();
      ctx.arc(random() * 800, random() * 200, 1 + random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
