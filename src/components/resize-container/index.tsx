import { Col, Row } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import useResponsive from './use-responsive';

interface ResizeObserverContainerProps {
  dataList: any[];
  renderItem: (data: any) => React.ReactNode;
  defaultSpan?: number;
  resizable?: boolean;
}

const ResizeContainer: React.FC<ResizeObserverContainerProps> = ({
  defaultSpan = 8,
  dataList,
  renderItem,
  resizable = true
}) => {
  const { span, handleResize } = useResponsive({ defaultSpan });

  return (
    <ResizeObserver onResize={handleResize} disabled={!resizable}>
      <Row gutter={[16, 16]}>
        {dataList.map((item: any, index) => {
          return (
            <Col span={span} key={item.id || index}>
              {renderItem(item)}
            </Col>
          );
        })}
      </Row>
    </ResizeObserver>
  );
};

export default ResizeContainer;
