/**
 * Creates a canvas element and its rendering context.
 * @param {number} width - Canvas width.
 * @param {number} height - Canvas height.
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }} - The created canvas and context.
 */
function createCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d')! };
}

/**
 * Checks if a pixel is white.
 * @param {Uint8ClampedArray} pixels - The image pixel data.
 * @param {number} x - The pixel's X coordinate.
 * @param {number} y - The pixel's Y coordinate.
 * @param {number} width - The image width.
 * @returns {boolean} - Whether the pixel is white.
 */
function isWhite(
  pixels: Uint8ClampedArray,
  x: number,
  y: number,
  width: number
): boolean {
  let index = (y * width + x) * 4;
  return (
    pixels[index] === 255 &&
    pixels[index + 1] === 255 &&
    pixels[index + 2] === 255
  );
}

/**
 * Performs a flood fill to find all connected white pixels.
 * @param {Uint8ClampedArray} pixels - The image pixel data.
 * @param {number} width - The image width.
 * @param {number} height - The image height.
 * @param {number} x - The starting X coordinate.
 * @param {number} y - The starting Y coordinate.
 * @param {boolean[][]} visited - A 2D array to track visited pixels.
 * @param {Array<{ x: number, y: number }>} block - The list of coordinates forming a white block.
 */
function floodFill(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  visited: boolean[][],
  block: Array<{ x: number; y: number }>
): void {
  let stack: Array<[number, number]> = [[x, y]];
  let directions: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1], // 4-directional search (can be extended to 8-directional)
    [1, 1],
    [-1, -1],
    [1, -1],
    [-1, 1] // Diagonal directions
  ];

  while (stack.length) {
    let [cx, cy] = stack.pop()!;
    if (
      cx < 0 ||
      cy < 0 ||
      cx >= width ||
      cy >= height ||
      visited[cy][cx] ||
      !isWhite(pixels, cx, cy, width)
    ) {
      continue;
    }

    visited[cy][cx] = true;
    block.push({ x: cx, y: cy });

    directions.forEach(([dx, dy]) => stack.push([cx + dx, cy + dy]));
  }
}

/**
 * Extracts all white blocks from an image.
 * @param {ImageData} imageData - The image pixel data.
 * @returns {Array<Array<{ x: number, y: number }>>} - List of white blocks, each containing pixel coordinates.
 */
function getWhiteBlocks(
  imageData: ImageData
): Array<Array<{ x: number; y: number }>> {
  const { data, width, height } = imageData;
  let visited: boolean[][] = Array.from({ length: height }, () =>
    new Array(width).fill(false)
  );
  let whiteBlocks: Array<Array<{ x: number; y: number }>> = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isWhite(data, x, y, width) && !visited[y][x]) {
        let block: Array<{ x: number; y: number }> = [];
        floodFill(data, width, height, x, y, visited, block);
        whiteBlocks.push(block);
      }
    }
  }
  return whiteBlocks;
}

/**
 * Loads an image from a file.
 * @param {File} file - The image file.
 * @returns {Promise<HTMLImageElement>} - The loaded image element.
 */
function loadImage(file: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = file;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image loading failed'));
  });
}

/**
 * Processes the image file and extracts white blocks.
 * @param {File} file - The uploaded image file.
 * @returns {Promise<Array<Array<{ x: number, y: number }>>>} - List of white blocks with pixel coordinates.
 */
async function processImage(
  file: string
): Promise<Array<Array<{ x: number; y: number }>>> {
  const img = await loadImage(file);
  const { canvas, ctx } = createCanvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const whiteBlocks = getWhiteBlocks(imageData);

  URL.revokeObjectURL(img.src);
  return whiteBlocks;
}

export { processImage };
