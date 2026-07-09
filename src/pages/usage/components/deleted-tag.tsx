/**
 * Deleted-entity marker for the usage filter dropdowns (model / user / api-key
 * on the Tokens tab; user / instance / volume on the resource tabs). Renders an
 * outlined transparent pill "Deleted·#{id}" — the id keeps two entries sharing
 * a now-stale label distinguishable. Pairs with dimming the option label to the
 * tertiary text color.
 *
 * Presentational only: each filter resolves the entity id from its own option
 * shape (Tokens tab ← ``identity.current``; resource tabs ← option ``value``)
 * and passes it in. When no id is available the tag falls back to plain
 * "Deleted".
 */
import { useIntl } from '@umijs/max';
import { Tag } from 'antd';
import React from 'react';

interface DeletedTagProps {
  id?: string | number | null;
}

const DeletedTag: React.FC<DeletedTagProps> = ({ id }) => {
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'usage.table.deleted' });
  return (
    <Tag
      variant="outlined"
      style={{
        margin: 0,
        fontSize: 11,
        borderRadius: 12,
        background: 'transparent'
      }}
    >
      {label}
      {id != null && (
        <span className="text-tertiary">
          <span style={{ margin: '0 2px' }}>·</span>#{id}
        </span>
      )}
    </Tag>
  );
};

export default DeletedTag;
