import IMG from '@/assets/images/small-logo-200x200.png';
import AutoTooltip from '@/components/auto-tooltip';
import { Tag, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import '../style/catalog-item.less';

const COLORS = ['blue', 'purple', 'orange'];
interface CatalogItemProps {
  activeId: number;
  itemId: number;
  data: any;
  onDeploy: () => void;
}
const CatalogItem: React.FC<CatalogItemProps> = (props) => {
  const { onDeploy, itemId, activeId, data } = props;

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
            {data.name}
          </AutoTooltip>
        </div>
        <Typography.Paragraph className="desc" ellipsis={{ rows: 2 }}>
          {data.description}
        </Typography.Paragraph>
      </div>
      <div className="item-footer">
        <div className="tags">
          {data.tags.map((sItem, i) => {
            return (
              <Tag key={sItem} className="tag-item" color={COLORS[i]}>
                {sItem}
              </Tag>
            );
          })}
          {/* <Tag color="blue" className="tag-item">
            Audio
          </Tag>
          <Tag color="purple" className="tag-item">
            GGUF
          </Tag>
          <Tag color="orange" className="tag-item">
            Qwen
          </Tag> */}
          {/* <span className="dot"></span>
          <Tag className="tag-item">Audio</Tag>
          <Tag className="tag-item">GGUF</Tag>
          <Tag className="tag-item">Qwen</Tag> */}
          {data.size?.length > 0 && (
            <>
              <span className="dot"></span>
              {data.size.map((sItem, i) => {
                return (
                  <Tag key={sItem} className="tag-item">
                    {sItem}
                  </Tag>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CatalogItem);
