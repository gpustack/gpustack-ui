const options = [
  {
    label: '--chat-template',
    value: '--chat-template'
  },
  {
    label: '--ctx-size',
    value: '--ctx-size',
    options: []
  },
  {
    label: '--flash-attn',
    value: '--flash-attn'
  },
  {
    label: '--parallel',
    value: '--parallel'
  },
  {
    label: '--batch-size',
    value: '--batch-size'
  },
  {
    label: '--ubatch-size',
    value: '--ubatch-size'
  },
  {
    label: '--images',
    value: '--images'
  }
];

const resultList = options.map((option) => {
  return {
    label: option.label,
    value: option.value,
    opts: option.options?.map((opt) => {
      return {
        label: opt,
        value: opt
      };
    })
  };
});

export default resultList;
