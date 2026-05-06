import { AutoTooltip, IconFont, TemplateCard } from '@gpustack/core-ui';
import styled from 'styled-components';
import { mockTemplateData } from '../../templates/config/mock-data';
import { ListItem as TemplateItem } from '../../templates/config/types';

const TemplateGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TemplateContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--ant-color-text-secondary);

  .name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--ant-color-text);
    font-weight: 500;
  }

  .info {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 8px;
    color: var(--ant-color-text-tertiary);
  }

  .value {
    color: var(--ant-color-text);
  }

  .icon {
    color: var(--ant-color-text-quaternary);
  }
`;

interface TemplateSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  dataList?: TemplateItem[];
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  value,
  onChange,
  dataList = mockTemplateData
}) => {
  return (
    <TemplateGrid>
      {dataList.map((item: TemplateItem) => (
        <TemplateCard
          key={item.id}
          clickable
          ghost
          hoverable
          height={102}
          active={value === item.id}
          disabled={item.status !== 'enabled'}
          onClick={() => onChange?.(item.id)}
        >
          <TemplateContent>
            <div className="name">
              <AutoTooltip ghost minWidth={20}>
                {item.name}
              </AutoTooltip>
            </div>
            <div className="info">
              <span>
                <IconFont className="icon" type="icon-model" /> 镜像:
              </span>
              <AutoTooltip ghost minWidth={20}>
                <span className="value">{item.image || '-'}</span>
              </AutoTooltip>
            </div>
            <div className="info">
              <span>
                <IconFont className="icon" type="icon-storage-outlined" /> 存储:
              </span>
              <span className="value">
                {item.volume_size_gb ?? '-'} GB {item.volume_mount_path || '-'}
              </span>
            </div>
          </TemplateContent>
        </TemplateCard>
      ))}
    </TemplateGrid>
  );
};

export default TemplateSelector;
