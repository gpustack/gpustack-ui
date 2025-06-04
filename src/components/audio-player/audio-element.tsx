import React from 'react';
import styled from 'styled-components';

const AudioWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const AudioElement: React.FC<any> = (props) => {
  return (
    <div>
      <AudioWrapper>
        <audio {...props} controls></audio>
      </AudioWrapper>
    </div>
  );
};

export default AudioElement;
