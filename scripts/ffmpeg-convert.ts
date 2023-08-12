// Name: ffmpeg-convert

import '@johnlindquist/kit';

import * as fs from 'node:fs';
import * as path from 'node:path';
const { $ } = await import('execa');
const { formatBytes } = await import('bytes-formatter');
import { getVideoDimension, convert } from './utils/video';

// process.env.FFMPEG_PATH ??= await env('KIT_FFMPEG_PATH');
// process.env.FFPROBE_PATH ??= await env('KIT_FFPROBE_PATH');

const $$ = $({ verbose: true });

const dir = (await env('KIT_VIDEO_GRABS_DIR')) || home('Desktop');
const files = await fs.promises.readdir(dir);

const sortedFiltes = files
  .filter((fileName) => fileName.endsWith('.mov'))
  .map((fileName) => ({
    name: fileName,
    time: fs.statSync(`${dir}/${fileName}`).mtime.getTime(),
  }))
  .sort((a, b) => b.time - a.time)
  .map((file) => file.name);

// process.exit(0);

if (sortedFiltes.length > 0) {
  const fileName = await arg(
    {
      placeholder: '...',
      enter: 'select',
      description: `select mov file from ${dir}`,
    },
    sortedFiltes.map((fileName) => {
      return {
        name: fileName,
        value: fileName,
        // preview: async () => {
        //   const { size } = await fs.promises.stat(home(dir, fileName));
        //   return `size: ${formatBytes(size)}`;
        // },
      };
    }),
  );
  // setDescription(fileName);

  const extname = path.extname(fileName);
  const basename = path.basename(fileName, extname);
  const inputPath = `${dir}/${fileName}`;
  let renameName = args.length >= 1 ? args.shift() : undefined;

  let { width: originWidth } = await getVideoDimension(inputPath);
  let convertWidth = originWidth;

  const { size: before } = await fs.promises.stat(inputPath);

  let resizeWidth = await arg({
    placeholder: 'enter resize',
    height: 80,
    description: `0.5 / 50% / 100 (${fileName})`,
    hasPreview: false,
    input: String(Math.min(800, originWidth)),
    hint: `width: ${originWidth}`,

    shortcuts: [
      {
        name: 'rename',
        key: `${cmd}+R`,
        onPress: async () => {
          renameName = await arg('name?');
          await run(kenvPath('scripts', 'ffmpeg-desktop.ts'), fileName, renameName);
        },
        bar: 'right',
      },
    ],
  });
  resizeWidth = resizeWidth?.trim();

  // inspect(
  //   `resizeWidth "${resizeWidth}", ${renameName}, ${global.args} ${args}`
  // );

  if (resizeWidth.length > 0) {
    if (resizeWidth.endsWith('%')) {
      convertWidth *= Number(resizeWidth.replace(/%$/, '')) / 100;
    } else if (Number(resizeWidth) < 1) {
      convertWidth *= Number(resizeWidth);
    } else if (Number.isFinite(Number.parseFloat(resizeWidth))) {
      convertWidth = Number(resizeWidth);
    }
  }

  if (convertWidth > originWidth) {
    const yesNo = await arg(
      {
        placeholder: 'upscale?',
        shortcuts: [
          {
            name: 'yes',
            key: `Y`,
            onPress: () => submit('yes'),
            bar: 'right',
          },
          {
            name: 'no',
            key: `N`,
            onPress: () => submit('no'),
            bar: 'right',
          },
        ],
      },
      ['yes', 'no'],
    );
    if (yesNo === 'no') {
      process.exit(0);
    }
  }

  const nameSuffix = convertWidth !== originWidth ? `-${convertWidth}` : '';
  convertWidth = convertWidth !== originWidth ? convertWidth : undefined;
  const name = Boolean(renameName) ? renameName : `${basename}${nameSuffix}`;
  const outputPath = `${dir}/${name}.mp4`;

  setLoading(true);

  await convert(inputPath, outputPath, convertWidth);
  // await fs.promises.copyFile(inputPath, outputPath);

  setLoading(false);

  const { size: after } = await fs.promises.stat(outputPath);

  let { width, height } = await getVideoDimension(outputPath);

  notify({
    title: `${fileName}`,
    message: `
    ${width}x${height} ${Boolean(resizeWidth) ? '(' + resizeWidth + ')' : ''}
    ${formatBytes(before)} -> ${formatBytes(after)}
    ${((after / before) * 100).toFixed(2)}% (${formatBytes(before - after)})`.trim(),
  });
}
