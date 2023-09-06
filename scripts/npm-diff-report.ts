// Name: diff npm packages HTML report

import '@johnlindquist/kit';

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const appPrefix = 'npm-diff';
let tmpDir = '/tmp/';
try {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));
} catch (e) {
  console.error(
    `An error has occurred while removing the temp folder at ${tmpDir}. Please remove it manually. Error: ${e}`,
  );
}

let npmCmd = 'npm';
let npxCmd = 'npx';
const { exitCode } = await exec(`type /opt/homebrew/bin/volta`, { reject: false });
if (exitCode === 0) {
  npmCmd = `/opt/homebrew/bin/volta run --npm 9 npm`;
  npxCmd = `/opt/homebrew/bin/volta run --npm 9 npx`;
}

let pkgName = await arg('enter package to check');

const { stdout } = await exec(`${npmCmd} view ${pkgName} versions --json`);
const versions = JSON.parse(stdout) as string[];
const sortedVersions = versions.reverse();

const verA = await arg({ placeholder: 'version from' }, sortedVersions);
const verB = await arg({ placeholder: 'version to' }, sortedVersions);

// const verA = await arg('version from');
// const verB = await arg('version to');

const fileName = `${pkgName}@${verA}-${pkgName}@${verB}`;
const titleName = `${pkgName}@${verA} -> ${pkgName}@${verB}`;

const sanitizedFileName = fileName.replaceAll(/[^@\w._-]/g, '').replaceAll('/', '-');
const diffFileName = `.diff-${sanitizedFileName}`;
const diffFile = `${tmpDir}/${diffFileName}`;
const reportFile = `${tmpDir}/${sanitizedFileName}`;
console.log({ pkgName, fileName, titleName, sanitizedFileName, diffFile, reportFile });

await hide();

await exec(`${npmCmd} diff --diff="${pkgName}@${verA}" --diff="${pkgName}@${verB}" >> ${diffFile}`);

await exec(
  `${npxCmd} diff2html-cli -t "${titleName}" -F "${reportFile}.html" -i file --renderNothingWhenEmpty -- "${diffFile}"`,
);

await exec(`open '${reportFile}.html'`);

// await $`volta run --npm 9 npm diff --diff="${pkgName}@${verA}" --diff="${pkgName}@${verB}" >> "${tmpDir}/${diffFileName}"`;

// npx diff2html-cli -t "$fileName" -F "files/$sanitizedFileName.html" -i file --renderNothingWhenEmpty -- "files/$diffFileName"

// sh "git --version"
// sh "git -c color.ui=always --no-pager diff --no-index -- previous/hash.json hash.json || exit 0"
// echo "***"
// sh "git --no-pager diff --no-index -- previous/hash.json hash.json > hash.diff || exit 0"
// sh "npx diff2html-cli -t 'hash' -F diff.html -i file --renderNothingWhenEmpty -- hash.diff"
