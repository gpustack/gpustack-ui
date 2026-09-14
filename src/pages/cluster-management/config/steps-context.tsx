import { createContext, MutableRefObject, useContext } from 'react';

export interface StepsContextProps {
  presetClusterType?: 'model' | 'gpu';
  formValues: Record<string, any>;
  systemConfig?: Record<string, any>;
  // Raw Chart Values text, kept across the step the wizard unmounts.
  // `formValues` holds the *parsed* `helmValues`, so re-seeding the editor
  // from it on the way back would hand the user a re-serialization of their
  // own input — comments and key order gone. Absent outside the wizard (the
  // edit drawer never unmounts the form), where the parsed value is the only
  // source there is.
  chartValuesDraft?: MutableRefObject<string | null>;
}

export const StepsContext = createContext<StepsContextProps>({
  formValues: {},
  systemConfig: {},
  presetClusterType: undefined
});

export const useStepsContext = () => useContext(StepsContext);
