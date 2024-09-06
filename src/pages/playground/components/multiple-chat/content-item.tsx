import { useIntl } from '@umijs/max';
import React from 'react';

const ContentItem: React.FC<{ data: { role: string; content: string } }> = ({
  data
}) => {
  const intl = useIntl();
  return (
    <div className="content-item">
      <div className="content-item-role">
        {' '}
        {intl.formatMessage({ id: `playground.${data.role}` })}
      </div>
      <div className="content-item-content">{data.content}</div>
    </div>
  );
};

export default React.memo(ContentItem);
