import _ from 'lodash';
import { PCA } from 'ml-pca';

type Point = {
  value: [number, number];
  [key: string]: any;
};

const normalizeEmbeddingToCanvas = (
  data: Point[],
  padding = 0.9 // 90% fill the canvas
) => {
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  data.forEach((p) => {
    const [x, y] = p.value;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });

  // 2. center point
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // 3. max radius
  let maxRadius = 0;
  data.forEach((p) => {
    const dx = Math.abs(p.value[0] - cx);
    const dy = Math.abs(p.value[1] - cy);
    maxRadius = Math.max(maxRadius, dx, dy);
  });

  if (maxRadius === 0) maxRadius = 1;

  // 4. scale factor
  const scale = padding / maxRadius;

  // 5. normalization
  return data.map((p) => ({
    ...p,
    value: [(p.value[0] - cx) * scale, (p.value[1] - cy) * scale]
  }));
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

    const list = pcadata.map((item: number[], index: number) => {
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
      scatterData: normalizeEmbeddingToCanvas(list),
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
