import { platformCall } from '@/utils';
const platform = platformCall();
const KeybindingsMap = {
  CREATE: ['alt+ctrl+N', 'alt+meta+N'],
  CLEAR: ['alt+ctrl+W', 'alt+meta+W'],
  RIGHT: ['ctrl+RIGHT', 'meta+RIGHT'],
  SAVE: ['ctrl+S', 'meta+S'],
  SUBMIT: ['ctrl+enter', 'meta+enter'],
  SAVEAS: ['alt+ctrl+S', 'alt+meta+S'],
  OPEN: ['alt+ctrl+O', 'alt+meta+O'],
  CANCEL: ['ctrl+W', 'meta+W'],
  DELETE: ['delete'],
  COPY: ['ctrl+C', 'meta+C'],
  REFRESH: ['ctrl+R', 'meta+R'],
  EDIT: ['ctrl+E', 'meta+E'],
  SEARCH: ['ctrl+K', 'meta+K'],
  RESET: ['alt+ctrl+R', 'alt+meta+R'],
  INPUT: ['ctrl+K', 'meta+K'],
  NEW1: ['ctrl+1', 'meta+1'],
  NEW2: ['ctrl+2', 'meta+2']
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
        ? keybinding.replace('meta', 'Command').replace('alt', 'Option')
        : keybinding.replace('ctrl', 'Ctrl'),
      iconKeybinding: platform.isMac
        ? keybinding.replace('meta', '⌘').replace('alt', '⌥')
        : keybinding.replace('ctrl', 'Ctrl')
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

console.log('KeyMap=========', KeyMap);

export { KeyMap, KeybiningList };

export default KeybindingsMap;
