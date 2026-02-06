import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import React, { useRef } from 'react';
import { FormData, BenchmarkListItem as ListItem } from '../config/types';

import BenchmarkForm from '../forms';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  clusterList?: Global.BaseOption<number>[];
  profilesOptions?: Global.BaseOption<string>[];
  datasetList?: Global.BaseOption<number | string>[];
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
  const form = useRef<any>(null);

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
      />
    </FormDrawer>
  );
};

export default AddBenchmark;
