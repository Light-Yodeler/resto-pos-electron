const assert = require('node:assert');

function bgraToEscPosRaster(bgraBuffer, width, height) {
  const bytesPerRow = Math.ceil(width / 8);
  const totalBytes = bytesPerRow * height;
  const rasterData = Buffer.alloc(totalBytes, 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const b = bgraBuffer[offset];
      const g = bgraBuffer[offset + 1];
      const r = bgraBuffer[offset + 2];
      const a = bgraBuffer[offset + 3];
      const luminance = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
      if (luminance < 160) {
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        rasterData[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;
  const header = Buffer.from([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);

  return Buffer.concat([header, rasterData]);
}

// Test with 576 x 10 dummy image
const width = 576;
const height = 10;
const dummyBgra = Buffer.alloc(width * height * 4, 255); // All white

// Put a black pixel at (0, 0) and (575, 9)
dummyBgra[0] = 0; dummyBgra[1] = 0; dummyBgra[2] = 0; // (0,0) black
const lastOffset = (9 * width + 575) * 4;
dummyBgra[lastOffset] = 0; dummyBgra[lastOffset + 1] = 0; dummyBgra[lastOffset + 2] = 0; // (575, 9) black

const raster = bgraToEscPosRaster(dummyBgra, width, height);

assert.equal(raster[0], 0x1d);
assert.equal(raster[1], 0x76);
assert.equal(raster[2], 0x30);
assert.equal(raster[3], 0x00);
assert.equal(raster[4], 72); // 576 / 8 = 72 bytes
assert.equal(raster[5], 0);
assert.equal(raster[6], 10); // height = 10
assert.equal(raster[7], 0);

// Check first byte has top-left bit set (0x80)
assert.equal(raster[8], 0x80);

// Check last byte has bottom-right bit set (0x01)
assert.equal(raster[raster.length - 1], 0x01);

console.log('Raster test passed successfully! Header length:', 8, 'Data length:', raster.length - 8, 'Total:', raster.length);
