import { CloseCircleFilled } from '@ant-design/icons';
import { Button } from 'antd';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  background-color: transparent !important;
  padding: 0;
  .anticon {
    color: var(--ant-color-text-quaternary);
    font-size: 12px !important;
    transition: color 0.3s ease;
  }
  &:hover {
    .anticon {
      color: var(--ant-color-text-tertiary);
    }
  }
`;

interface SmallCloseButtonProps {
  onClick?: () => void;
}

const SmallCloseButton: React.FC<SmallCloseButtonProps> = ({ onClick }) => {
  return (
    <StyledButton
      icon={<CloseCircleFilled />}
      shape="circle"
      type="text"
      onClick={onClick}
      size="small"
    ></StyledButton>
  );
};

export default SmallCloseButton;
