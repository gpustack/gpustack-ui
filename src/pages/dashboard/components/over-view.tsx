import { Card, Col, Row } from 'antd';
import { overviewConfigs } from '../config';
import styles from './over-view.less';

const CardItem: React.FC<{ label: string; value: number; bgColor: string }> = ({
  label,
  value,
  bgColor
}) => {
  return (
    <Card
      bordered={false}
      style={{ background: bgColor }}
      className={styles['card-body']}
    >
      <div className={styles.content}>
        <div className="label">{label}</div>
        <div className="value">{value}</div>
      </div>
    </Card>
  );
};
const Overview: React.FC = (props) => {
  const { data = {} } = props;
  return (
    <Row gutter={[20, 20]} className={styles.row}>
      {overviewConfigs.map((config, index) => (
        <Col span={5} key={config.key}>
          <CardItem
            label={config.label}
            value={data[config.key] || 0}
            bgColor={config.backgroundColor}
          />
        </Col>
      ))}
    </Row>
  );
};

export default Overview;
