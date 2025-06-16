import { platformCall } from '@/utils';

const platform = platformCall();
const KeybindingsMap = {
  CREATE: ['Alt+Ctrl+N', 'Alt+Meta+N'],
  CLEAR: ['Alt+Ctrl+K', 'Alt+Meta+K'],
  RIGHT: ['Ctrl+RIGHT', 'Meta+RIGHT'],
  SAVE: ['Ctrl+S', 'Meta+S'],
  SUBMIT: ['Enter', 'Enter'],
  ENTER: ['Enter', 'Enter'],
  SHIFT: ['Shift', 'Shift'],
  CTRL: ['Ctrl', 'Meta'],
  OPTION: ['Alt', 'Option'],
  SAVEAS: ['Alt+Ctrl+S', 'Alt+Meta+S'],
  OPEN: ['Alt+Ctrl+O', 'Alt+Meta+O'],
  UNDO: ['Ctrl+Z', 'Meta+Z'],
  CANCEL: ['Ctrl+W', 'Meta+W'],
  DELETE: ['delete'],
  COPY: ['Ctrl+C', 'Meta+C'],
  REFRESH: ['Ctrl+R', 'Meta+R'],
  EDIT: ['Ctrl+E', 'Meta+E'],
  SEARCH: ['Ctrl+K', 'Meta+K'],
  RESET: ['Alt+Ctrl+R', 'Alt+Meta+R'],
  INPUT: ['Ctrl+K', 'Meta+K'],
  NEW1: ['Ctrl+1', 'Meta+1'],
  NEW2: ['Ctrl+2', 'Meta+2'],
  NEW3: ['Ctrl+3', 'Meta+3'],
  NEW4: ['Ctrl+4', 'Meta+4'],
  FOCUS: ['/', '/'],
  ADD: ['Alt+Ctrl+Enter', 'Alt+Meta+Enter'],
  ESC: ['Esc', 'Esc']
};

type KeyBindingType = keyof typeof KeybindingsMap;

type KeybindingValue = {
  keybinding: string;
  command: KeyBindingType;
  textKeybinding: string;
  iconKeybinding: string;
};

const KeybiningList: KeybindingValue[] = Object.entries(KeybindingsMap).map(
  ([key, value]) => {
    const keybinding = platform.isMac ? value[1] || value[0] : value[0];
    return {
      keybinding: keybinding,
      command: key,
      textKeybinding: platform.isMac
        ? keybinding.replace('Meta', 'Cmd').replace('Alt', 'Option')
        : keybinding.replace('Ctrl', 'Ctrl'),
      iconKeybinding: platform.isMac
        ? keybinding.replace('Meta', '⌘').replace('Alt', '⌥')
        : keybinding.replace('Ctrl', 'Ctrl')
    } as KeybindingValue;
  }
);

const KeyMap: Record<KeyBindingType, KeybindingValue> = KeybiningList.reduce(
  (acc: any, item) => {
    acc[item.command] = item;
    return acc;
  },
  {}
);

export { KeyMap, KeybiningList };

export default KeybindingsMap;
