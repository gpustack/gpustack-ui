export default {
  'root-entry-name': 'variable',
  cssVar: true,
  hashed: false,
  components: {
    Input: {
      inputFontSize: 14,
      inputFontSizeLG: 14
    },
    Table: {
      cellFontSize: 14,
      rowSelectedHoverBg: 'rgba(230, 230, 230, 0.88)',
      rowSelectedBg: 'rgb(244, 245, 244)'
    },
    Button: {
      contentFontSizeLG: 14
    },
    Tabs: {
      titleFontSizeLG: 14
    },
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
      itemBorderRadius: 4,
      itemSelectedColor: '#007BFF',
      itemHeight: 44,
      groupTitleColor: 'rgba(0,0,0,1)',
      itemHoverColor: 'rgba(0,0,0,1)',
      itemColor: 'rgba(0,0,0,1)',
      itemHoverBg: 'rgba(0,0,0,0.04)',
      itemActiveBg: 'rgba(0,0,0,0.04)'
    },
    Progress: {
      lineBorderRadius: 2
    },
    Select: {
      optionSelectedBg: 'rgba(230, 230, 230, 88%)',
      fontSizeLG: 14
    },
    Message: {
      contentPadding: '12px 16px'
    },
    Tooltip: {
      colorBgSpotlight: '#3e3e3e'
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
    colorText: 'rgba(0,0,0,1)',
    colorPrimary: '#007BFF',
    colorSuccess: '#54cc98',
    borderRadius: 4,
    borderRadiusSM: 2,
    fontSize: 14,
    motion: true
  }
};
