const proxyTableList = ['cli', 'v1'];

// @ts-ingore
export default function createProxyTable(target?: string) {
  const proxyTable = proxyTableList.reduce(
    (obj: Record<string, object>, api) => {
      const newTarget = target || 'http://localhost';
      obj[`/${api}/`] = {
        target: newTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
        pathRewrite: (pth: string) => pth.replace(`/^/${api}/`, `/${api}`),
        headers: {
          origin: newTarget
        }
      };
      return obj;
    },
    {}
  );
  return proxyTable;
}