import chalk from 'chalk';
import fs from 'fs';
import https from 'https';
import mkdirp from 'mkdirp';
import tar from 'tar-fs';
import url from 'url';
import bz2 from 'unbzip2-stream';

const PYODIDE_VERSION = '0.14.3';
const TAR_NAME = `pyodide-build-${PYODIDE_VERSION}.tar.bz2`;
const TAR_URL = `https://github.com/iodide-project/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-build-${PYODIDE_VERSION}.tar.bz2`;
const PYODIDE_DIR = 'app/utils/pyodide/src/';

const writeAndUnzipFile = (response) => {
  const filePath = `${PYODIDE_DIR}${TAR_NAME}`;
  const writeStream = fs.createWriteStream(filePath);
  response.pipe(writeStream);

  writeStream.on('finish', () => {
    console.log(`${chalk.green.bold(`Unzipping pyodide`)}`);

    const readStream = fs.createReadStream(filePath);
    try {
      readStream.pipe(bz2()).pipe(tar.extract(PYODIDE_DIR));
    } catch (e) {
      throw new Error('Error in unzip:', e);
    }

    readStream.on('end', () => {
      console.log(`${chalk.green.bold(`Unzip successful`)}`);
    });
  });
};

const downloadFile = (response) => {
  if (
    response.statusCode > 300 &&
    response.statusCode < 400 &&
    response.headers.location
  ) {
    if (url.parse(response.headers.location).hostname) {
      https.get(response.headers.location, writeAndUnzipFile);
    } else {
      https.get(
        url.resolve(url.parse(TAR_URL).hostname, response.headers.location),
        writeAndUnzipFile
      );
    }
  } else {
    writeAndUnzipFile(response);
  }
};

(() => {
  if (fs.existsSync(`${PYODIDE_DIR}${TAR_NAME}`)) {
    console.log(
      `${chalk.green.bold(`Pyodide is already present: ${PYODIDE_VERSION}...`)}`
    );
    return;
  }
  console.log(
    `${chalk.green.bold(`Downloading pyodide ${PYODIDE_VERSION}...`)}`
  );
  mkdirp.sync(`app/utils/pyodide/src`);
  https.get(TAR_URL, downloadFile);
})();
