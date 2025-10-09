import ThemeTag from '@/components/tags-wrapper/theme-tag';
import { Divider, Form } from 'antd';
import styled from 'styled-components';
import { getGpuColor } from '../config';

const ItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  .title {
    width: 100%;
    justify-content: space-between;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
`;

const RowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  .label {
    color: var(--ant-color-text-tertiary);
  }
  .drivers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

interface VersionItemProps {
  data: {
    build_in_frameworks: string[];
    custom_framework: string;
    version_no: string;
    image_name: string;
    run_command: string;
    isBuiltin: boolean;
    is_default: boolean;
  };
}

export const VersionItem: React.FC<VersionItemProps> = ({ data }) => {
  return (
    <ItemWrapper>
      <div className="title">
        <span>{data.version_no}</span>
        {data.is_default && (
          <ThemeTag
            color="geekblue"
            className="font-400"
            style={{ marginRight: 0 }}
          >
            Default
          </ThemeTag>
        )}
      </div>
      <RowWrapper>
        <span className="text drivers">
          {data.build_in_frameworks?.map((item) => {
            return (
              <ThemeTag
                key={item}
                style={{ marginRight: 0 }}
                color={getGpuColor(item)}
              >
                {item}
              </ThemeTag>
            );
          })}
        </span>
      </RowWrapper>
    </ItemWrapper>
  );
};

const BuiltInVersionsForm = () => {
  const form = Form.useFormInstance();
  const versionList = Form.useWatch('build_in_version_configs', form) || [];
  return (
    <Form.List name="build_in_version_configs">
      {() => {
        return (
          <div
            style={{
              border: '1px solid var(--ant-color-border)',
              borderRadius: 'var(--border-radius-base)',
              padding: '14px'
            }}
          >
            {versionList.map((version: any, index: number) => {
              return (
                <>
                  <VersionItem key={index} data={version} />
                  {index < versionList.length - 1 && (
                    <Divider
                      className="divider"
                      style={{
                        marginBlock: 16,
                        borderTop: '1px  dashed var(--ant-color-border)'
                      }}
                    />
                  )}
                </>
              );
            })}
          </div>
        );
      }}
    </Form.List>
  );
};

export default BuiltInVersionsForm;
