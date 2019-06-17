//mkdir app/utils/pyodide/src
// && cd app/utils/pyodide/src
// curl -LJO https://github.com/iodide-project/pyodide/releases/download/0.12.0/pyodide-build-0.12.0.tar.bz2
// tar xjf pyodide-build-0.12.0.tar.bz2
// rm pyodide-build-0.12.0.tar.bz2",

import chalk from "chalk";
import os from "os";
import fs from "fs";
import https from "https";
import mkdirp from "mkdirp";
import tar from "tar-fs";
import url from "url";
import gunzip from "gunzip-maybe";

const PYODIDE_VERSION = "0.12.0";
const TAR_NAME = `pyodide-build-${PYODIDE_VERSION}.tar.bz2`;
const PYODIDE_DIR = "app/utils/pyodide/src/";

const writeAndUnzipFile = response => {
  const filePath = `${PYODIDE_DIR}${TAR_NAME}`;
  const writeStream = fs.createWriteStream(filePath);
  response.pipe(writeStream);

  writeStream.on("finish", () => {
    console.log(`${chalk.green.bold(`Unzipping pyodide`)}`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(gunzip()).pipe(tar.extract(PYODIDE_DIR));

    readStream.on("end", () => {
      console.log(`${chalk.green.bold(`Unzip successful`)}`);
    });
  });
};

(() => {
  console.log(
    `${chalk.green.bold(`Downloading pyodide ${PYODIDE_VERSION}...`)}`
  );

  mkdirp.sync(`app/utils/pyodide/src`);

  https.get(
    `https://github.com/iodide-project/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-build-${PYODIDE_VERSION}.tar.bz2`,
    response => {
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
            writeToFile
          );
        }
      } else {
        writeAndUnzipFile(response);
      }
    }
  );
})();
