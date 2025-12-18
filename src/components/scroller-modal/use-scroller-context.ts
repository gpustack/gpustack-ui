import { createContext, useContext } from 'react';

interface ScrollerContextProps {
  scrollToBottom: () => void;
}

export const ScrollerContext = createContext<ScrollerContextProps>({
  scrollToBottom: () => {}
});

export const useScrollerContext = () => useContext(ScrollerContext);
