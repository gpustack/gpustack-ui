import AutoTooltip from '@/components/auto-tooltip';
import React, { useMemo } from 'react';

interface SelectRenderProps {
  maxTagWidth?: number;
  radius?: number | string;
  style?: React.CSSProperties;
  filled?: boolean;
}

export default function useSelectRender(config?: SelectRenderProps) {
  const { maxTagWidth = 100, radius, filled, style } = config || {};
  const TagRender = (props: any) => {
    const { label } = props;
    const labelText = useMemo(() => {
      if (!props.isMaxTag) {
        return label;
      }
      return label.slice(0, -3);
    }, [label, props.isMaxTag]);
    return (
      <AutoTooltip
        maxWidth={maxTagWidth}
        closable={props.closable}
        onClose={props.onClose}
        radius={radius}
        filled={filled}
        style={style}
      >
        {labelText}
      </AutoTooltip>
    );
  };

  return {
    TagRender
  };
}
