export default {
  'root-entry-name': 'variable',
  cssVar: true,
  hashed: false,
  components: {
    Input: {
      inputFontSize: 14
    },
    Table: {
      cellFontSize: 14,
      rowSelectedHoverBg: 'rgb(249 249 249)',
      rowHoverBg: 'rgb(249 249 249)',
      rowSelectedBg: 'transparent'
    },
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
      itemHeight: 44,
      itemColor: 'rgba(0,0,0,1)',
      itemHoverBg: 'rgba(0,0,0,0.04)',
      itemActiveBg: 'rgba(0,0,0,0.04)'
    },
    Progress: {
      lineBorderRadius: 4
    },
    Select: {
      itemSelectedBg: 'rgba(0,0,0,0.06)'
    },
    Message: {
      contentPadding: '12px 16px'
    },
    Tooltip: {
      colorBgSpotlight: '#3e3e3e'
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Cascader: {
      dropdownHeight: 240
    },
    Slider: {
      handleSize: 8,
      handleSizeHover: 8,
      trackBg: 'rgba(0,0,0,0.15)',
      handleColor: 'rgba(0,0,0,0.2)',
      trackHoverBg: 'rgba(0,0,0,0.25)',
      handleActiveColor: 'rgba(0,0,0,0.3)',
      dotActiveBorderColor: 'rgba(0,0,0,0.25)',
      handleActiveOutlineColor: 'rgba(0,0,0,0.25)',
      dotBorderColor: 'rgba(0,0,0,0.25)'
    }
  },
  token: {
    colorPrimary: '#007BFF',
    colorSuccess: '#54cc98',
    borderRadius: 4,
    borderRadiusSM: 2,
    fontSize: 14,
    motion: true
  }
};
