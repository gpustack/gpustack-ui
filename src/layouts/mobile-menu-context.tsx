import { createContext, useContext } from 'react';

type MobileMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  closeWithoutMotion: () => void;
  disableCloseMotion: boolean;
  resetCloseMotion: () => void;
};

export const MobileMenuContext = createContext<MobileMenuContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  closeWithoutMotion: () => {},
  disableCloseMotion: false,
  resetCloseMotion: () => {}
});

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}
