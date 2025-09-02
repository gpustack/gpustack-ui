import { Outlet } from '@umijs/max';
import React, { useEffect, useRef, useState } from 'react';

const ListLayout: React.FC = () => {
  const [listParams, setListParams] = useState({ page: 1, keyword: '' });
  const scrollRef = useRef<number>(0);

  useEffect(() => {
    console.log('cluster layout:');
  }, []);

  return (
    <div>
      {/* 提供上下文给子路由：ListPage & DetailPage */}
      <Outlet context={{ listParams, setListParams, scrollRef }} />
    </div>
  );
};

export default ListLayout;
