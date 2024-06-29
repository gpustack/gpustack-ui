const proxyTableList = ['cli', 'v1', 'auth', 'v1-openai'];

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
        // onProxyRes: (proxyRes: any, req: any, res: any) => {
        //   if (req.headers.accept === 'text/event-stream') {
        //     res.writeHead(res.statusCode, {
        //       'Content-Type': 'text/event-stream',
        //       'Cache-Control': 'no-transform',
        //       Connection: 'keep-alive',
        //       'X-Accel-Buffering': 'no',
        //       'Access-Control-Allow-Origin': '*'
        //     });
        //     proxyRes.pipe(res);
        //   }
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
