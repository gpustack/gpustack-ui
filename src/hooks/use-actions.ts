export default function useActions<T>(actions: Global.ActionItem<T>[], ctx: T) {
  return actions
    .filter((action) => {
      return action.visible ? action.visible(ctx) : true;
    })
    .map((action) => ({
      ...action,
      disabled: action.disabled?.(ctx)
    }));
}
