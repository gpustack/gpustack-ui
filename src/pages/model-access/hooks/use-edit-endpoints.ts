import { queryAccessPoints } from '../apis';
import { AccessPointItem } from '../config/types';

const useEditEndpoints = () => {
  const generateEndpointData = (endpoints: AccessPointItem[]) => {
    const fallbackEndpoint =
      endpoints?.filter(
        (ep) => ep.fallback_status_codes && ep.fallback_status_codes?.length > 0
      )?.[0] || null;

    const endPoints = endpoints?.filter(
      (ep) =>
        !ep.fallback_status_codes || ep.fallback_status_codes?.length === 0
    );

    return {
      endpoints: endPoints,
      fallbackEndpoint: fallbackEndpoint
    };
  };

  const fetchEndpoints = async (accessId: number) => {
    try {
      const res = await queryAccessPoints({ id: accessId });
      return res.items || [];
    } catch (error) {
      return [];
    }
  };

  return {
    generateEndpointData,
    fetchEndpoints
  };
};

export default useEditEndpoints;
