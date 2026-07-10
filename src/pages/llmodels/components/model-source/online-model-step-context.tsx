import { createContext, useContext } from 'react';
import type { OnlineModelMobileStep } from './online-model-layout';

type OnlineModelStepContextValue = {
  isMobileWizard: boolean;
  step: OnlineModelMobileStep;
  goToDetail: () => void;
};

export const OnlineModelStepContext =
  createContext<OnlineModelStepContextValue | null>(null);

export function useOnlineModelStepNav() {
  return useContext(OnlineModelStepContext);
}
