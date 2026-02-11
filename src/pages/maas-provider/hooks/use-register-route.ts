import { registerRouteConfigAtom } from '@/atoms/routes';
import { modelCategoriesMap } from '@/pages/llmodels/config';
import { useNavigate } from '@umijs/max';
import { useAtom } from 'jotai';

const useRegisterRoute = () => {
  const navigate = useNavigate();
  const [, setRegisterRouteConfig] = useAtom(registerRouteConfigAtom);

  const handleRegisterRoute = (record: any) => {
    const model = record.models?.[0] || {};
    const initialValues = {
      name: model.name || '',
      categories: [model.category || modelCategoriesMap.llm],
      routeTargets: [
        {
          weight: 100,
          provider_model_name: model.name,
          provider_id: record.id,
          parentId: record.id
        }
      ]
    };
    setRegisterRouteConfig({
      initialValues,
      create: true
    });
    navigate('/models/routes');
  };

  return {
    handleRegisterRoute
  };
};

export default useRegisterRoute;
