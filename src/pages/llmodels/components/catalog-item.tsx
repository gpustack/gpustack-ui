import fallbackImg from '@/assets/images/img.png';
import AutoTooltip from '@/components/auto-tooltip';
import IconFont from '@/components/icon-font';
import TagWrapper from '@/components/tags-wrapper';
import { Tag, Typography } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { modelCategories } from '../config';
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

  const handleOnError = (e: any) => {
    e.target.src = fallbackImg;
  };

  return (
    <div
      onClick={handleOnClick}
      className={classNames('catalog-item', { active: activeId === data.id })}
    >
      <div className="content">
        <div className="title">
          <div className="img">
            <img
              src={data.icon || fallbackImg}
              alt=""
              onError={handleOnError}
            />
          </div>
          <AutoTooltip ghost style={{ flex: 1 }}>
            {data.name}
          </AutoTooltip>
        </div>
        <Typography.Paragraph
          className="desc"
          ellipsis={{
            rows: 2,
            tooltip: (
              <div
                className="custome-scrollbar"
                style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  maxHeight: 300,
                  maxWidth: 300,
                  overflow: 'auto'
                }}
              >
                {data.description}
              </div>
            )
          }}
        >
          {data.description}
        </Typography.Paragraph>
      </div>
      <div className="item-footer">
        <div className="update-time">
          <span className="flex-center">
            <IconFont
              type="icon-new_release_outlined"
              className="m-r-5"
              style={{ color: 'var(--ant-color-text-secondary)' }}
            ></IconFont>
            {data.release_date}
          </span>
          <span className="flex-center">
            {_.map(data.licenses, (license: string, index: number) => {
              return (
                <span key={license} className="flex-center m-r-16">
                  <IconFont type="icon-justice1" className="m-r-5"></IconFont>
                  <span>{license}</span>
                </span>
              );
            })}
          </span>
        </div>
        <div className="tags">
          {data.categories.map((sItem, i) => {
            return (
              <Tag key={sItem} className="tag-item" color="blue">
                {_.find(modelCategories, { value: sItem })?.label || sItem}
              </Tag>
            );
          })}
          {data.capabilities?.length > 0 &&
            data.capabilities.map((sItem, i) => {
              return (
                <Tag key={sItem} className="tag-item" color="purple">
                  {_.map(_.split(sItem, '/'), (s: string) => {
                    return _.split(s, '_').join(' ');
                  })
                    .reverse()
                    .join(' ')}
                </Tag>
              );
            })}
          {data.sizes?.length > 0 && (
            <>
              <span className="dot"></span>
              <div className="box">
                <TagWrapper>
                  {data.sizes.map((sItem, i) => {
                    return (
                      <Tag key={sItem} className="tag-item">
                        {sItem}B
                      </Tag>
                    );
                  })}
                </TagWrapper>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(CatalogItem);
