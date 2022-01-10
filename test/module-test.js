const storyJsonToVideo = require('../bin/module');
const json = require('../story.json');

storyJsonToVideo.run(json, { outputFolder: 'test-2' })
    .then(r => console.log(r))
    .then(r => storyJsonToVideo.cleanUp('test-2'))
    .catch(err => console.error(err));