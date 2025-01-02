import IMG from '@/assets/images/small-logo-200x200.png';
import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Divider, Tag, Typography } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { CatalogItem as CatalogItemType } from '../config/types';
import '../style/catalog-item.less';

const COLORS = ['blue', 'purple', 'orange'];
interface CatalogItemProps {
  activeId: number;
  data: CatalogItemType;
  onClick: (data: CatalogItemType) => void;
}
const CatalogItem: React.FC<CatalogItemProps> = (props) => {
  const { onClick, activeId, data } = props;

  const handleOnClick = useCallback(() => {
    onClick(data);
  }, [data, onClick]);

  const icon = useMemo(() => {
    const home = data.home?.replace(/\/$/, '');
    const icon = data.icon?.replace(/^\//, '');
    if (icon) {
      return `${home}/${icon}`;
    }
    return IMG;
  }, [data]);

  const handleOnError = (e: any) => {
    e.target.src = IMG;
  };

  return (
    <div
      onClick={handleOnClick}
      className={classNames('catalog-item', { active: activeId === data.id })}
    >
      <div className="content">
        <div className="title">
          <div className="img">
            <img src={icon} alt="" onError={handleOnError} />
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
        <div className="update-time">
          <span className="flex-center">
            <ClockCircleOutlined
              className="m-r-5"
              style={{ color: 'var(--ant-color-text-secondary)' }}
            />
            {data.release_date}
          </span>
          <span className="flex-center">
            <IconFont type="icon-justice" className="m-r-5"></IconFont>
            {_.map(data.licenses, (license: string, index: number) => {
              return (
                <>
                  <span key={license}>{license}</span>
                  {index !== data.licenses.length - 1 && (
                    <Divider type="vertical" />
                  )}
                </>
              );
            })}
          </span>
        </div>
        <div className="tags">
          {data.categories.map((sItem, i) => {
            return (
              <Tag key={sItem} className="tag-item" color={COLORS[i]}>
                {sItem}
              </Tag>
            );
          })}
          {data.sizes?.length > 0 && (
            <>
              <span className="dot"></span>
              {data.sizes.map((sItem, i) => {
                return (
                  <Tag key={sItem} className="tag-item">
                    {sItem}B
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
