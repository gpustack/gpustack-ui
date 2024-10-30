import { useState } from 'react';

const useLogsPagination = () => {
  const [pageSize, setPageSize] = useState(1000);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);

  const nextPage = () => {
    setPage(page + 1);
  };

  const prePage = () => {
    let newPage = page - 1;
    if (newPage < 1) {
      newPage = 1;
    }
    setPage(newPage);
  };

  const resetPage = () => {
    setPage(1);
  };

  const setTotalPage = (total: number) => {
    setTotal(total);
  };

  return {
    nextPage,
    resetPage,
    prePage,
    setPage,
    pageSize,
    setTotalPage,
    page,
    totalPage: total
  };
};

export default useLogsPagination;
