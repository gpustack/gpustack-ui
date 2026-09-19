import { COLOR_PRIMARY, FONT_FAMILY } from './constants';

export default {
  'root-entry-name': 'variable',
  hashed: false,
  components: {
    Layout: {
      headerHeight: 48
    },
    // One value for the modal role. `--border-radius-modal: 12px` (global.less)
    // has named it since the beginning, but only DeleteModal and the login card
    // read it — the other ~55 modals fell back to the global borderRadiusLG of
    // 6. Setting it in the component scope makes the token the single source
    // instead of a label on 7% of the cases.
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
      defaultBg: '#fafafa'
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
      rowSelectedHoverBg: 'rgb(247 247 247)',
      rowHoverBg: 'rgb(247 247 247)',
      rowSelectedBg: 'transparent',
      headerSortActiveBg: 'transparent',
      headerSortHoverBg: 'transparent',
      bodySortBg: 'transparent',
      headerSplitColor: '#e8e8e8',
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
    Card: {
      headerHeight: 50
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
      itemActiveBg: 'rgba(0,0,0,0.04)',
      menuItemSelectedBg: '#e8eaed'
    },
    Progress: {
      lineBorderRadius: 3
    },
    Dropdown: {
      controlItemBgActive: 'rgba(230, 230, 230, 88%)',
      controlItemBgActiveHover: 'rgba(230, 230, 230, 88%)'
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
    // `system-ui` leads so each platform gets its own UI grotesque (SF Pro on
    // macOS, Segoe UI Variable on Windows) instead of the old stack, which
    // missed on Windows all the way down to Arial. The CJK faces are the other
    // half of the fix: the product ships zh-CN and ja-JP, and with no CJK entry
    // those locales fell to the browser default — often a serif on Windows,
    // rendering in a different family from the Latin text beside it.
    fontFamily: FONT_FAMILY,
    colorText: '#1F1F1F',
    // colorTextSecondary: '#484848',
    // colorTextTertiary: '#757576',
    // colorTextQuaternary: '#A6A6A7',
    // The three fill levels are deliberately NOT overridden. antd derives them
    // as alpha overlays (`rgba(0,0,0,0.06 / 0.04 / 0.02)`) and the whole system
    // depends on that: a hover fill is meant to DARKEN whatever it sits on, and
    // antd stacks them (a quaternary zebra stripe plus a secondary hover). The
    // opaque hex values this replaces (`#eaebec` / `#f1f2f3` / `#f7f8fa`) could
    // not stack — they replaced the colour underneath instead of deepening it,
    // which broke hover on any tinted or already-filled surface. They also left
    // light and dark on different mechanisms, since dark never overrode them.
    //
    // The look barely moves: composited over this theme's `#fdfdfd` container
    // the derived values are `#eeeeee` / `#f3f3f3` / `#f8f8f8`, i.e. within a
    // couple of levels of the literals they replace.
    colorPrimary: COLOR_PRIMARY,
    colorSuccess: '#54cc98',
    colorBorder: '#d3d8de',
    borderRadiusOuter: 6,
    borderRadiusLG: 6,
    borderRadius: 4,
    borderRadiusSM: 3,
    colorBgContainer: '#fdfdfd',
    // antd's B1 layer. It had no value at all before, so nothing in the product
    // used `colorBgLayout` — the page canvas was painted straight onto `<html>`
    // and duplicated by two further tokens that had no consumers. Kept in sync
    // with `--color-bg-page` in `global.less`, which paints that same backdrop.
    colorBgLayout: '#f4f5f6',
    fontSize: 14,
    motion: true
  }
};
