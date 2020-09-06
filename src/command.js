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
  .action(async ({config, ...options}) => {
    
    const configFile = config && await fs.promises.readFile(config);
    const configOptions = configFile ? JSON.parse(configFile) : {};
    const { source, token, server, out, include, exclude, parentChannel } = {
      ...configOptions,
      ...options
    }

    assert.ok(token, 'Please, provide your Discord Bot token to continue...');
    assert.ok(server, 'Please, provide your Server (Guild) ID to continue...');

    const sourcePath = source || process.cwd();
    const outPath = out || './.s2d_tmp/out';
    const pChannel = parentChannel || 'MIGRATION';
    const includeList = include ? include.split(',') : [];
    const excludeList = exclude ? exclude.split(',') : [];

    
    console.log(`Parsing messages from ${sourcePath}`);

    await parse(sourcePath, outPath, includeList, excludeList);

    console.log(`Sending messages from ${outPath} to Discord`);

    await send(outPath, token, server, pChannel);

  });

program
  .command('parse')
  .option('-s, --source [value]', 'Slack messages source path')
  .option('-o, --out [value]', 'Parsed message output path')
  .option('-i, --include [value]', 'Include channels')
  .option('-e, --exclude [value]', 'Exclude channels')
  .action(async ({ source, out, include, exclude }) => {
    
    const sourcePath = source || process.cwd();
    const outPath = out || './out';
    const includeList = include ? include.split(',') : [];
    const excludeList = exclude ? exclude.split(',') : [];

    console.log(`Parsing messages from ${sourcePath}`);

    await parse(sourcePath, outPath, includeList, excludeList);
  });
  
program.parse(process.argv);