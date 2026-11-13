import { request } from '@umijs/max';
import { REVISION_HISTORY_LIMIT } from '../../../components/deployment/revisions/config';
import type {
  ModelRevisionDetail,
  RevisionPage
} from '../../../components/deployment/revisions/config/types';

// This detail-page reader intentionally exposes GET operations only.
export const queryReadOnlyRevisions = async (
  modelId: number,
  signal: AbortSignal
): Promise<RevisionPage> => {
  const result = await request<RevisionPage>(`/models/${modelId}/revisions`, {
    method: 'GET',
    params: { page: 1, perPage: REVISION_HISTORY_LIMIT },
    signal,
    skipErrorHandler: true
  });
  return {
    ...result,
    items: (result.items || [])
      .filter(
        (item) =>
          item.model_id === modelId &&
          Number.isSafeInteger(item.revision) &&
          item.revision > 0
      )
      .sort((first, second) => second.revision - first.revision)
  };
};

export const queryReadOnlyRevision = async (
  modelId: number,
  revision: number,
  signal: AbortSignal
): Promise<ModelRevisionDetail> => {
  const result = await request<ModelRevisionDetail>(
    `/models/${modelId}/revisions/${revision}`,
    { method: 'GET', signal, skipErrorHandler: true }
  );
  if (
    result.model_id !== modelId ||
    result.revision !== revision ||
    !result.spec ||
    typeof result.spec !== 'object' ||
    Array.isArray(result.spec)
  )
    throw new Error('Revision unavailable');
  return result;
};
