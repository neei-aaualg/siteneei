import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.resolve(__dirname, '../public/assets');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalOrig = 0;
  let totalWebp = 0;
  let convertedCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await processDirectory(fullPath);
      totalOrig += sub.totalOrig;
      totalWebp += sub.totalWebp;
      convertedCount += sub.convertedCount;
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      continue;
    }

    const webpPath = path.join(dir, `${path.basename(entry.name, ext)}.webp`);
    const origStat = fs.statSync(fullPath);

    await sharp(fullPath)
      .webp({ quality: 82, effort: 4 })
      .toFile(webpPath);

    const webpStat = fs.statSync(webpPath);
    const reduction = ((1 - webpStat.size / origStat.size) * 100).toFixed(1);

    console.log(
      `✓ ${path.relative(assetsDir, fullPath)}: ${(origStat.size / 1024).toFixed(0)}KB -> ${(webpStat.size / 1024).toFixed(0)}KB (-${reduction}%)`
    );

    totalOrig += origStat.size;
    totalWebp += webpStat.size;
    convertedCount++;
  }

  return { totalOrig, totalWebp, convertedCount };
}

console.log('--- A converter imagens em public/assets para WebP ---');
const result = await processDirectory(assetsDir);
const totalReduction = ((1 - result.totalWebp / result.totalOrig) * 100).toFixed(1);
console.log('----------------------------------------------------');
console.log(`Total de ficheiros convertidos: ${result.convertedCount}`);
console.log(`Tamanho original: ${(result.totalOrig / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Tamanho WebP: ${(result.totalWebp / (1024 * 1024)).toFixed(2)} MB`);
console.log(`Redução global: -${totalReduction}% (${((result.totalOrig - result.totalWebp) / (1024 * 1024)).toFixed(2)} MB poupados)`);
