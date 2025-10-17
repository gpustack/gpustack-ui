import { update } from 'jdenticon';
import React, { useEffect, useRef } from 'react';

interface IdenticonProps {
  value: string;
  size: number;
}

const Identicon: React.FC<IdenticonProps> = ({
  value = 'test',
  size = 28
}: IdenticonProps) => {
  const icon = useRef<any>(null);

  useEffect(() => {
    update(icon.current, value);
  }, [value]);

  return (
    <>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </>
  );
};

export default Identicon;
