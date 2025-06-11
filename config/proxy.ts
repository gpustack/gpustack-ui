const proxyTableList = [
  'cli',
  'v1',
  'auth',
  'v1-openai',
  'version',
  'proxy',
  'update'
];

// @ts-ingore
export default function createProxyTable(target?: string) {
  const proxyTable = proxyTableList.reduce(
    (obj: Record<string, object>, api) => {
      const newTarget = target || 'http://localhost';
      obj[`/${api}`] = {
        target: newTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
        log: 'debug',
        pathRewrite: (pth: string) => pth.replace(`/^/${api}`, `/${api}`),
        headers: {
          origin: newTarget,
          Connection: 'keep-alive'
        }
      };
      return obj;
    },
    {}
  );
  return proxyTable;
}
