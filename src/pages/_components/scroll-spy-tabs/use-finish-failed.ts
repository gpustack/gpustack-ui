interface FinishFailedOptions {
  requiredFields: {
    [tab: string]: {
      sort: number;
      fields: string[];
    };
  };
  onTargetChange: (key: string) => void;
  updateActiveKey: (key: string[]) => void;
}

const useFinishFailed = (options: FinishFailedOptions) => {
  const { requiredFields, onTargetChange, updateActiveKey } = options;
  const handleOnFinishFailed = (errorInfo: any) => {
    const { errorFields } = errorInfo;

    console.log('Finish failed:', errorInfo);

    if (errorFields && errorFields.length > 0) {
      const collapseKeys: { sort: number; key: string }[] = [];
      const names = errorFields.map((item: any) => item.name[0]);
      Object.entries(requiredFields).forEach(([tab, { fields, sort }]) => {
        const hasError = fields.some((field: string) => names.includes(field));
        if (hasError) {
          collapseKeys.push({ sort, key: tab });
        }
      });
      if (collapseKeys.length > 0) {
        const keys = collapseKeys
          .sort((a, b) => a.sort - b.sort)
          .map((item) => item.key);

        updateActiveKey(keys);
        onTargetChange(collapseKeys[0].key);
      }
    }
  };

  return {
    handleOnFinishFailed
  };
};

export default useFinishFailed;
