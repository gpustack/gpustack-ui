const extractImageColors = (base64Image: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Image;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const pixels = imageData.data;

      let blackPixels = [];
      let whitePixels = [];

      for (let i = 0; i < pixels.length; i += 4) {
        let r = pixels[i],
          g = pixels[i + 1],
          b = pixels[i + 2];
        let x = (i / 4) % img.width;
        let y = Math.floor(i / 4 / img.width);

        if (r === 0 && g === 0 && b === 0) {
          blackPixels.push({ x, y });
        } else if (r === 255 && g === 255 && b === 255) {
          whitePixels.push({ x, y });
        }
      }

      URL.revokeObjectURL(img.src);

      resolve({ blackPixels, whitePixels });
    };

    img.onerror = function () {
      reject(new Error('Image loading failed'));
    };
  });
};

export default extractImageColors;
