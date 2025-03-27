import styled from 'styled-components';

const Row = styled.div.attrs<{ className?: string }>((props) => ({
  className: props.className
}))`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const Col = styled.div<{
  $width?: string | number;
  $align?: string;
  $flexBasis?: string | number;
  $maxWidth?: string | number;
}>`
  flex: ${(props) => (props.$width ? 'none' : 1)};
  display: flex;
  justify-content: ${(props) => props.$align || 'flex-start'};
  align-items: center;
  width: ${({ $width }) =>
    $width ? (typeof $width === 'number' ? `${$width}px` : $width) : '10px'};
  ${({ $flexBasis }) => ($flexBasis ? `flex-basis: ${$flexBasis};` : '')}
  ${({ $maxWidth }) => ($maxWidth ? `max-width: ${$maxWidth};` : '')}
`;

export { Col, Row };
