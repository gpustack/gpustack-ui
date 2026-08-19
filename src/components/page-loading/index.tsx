import { COLOR_PRIMARY } from '@/config/theme/constants';
import { LoadingOutlined } from '@ant-design/icons';
import { Flex, Spin } from 'antd';
import { createStyles, keyframes } from 'antd-style';

// A chunk that is already cached resolves within a frame or two, and a spinner
// that appears and vanishes that fast reads as a glitch. The delay lives in CSS
// so the component never re-renders to reveal itself.
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const useStyles = createStyles(({ css }) => ({
  wrapper: css`
    height: calc(100vh - 300px);
    min-height: 320px;
    opacity: 0;
    animation: ${fadeIn} 0.2s ease-out 0.3s forwards;
  `
}));

/**
 * Suspense fallback for every lazy route chunk — wired in `src/app.tsx` through
 * `modifyClientRenderOpts`. It renders in two very different places: inside the
 * layout's content area on an in-app navigation, and bare in `#root` on a cold
 * load, where the layout chunk (and so `ConfigProvider`) does not exist yet.
 * That second case is why the indicator carries the brand color literally
 * instead of reading an `--ant-color-*` token — those are injected by
 * `ConfigProvider` and are still undefined at that point.
 */
const PageLoading: React.FC = () => {
  const { styles } = useStyles();

  return (
    <Flex className={styles.wrapper} align="center" justify="center">
      <Spin
        indicator={
          <LoadingOutlined
            style={{ fontSize: 28, color: COLOR_PRIMARY }}
            spin
          />
        }
      />
    </Flex>
  );
};

export default PageLoading;
