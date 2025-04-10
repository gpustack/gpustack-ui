import { convertFileSize } from '@/utils';
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const FileParts: React.FC<{
  showSize?: boolean;
  fileList: any[];
}> = ({ fileList, showSize = true }) => {
  return (
    <SimpleBar
      style={{ maxHeight: 200 }}
      classNames={{ scrollbar: 'scrollbar-handle-light simplebar-scrollbar' }}
    >
      <div style={{ padding: 10 }}>
        {fileList.map((file, index) => {
          return (
            <div key={index} className="flex-between m-b-5">
              <span>
                {' '}
                Part {file.part} of {file.total}
              </span>
              {showSize && <span>{convertFileSize(file.size)}</span>}
            </div>
          );
        })}
      </div>
    </SimpleBar>
  );
};

export default FileParts;
