const path = require('path');
const assert = require('assert').strict;
const parseMessages = require('../actions/parseMessages');
const sendMessages = require('../actions/sendMessages');
const optionsParser = require('../services/optionsParser');

module.exports = async (params) => {

    const { source, token, serverId, out, include, exclude, parentChannel, onlyParse } = await optionsParser.getOptions(params)

    const sourcePath = source || process.cwd();
    const outPath = out || path.join(sourcePath, '.s2d', 'out');
    const pChannel = parentChannel || 'MIGRATION';
    
    console.log(`Parsing messages from ${sourcePath}`);

    await parseMessages(sourcePath, outPath, include, exclude);

    if (onlyParse) return;

    assert.ok(token, 'Please, provide your Discord Bot token to continue...');
    assert.ok(serverId, 'Please, provide your Server (Guild) ID to continue...');

    console.log(`Sending messages from ${outPath} to Discord`);

    await sendMessages(outPath, token, serverId, pChannel);

    console.log(`Sent all messages to Discord \\o/! You can leave this terminal now.`);

    return;
}