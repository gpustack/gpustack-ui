import { getGPUStackPlugin } from '@/plugins';
import React from 'react';

// Render a plugin-provided component registered under
// `pluginManager.components.<key>`. If no plugin is registered, or
// the plugin doesn't export this slot, renders nothing — host pages
// embedding the slot stay unchanged when no plugin is present.
//
// Used by create / edit forms to let plugins inject extra Form.Item
// fields. Because antd `Form` walks the JSX tree to collect named
// `Form.Item` values, the plugin's content gets picked up by the
// surrounding form automatically — no host-side wiring required.
const PluginExtraFields: React.FC<{
  name: string;
  // Free-form payload forwarded to the plugin component, e.g. so a
  // form-specific slot can pass its action / record context if it
  // needs to.
  context?: Record<string, any>;
  [key: string]: any;
}> = ({ name, context, ...rest }) => {
  const Slot = getGPUStackPlugin()?.components?.[name];
  if (!Slot) {
    return null;
  }
  return <Slot context={context} {...rest} />;
};

export default PluginExtraFields;
