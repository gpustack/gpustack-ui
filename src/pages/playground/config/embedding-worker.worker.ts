import _ from 'lodash';
import { PCA } from 'ml-pca';

const normalize2D = (data: number[][]) => {
  const dim = data[0].length;
  const mins = Array(dim).fill(Infinity);
  const maxs = Array(dim).fill(-Infinity);

  for (const row of data) {
    for (let i = 0; i < dim; i++) {
      mins[i] = Math.min(mins[i], row[i]);
      maxs[i] = Math.max(maxs[i], row[i]);
    }
  }

  return data.map((row) =>
    row.map((val, i) => {
      const range = maxs[i] - mins[i];
      if (range === 0) return 0;
      return ((val - mins[i]) / range) * 2 - 1;
    })
  );
};

self.onmessage = (
  event: MessageEvent<{
    embeddings: any[];
    fileList: { text: string; name: string; uid: number | string }[];
    textList: { text: string; name: string; uid: number | string }[];
  }>
) => {
  const { embeddings, fileList, textList } = event.data;

  try {
    const dataList = embeddings.map((item) => {
      return item.embedding;
    });
    let pca: any = null;

    // for large datasets, use NIPALS method for PCA
    if (dataList.length > 200) {
      pca = new PCA(dataList, { nCompNIPALS: 2, method: 'NIPALS' });
    } else {
      pca = new PCA(dataList); // default method is SVD
    }
    const pcadata = pca.predict(dataList, { nComponents: 2 }).to2DArray();

    const input = [
      ...textList.map((item) => item.text).filter((item) => item),
      ...fileList.map((item) => item.text).filter((item) => item)
    ];

    const normalizedData = normalize2D(pcadata);

    const list = normalizedData.map((item: number[], index: number) => {
      return {
        value: item,
        name: index + 1,
        text: input[index]
      };
    });

    const embeddingJson = embeddings.map((o, index) => {
      const item = _.cloneDeep(o);
      item.embedding = item.embedding.slice(0, 5);
      item.embedding.push(null);
      return item;
    });
    const embeddingData = {
      code: JSON.stringify(embeddingJson, null, 2).replace(/null/g, '...'),
      copyValue: JSON.stringify(embeddings, null, 2)
    };

    self.postMessage({
      scatterData: list,
      embeddingData: embeddingData
    });
  } catch (e) {
    console.log('error:', e);
    self.postMessage({
      scatterData: [],
      embeddingData: {
        code: '',
        copyValue: ''
      }
    });
  }
};

self.onerror = (e) => {
  console.log('error:', e);
};

self.onmessageerror = (e) => {
  console.log('message error:', e);
};
