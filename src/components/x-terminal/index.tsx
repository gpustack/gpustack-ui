import useUserSettings from '@/hooks/use-user-settings';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { createStyles } from 'antd-style';
import _ from 'lodash';
import qs from 'query-string';
import React, { forwardRef, useEffect, useImperativeHandle } from 'react';

const useStyles = createStyles(({ token, css }) => ({
  wrap: css`
    position: relative;
    text-align: left;
    .xterm {
      height: 100%;
      .xterm-viewport {
        overflow-y: auto;
      }
    }
  `,
  terminal: css`
    height: 100%;
    padding: 5px;
    overflow: hidden;
    overflow: hidden;
    background-color: var(--color-logs-bg);
    border-radius: 0 0 8px 8px;
  `
}));

const terminalEnvList = ['bash', 'sh', 'powershell', 'pwsh', 'cmd', 'bash'];

const RECONNECT_MSG = '--- press Y to reconnect! ---';

const colorBg2 = 'rgb(33, 36, 39)';

interface XTerminalProps {
  height: number;
  url: string;
}

const XTerminal: React.FC<XTerminalProps> = forwardRef((props, ref) => {
  const { height, url } = props;
  const { styles } = useStyles();
  const { userSettings } = useUserSettings();
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const WrapperRef = React.useRef<HTMLDivElement>(null);
  const terminalInstance = React.useRef<any>(null);
  const wssURL = React.useRef<string>('');
  const terminalEnvIndex = React.useRef(0);
  const terminalSocket = React.useRef<WebSocket | null>(null);
  const retryCount = React.useRef(5);
  const totalRetry = React.useRef(5);
  const first = React.useRef(true);
  const loading = React.useRef(false);
  const timer = React.useRef<any>(null);
  const toRetry = React.useRef(false);
  const conReadyState = React.useRef<number>(0);
  const [statusCode, setStatusCode] = React.useState(0);

  const fitAddon = new FitAddon();

  const setWssUrl = (flag?: boolean) => {
    if (terminalEnvIndex.current >= terminalEnvList.length - 1) return;
    if (flag) {
      terminalEnvIndex.current = 0;
    } else {
      terminalEnvIndex.current += 1;
    }
    const params = qs.stringify({
      shell: terminalEnvList[terminalEnvIndex.current]
    });
    wssURL.current = `${url}&${params}`;
  };

  // readyState: 0 1 2 3
  const isWsOpen = () => {
    const readyState =
      terminalSocket.current && terminalSocket.current.readyState;
    return readyState === 1;
  };

  const resizeRemoteTerminal = () => {
    const { cols, rows } = terminalInstance.current || {};
    if (isWsOpen()) {
      terminalSocket.current?.send(`#{"width":${cols},"height":${rows}}#`);
    }
  };

  const fitTerm = () => {
    fitAddon.fit();
    resizeRemoteTerminal();
  };

  const onResize = _.throttle(() => fitTerm(), 100);

  const removeResizeListener = () => {
    window.removeEventListener('resize', onResize);
  };

  const destoryedTerm = () => {
    removeResizeListener();
    terminalSocket.current?.close?.();
  };

  const setData = (data: string) => {
    return `${data}\x1B[1;3;31m\x1B[0m`;
  };

  const setErrorData = (data: string) => {
    return `\x1b[31m${data}\x1b[m`;
  };

  const runRealTerminal = () => {
    terminalInstance.current?.clear?.();
    loading.current = false;
    toRetry.current = false;
  };

  const onWSReceive = (message: MessageEvent) => {
    if (first.current === true) {
      first.current = false;
      resizeRemoteTerminal();
    }

    const data = { Data: message.data };
    conReadyState.current = terminalSocket.current?.readyState || 0;

    // const data = JSON.parse(message.data) || '';
    if (terminalInstance.current?.element) terminalInstance.current.focus();
    const output = data.Data;
    terminalInstance.current?.write?.(setData(output));
  };

  const closeRealTerminal = (data: any) => {
    setStatusCode(_.get(data, 'code'));
    conReadyState.current = terminalSocket.current?.readyState || 0;
    if ([1011, 1006, 1000].includes(statusCode)) {
      toRetry.current = true;
      if (first.current) {
        terminalInstance.current?.reset?.();
      }
      if (!loading.current) {
        terminalInstance.current?.write?.(
          setData(`(${statusCode})${data.reason}\r\n`)
        );
        terminalInstance.current?.write?.(setErrorData(`\r${RECONNECT_MSG}`));
      }
      first.current = true;
    } else if (data.reason) {
      terminalInstance.current?.write?.(
        setData(`(${statusCode})${data.reason}\r\n`)
      );
    }
    loading.current = false;
  };

  const errorRealTerminal = (ex: any) => {
    let { message } = ex;
    if (!message) {
      message = 'disconnected!';
      toRetry.current = true;
      first.current = true;
      loading.current = false;
    }
    conReadyState.current = terminalSocket.current!.readyState;
    terminalInstance.current?.write?.(setErrorData(`\r${message}`));
  };

  const createWS = () => {
    if (!props.url) return;
    terminalInstance.current?.write?.('');
    setStatusCode(0);
    terminalSocket.current = new WebSocket(wssURL.current);
    terminalSocket.current.onopen = runRealTerminal;
    terminalSocket.current.onmessage = onWSReceive;
    terminalSocket.current.onclose = closeRealTerminal;
    terminalSocket.current.onerror = errorRealTerminal;
  };

  const initWS = () => {
    if (!terminalSocket.current) {
      createWS();
      return;
    }
    terminalSocket.current?.close?.();
    createWS();
  };

  const retry = () => {
    loading.current = true;
    terminalInstance.current?.reset?.();
    initWS();
  };

  const registerTermHandler = () => {
    terminalInstance.current?.onData((data: string) => {
      if (isWsOpen()) {
        terminalSocket.current?.send(data);
      }
    });
    terminalInstance.current?.onKey((e: any) => {
      if (toRetry.current && e.domEvent.code === 'KeyY') {
        retry();
      }
    });
  };

  const onTerminalResize = () => {
    window.addEventListener('resize', onResize);
  };

  const initTerm = () => {
    terminalInstance.current?.dispose?.();
    terminalInstance.current = new Terminal({
      lineHeight: 1.2,
      fontSize: 12,
      fontFamily:
        "monospace,Menlo,Courier,'Courier New',Consolas,Monaco, 'Liberation Mono'",
      theme: {
        background: userSettings.theme === 'realDark' ? colorBg2 : '#181d28',
        foreground:
          userSettings.theme === 'realDark'
            ? 'rgba(255, 255, 255, 0.7)'
            : '#fff'
      },
      cursorBlink: true,
      cursorStyle: 'underline',
      scrollback: 100,
      tabStopWidth: 4
    });
    terminalInstance.current?.open?.(terminalRef.current!);
    terminalInstance.current?.loadAddon?.(fitAddon);
    fitAddon.fit();
  };

  const init = () => {
    setWssUrl();
    initWS();
    initTerm();
    registerTermHandler();
    onTerminalResize();
  };

  const debounceCall = _.debounce(() => {
    first.current = true;
    loading.current = true;
    setWssUrl(true);
    initWS();
  }, 100);

  useEffect(() => {
    if (!url) {
      terminalInstance.current?.reset?.();
      terminalSocket.current?.close?.();
      terminalSocket.current = null;
    } else {
      // reset retry count
      retryCount.current = totalRetry.current;
      clearTimeout(timer.current);

      terminalInstance.current?.reset?.();
      debounceCall();
    }
    return () => {
      destoryedTerm();
      removeResizeListener();
    };
  }, [url]);

  useImperativeHandle(ref, () => ({
    fit: () => {
      fitAddon.fit();
    }
  }));

  return (
    <div
      ref={WrapperRef}
      className={styles.wrap}
      style={{
        height: height
      }}
    >
      <div
        ref={terminalRef}
        className={styles.terminal}
        style={{ height: '100%' }}
      ></div>
    </div>
  );
});

export default XTerminal;
