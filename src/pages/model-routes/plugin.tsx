import { getGPUStackPlugin } from '@/plugins';
import type { ComponentType, ReactNode } from 'react';
import { useEffect } from 'react';
import type { RouteItem } from './config/types';

// Generic per-row "configure this route" plugin slot. Same shape as
// the api-keys page's `apiKeys.configActions`. Each enterprise plugin
// contributes a `{ key, labelId, icon, priority, form, useCreate }`
// entry — the host renders one dropdown button per entry and one
// `ModelRouteConfigActionMount` per entry. That mount is the only
// place `useCreate` is called (one hook per component, so iterating
// the plugin list doesn't violate the Rules of Hooks). Replaces the
// older `modelRoutes.rowActions` plus the drawer half of
// `<PluginExtraFields name="ModelRoutesPageGlobal" />`.
export type ModelRouteConfigActionRecord = RouteItem;

export type ModelRouteConfigActionFormProps = {
  open: boolean;
  route?: ModelRouteConfigActionRecord | null;
  onClose: () => void;
  onOk?: () => void;
};

export type ModelRouteConfigActionState = {
  open: boolean;
  currentData?: ModelRouteConfigActionRecord | null;
};

export type ModelRouteConfigActionController = {
  openModalStatus: ModelRouteConfigActionState;
  openModal: (row: ModelRouteConfigActionRecord) => void;
  closeModal: () => void;
};

export type ModelRouteConfigAction = {
  key: string;
  labelId: string;
  icon?: ReactNode;
  // Lower comes first; default 100. Built-ins use edit=0, chat=10,
  // api=20, accessControl=30, delete=9999. A plugin priority of
  // 40–9000 lands after accessControl and before delete.
  priority?: number;
  // Sinks the entry to the bottom of the dropdown regardless of
  // priority — keeps destructive actions grouped with Delete.
  danger?: boolean;
  // Per-row visibility predicate. Returning false hides the entry for
  // that route (e.g. for routes without ready targets).
  show?: (route: ModelRouteConfigActionRecord) => boolean;
  form: ComponentType<ModelRouteConfigActionFormProps>;
  useCreate: () => ModelRouteConfigActionController;
};

// Static registration read — plugins are wired once at boot, so the
// list reference is stable across renders.
export const getModelRouteConfigActions = (): ModelRouteConfigAction[] =>
  getGPUStackPlugin()?.modelRoutes?.configActions ?? [];

type ModelRouteConfigActionMountProps = {
  action: ModelRouteConfigAction;
  // Called once after mount (and on controller identity change) so the
  // host can route a dropdown click to the correct entry's openModal.
  registerController: (
    key: string,
    controller: ModelRouteConfigActionController
  ) => void;
  onOk?: () => void;
};

// One component instance per registered action. Single `useCreate`
// call at the top level keeps the hook contract clean even as the
// plugin list grows.
export const ModelRouteConfigActionMount: React.FC<
  ModelRouteConfigActionMountProps
> = ({ action, registerController, onOk }) => {
  const controller = action.useCreate();
  useEffect(() => {
    registerController(action.key, controller);
  }, [action.key, controller, registerController]);
  const Form = action.form;
  return (
    <Form
      open={controller.openModalStatus.open}
      route={controller.openModalStatus.currentData}
      onClose={controller.closeModal}
      onOk={onOk}
    />
  );
};
