import { useState } from 'react';

export function useSpotlight() {
  const [focus, setFocus] = useState({ x: '50%', y: '50%' });
  const [rotation, setRotation] = useState({ rx: 0, ry: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    
    setFocus({ x: `${xPct * 100}%`, y: `${yPct * 100}%` });

    // Premium 3D tilt effect calculations (max 8 degrees tilt)
    const intensity = 8;
    const rotateY = (xPct - 0.5) * intensity * 2;
    const rotateX = -(yPct - 0.5) * intensity * 2;
    
    setRotation({ rx: rotateX, ry: rotateY });
  };

  const handleMouseLeave = () => {
    setFocus({ x: '50%', y: '50%' });
    setRotation({ rx: 0, ry: 0 });
  };

  return {
    style: { 
      '--spot-x': focus.x, 
      '--spot-y': focus.y,
      '--rot-x': `${rotation.rx}deg`,
      '--rot-y': `${rotation.ry}deg`
    } as React.CSSProperties,
    handleMouseMove,
    handleMouseLeave,
  };
}
