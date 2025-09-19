import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import styled from 'styled-components';

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-weight: 700;
  font-size: 16px;
  .text {
    font-size: 20px;
  }
`;
interface FooterButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  handleCancel: () => void;
  handleSubmit: () => void;
  showButtons: Record<string, boolean>;
}

const FooterButtons: React.FC<FooterButtonsProps> = (props) => {
  const { onPrevious, onNext, handleCancel, handleSubmit, showButtons } = props;
  const intl = useIntl();
  const handleOnNext = () => {
    onNext();
  };
  return (
    <Title style={{ height: 64 }}>
      <div className="flex-center gap-16">
        {showButtons.previous && (
          <Button type="link" icon={<LeftOutlined />} onClick={onPrevious}>
            {intl.formatMessage({ id: 'common.button.prev' })}
          </Button>
        )}
        {showButtons.next && (
          <Button type="link" onClick={handleOnNext}>
            {intl.formatMessage({ id: 'common.button.next' })}
            <RightOutlined />
          </Button>
        )}
        {showButtons.skip && (
          <Button type="primary" onClick={handleCancel}>
            {intl.formatMessage({ id: 'clusters.create.skipfornow' })}
          </Button>
        )}
        {showButtons.save && (
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ minWidth: 88 }}
          >
            {intl.formatMessage({ id: 'common.button.save' })}
          </Button>
        )}
      </div>
    </Title>
  );
};

export default FooterButtons;
