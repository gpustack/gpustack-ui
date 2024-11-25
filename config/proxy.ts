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
        pathRewrite: (pth: string) => pth.replace(`/^/${api}`, `/${api}`),
        // onProxyRes: (proxyRes: any, req: any, res: any) => {
        //   proxyRes.on('data', (chunk: any) => {
        //     console.log('chunk=====', chunk);
        //     res.write(chunk);
        //   });

        //   proxyRes.on('end', () => {
        //     res.end();
        //   });

        //   proxyRes.on('error', (err: any) => {
        //     console.error('Proxy stream error:', err);
        //     res.status(500).end('Stream error');
        //   });
        // },
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
