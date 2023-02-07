#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const package = require('../package.json')
const assert = require('assert').strict;
const parseMessages = require('./commands/parseMessages');
const sendMessages = require('./commands/sendMessages');
const removeChannels = require('./commands/removeChannels');

program.version(package.version);

async function main() {
  program
    .command('run')
    .option('-s, --source [value]', 'Slack messages source path')
    .option('-o, --out [value]', 'Parsed message output path')
    .option('-i, --include [value]', 'Include channels')
    .option('-e, --exclude [value]', 'Exclude channels')
    .option('-c, --config [value]', 'Configuration file path')
    .option('-t, --token [value]', 'Discord bot token')
    .option('-sid, --server-id [value]', 'Discord server (guild) ID')
    .option('--only-parse', 'Only parses the messages to check')
    .action(async ({config, onlyParse, ...options}) => {
      
      options.include = options.include ? options.include.split(',') : [];
      options.exclude = options.exclude ? options.exclude.split(',') : [];

      const configFile = config && await fs.promises.readFile(config);
      const configOptions = configFile ? JSON.parse(configFile) : {};
      const { source, token, serverId, out, include, exclude, parentChannel, onlyParse } = {
        ...configOptions,
        ...options
      }

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
    });

  program
    .command('rm-channels')
    .requiredOption('-ch, --channels [value]', 'Channel nameßs to delete')
    .requiredOption('-t, --token [value]', 'Discord bot token')
    .requiredOption('-sid, --server-id [value]', 'Discord server (guild) ID')
    .action(async ({channels, token, serverId}) => {

      assert.ok(channels, 'Please provide a channel list to be removed');

      try {
        
        const channelList = channels.split(',');

        removeChannels(channelList, token, serverId);

      } catch (e) {
        console.error(`Couldn't parse channels names. Please make sure to use comma ',' separated string`);
      }
    })

  await program.parseAsync(process.argv);
}

main();