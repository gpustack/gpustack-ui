import OverlayScroller from '@/components/overlay-scroller';
import SimpleTabel, { ColumnProps } from '@/components/simple-table';
import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Button, Popover, Radio } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 8px 12px;
  padding-right: 4px;
  .title {
    font-weight: 500;
    margin-bottom: 12px;
  }
  .btn-wrapper {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    align-items: center;
    padding-top: 12px;
  }
  .buttons {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

interface EnvsOverridePopoverProps {
  diffEnvs: {
    old: Record<string, any>;
    new: Record<string, any>;
  } | null;
  onSave: (data: Record<string, any>) => void;
}

const EnvsOverridePopover: React.FC<EnvsOverridePopoverProps> = (props) => {
  const { diffEnvs, onSave } = props;
  const [open, setOpen] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [checkedEnvs, setCheckedEnvs] = React.useState<Record<string, any>>({});
  const intl = useIntl();

  const handleSelectValue = (
    e: any,
    { env_name, value }: { env_name: string; value: any }
  ) => {
    setCheckedEnvs((prev) => ({
      ...prev,
      [env_name]: value
    }));
  };

  const columns: ColumnProps[] = [
    {
      title: 'Environment Variable',
      key: 'env_name'
    },
    {
      title: 'Old Value',
      key: 'old',
      render: ({ row }) => {
        return (
          <Radio
            onChange={(e) =>
              handleSelectValue(e, { env_name: row.env_name, value: row.old })
            }
            checked={row.checkedValue === row.old}
          >
            {row.old}
          </Radio>
        );
      }
    },
    {
      title: 'New Value',
      key: 'new',
      render: ({ row }) => {
        return (
          <Radio
            onChange={(e) =>
              handleSelectValue(e, { env_name: row.env_name, value: row.new })
            }
            checked={row.checkedValue === row.new}
          >
            {row.new}
          </Radio>
        );
      }
    }
  ];

  const dataList = useMemo(() => {
    if (!diffEnvs) return [];
    const list: { env_name: string; old: any; new: any; checkedValue?: any }[] =
      [];
    Object.keys(diffEnvs.old).forEach((key) => {
      list.push({
        env_name: key,
        old: diffEnvs.old[key],
        new: diffEnvs.new[key],
        checkedValue: checkedEnvs[key]
      });
    });
    return list;
  }, [diffEnvs, checkedEnvs]);

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleOnSave = () => {
    onSave(checkedEnvs);
    setOpen(false);
  };

  return (
    <Popover
      arrow={false}
      content={
        <Container>
          <OverlayScroller
            maxHeight={300}
            styles={{
              wrapper: {
                paddingInlineStart: 0
              }
            }}
          >
            <SimpleTabel
              columns={columns}
              dataSource={dataList}
              rowKey="env_name"
              theme="light"
            />
          </OverlayScroller>
          <div className="btn-wrapper">
            <Button size="middle" onClick={() => setOpen(false)}>
              {intl.formatMessage({ id: 'common.button.close' })}
            </Button>
            <Button size="middle" type="primary" onClick={handleOnSave}>
              {intl.formatMessage({ id: 'common.button.confirm' })}
            </Button>
          </div>
        </Container>
      }
      open={open}
      getPopupContainer={(triggerNode) => containerRef.current || triggerNode}
      onOpenChange={onOpenChange}
      trigger={'click'}
      styles={{
        root: {
          left: 0,
          right: 0,
          width: '100%'
        },
        container: {
          width: '100%'
        }
      }}
    >
      <div ref={containerRef}>
        <Alert
          style={{ marginBlock: 16, cursor: 'pointer' }}
          icon={<WarningOutlined />}
          type="warning"
          showIcon
          title={'检测到环境变量值不一致，请确认使用的值'}
        ></Alert>
      </div>
    </Popover>
  );
};

export default EnvsOverridePopover;
