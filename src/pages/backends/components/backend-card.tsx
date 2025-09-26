import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import Card from '@/components/templates/card';
import { DockerOutlined } from '@ant-design/icons';
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
  margin-top: 8px;
  gap: 12px;
  color: var(--ant-color-text-secondary);
  .description {
    margin-block: 12px;
    color: var(--ant-color-text-tertiary);
  }
  .text {
    margin-left: 4px;
    color: var(--ant-color-text-secondary);
  }
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
      height={'auto'}
      ghost
      header={
        <Header>
          <div className="title">
            <img src={data.icon} alt={data.backend_name} height={20} />
            <span>{data.backend_name}</span>
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
        <div className="description">This is a description</div>
        <div>
          <IconFont type="icon-version" style={{ marginRight: 4 }} /> Default
          version: <span className="text">{data.default_version}</span>
        </div>
        <div>
          <DockerOutlined style={{ marginRight: 4 }} /> Default Image:{' '}
          <span className="text">
            {data.version_configs?.[data.default_version]?.image_name}
          </span>
        </div>
      </Content>
    </Card>
  );
};

export default BackendCard;
