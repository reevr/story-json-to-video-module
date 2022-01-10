# story-json-to-video

Compile [story-json](https://github.com/micnews/story-json) documents into videos.

*Note*: Not all features of `story-json` format are supported at the moment. Open an issue if you need something that isn't supported yet. PRs are always welcome too.

<img src="https://user-images.githubusercontent.com/6034700/36316418-40c3cc3e-1308-11e8-98e9-27f98247cfa4.gif" width="200">

## Installation

This package requires [node.js](https://nodejs.org) version 8 or later.

This package uses `ffmpeg` to process videos, which needs to be installed in your `PATH` directory.

This package depends on [node-canvas](https://github.com/Automattic/node-canvas), which requires Cairo, Pango, libpng, libjpeg, giflib and librsvg to be installed on the system. librsvg is optional for svg rendering. See https://github.com/Automattic/node-canvas#installation.

Example for macOS:

```
brew install ffmpeg
brew install pkg-config cairo pango libpng jpeg giflib librsvg
PKG_CONFIG_PATH=/usr/local/opt/zlib/lib/pkgconfig npm install story-json-to-video -g
```

This package also depends on [yoga](https://github.com/facebook/yoga), targeting the node.js platform:

```
npm config set yoga-layout:platform node -g
```

*Remove `-g` from the commands if you're cloning and installing this module locally.*

## Usage

To compile `story.json` into video, use the following code:

```
const storyJsonToVideo = require('story-json-to-video');
const json = require('../story.json');

storyJsonToVideo.run(json, { outputFolder: 'test-2' })
    .then(r => console.log(r))
    .then(r => storyJsonToVideo.cleanUp('test-2'))
    .catch(err => console.error(err));
```

If everything works, the program will create `story.mp4` in the same directory.

To list additional options:

```
story-json-to-video --help
```

### Options

Use `--font` option to provide custom fonts, e.g. `--font MyFont=./my-font.otf`.

This uses [registerFont](https://github.com/Automattic/node-canvas#registerfont-for-bundled-fonts) from `node-canvas`.

## License

MIT
