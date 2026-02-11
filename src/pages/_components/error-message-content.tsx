import { CheckCircleFilled, CopyOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import styled from 'styled-components';

const Content = styled.div`
  position: relative;
  .cp-btn {
    position: absolute;
    top: 0px;
    right: -4px;
    display: none;
  }
  &:hover .cp-btn {
    display: inline-block;
  }
  .msg {
    display: none;
  }
`;

const ErrorMessageContent: React.FC<{ errMsg: string }> = ({ errMsg }) => {
  return (
    <Content>
      <Typography.Text
        className="cp-btn"
        copyable={{
          text: errMsg,
          icon: [
            <CopyOutlined style={{ fontSize: 14 }} key="copy" />,
            <CheckCircleFilled
              style={{ color: 'var(--ant-color-success)', fontSize: 14 }}
              key="copied"
            />
          ]
        }}
      >
        <span className="msg">{errMsg}</span>
      </Typography.Text>
      {errMsg}
    </Content>
  );
};

export default ErrorMessageContent;
