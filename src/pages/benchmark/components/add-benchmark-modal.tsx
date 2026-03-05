import ModalFooter from '@/components/modal-footer';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import CompatibilityAlert from '@/pages/llmodels/components/compatible-alert';
import { useIntl } from '@umijs/max';
import React, { useRef } from 'react';
import { ProfileValueMap } from '../config';
import { FormData, BenchmarkListItem as ListItem } from '../config/types';
import BenchmarkForm from '../forms';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  clusterList?: Global.BaseOption<number>[];
  profilesOptions: Global.BaseOption<string>[];
  datasetList: Global.BaseOption<number | string>[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddBenchmark: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  currentData,
  clusterList,
  profilesOptions,
  datasetList,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const [profile, setProfile] = React.useState<string>('');

  const handleProfileChange = (value: string) => {
    setProfile(value);
  };

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleOk = async (data: FormData) => {
    onOk({
      ...data
    });
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={600}
      footer={
        <>
          {action === PageAction.CREATE &&
            profile === ProfileValueMap.LongContextStress && (
              <CompatibilityAlert
                showClose={false}
                warningStatus={{
                  show: true,
                  message: intl.formatMessage({
                    id: 'benchmark.form.longContext.tips'
                  })
                }}
                contentStyle={{ paddingInline: 0 }}
              ></CompatibilityAlert>
            )}
          <ModalFooter
            onOk={handleSubmit}
            onCancel={handleCancel}
            style={ModalFooterStyle}
          ></ModalFooter>
        </>
      }
    >
      <BenchmarkForm
        ref={form}
        action={action}
        open={open}
        currentData={currentData}
        clusterList={clusterList}
        profilesOptions={profilesOptions}
        datasetList={datasetList}
        onFinish={handleOk}
        onProfileChange={handleProfileChange}
      />
    </FormDrawer>
  );
};

export default AddBenchmark;
