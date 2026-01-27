import React, { useEffect, useRef, useState } from 'react';

interface CollapseProps {
  open: boolean;
  children: React.ReactNode;
  duration?: number;
  minHeight?: number;
}

export default function Collapse({
  open,
  children,
  minHeight = 0,
  duration = 200
}: CollapseProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(minHeight);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      const h = el.scrollHeight;
      setHeight(h);

      const timer = setTimeout(() => {
        setHeight('auto');
      }, duration);

      return () => clearTimeout(timer);
    } else {
      const h = el.scrollHeight;
      setHeight(h);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
    return undefined;
  }, [open, duration]);

  return (
    <div
      ref={ref}
      style={{
        height,
        overflow: 'hidden',
        transition: `height ${duration}ms ease`
      }}
    >
      {children}
    </div>
  );
}
