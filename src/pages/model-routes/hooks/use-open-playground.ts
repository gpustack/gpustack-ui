import { getCurrentOrg, getOrgById } from '@/atoms/user';
import { getGPUStackPlugin } from '@/plugins';
import { useNavigate } from '@umijs/max';
import { modelCategoriesMap } from '../../llmodels/config';
import { categoryToPathMap } from '../../llmodels/config/button-actions';

const useOpenPlayground = () => {
  const navigate = useNavigate();
  const plugin = getGPUStackPlugin();

  const generateModelName = (row: any) => {
    const org = getOrgById(row.owner_principal_id) ?? getCurrentOrg();

    // The platform Org is always named ``default`` (backend constant
    // ``PLATFORM_PRINCIPAL_NAME``); its models are reported by
    // ``/v1/models`` without a prefix. Match by name too, not just the
    // ``is_platform`` flag — pre-multi-tenancy OSS caches and any other
    // path that drops the flag would otherwise emit ``default/<name>``
    // and 404 against the unprefixed model id.
    const isPlatformOrg = org?.is_platform || org?.name === 'default';
    const rawModel =
      org?.name && !isPlatformOrg ? `${org.name}/${row.name}` : row.name;
    return rawModel;
  };

  const handleOpenPlayGround = (row: any) => {
    // Match the id format the OpenAI ``/v1/models`` endpoint reports: an
    // org's models are namespaced as ``{org}/{name}``, while the platform
    // org's carry no prefix (the server strips it). Prefer the row's own
    // ``owner_principal_id`` (an org principal id); fall back to the Org the
    // caller is currently acting under for the admin "All" view, where the
    // row's owner still resolves via the platform-wide org cache.
    // if has plugin, it means is enterpise edition, we need to generate the model name with org name prefix, otherwise, we just use the model name
    const rawModel = plugin ? generateModelName(row) : row.name;
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
    handleOpenPlayGround,
    generateModelName
  };
};

export default useOpenPlayground;
