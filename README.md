<p align="center">
  <img alt="banner" src="Brainwaves_Logo_Purple.png" width="600">
</p>
<p align="center" href="">
  An easy-to-use platform for EEG experimentation in the classroom
</p>

## Prerequisites

### All Platforms

- node version >= 7 and npm version >= 4
- Anaconda (Python 3) with an environment named 'brainwaves' containing dependencies in `environment.yml`. See [Conda Environment Setup](https://github.com/makebrainwaves/BrainWaves#conda-environment-setup) for instructions

### OS X

- may need to update your `.bash_profile` to include the path for your [compiler](https://github.com/sandeepmistry/node-xpc-connection/issues/2) (nothing terribly scary).
  1. Find it's location
  ```bash
  which gcc
  ```
  2. Add this path to your `.bash_profile`
  ```bash
  export PATH="/usr/bin:$PATH"
  ```

### Windows 10

- [Visual C++ Build Tools](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools&rel=15)

## Installing from Source

- **If you have installation or compilation issues with this project, please see [the boilerplate's debugging guide](https://github.com/chentsulin/electron-react-boilerplate/issues/400)**

1. First, clone the repo via git:

```bash
git clone https://github.com/makebrainwaves/BrainWaves.git
```

2. And then install dependencies

```bash
$ cd BrainWaves
$ npm install
```

3. If using Emotiv, insert your Emotiv account's credentials into the file `keys.js`

### Run

Start the app in the `dev` environment. This starts the renderer process in [**hot-module-replacement**](https://webpack.js.org/guides/hmr-react/) mode and starts a webpack dev server that sends hot updates to the renderer process:

```bash
$ npm run dev
```

Alternatively, you can run the renderer and main processes separately. This way, you can restart one process without waiting for the other. Run these two commands **simultaneously** in different console tabs:

```bash
$ npm run start-renderer-dev
$ npm run start-main-dev
```

## Installing from Executable

1. Download and install the executable from this repository's [releases](https://github.com/makebrainwaves/BrainWaves/releases)

2. Before running the app, follow the Conda Environmemt Setup instructions

## Conda Environment Setup

BrainWaves needs an Anaconda environment called "brainwaves" with the right dependencies to run its analysis.

1. Download and install Anaconda for Python 3. We recommend using the [Miniconda installer for Python 3.6 available from this page](https://conda.io/miniconda.html)

2. Download the BrainWaves [environment file](https://github.com/makebrainwaves/BrainWaves/releases/download/v0.1.0/environment.yml) or grab it by cloning this repository

*Note: you may need to install Microsoft Visual C++ Build Tools to run this following command on Windows*

3. Open Anaconda prompt (or terminal on Linux and OSX) in the directory where the environment file is located and run `conda env create -f environment.yml`

4. Verify that the environment has been created with the necessary dependencies by running `conda activate brainwaves` (or `source activate brainwaves` on Linux and OSX) and then `mne`

5. If the brainwaves environment exists and prints command options for the mne library, then set up a new jupyter kernel to use this environment: `python -m ipykernel install --user --name brainwaves --display-name "brainwaves"`

## Packaging

To package apps for the local platform:

```bash
$ npm run package
```

To package apps for all platforms:

First, refer to [Multi Platform Build](https://www.electron.build/multi-platform-build) for dependencies.

Then,

```bash
$ npm run package-all
```

To package apps with options:

```bash
$ npm run package -- --[option]
```

To run End-to-End Test

```bash
$ npm run build
$ npm run test-e2e
```

:bulb: You can debug your production build with devtools by simply setting the `DEBUG_PROD` env variable:

```bash
DEBUG_PROD=true npm run package
```

## How to add modules to the project

You will need to add other modules to this boilerplate, depending on the requirements of your project. For example, you may want to add [node-postgres](https://github.com/brianc/node-postgres) to communicate with PostgreSQL database, or
[material-ui](http://www.material-ui.com/) to reuse react UI components.

⚠️ Please read the following section before installing any dependencies ⚠️

### Module Structure

This boilerplate uses a [two package.json structure](https://github.com/electron-userland/electron-builder/wiki/Two-package.json-Structure). This means, you will have two `package.json` files.

1. `./package.json` in the root of your project
2. `./app/package.json` inside `app` folder

### Which `package.json` file to use

**Rule of thumb** is: all modules go into `./package.json` except native modules. Native modules go into `./app/package.json`.

1. If the module is native to a platform (like node-postgres), it should be listed under `dependencies` in `./app/package.json`
2. If a module is `import`ed by another module, include it in `dependencies` in `./package.json`. See [this ESLint rule](https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/no-extraneous-dependencies.md). Examples of such modules are `material-ui`, `redux-form`, and `moment`.
3. Otherwise, modules used for building, testing and debugging should be included in `devDependencies` in `./package.json`.

### Further Readings

See the wiki page, [Module Structure — Two package.json Structure](https://github.com/chentsulin/electron-react-boilerplate/wiki/Module-Structure----Two-package.json-Structure) to understand what is native module, the rationale behind two package.json structure and more.

For an example app that uses this boilerplate and packages native dependencies, see [erb-sqlite-example](https://github.com/amilajack/erb-sqlite-example).

## Static Type Checking

This project comes with Flow support out of the box! You can annotate your code with types, [get Flow errors as ESLint errors](https://github.com/amilajack/eslint-plugin-flowtype-errors), and get [type errors during runtime](https://github.com/codemix/flow-runtime) during development. Types are completely optional.

## Dispatching redux actions from main process

See [#118](https://github.com/chentsulin/electron-react-boilerplate/issues/118) and [#108](https://github.com/chentsulin/electron-react-boilerplate/issues/108)

## How to keep this project updated with the boilerplate

If your application is a fork from this repo, you can add this repo to another git remote:

```sh
git remote add upstream https://github.com/chentsulin/electron-react-boilerplate.git
```

Then, use git to merge some latest commits:

```sh
git pull upstream master
```
