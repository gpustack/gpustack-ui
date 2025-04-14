import { convertFileSize } from '@/utils';
import React from 'react';
import 'simplebar-react/dist/simplebar.min.css';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  .file-part-item {
    width: 180px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const FileParts: React.FC<{
  showSize?: boolean;
  fileList: any[];
}> = ({ fileList, showSize = true }) => {
  return (
    <Wrapper>
      {fileList.map((file, index) => {
        return (
          <div key={index} className="file-part-item">
            <span>
              Part {file.part} of {file.total}
            </span>
            {<span>{convertFileSize(file.size)}</span>}
          </div>
        );
      })}
    </Wrapper>
  );
};

export default FileParts;
