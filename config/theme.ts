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
      rowSelectedHoverBg: '#e6f6ff'
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
      handleSizeHover: 10
      // handleColor: '#007BFF'
      // trackBg: '#007BFF',
      // trackHoverBg: '#007BFF'
    }
  },
  token: {
    colorPrimary: '#007BFF',
    borderRadius: 8,
    fontSize: 12,
    motion: true
  }
};
