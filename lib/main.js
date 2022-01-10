const { registerFont } = require('canvas');
const got = require('got');
const path = require('path');
const fs = require('fs');
const prepareContent = require('./prepare-content');
const { Image, createCanvas } = require('canvas');
const drawElements = require('./draw-elements');
const overlayVideo = require('./overlay-video');
const concatVideos = require('./concat-vidoes');
const getImages = require('./overlay/get-images');

function findMediaElement(el) {
  if (el.type === 'container' && el.elements) {
    for (const e of el.elements) {
      const mediaEl = findMediaElement(e);
      if (mediaEl) {
        return mediaEl;
      }
    }
  }

  if (el.type === 'image' || el.type === 'video') {
    return el;
  }

  return null;
}

module.exports = async (json, opts = {}) => {
  if (opts.fonts) {
    opts.fonts.forEach((font) => {
      console.log(`Registering font ${font.family}`);
      registerFont(font.source, { family: font.family });
    });
  }

  if (!opts.outputFolder)
    throw new Error('Invalid output folder');

  await fs.promises.mkdir(opts.outputFolder, { recursive: true });


  const videosToConcat = [];
  const imageSrcs = await getImages(json);
  const images = {};

  let imgIndex = 0;
  for (const imgSrc of imageSrcs) {
    const downloadName = path.join(opts.outputFolder, `${opts.outputName}-image-asset-${imgIndex++}${path.extname(imgSrc)}`);
    console.log('opts.outputFolder', downloadName)

    if (!opts.noDownloadAssets) {
      console.log(`Downloading image asset ${imgSrc}`);
      const resp = await got(imgSrc, { encoding: null });
      fs.writeFileSync(downloadName, resp.body);
    }

    const img = new Image();
    img.src = downloadName;
    images[imgSrc] = img;
  }

  let pageIndex = -1;
  for (const page of json.pages) {
    pageIndex++;

    const consolePrefix = `[page ${pageIndex + 1}/${json.pages.length}]`;
    if (opts.pagesRange && !opts.pagesRange.has(pageIndex + 1)) {
      continue;
    }

    console.log(`${consolePrefix} Preparing background media`);

    let fillLayer = null;
    for (const layer of page.layers) {
      const maybeMedia = findMediaElement(layer);
      if (maybeMedia) {
        fillLayer = maybeMedia;
      }
    }

    let file;
    if (fillLayer) {
      switch (fillLayer.type) {
        case 'image':
          if (fillLayer.source.endsWith('.gif')) {
            file = await prepareContent.video(opts, pageIndex, fillLayer.source);
          } else {
            file = await prepareContent.image(opts, pageIndex, fillLayer.source, 3);
          }
          break;
        case 'video':
          file = await prepareContent.video(opts, pageIndex, fillLayer.sources[0].source);
          break;
        default:
          break;
      }
    } else {
      file = await prepareContent.empty(opts, pageIndex, 3);
    }

    console.log(`${consolePrefix} Applying overlay`);

    let frameIndex = -1;
    const overlayFile = await overlayVideo(file, (png) => {
      frameIndex++;

      const img = new Image();
      img.src = png;

      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, img.width, img.height);
      drawElements(page.layers, ctx, img.width, img.height, images, opts.printLayout);

      const out = canvas.toBuffer(undefined, 0, canvas.PNG_FILTER_NONE);

      if ((opts.savePosterImages || opts.posterImages) && frameIndex === 0) {
        const posterName = path.join(opts.outputFolder, `${opts.outputName}-poster-${pageIndex + 1}.png`);
        console.log(`${consolePrefix} Saving poster image (${posterName})`);
        fs.writeFileSync(posterName, out);
      }

      return out;
    }, opts.posterImages, opts.outputFolder);

    videosToConcat.push(overlayFile);
  }

  if (!opts.posterImages && !opts.noConcat) {
    console.log('Concatenating pages', opts.outputFolder, opts.outputName);
    await concatVideos(videosToConcat, path.join(opts.outputFolder, opts.outputName));
  }

  console.log('OK');
};
