import { useState } from 'react';

export function useTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // mouse position within element
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    // Calculate rotation angles (max 15 degrees each direction)
    const rotateY = ((x / width) - 0.5) * 30; // -15 to +15
    const rotateX = ((y / height) - 0.5) * -30; // invert for natural tilt

    console.log('Tilt:', { rotateX, rotateY });
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const shadowX = tilt.y * 0.5; // px
  const shadowY = tilt.x * 0.5;
  const style: React.CSSProperties = {
    transform: `perspective(500px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transformStyle: 'preserve-3d',
    backfaceVisibility: 'hidden',
    transformOrigin: 'center',
    transition: 'transform 0.1s ease-out',
    willChange: 'transform',
    boxShadow: `${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, 0.3)`,
  };

  return {
    style,
    handleMouseMove,
    handleMouseLeave,
  };
}