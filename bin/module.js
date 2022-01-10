#!/usr/bin/env node
const rimraf = require("rimraf");
const fs = require('fs');
const { multirange } = require('multi-integer-range');
const path = require('path');
const articleJsonToVideo = require('../lib/main');


async function run(json, argv) {

  const fontOpts = (Array.isArray(argv.font) ? argv.font : [argv.font]).filter(Boolean);
  const fonts = fontOpts.map((fontStr) => {
    const [family, source] = fontStr.split('=');
    try {
      fs.statSync(source);
    } catch (e) {
      console.error(`Unable to load font ${source}`);
      process.exit(1);
    }

    return { family, source };
  });

  function usage() {
    console.log('USAGE: story-json-to-video [options] <story.json>');
    console.log('');
    console.log('OPTIONS:');
    console.log('  --font <family>=<file>   Use custom font from the file');
    console.log('  --help                   Show this message');
    console.log('  --no-concat              Do not concatenate per-page videos into resulting video');
    console.log('  --no-download-assets     Reuse existing pre-downloaded assets (<story>-image-asset-<name>, <story>-media-<page>.mp4) from the previous run');
    console.log('  --pages                  List of pages to include (e.g. "1-2,4,6-"), defaults to all');
    console.log('  --poster-images          Only save first frame of each page as image');
    console.log('  --print-layout           Print generated Flexbox layout tree');
    console.log('  --print-ffmpeg           Print ffmpeg output');
    console.log('  --save-poster-images     Save first frame of each page as image');
    process.exit(1);
  }

  if (argv.help) {
    usage();
  }

  const input = json;
  if (!input) {
    usage();
  }

  let pagesRange = null;
  try {
    pagesRange = multirange(
      argv.pages || '0-',
      { parseUnbounded: true },
    );
  } catch (e) {
    console.error('Invalid pages range');
    process.exit(1);
  }

  console.log(argv);

  await articleJsonToVideo(json, {
    fonts,
    printFfmpeg: argv['print-ffmpeg'],
    savePosterImages: argv['save-poster-images'],
    posterImages: argv['poster-images'],
    noConcat: argv.concat === false,
    noDownloadAssets: argv['download-assets'] === false,
    printLayout: argv['print-layout'],
    pagesRange,
    outputName: 'story',
    outputFolder: argv['outputFolder']
  });

  return path.join(argv['outputFolder'], 'story.mp4');

}

async function cleanUp(outputFolder) {
  return rimraf.sync(outputFolder);
}


module.exports.run = run;
module.exports.cleanUp = cleanUp;
