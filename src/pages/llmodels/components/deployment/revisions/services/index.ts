import { request } from '@umijs/max';
import { MODELS_API } from '../../../../apis';
import type { ListItem } from '../../../../config/types';
import type {
  ModelRevisionDetail,
  RevisionPage,
  RollbackPreview
} from '../config/types';

export { restartModel } from '../../../../apis';

export const getRevisionModel = (id: number) =>
  request<ListItem>(`${MODELS_API}/${id}`, { skipErrorHandler: true });

export const getRevisions = (id: number, page: number) =>
  request<RevisionPage>(`${MODELS_API}/${id}/revisions`, {
    params: { page, perPage: 10 },
    skipErrorHandler: true
  });

export const getRevision = (id: number, revision: number) =>
  request<ModelRevisionDetail>(`${MODELS_API}/${id}/revisions/${revision}`, {
    skipErrorHandler: true
  });

export const previewRollback = (id: number, target_revision: number) =>
  request<RollbackPreview>(`${MODELS_API}/${id}/rollback-preview`, {
    method: 'POST',
    data: { target_revision },
    skipErrorHandler: true
  });

export const rollbackRevision = (id: number, target_revision: number) =>
  request<ListItem>(`${MODELS_API}/${id}/rollback`, {
    method: 'POST',
    data: { target_revision },
    skipErrorHandler: true
  });

export const deleteRevision = (id: number, revision: number) =>
  request<void>(`${MODELS_API}/${id}/revisions/${revision}`, {
    method: 'DELETE',
    skipErrorHandler: true
  });
