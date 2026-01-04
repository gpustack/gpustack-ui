import { COLOR_PRIMARY } from './index';

export default {
  'root-entry-name': 'variable',
  // cssVar: true,
  hashed: false,
  components: {
    Input: {
      inputFontSize: 14,
      inputFontSizeLG: 14
    },
    InputNumber: {
      handleWidth: 32
    },
    Tag: {
      defaultBg: '#1d1d1d'
    },
    Steps: {
      descriptionMaxWidth: 200,
      iconSizeSM: 20
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
      itemSelectedColor: COLOR_PRIMARY,
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
      dropdownHeight: 240,
      optionSelectedFontWeight: 400
    },
    Slider: {
      handleSize: 10,
      handleSizeHover: 10,
      railSize: 5,
      handleActiveOutlineColor: '#646464', // disable default outline
      handleActiveColor: '#656565', // same as the rail color
      handleColor: '#474747', // same as the rail color
      trackBg: 'rgba(255,255,255,.15)',
      trackHoverBg: '#646464',
      dotActiveBorderColor: 'rgba(255,255,255,0.25)',
      dotBorderColor: 'rgba(255,255,255,0.25)'
    }
  },
  token: {
    darkMode: true,
    fontFamily:
      "Helvetica Neue, -apple-system, BlinkMacSystemFont, Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    colorText: '#ccc',
    colorPrimary: COLOR_PRIMARY,
    colorSuccess: '#48A77E',
    borderRadius: 4,
    borderRadiusSM: 2,
    fontSize: 14,
    motion: true,
    colorFill: '#000',
    colorBgBase: '#000'
  }
};
