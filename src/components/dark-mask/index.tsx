import { getStorageUserSettings } from '@/atoms/settings';
import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const duration = 1;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.05);
  }
`;

const Mask = styled.div<{ isHiding: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(59, 59, 59, 1);
  z-index: 9999;
  animation: ${({ isHiding }) => (isHiding ? fadeOut : 'none')} ${duration}s
    ease forwards;
`;

const DarkModeMask = () => {
  const { theme: savedTheme } = getStorageUserSettings();
  const [visible, setVisible] = useState(savedTheme === 'realDark');
  const [isHiding, setIsHiding] = useState(false);
  const maskRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  const initTheme = () => {
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-theme', savedTheme);
    }
  };

  initTheme();

  useEffect(() => {
    if (savedTheme === 'realDark') {
      setVisible(true);
      requestAnimationFrame(() => {
        setIsHiding(true);
      });
    } else {
      setIsHiding(true);
    }
  }, [savedTheme]);

  useEffect(() => {
    const el = maskRef.current;
    if (!el) return;

    const handleAnimationEnd = () => {
      clearTimeout(timerRef.current);
      setVisible(false);
    };

    el.addEventListener('animationend', handleAnimationEnd);

    if (isHiding) {
      timerRef.current = setTimeout(
        () => {
          setVisible(false);
        },
        duration * 1000 + 100
      );
    }
    return () => el.removeEventListener('animationend', handleAnimationEnd);
  }, [visible]);

  return visible ? <Mask ref={maskRef} isHiding={isHiding}></Mask> : null;
};

export default DarkModeMask;
