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
      headerBorderRadius: 4,
      cellPaddingInline: 16,
      cellPaddingBlock: 6,
      cellFontSize: 14,
      rowSelectedHoverBg: 'rgb(24 25 27)',
      rowHoverBg: 'rgb(24 25 27)',
      rowSelectedBg: 'transparent'
    },
    Button: {
      contentFontSizeLG: 14,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Tabs: {
      titleFontSizeLG: 14,
      cardBg: '#1D1E20'
    },
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
      itemBorderRadius: 4,
      itemHeight: 44,
      itemSelectedColor: '#007BFF',
      darkItemSelectedBg: 'rgb(24 25 27)',
      darkItemHoverBg: 'rgb(24 25 27)',
      groupTitleColor: 'rgba(0,0,0,1)',
      itemHoverColor: 'rgba(0,0,0,1)',
      itemColor: 'rgba(0,0,0,1)',
      itemHoverBg: 'rgb(24 25 27)',
      itemActiveBg: 'rgb(24 25 27)'
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
      colorBgSpotlight: '#1D1E20'
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
    fontFamily:
      "Helvetica Neue, -apple-system, BlinkMacSystemFont, Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    colorText: '#ccc',
    colorPrimary: '#007BFF',
    colorSuccess: '#54cc98',
    borderRadius: 4,
    borderRadiusSM: 2,
    fontSize: 14,
    motion: true,
    colorFill: 'rgb(0,0,0)',
    colorFillTertiary: '#1D1E20',
    colorBgContainer: '#141414',
    colorBgBase: '#000',
    colorBorder: '#353535',
    colorSplit: '#262626',
    colorBorderSecondary: '#262626'
  }
};
