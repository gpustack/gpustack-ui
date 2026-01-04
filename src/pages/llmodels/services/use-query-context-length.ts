import { useState } from 'react';
import { queryModelContextLength } from '../apis';

export const useQueryContextLength = () => {
  const [modelContextData, setModelContextData] = useState<{
    native: number;
    scaled: number;
  }>({} as any);
  const fetchContextLength = async (params: {
    source: string;
    model_scope_model_id?: string;
    huggingface_repo_id?: string;
    local_path?: string;
  }) => {
    try {
      const res = await queryModelContextLength({
        model: params
      });
      setModelContextData(res);
    } catch (error) {
      setModelContextData({} as any);
    }
  };

  return {
    modelContextData,
    fetchContextLength
  };
};
