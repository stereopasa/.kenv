// Menu: Node.js latest releases

import '@johnlindquist/kit';
import { Choice } from '@johnlindquist/kit';

const { HttpsProxyAgent } = await import('https-proxy-agent');
const { JSDOM } = await import('jsdom');

let agent = undefined;
if (process.env.HTTP_PROXY) {
  agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
}

let resp = await get('https://nodejs.org/en/download/releases', {
  httpAgent: agent,
  httpsAgent: agent,
  proxy: false,
  responseType: 'text',
});

const dom = new JSDOM(resp.data);

// Parse HTML table element to JSON array of objects
function parseHTMLTableElem(tableEl: HTMLElement) {
  let columns = Array.from(tableEl.querySelectorAll('th')).map((it) => it.textContent);
  if (columns.length === 0) {
    columns = Array.from(tableEl.querySelectorAll('thead td')).map((it) => it.textContent);
  }
  columns = columns.filter((val) => val?.length > 0);
  const rows = tableEl.querySelectorAll('tbody > tr');
  return Array.from(rows).map((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    return columns.reduce((obj, col, idx) => {
      obj[col] = cells[idx].textContent;
      return obj;
    }, {});
  });
}

const tableEl = dom.window.document.querySelector('#tbVersions') as HTMLElement;
const table = parseHTMLTableElem(tableEl);

const choices: Choice[] = table.map((release) => {
  const { Version, LTS, Date, npm, ...rest } = release as {
    Version: string;
    LTS: string;
    Date: string;
    npm: string;
    [key: string]: string;
  };
  // console.log({ entry }, { rest });
  return {
    name: Version,
    description: `Date: ${Date}, npm: ${npm}` + (LTS ? `, LTS: ${LTS}` : ''),
    value: Version.split(' ')[1],
    // description: Object.entries(rest)
    //   .map(([k, v]) => `${k}:${v}`)
    //   .join(' '),
  };
});

const version = await arg('latest releases', choices);

await clipboard.writeText(version);
