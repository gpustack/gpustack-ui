import { queryRouteTargets } from '../apis';
import { RouteTarget } from '../config/types';

const useEditTargets = () => {
  const generateTargetData = (targetList: RouteTarget[]) => {
    const fallbackTarget =
      targetList?.filter(
        (ep) => ep.fallback_status_codes && ep.fallback_status_codes?.length > 0
      )?.[0] || null;

    const targets = targetList?.filter(
      (ep) =>
        !ep.fallback_status_codes || ep.fallback_status_codes?.length === 0
    );

    return {
      targets: targets,
      fallbackTarget: fallbackTarget
    };
  };

  const fetchTargets = async (accessId: number) => {
    try {
      const res = await queryRouteTargets({ id: accessId });
      return res.items || [];
    } catch (error) {
      return [];
    }
  };

  return {
    generateTargetData,
    fetchTargets
  };
};

export default useEditTargets;
