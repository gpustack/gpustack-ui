import AutoTooltip from '@/components/auto-tooltip';

interface SelectRenderProps {
  maxTagWidth?: number;
}

export default function useSelectRender(config?: SelectRenderProps) {
  const { maxTagWidth = 100 } = config || {};
  const TagRender = (props: any) => {
    const { label } = props;
    return (
      <AutoTooltip
        maxWidth={maxTagWidth}
        closable={props.closable}
        onClose={props.onClose}
      >
        {label}
      </AutoTooltip>
    );
  };

  return {
    TagRender
  };
}
