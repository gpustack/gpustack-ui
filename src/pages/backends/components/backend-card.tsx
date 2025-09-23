import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import Card from '@/components/templates/card';
import { Button } from 'antd';
import styled from 'styled-components';
import { backendActions } from '../config';
import { ListItem } from '../config/types';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  .title {
    display: flex;
    align-items: center;
    gap: 16px;
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 12x;
  gap: 16px;
  .title {
    color: var(--ant-color-text);
    font-weight: 500;
    line-height: 1.5;
  }
`;

interface BackendCardProps {
  onClick: (data: any) => void;
  onSelect?: (item: any) => void;
  data: ListItem;
}

const BackendCard: React.FC<BackendCardProps> = ({
  onClick,
  data,
  onSelect
}) => {
  return (
    <Card
      onClick={() => onClick(data)}
      clickable={true}
      disabled={false}
      height={205}
      ghost
      header={
        <Header>
          <div className="title">
            <img src={data.icon} alt={data.backend_name} height={20} />
          </div>
          <span>
            <DropDownActions
              menu={{
                items: backendActions,
                onClick: onSelect
              }}
            >
              <Button
                icon={<IconFont type="icon-more"></IconFont>}
                size="small"
                type="text"
              ></Button>
            </DropDownActions>
          </span>
        </Header>
      }
    >
      <Content>
        <div className="title">{data.backend_name}</div>
        <div>This is a description</div>
        <div>默认版本：{data.default_version}</div>
        <div>
          镜像：{data.version_configs?.[data.default_version]?.image_name}
        </div>
      </Content>
    </Card>
  );
};

export default BackendCard;
