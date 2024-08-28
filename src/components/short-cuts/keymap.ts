import { KeyMap } from '@/config/hotkeys';
export default [
  {
    scope: 'playground',
    command: 'shortcuts.playground.newmessage',
    keybinding: KeyMap.CREATE.iconKeybinding
  },
  {
    scope: 'playground',
    command: 'shortcuts.playground.clearmessage',
    keybinding: KeyMap.CLEAR.iconKeybinding
  },
  {
    scope: 'playground',
    command: 'shortcuts.playground.toggleparams',
    keybinding: KeyMap.RIGHT.iconKeybinding
  },
  {
    scope: 'models',
    // span: {
    //   rowSpan: 3,
    //   colSpan: 1
    // },
    command: 'shortcuts.models.newmodelHF',
    keybinding: KeyMap.NEW1.iconKeybinding
  },
  {
    scope: 'models',
    command: 'shortcuts.models.newmodelLM',
    keybinding: KeyMap.NEW2.iconKeybinding
    // span: {
    //   rowSpan: 0,
    //   colSpan: 0
    // }
  },
  {
    scope: 'models',
    command: 'shortcuts.models.search',
    keybinding: KeyMap.SEARCH.iconKeybinding
    // span: {
    //   rowSpan: 0,
    //   colSpan: 0
    // }
  },
  {
    scope: 'resources',
    command: 'shortcuts.resources.addworker',
    keybinding: KeyMap.CREATE.iconKeybinding
  },
  {
    scope: 'API keys',
    command: 'shortcuts.apikeys.new',
    keybinding: KeyMap.CREATE.iconKeybinding
  },
  {
    scope: 'users',
    command: 'shortcuts.users.new',
    keybinding: KeyMap.CREATE.iconKeybinding
  }
];
