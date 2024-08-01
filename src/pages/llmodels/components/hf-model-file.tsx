import { convertFileSize } from '@/utils';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Row, Space, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { queryHuggingfaceModelFiles } from '../apis';
import '../style/hf-model-file.less';

interface HFModelFileProps {
  repo: string;
  onSelectFile?: (file: any) => void;
}
const HFModelFile: React.FC<HFModelFileProps> = (props) => {
  const [dataSource, setDataSource] = useState<any>({
    fileList: [],
    loading: false
  });

  const [current, setCurrent] = useState<string>('');

  const handleSelectModelFile = (item: any) => {
    props.onSelectFile?.(item);
    setCurrent(item.path);
  };

  const handleFetchModelFiles = async () => {
    if (!props.repo) {
      setDataSource({ fileList: [], loading: false });
      return;
    }
    setDataSource({ ...dataSource, loading: true });
    setCurrent('');
    try {
      const res = await queryHuggingfaceModelFiles({ repo: props.repo });
      const list = _.filter(res, (file: any) => {
        return _.endsWith(file.path, '.gguf');
      });
      setDataSource({ fileList: list, loading: false });
      handleSelectModelFile(list[0]);
    } catch (error) {
      setDataSource({ fileList: [], loading: false });
      handleSelectModelFile({});
    }
  };

  useEffect(() => {
    handleFetchModelFiles();
  }, [props.repo]);
  return (
    <div>
      <h3 className="flex-between font-size-14">
        <span>Available Files({dataSource.fileList.length || 0})</span>
      </h3>
      <div>
        <Spin spinning={dataSource.loading} style={{ minHeight: 100 }}></Spin>
        {dataSource.fileList.length ? (
          <Row gutter={[10, 10]}>
            {_.map(dataSource.fileList, (item: any) => {
              return (
                <Col span={24} key={item.path}>
                  <div
                    className={classNames('hf-model-file', {
                      active: item.path === current
                    })}
                    onClick={() => handleSelectModelFile(item)}
                  >
                    <div className="title">{item.path}</div>
                    <Space className="tags">
                      <span className="tag-item">
                        {convertFileSize(item.size)}
                      </span>
                    </Space>
                    <div className="btn">
                      <Button size="middle">Install</Button>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        ) : (
          !dataSource.loading && (
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
    </div>
  );
};

export default HFModelFile;
