export const imageSharedFields = [
  'size',
  'width',
  'height',
  'seed',
  'random_seed'
];

export const imageParameterLabels: Record<string, string> = {
  size: 'playground.params.size',
  width: 'playground.params.width',
  height: 'playground.params.height',
  seed: 'playground.image.params.seed'
};

export const imageComparisonLayouts = [
  {
    count: 2,
    span: 12,
    icon: 'icon-cols_2',
    messageId: 'playground.toolbar.compare2Model'
  },
  {
    count: 3,
    span: 8,
    icon: 'icon-cols_3',
    messageId: 'playground.toolbar.compare3Model'
  },
  {
    count: 4,
    span: 12,
    icon: 'icon-cols_4',
    messageId: 'playground.toolbar.compare4Model'
  },
  {
    count: 6,
    span: 8,
    icon: 'icon-cols_6',
    messageId: 'playground.toolbar.compare6Model'
  }
];
