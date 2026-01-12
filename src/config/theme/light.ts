import { COLOR_PRIMARY } from './index';

export default {
  'root-entry-name': 'variable',
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
      defaultBg: '#fafafa'
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
      rowSelectedHoverBg: 'rgb(249 249 249)',
      rowHoverBg: 'rgb(249 249 249)',
      rowSelectedBg: 'transparent',
      headerSortActiveBg: 'transparent',
      headerSortHoverBg: 'transparent',
      headerBg: 'none'
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
      itemSelectedColor: COLOR_PRIMARY,
      itemHeight: 32,
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
      dropdownHeight: 240,
      optionSelectedFontWeight: 400
    },
    Slider: {
      handleSize: 8,
      handleSizeHover: 8,
      railSize: 4,
      handleActiveOutlineColor: '#B4B4B4', // disable default outline
      handleActiveColor: '#D0D0D0', // same as the rail color
      handleColor: '#D0D0D0', // same as the rail color
      handleHoverColor: '#B4B4B4', // same as the rail hover color
      trackBg: 'rgba(0,0,0,0.15)',
      trackHoverBg: '#B4B4B4',
      dotActiveBorderColor: 'rgba(0,0,0,0.25)',
      dotBorderColor: 'rgba(0,0,0,0.25)'
    },
    Descriptions: {
      itemPaddingBottom: 8
    }
  },
  token: {
    darkMode: false,
    fontFamily:
      "Helvetica Neue, -apple-system, BlinkMacSystemFont, Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    colorText: '#1F1F1F',
    colorPrimary: COLOR_PRIMARY,
    colorSuccess: '#54cc98',
    colorBorder: '#d3d0d9',
    borderRadius: 4,
    borderRadiusSM: 2,
    colorBgContainer: '#fff',
    fontSize: 14,
    motion: true
  }
};
