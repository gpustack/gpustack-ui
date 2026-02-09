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
  format?: 'text/plain' | 'text/html';
};

const CopyButton: React.FC<CopyButtonProps & TextProps> = ({
  children,
  text,
  fontSize = '14px',
  style,
  btnStyle,
  format = 'text/plain',
  ...rest
}) => {
  const intl = useIntl();

  const tooltips = useMemo(() => {
    return [
      intl.formatMessage({ id: 'common.button.copy' }),
      intl.formatMessage({ id: 'common.button.copied' })
    ];
  }, [intl]);

  const onCopy = () => {
    console.log('copied');
  };

  return (
    <Typography.Paragraph
      style={{ ...btnStyle, marginBottom: 0 }}
      {...rest}
      copyable={{
        text: text,
        format: format,
        tooltips: tooltips,
        onCopy: onCopy,
        icon: [
          <CopyOutlined style={{ fontSize: fontSize, ...style }} key="copy" />,
          <CheckCircleFilled
            style={{ color: 'var(--ant-color-success)', fontSize: fontSize }}
            key="copied"
          />
        ]
      }}
    >
      {children}
    </Typography.Paragraph>
  );
};

export default CopyButton;
