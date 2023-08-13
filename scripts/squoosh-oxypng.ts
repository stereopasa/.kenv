// Name: squoosh-oxypng

import '@johnlindquist/kit';

import { cpus } from 'node:os';
import * as fsp from 'node:fs/promises';
const { $ } = await import('execa');
const { formatBytes } = await import('bytes-formatter');
import sharp from 'sharp';
const { default: imageType, minimumBytes } = await import('image-type');
const { ImagePool } = await import('@squoosh/lib');
// import { ImagePool } from '@squoosh/lib';

const $$ = $({ verbose: true });

const suffix = '-opt';

const clipboardImage = await clipboard.readImage();
const selectedFiles = await getSelectedFile();

const choices = [
  // clipboardImage.byteLength ? 'Clipboard' : null,
  selectedFiles.length ? 'File Selection' : null,
  'Drop',
].filter(Boolean);
// inspect({ choices });
const source = choices.length > 1 ? await arg({ placeholder: 'Source?' }, choices) : 'Drop';

if (source === 'Clipboard') {
  //   const before = clipboardImage.byteLength;
  //   const buffer = await imagemin.buffer(clipboardImage, {
  //     plugins: plugins,
  //   });
  //   clipboard.writeImage(buffer);
  //   const after = buffer.byteLength;
  //   notify({
  //     title: 'Compression finished',
  //     message: `
  // Compressed image from clipboard 🗜️
  // ${formatBytes(before)} -> ${formatBytes(after)}
  // ${((after / before) * 100).toFixed(2)}% (${formatBytes(before - after)}) savings 🤑
  //     `.trim(),
  //   });
} else {
  let filePaths: Array<string>;

  if (source === 'File Selection') {
    filePaths = selectedFiles.split('\n').filter((fileName) => fileName.endsWith('.png'));
  } else {
    let droppedFiles = await drop({ placeholder: 'Drop images to compress' });
    filePaths = droppedFiles.map((file) => file.path);
  }

  let resizeSize = await arg({
    placeholder: 'enter resize',
    description: `0.5 / 50% / 100`,
    hint: '"max:" prefix if bigger side should be changed',
  });
  resizeSize = resizeSize.trim();
  const changeMaxSide = resizeSize.startsWith('max:');
  resizeSize = resizeSize.replace(/^max:\s*/, '');

  for (let filePath of filePaths) {
    let directory = path.dirname(filePath);
    let extname = path.extname(filePath);
    let basename = path.basename(filePath, extname);
    // const { stdout } = await $({
    //   cwd: directory,
    // })`squoosh-cli --oxipng '{\"level\":2,\"interlace\":false}' -s opt ${filePath}`;

    // const { stdout: cliPath } = await $`which squoosh-cli`;
    // console.log("cliPath", cliPath);

    // const { stdout: node } = await $`node ${cliPath} --help`
    // console.log(node);

    // const { stdout } =
    //   await $`node --no-experimental-fetch ${cliPath} --oxipng '{\"level\":2,\"interlace\":false}' --suffix 'opt' ${filePath}`;
    // console.log(stdout);
    // node $(which squoosh-cli) --help -- --no-experimental-fetch

    // const { stdout } = await $`squoosh-cli --oxipng '{\"level\":2,\"interlace\":false}' --suffix 'opt' "${filePath}"`;
    const { size: before } = await fsp.stat(filePath);
    const metadata = await sharp(filePath).metadata();
    let { width: originWidth, height: originHeight } = metadata;
    let size = changeMaxSide ? Math.max(originWidth, originHeight) : originWidth;

    if (resizeSize.length > 0) {
      if (resizeSize.endsWith('%')) {
        size *= Number(resizeSize.replace(/%$/, '')) / 100;
      } else if (Number(resizeSize) < 1) {
        size *= Number(resizeSize);
      } else if (Number.isFinite(Number.parseFloat(resizeSize))) {
        size = Number(resizeSize);
      }
    }

    let w: number, h: number;
    if (changeMaxSide && originWidth < originHeight) {
      const ratio = size / originHeight;
      w = Math.floor(originWidth * ratio);
      h = size;
    } else {
      const ratio = size / originWidth;
      w = size;
      h = Math.floor(originHeight * ratio);
    }

    setLoading(true);
    if (w !== originWidth) {
      const { stdout } = await $({
        extendEnv: true,
        env: { NODE_OPTIONS: '--no-experimental-fetch' },
      })`squoosh-cli --resize {'enabled':true,'width':${w},'height':${h},'method':'lanczos3','fitMethod':'stretch','premultiply':false,'linearRGB':true} --oxipng {'level':2,'interlace':false} --suffix ${suffix} ${filePath} -d ${directory}`;
    } else {
      const { stdout } = await $({
        extendEnv: true,
        env: { NODE_OPTIONS: '--no-experimental-fetch' },
      })`squoosh-cli --oxipng '{\"level\":2,\"interlace\":false}' --suffix ${suffix} ${filePath} -d ${directory}`;
    }
    setLoading(false);

    const outFileName = `${directory}/${basename}${suffix}${extname}`;
    const { size: after } = await fsp.stat(outFileName);

    notify({
      title: `Compression finished: ${basename}`,
      message: `${w > originWidth ? 'UPSCALE' : ''}
      ${w}x${h} ${Boolean(resizeSize) ? '(' + resizeSize + ')' : ''}
      ${formatBytes(before)} -> ${formatBytes(after)}
      ${((after / before) * 100).toFixed(2)}% (${formatBytes(before - after)})`.trim(),
    });

    // const { stdout } = await $({ env: { NODE_OPTIONS: \"${NODE_OPTIONS} --no-experimental-fetch\"}})`squoosh-cli --oxipng '{\"level\":2,\"interlace\":false}' --suffix 'opt' "${filePath}"`;
  }

  // notify({
  //   title: 'Compression finished',
  //   message: `Compressed ${filePaths.length} images.`,
  // });
}
