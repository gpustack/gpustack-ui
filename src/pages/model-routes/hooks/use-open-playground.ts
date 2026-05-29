import { getAllOrganizations } from '@/atoms/user';
import { useNavigate } from '@umijs/max';
import { modelCategoriesMap } from '../../llmodels/config';
import { categoryToPathMap } from '../../llmodels/config/button-actions';

const useOpenPlayground = () => {
  const navigate = useNavigate();

  const handleOpenPlayGround = (row: any) => {
    const allOrganizations = getAllOrganizations();
    const orgName = allOrganizations.find(
      (org) => org.id === row.owner_principal_id
    )?.name;
    const rawModel = orgName ? `${orgName}/${row.name}` : row.name;
    const modelName = encodeURIComponent(rawModel);

    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        row.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${modelName}`);
        return;
      }
      if (row.categories?.includes(category)) {
        navigate(`${path}?model=${modelName}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${modelName}`);
  };
  return {
    handleOpenPlayGround
  };
};

export default useOpenPlayground;
