import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';

const HelpTooltip = ({
  label,
  content
}: {
  label: string;
  content: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [open]);
  return (
    <Tooltip
      title={content}
      trigger={['hover', 'focus']}
      open={open}
      onOpenChange={setOpen}
      styles={{ root: { maxWidth: 'min(400px, calc(100vw - 16px))' } }}
    >
      <button
        type="button"
        aria-label={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: 0,
          background: 'none',
          padding: 2,
          lineHeight: 1,
          fontSize: 12,
          color: 'var(--ant-color-text-tertiary)',
          cursor: 'help'
        }}
      >
        <QuestionCircleOutlined aria-hidden />
      </button>
    </Tooltip>
  );
};

export default HelpTooltip;
