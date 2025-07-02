const fs = require('fs');
const https = require('https');
const path = require('path');

const downloads = [
  {
    url: 'https://example.com/file1.csv',
    output: 'data/source1.csv',
  },
  {
    url: 'https://example.com/file2.zip',
    output: 'data/source2.zip',
  },
];

function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(`Failed to get ${url}`);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function fetchAll() {
  try {
    for (const { url, output } of downloads) {
      console.log(`Downloading ${url} → ${output}`);
      await downloadFile(url, path.resolve(__dirname, '..', output));
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fetchAll();
