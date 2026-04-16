import { atom } from 'jotai';

export interface UsageTableData {
  dataList: any[];
  total: number;
  loadend: boolean;
}

export const apiKeysTableDataAtom = atom<UsageTableData>({
  dataList: [],
  total: 0,
  loadend: false
});

export const usersTableDataAtom = atom<UsageTableData>({
  dataList: [],
  total: 0,
  loadend: false
});

export const modelsTableDataAtom = atom<UsageTableData>({
  dataList: [],
  total: 0,
  loadend: false
});
