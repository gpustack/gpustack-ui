import { getGPUStackPlugin } from '@/plugins';
import type { ComponentType, ReactNode } from 'react';
import { useEffect } from 'react';
import type { ListItem } from './config/types';

// Generic per-row "configure this api-key" plugin slot.
//
// Each enterprise plugin contributes one entry: a dropdown button +
// its own controlled form component + a `useCreate` hook that owns the
// open/close state for that entry's drawer. The host renders all
// entries' buttons in the dropdown (ordered by `priority`) and renders
// one `APIKeyConfigActionMount` per entry — that mount is what calls
// the entry's `useCreate` (a single hook call per component, so the
// Rules-of-Hooks aren't violated by iteration order) and reports its
// controller back to the host via `registerController`. Replaces the
// older `APIKeyIPConfig` slot, the generic `apiKeys.rowActions`, and
// the `PluginExtraFields name="APIKeysPageGlobal"` mount point —
// adding a new per-key configuration feature now only requires
// registering a new entry from the plugin side.
export type APIKeyConfigActionRecord = Partial<ListItem> & {
  id: number;
  name?: string;
};

export type APIKeyConfigActionFormProps = {
  open: boolean;
  apiKey?: APIKeyConfigActionRecord | null;
  onClose: () => void;
  onOk?: () => void;
};

export type APIKeyConfigActionState = {
  open: boolean;
  currentData?: APIKeyConfigActionRecord | null;
};

export type APIKeyConfigActionController = {
  openModalStatus: APIKeyConfigActionState;
  openModal: (row: APIKeyConfigActionRecord) => void;
  closeModal: () => void;
};

export type APIKeyConfigAction = {
  key: string;
  labelId: string;
  icon?: ReactNode;
  // Lower comes first; default 100. Stable sort preserves declaration
  // order on ties. Built-ins use `edit=0` and `delete=9999`, so a
  // plugin priority of 10–9000 lands between Edit and Delete.
  priority?: number;
  // Destructive entries sink to the bottom of the dropdown regardless
  // of priority — keeps Delete-style actions visually grouped.
  danger?: boolean;
  form: ComponentType<APIKeyConfigActionFormProps>;
  useCreate: () => APIKeyConfigActionController;
};

// Static registration read — plugins are wired once at boot, so the
// list reference is stable across renders. Exposed as a helper to keep
// the host's import surface tight.
export const getAPIKeyConfigActions = (): APIKeyConfigAction[] =>
  getGPUStackPlugin()?.apiKeys?.configActions ?? [];

type APIKeyConfigActionMountProps = {
  action: APIKeyConfigAction;
  // Called once after mount (and on controller identity change) so the
  // host can route a dropdown click to the correct entry's openModal.
  registerController: (
    key: string,
    controller: APIKeyConfigActionController
  ) => void;
  onOk?: () => void;
};

// One component instance per registered action. Calls `useCreate` at
// the top level (single hook call per component) and renders the
// entry's form bound to its own controller. Hosts mount one of these
// per entry in `apiKeys.configActions`.
export const APIKeyConfigActionMount: React.FC<
  APIKeyConfigActionMountProps
> = ({ action, registerController, onOk }) => {
  const controller = action.useCreate();
  useEffect(() => {
    registerController(action.key, controller);
  }, [action.key, controller, registerController]);
  const Form = action.form;
  return (
    <Form
      open={controller.openModalStatus.open}
      apiKey={controller.openModalStatus.currentData}
      onClose={controller.closeModal}
      onOk={onOk}
    />
  );
};
