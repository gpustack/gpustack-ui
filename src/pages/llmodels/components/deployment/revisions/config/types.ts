import type { ListItem } from '../../../../config/types';

export interface ModelRevision {
  id: number;
  model_id: number;
  revision: number;
  created_at: string;
  created_by: number | null;
}

export interface ModelRevisionDetail extends ModelRevision {
  spec: Record<string, unknown>;
}

export interface RevisionComparison {
  target: ModelRevisionDetail;
  previous: ModelRevisionDetail | null;
}

export interface RollbackReview {
  restartOnRollback: boolean;
  revision: number;
  preview: RollbackPreview | null;
  loading: boolean;
  error: string | null;
}

export interface RevisionPage {
  items: ModelRevision[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPage: number;
  };
}

export interface RollbackPreview {
  current_revision: number;
  target_revision: number;
  current: Record<string, unknown>;
  desired: Record<string, unknown>;
  changes: { field: string; current: unknown; desired: unknown }[];
  changed: boolean;
}

export interface HistoryState {
  restartError: string | null;
  model: ListItem | null;
  items: ModelRevision[];
  page: number;
  total: number;
  latest: number | null;
  selected: number | null;
  comparison: RevisionComparison | null;
  rollback: RollbackReview | null;
  loading: boolean;
  comparisonLoading: boolean;
  error: string | null;
}
