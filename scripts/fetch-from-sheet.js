const axios = require('axios');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const parse = require('csv-parse/lib/sync');

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZn1rRRnweHPVsyDIcf0_U7pKZ_EyhLWQMDDPmqQDmtJ-X3UzF7e2iQlcyaaFgbVL0ydbiCdRPESXa/pub?output=csv';

async function downloadFile(url, folder) {
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      maxRedirects: 5,
    });

    // Get filename from final URL or fallback to content-disposition
    let filename = path.basename(new URL(response.request.res.responseUrl).pathname);
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?(.+?)"?$/);
      if (match) filename = match[1];
    }

    const fullPath = path.join(folder, filename);
    await mkdirp(path.dirname(fullPath));

    const writer = fs.createWriteStream(fullPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(fullPath));
      writer.on('error', reject);
    });
  } catch (err) {
    console.error(`Failed to download ${url}:`, err.message);
  }
}

async function run() {
  const csvRes = await axios.get(SHEET_CSV_URL);
  const records = parse(csvRes.data, {
    columns: true,
    skip_empty_lines: true,
  });

  for (const { url, output } of records) {
    if (url && output) {
      console.log(`Downloading from ${url} into ${output}`);
      await downloadFile(url, output);
    }
  }
}

run();
