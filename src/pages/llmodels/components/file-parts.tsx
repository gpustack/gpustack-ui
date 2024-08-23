import { convertFileSize } from '@/utils';
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const FileParts: React.FC<{
  fileList: any[];
}> = ({ fileList }) => {
  return (
    <SimpleBar style={{ maxHeight: 200 }}>
      <div style={{ padding: 10 }}>
        {fileList.map((file, index) => {
          return (
            <div key={index} className="flex-between m-b-5">
              <span>
                {' '}
                Part {file.part} of {file.total}
              </span>
              <span>{convertFileSize(file.size)}</span>
            </div>
          );
        })}
      </div>
    </SimpleBar>
  );
};

export default FileParts;
