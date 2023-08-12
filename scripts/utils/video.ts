const { default: ffmpeg } = await import('fluent-ffmpeg');
const { path: ffmpegPath } = await import('@ffmpeg-installer/ffmpeg');
const { path: ffprobePath } = await import('@ffprobe-installer/ffprobe');

if (!process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
if (!process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(ffprobePath);
}

export const getVideoDimension = (filePath: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        reject();
      }

      const { width, height } = data.streams[0];
      resolve({ width, height });
    });
  });

export const convert = (input: string, output: string, width?: number) =>
  new Promise<number>((resolve, reject) => {
    const command = ffmpeg();
    command.input(input).output(output);
    if (typeof width === 'number') {
      command.addOption(`-vf scale=${width}:-2`);
    }
    command.on('error', reject).on('end', resolve).run();
  });
