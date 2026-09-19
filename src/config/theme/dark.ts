import { COLOR_PRIMARY, FONT_FAMILY } from './constants';

export default {
  'root-entry-name': 'variable',
  hashed: false,
  components: {
    // Keep in step with light.ts — see the note there on why the modal radius
    // is set here rather than left to the global borderRadiusLG.
    Modal: {
      borderRadiusLG: 12
    },
    Input: {
      inputFontSize: 14,
      inputFontSizeLG: 14
    },
    InputNumber: {
      handleWidth: 32
    },
    Tag: {
      defaultBg: '#272727'
    },
    Steps: {
      descriptionMaxWidth: 200,
      iconSizeSM: 20
    },
    Table: {
      headerBorderRadius: 6,
      cellPaddingInline: 16,
      cellPaddingBlock: 6,
      cellFontSize: 14,
      rowSelectedHoverBg: '#272727',
      rowHoverBg: '#272727',
      rowSelectedBg: 'transparent',
      headerSortActiveBg: 'transparent',
      headerSortHoverBg: 'transparent',
      bodySortBg: 'transparent',
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
    Alert: {
      withDescriptionPadding: '12px 16px',
      withDescriptionIconSize: 18
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
      itemActiveBg: 'rgb(24 25 27)',
      menuItemSelectedBg: '#292929'
    },
    Progress: {
      lineBorderRadius: 4
    },
    Dropdown: {
      controlItemBgActive: '#333',
      controlItemBgActiveHover: '#333'
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
      handleSize: 8,
      handleSizeHover: 8,
      railSize: 4,
      handleActiveOutlineColor: '#646464', // disable default outline
      handleActiveColor: '#656565', // same as the rail color
      handleColor: '#474747', // same as the rail color
      trackBg: 'rgba(255,255,255,.15)',
      trackHoverBg: '#646464',
      dotActiveBorderColor: 'rgba(255,255,255,0.25)',
      dotBorderColor: 'rgba(255,255,255,0.25)'
    },
    Descriptions: {
      itemPaddingBottom: 8
    }
  },
  token: {
    darkMode: true,
    fontFamily: FONT_FAMILY,
    colorText: '#ccc',
    colorPrimary: COLOR_PRIMARY,
    colorSuccess: '#48A77E',
    colorBorder: '#3a3a3a',
    borderRadiusOuter: 6,
    borderRadiusLG: 6,
    borderRadius: 4,
    borderRadiusSM: 3,
    fontSize: 14,
    motion: true,
    // `colorFill: '#0A0A0A'` was here alongside `colorBgBase` and is gone.
    // It is antd's FIRST-LEVEL FILL — "the darkest fill color… currently only
    // used in the hover effect of Slider", and in this app also the scrollbar
    // thumb's hover. Setting it to the same value as the base background made
    // both invisible in the dark theme. antd's own dark derivation is
    // `rgba(255,255,255,0.18)`, i.e. a LIGHT overlay, which is what a fill on a
    // dark canvas has to be.
    colorBgBase: '#0A0A0A',
    // Matches `--color-bg-page` in the dark block of `global.less`.
    colorBgLayout: '#141414',
    menuItemSelectedBg: '#292929'
  }
};
