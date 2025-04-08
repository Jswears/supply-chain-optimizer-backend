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

// Get command line arguments - check if a specific function name was provided
const args = process.argv.slice(2);
const functionArg = args.find(arg => !arg.startsWith('--'));

const entryPoints = glob.sync('src/services/**/*.ts');

// Filter entry points if a specific function was requested
function getFilteredEntryPoints(funcName: string | undefined): string[] {
  if (!funcName) {
    return entryPoints;
  }

  const filtered = entryPoints.filter(entry => {
    const baseName = path.basename(entry, path.extname(entry));
    return baseName === funcName;
  });

  if (filtered.length === 0) {
    console.error(`Error: Function "${funcName}" not found in src/services/**/*.ts`);
    console.log('Available functions:');
    entryPoints.forEach(entry => {
      console.log(`- ${path.basename(entry, path.extname(entry))}`);
    });
    process.exit(1);
  }

  return filtered;
}

async function buildAndZip() {
  const filteredEntries = getFilteredEntryPoints(functionArg);

  if (functionArg) {
    console.log(`Building only the "${functionArg}" function...`);
  } else {
    console.log(`Building all ${filteredEntries.length} functions...`);
  }

  await Promise.all(
    filteredEntries.map(async (entry) => {
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
