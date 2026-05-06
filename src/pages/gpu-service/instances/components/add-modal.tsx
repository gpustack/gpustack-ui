import { PageActionType } from '@/config/types';
import Separator from '@/pages/llmodels/components/separator';
import { ColumnWrapper, GSDrawer, ModalFooter } from '@gpustack/core-ui';
import { useRef } from 'react';
import styled from 'styled-components';
import { FormData, ListItem } from '../config/types';
import GPUServiceInstanceForm from '../forms';
import { TemplateSelector } from '../forms/template-overlay';
import InstanceTypeList from './instance-type-list';

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 0;
`;

const ColWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33.33%;
  min-height: 0;
`;

const FormWrapper = styled.div`
  display: flex;
  flex: 1;
  max-width: 33.33%;
  min-height: 0;
`;

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel
}) => {
  const form = useRef<any>(null);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    onOk({
      ...values
    });
  };

  return (
    <GSDrawer
      title={title}
      open={open}
      onClose={handleCancel}
      destroyOnHidden={true}
      closeIcon={false}
      mask={{
        closable: false
      }}
      keyboard={false}
      styles={{
        wrapper: { width: 'calc(100vw - 220px)' },
        body: { overflowY: 'hidden' }
      }}
      footer={false}
    >
      <Container>
        <ColWrapper>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <InstanceTypeList />
          </ColumnWrapper>
          <Separator></Separator>
        </ColWrapper>
        <ColWrapper>
          <ColumnWrapper styles={{ container: { paddingBlock: 0 } }}>
            <TemplateSelector></TemplateSelector>
          </ColumnWrapper>
          <Separator></Separator>
        </ColWrapper>
        <FormWrapper>
          <ColumnWrapper
            styles={{ container: { paddingBlock: 0 } }}
            footer={
              <ModalFooter
                onOk={handleSubmit}
                onCancel={handleCancel}
                style={{
                  padding: '16px 24px 8px',
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              />
            }
          >
            <GPUServiceInstanceForm
              ref={form}
              action={action}
              currentData={data}
              onFinish={onFinish}
              open={open}
            />
          </ColumnWrapper>
        </FormWrapper>
      </Container>
    </GSDrawer>
  );
};

export default AddModal;
