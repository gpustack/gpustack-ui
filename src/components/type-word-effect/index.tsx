import { useEffect, useState } from 'react';

const TypingEffect: React.FC<{ text?: string }> = ({ text = '' }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const intervalId = setInterval(() => {
      setDisplayedText((prev) => prev + text[index]);
      index += 1;
      if (index === text.length) {
        clearInterval(intervalId);
      }
    }, 20);

    return () => clearInterval(intervalId);
  }, [text]);

  return <div>{displayedText}</div>;
};

export default TypingEffect;
