import IMG from '@/assets/images/small-logo-200x200.png';
import AutoTooltip from '@/components/auto-tooltip';
import { Button, Tag, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../style/catalog-item.less';

interface CatalogItemProps {
  activeId: number;
  itemId: number;
  onDeploy: () => void;
}
const CatalogItem: React.FC<CatalogItemProps> = (props) => {
  const { onDeploy, itemId, activeId } = props;

  const handleOnDeploy = () => {
    onDeploy();
  };
  return (
    <div
      className={classNames('catalog-item', { active: activeId === itemId })}
    >
      <div className="content">
        <div className="title">
          <div className="img">
            <img src={IMG} alt="" />
          </div>
          <AutoTooltip ghost style={{ flex: 1 }}>
            gpustack/stable-diffusion-v3-5-medium-GGUF
          </AutoTooltip>
        </div>
        <Typography.Paragraph className="desc" ellipsis={{ rows: 2 }}>
          this is description this is description this is description this is
          this is description this isthis is description this isthis is
          description this is this is description this isthis is description
          this isthis is description this isthis is description this isthis is
          description this isthis is description this isthis is description this
          is this is description this isthis is description this isthis is
          description this isthis is description this is
        </Typography.Paragraph>
      </div>
      <div className="item-footer">
        <div className="tags">
          <Tag color="blue" className="tag-item">
            Audio
          </Tag>
          <Tag color="purple" className="tag-item">
            GGUF
          </Tag>
          <Tag color="orange" className="tag-item">
            Qwen
          </Tag>
        </div>
        <Button size="small" type="primary" onClick={handleOnDeploy}>
          Deploy
        </Button>
      </div>
    </div>
  );
};

export default React.memo(CatalogItem);
