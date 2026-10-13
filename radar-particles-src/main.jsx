import React from 'react';
import { createRoot } from 'react-dom/client';
import Particles from './Particles';

const root = document.getElementById('radarParticlesRoot');
if (root) {
  createRoot(root).render(
    <Particles
      particleColors={['#ffffff']}
      particleCount={1400}
      particleSpread={10}
      speed={0.1}
      particleBaseSize={55}
      glow={0.2}
      twinkle={0}
      moveParticlesOnHover
      hoverEffect="parallax"
      drift="down"
      driftSpeed={0.8}
      alphaParticles
      disableRotation
    />
  );
}
