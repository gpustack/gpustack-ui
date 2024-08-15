import { SearchOutlined } from '@ant-design/icons';
import { Col, Empty, Row, Spin } from 'antd';
import React from 'react';
import '../style/search-result.less';
import HFModelItem from './hf-model-item';

interface SearchResultProps {
  resultList: any[];
  onSelect?: (item: any) => void;
  current?: string;
  source?: string;
  style?: React.CSSProperties;
  loading?: boolean;
}

const SearchResult: React.FC<SearchResultProps> = (props) => {
  console.log('SearchResult======');
  const { resultList, onSelect, source } = props;

  const handleSelect = (e: any, item: any) => {
    e.stopPropagation();
    onSelect?.(item);
  };
  const handleOnEnter = (e: any, item: any) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      onSelect?.(item);
    }
  };
  return (
    <div style={{ ...props.style }} className="search-result-wrap">
      <Spin spinning={props.loading}>
        <div style={{ minHeight: 200 }}>
          {resultList.length ? (
            <Row gutter={[16, 16]}>
              {resultList.map((item, index) => (
                <Col span={24} key={item.name}>
                  <div
                    onClick={(e) => handleSelect(e, item)}
                    onKeyDown={(e) => handleOnEnter(e, item)}
                  >
                    <HFModelItem
                      source={source}
                      tags={item.tags}
                      key={index}
                      title={item.name}
                      downloads={item.downloads}
                      likes={item.likes}
                      task={item.task}
                      updatedAt={item.updatedAt}
                      active={item.id === props.current}
                    />
                  </div>
                </Col>
              ))}
            </Row>
          ) : (
            !props.loading && (
              <Empty
                imageStyle={{ height: 'auto', marginTop: '20px' }}
                image={
                  <SearchOutlined
                    className="font-size-16"
                    style={{ color: 'var(--ant-color-text-tertiary)' }}
                  ></SearchOutlined>
                }
                description="No models found"
              />
            )
          )}
        </div>
      </Spin>
    </div>
  );
};

export default React.memo(SearchResult);
