import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import { TextProps } from 'antd/es/typography/Text';
import React, { useMemo } from 'react';

type CopyButtonProps = {
  children?: React.ReactNode;
  text: string;
  fontSize?: string;
  btnStyle?: React.CSSProperties;
  style?: React.CSSProperties;
};

const CopyButton: React.FC<CopyButtonProps & TextProps> = ({
  children,
  text,
  fontSize = '14px',
  style,
  btnStyle,
  ...rest
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
      {...rest}
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
