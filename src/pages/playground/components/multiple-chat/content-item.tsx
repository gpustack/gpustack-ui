import IconFont from '@/components/icon-font';
import { UserOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import React from 'react';
import { Roles } from '../../config';
import '../../style/content-item.less';

const ContentItem: React.FC<{ data: { role: string; content: string } }> = ({
  data
}) => {
  const intl = useIntl();
  return (
    <div className="content-item">
      <div className="content-item-role">
        <span className="m-r-5">
          {Roles.User === data.role ? (
            <UserOutlined></UserOutlined>
          ) : (
            <IconFont type="icon-AIzhineng"></IconFont>
          )}
        </span>
        {intl.formatMessage({ id: `playground.${data.role}` })}
      </div>
      <div className="content-item-content">{data.content}</div>
    </div>
  );
};

export default React.memo(ContentItem);
