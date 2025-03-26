import { getActiveStatus, setActiveStatus } from '@/atoms/tab-active';

const tabsMap = {
  resources: 'resources'
};

export default function useTabActive() {
  const setTabActive = (key: string, value: any) => {
    setActiveStatus(key, value);
  };
  const getTabActive = (key: string) => {
    return getActiveStatus(key);
  };
  return {
    setTabActive,
    getTabActive,
    tabsMap
  };
}
