#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const parse = require('./parse');
const assert = require('assert').strict;
const send = require('./send');
program.version('0.0.1');

program
  .command('run')
  .option('-s, --source [value]', 'Slack messages source path')
  .option('-o, --out [value]', 'Parsed message output path')
  .option('-i, --include [value]', 'Include channels')
  .option('-e, --exclude [value]', 'Exclude channels')
  .option('-c, --config [value]', 'Configuration file path')
  .option('-t, --token [value]', 'Discord bot token')
  .option('--server [value]', 'Discord server (guild) ID')
  .option('--only-parse', 'Only parses the messages to check')
  .action(async ({config, onlyParse, ...options}) => {
    
    options.include = options.include ? options.include.split(',') : [];
    options.exclude = options.exclude ? options.exclude.split(',') : [];

    const configFile = config && await fs.promises.readFile(config);
    const configOptions = configFile ? JSON.parse(configFile) : {};
    const { source, token, server, out, include, exclude, parentChannel } = {
      ...configOptions,
      ...options
    }

    const sourcePath = source || process.cwd();
    const outPath = out || `${sourcePath}/.s2d/out`;
    const pChannel = parentChannel || 'MIGRATION';
    
    console.log(`Parsing messages from ${sourcePath}`);

    await parse(sourcePath, outPath, include, exclude);

    if (onlyParse) return;

    assert.ok(token, 'Please, provide your Discord Bot token to continue...');
    assert.ok(server, 'Please, provide your Server (Guild) ID to continue...');

    console.log(`Sending messages from ${outPath} to Discord`);

    await send(outPath, token, server, pChannel);

  });

program.parse(process.argv);