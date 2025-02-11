import IconFont from '@/components/icon-font';
import { DownOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { useState } from 'react';
import '../../style/think-content.less';

interface ThinkContentProps {
  content: string;
}

const ThinkContent: React.FC<ThinkContentProps> = ({ content }) => {
  const intl = useIntl();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <>
      {content ? (
        <div className="think-wrapper">
          <div className="btn-collapse">
            <Button
              size="small"
              type="text"
              className="flex-center"
              variant={collapsed ? 'filled' : undefined}
              color="default"
              onClick={() => setCollapsed(!collapsed)}
            >
              <IconFont type="icon-AIzhineng" />
              <span>
                {intl.formatMessage({ id: 'playground.chat.aithought' })}
              </span>
              <DownOutlined rotate={collapsed ? 0 : 180} className="m-l-10" />
            </Button>
          </div>
          {!collapsed && <div className="think-content">{content}</div>}
        </div>
      ) : null}
    </>
  );
};

export default ThinkContent;
