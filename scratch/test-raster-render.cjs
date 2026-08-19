const fs = require('node:fs');
const path = require('node:path');

function bgraToEscPosRaster(bgraBuffer, width, height, threshold = 175) {
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
      // Convert to luminance (0..255)
      const luminance = a < 128 ? 255 : (0.299 * r + 0.587 * g + 0.114 * b);
      if (luminance < threshold) {
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

function buildEscPosRasterReceipt(bgraBuffer, width, height, feedLines = 8, autoCut = true) {
  const raster = bgraToEscPosRaster(bgraBuffer, width, height);
  const chunks = [
    Buffer.from([0x1b, 0x40]), // Initialize printer
    Buffer.from([0x1b, 0x61, 0x01]), // Center align
    raster,
    Buffer.from([0x1b, 0x64, feedLines]) // Feed lines
  ];
  if (autoCut) chunks.push(Buffer.from([0x1d, 0x56, 0x01])); // Cut
  return Buffer.concat(chunks);
}

// Test with 576 x 100 dummy BGRA buffer
const width = 576;
const height = 100;
const dummy = Buffer.alloc(width * height * 4, 255);
const receipt = buildEscPosRasterReceipt(dummy, width, height, 8, true);

console.log('Build ESC/POS raster receipt test passed. Total buffer length:', receipt.length);
