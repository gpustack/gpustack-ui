import { useHover } from 'ahooks';
import { Popover } from 'antd';
import { useRef, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid var(--ant-color-border);
  border-radius: 4px;
  padding: 8.5px 11px;
  height: 40px;
  width: 240px;
  cursor: pointer;
  &:hover {
    border-color: var(--ant-color-primary-hover);
  }
  &:active {
    box-shadow: var(--ant-input-active-shadow);
  }
  .holder {
    color: var(--ant-color-text-placeholder);
  }
`;
const CompareConditions: React.FC = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovering = useHover(containerRef);

  return (
    <Popover
      trigger={'click'}
      content="Compare Conditions Content"
      arrow={false}
      placement="bottom"
      styles={{
        root: {
          width: '240px'
        }
      }}
    >
      <Container>
        <span className="holder">Compare Filter</span>
      </Container>
    </Popover>
  );
};

export default CompareConditions;
