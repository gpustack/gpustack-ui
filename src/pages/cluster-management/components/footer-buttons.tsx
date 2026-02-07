import { workerAddedCountAtom } from '@/atoms/clusters';
import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import { useAtom } from 'jotai';
import styled from 'styled-components';
import AddedMessage from './add-worker/added-message';

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  gap: 16px;
  padding-inline: 24px;
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
  loading?: boolean;
}

const FooterButtons: React.FC<FooterButtonsProps> = (props) => {
  const {
    onPrevious,
    onNext,
    handleCancel,
    handleSubmit,
    showButtons,
    loading
  } = props;
  const intl = useIntl();
  const [addedCount] = useAtom(workerAddedCountAtom);
  const handleOnNext = () => {
    onNext();
  };
  return (
    <Title style={{ padding: '16px 24px 24px' }}>
      <div className="added-msge">
        <AddedMessage addedCount={addedCount} />
      </div>
      <div className="flex-center gap-20">
        {showButtons.previous && (
          <Button
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={onPrevious}
          >
            {intl.formatMessage({ id: 'common.button.prev' })}
          </Button>
        )}
        {showButtons.next && (
          <Button
            type="primary"
            onClick={handleOnNext}
            style={{ minWidth: 100 }}
          >
            {intl.formatMessage({ id: 'common.button.next' })}
            <ArrowRightOutlined />
          </Button>
        )}
        {showButtons.done && (
          <Button type="primary" onClick={handleCancel}>
            {intl.formatMessage({ id: 'common.button.done' })}
          </Button>
        )}
        {showButtons.save && (
          <Button
            type="primary"
            onClick={handleSubmit}
            style={{ minWidth: 88 }}
            loading={loading}
          >
            {intl.formatMessage({ id: 'common.button.save' })}
          </Button>
        )}
      </div>
    </Title>
  );
};

export default FooterButtons;
