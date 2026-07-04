/**
 * Mirrors ProLayout's clearMenuItem so mobile drawer menu matches desktop sider.
 * RouteContext.menuData is unfiltered (ignoreFilter=true in getMenuData).
 */

type MenuDataItem = {
  name?: string;
  hideInMenu?: boolean;
  hideChildrenInMenu?: boolean;
  children?: MenuDataItem[];
  routes?: MenuDataItem[];
  [key: string]: unknown;
};

export function clearMenuData(menusData: MenuDataItem[] = []): MenuDataItem[] {
  return menusData
    .map((item) => {
      const children = item.children || [];
      const finalItem = { ...item };

      if (!finalItem.children && finalItem.routes) {
        finalItem.children = finalItem.routes;
      }

      if (!finalItem.name || finalItem.hideInMenu) {
        return null;
      }

      if (finalItem.children) {
        if (
          !finalItem.hideChildrenInMenu &&
          children.some((child) => child && child.name && !child.hideInMenu)
        ) {
          return {
            ...item,
            children: clearMenuData(children)
          };
        }
        delete finalItem.children;
      }

      delete finalItem.routes;
      return finalItem;
    })
    .filter((item): item is MenuDataItem => !!item);
}
