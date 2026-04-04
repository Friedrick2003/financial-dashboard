import { useState } from 'react';

export function useSpotlight() {
  const [focus, setFocus] = useState({ x: '50%', y: '50%' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocus({ x: `${x}%`, y: `${y}%` });
  };

  const handleMouseLeave = () => setFocus({ x: '50%', y: '50%' });

  return {
    style: { '--spot-x': focus.x, '--spot-y': focus.y } as React.CSSProperties,
    handleMouseMove,
    handleMouseLeave,
  };
}
