import { useState } from 'react';

export default function useCompareEnvs() {
  const [openTips, setOpenTips] = useState(false);
  const [diffEnvs, setDiffEnvs] = useState<{
    old: Record<string, any>;
    new: Record<string, any>;
  } | null>(null);

  const handleOpenTips = () => {
    setOpenTips(true);
  };

  const handleCloseTips = () => {
    setOpenTips(false);
  };

  const handleCompareEnvs = (
    oldEnvs: Record<string, any>,
    newEnvs: Record<string, any>
  ) => {
    const result = {
      old: {} as Record<string, any>,
      new: {} as Record<string, any>
    };

    Object.keys(oldEnvs).forEach((key) => {
      if (key in newEnvs && oldEnvs[key] !== newEnvs[key]) {
        result.old[key] = oldEnvs[key];
        result.new[key] = newEnvs[key];
      }
    });

    setDiffEnvs(result);
    if (Object.keys(result.old).length > 0) {
      handleOpenTips();
    }
  };

  return {
    openTips,
    diffEnvs,
    handleOpenTips,
    handleCloseTips,
    handleCompareEnvs
  };
}
