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
        buffer: false,
        selfHandleResponse: false,
        pathRewrite: (pth: string) => pth.replace(`/^/${api}`, `/${api}`),
        headers: {
          origin: newTarget,
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        onProxyRes: (proxyRes: any, req: any, res: any) => {
          // let body = '';
          // proxyRes.on('data', (chunk) => {
          //   body += chunk;
          //   console.log('Received data from target server::::::::::', chunk);
          // });

          // proxyRes.on('end', () => {
          //   console.log('Received data from target server=================end');
          //   console.log(body);
          // });
          if (req.headers.accept === 'text/event-stream') {
            res.writeHead(res.statusCode, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Accel-Buffering': 'no',
              'Access-Control-Allow-Origin': '*'
            });
            proxyRes.pipe(res);
          }
        }
      };
      return obj;
    },
    {}
  );
  return proxyTable;
}
