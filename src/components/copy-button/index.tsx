import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import React, { useMemo } from 'react';

type CopyButtonProps = {
  children?: React.ReactNode;
  text: string;
  disabled?: boolean;
  fontSize?: string;
  type?: 'text' | 'primary' | 'dashed' | 'link' | 'default';
  size?: 'small' | 'middle' | 'large';
  shape?: 'circle' | 'round' | 'default';
  tips?: string;
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

const CopyButton: React.FC<CopyButtonProps> = ({
  children,
  tips,
  text,
  disabled,
  type = 'text',
  shape = 'default',
  fontSize = '14px',
  style,
  btnStyle,
  placement,
  size = 'middle'
}) => {
  const intl = useIntl();

  const tooltips = useMemo(() => {
    return [
      intl.formatMessage({ id: 'common.button.copy' }),
      intl.formatMessage({ id: 'common.button.copied' })
    ];
  }, [intl]);

  return (
    <Typography.Text
      style={{ ...btnStyle }}
      copyable={{
        text: text,
        tooltips: tooltips,
        icon: [
          <CopyOutlined style={{ fontSize: fontSize, ...style }} key="copy" />,
          <CheckCircleFilled
            style={{ color: 'var(--ant-color-success)', fontSize: fontSize }}
            key="check"
          />
        ]
      }}
    >
      {children}
    </Typography.Text>
  );
};

export default CopyButton;
