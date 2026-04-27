import Bg2 from '@/assets/images/bg-2.png';
import React from 'react';

const Background: React.FC<{ isDarkTheme: boolean }> = ({ isDarkTheme }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        minHeight: '100vh',
        zIndex: -1,
        background: isDarkTheme
          ? `radial-gradient(at 50% 20%, #383838 0%, #292929 40%, #000 100%)`
          : `url(${Bg2}) center center no-repeat`,
        backgroundSize: isDarkTheme ? 'contain' : 'cover',
        opacity: isDarkTheme ? 1 : 0.6
      }}
    ></div>
  );
};

export default Background;
