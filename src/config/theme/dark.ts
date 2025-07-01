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
      rowSelectedHoverBg: '#1d1d1d',
      rowHoverBg: '#1d1d1d',
      rowSelectedBg: 'transparent'
    },
    Button: {
      contentFontSizeLG: 14,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Tabs: {
      titleFontSizeLG: 14
    },
    DatePicker: {
      fontSizeLG: 14
    },
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
      itemBorderRadius: 4,
      itemHeight: 32,
      itemSelectedColor: '#007BFF',
      darkItemSelectedBg: '#141414',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.03)',
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
      optionSelectedBg: '#333',
      fontSizeLG: 14
    },
    Message: {
      contentPadding: '12px 16px'
    },
    Tooltip: {
      // colorBgSpotlight: '#333'
    },
    Cascader: {
      dropdownHeight: 240
    },
    Slider: {
      handleSize: 8,
      handleSizeHover: 8,
      trackBg: 'rgba(255,255,255,.15)',
      handleColor: 'rgba(255,255,255,0.2)',
      trackHoverBg: 'rgba(255,255,255,0.25)',
      handleActiveColor: 'rgba(255,255,255,0.3)',
      dotActiveBorderColor: 'rgba(255,255,255,0.25)',
      handleActiveOutlineColor: 'rgba(255,255,255,0.25)',
      dotBorderColor: 'rgba(255,255,255,0.25)'
    }
  },
  token: {
    darkMode: true,
    fontFamily:
      "Helvetica Neue, -apple-system, BlinkMacSystemFont, Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    colorText: '#ccc',
    colorPrimary: '#007BFF',
    colorSuccess: '#48A77E',
    borderRadius: 4,
    borderRadiusSM: 2,
    fontSize: 14,
    motion: true,
    colorFill: '#000',
    colorBgBase: '#000'
  }
};
