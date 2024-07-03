export default {
  'root-entry-name': 'variable',
  cssVar: true,
  hashed: false,
  components: {
    Input: {
      inputFontSize: 12
    },
    Table: {
      cellFontSize: 12,
      rowSelectedHoverBg: 'rgba(230, 230, 230, 0.88)',
      rowSelectedBg: 'rgb(244, 245, 244)'
    },
    Menu: {
      iconSize: 16,
      iconMarginInlineEnd: 12,
      itemHeight: 44
    },
    Progress: {
      lineBorderRadius: 4
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
    borderRadius: 8,
    fontSize: 12,
    motion: true
  }
};
