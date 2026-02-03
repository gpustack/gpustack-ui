import { useNavigate } from '@umijs/max';
import { modelCategoriesMap } from '../../llmodels/config';
import { categoryToPathMap } from '../../llmodels/config/button-actions';

const useOpenPlayground = () => {
  const navigate = useNavigate();

  const handleOpenPlayGround = (row: any) => {
    for (const [category, path] of Object.entries(categoryToPathMap)) {
      if (
        row.categories?.includes(category) &&
        [
          modelCategoriesMap.text_to_speech,
          modelCategoriesMap.speech_to_text
        ].includes(category)
      ) {
        navigate(`${path}&model=${row.name}`);
        return;
      }
      if (row.categories?.includes(category)) {
        navigate(`${path}?model=${row.name}`);
        return;
      }
    }
    navigate(`/playground/chat?model=${row.name}`);
  };
  return {
    handleOpenPlayGround
  };
};

export default useOpenPlayground;
