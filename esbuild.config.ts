import esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';
import { glob } from 'glob';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

console.log('Cleaning dist and zipped folders...');
fs.rmSync('dist', { recursive: true, force: true });
fs.rmSync('infrastructure/build', { recursive: true, force: true });

console.log('🔃Building...');

const entryPoints = glob.sync('src/services/**/*.ts');

async function buildAndZip() {
  await Promise.all(
    entryPoints.map(async (entry) => {
      const functionName = path.basename(entry, path.extname(entry));
      const functionDistDir = `dist/${functionName}`;
      fs.mkdirSync(functionDistDir, { recursive: true });

      console.log(`Building ${functionName}...`);

      await esbuild.build({
        entryPoints: [entry],
        outdir: functionDistDir,
        bundle: true,
        platform: 'node',
        target: 'node22',
        sourcemap: true,
        minify: true,
        plugins: [esbuildPluginTsc()],
      });

      console.log(`Zipping ${functionName}...`);
      await zipDirectory(functionDistDir, `infrastructure/build/${functionName}.zip`);
    }),
  );

  console.log('✅All builds and zips completed.');
}

async function zipDirectory(sourceDir: string, outPath: string) {
  if (!fs.existsSync('infrastructure/build')) {
    fs.mkdirSync('infrastructure/build', { recursive: true });
  }

  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${sourceDir} -> ${outPath} (${archive.pointer()} bytes)`);
      resolve();
    });
    output.on('error', reject);

    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

buildAndZip().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
