#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');
const parse = require('./parse');
const send = require('./send');
program.version('0.0.1');

program
  .command('run')
  .option('-s, --source [value]', 'Slack messages source path')
  .option('-o, --out [value]', 'Parsed message output path')
  .option('-i, --include [value]', 'Include channels')
  .option('-e, --exclude [value]', 'Exclude channels')
  .requiredOption('-t, --token [value]', 'Discord bot token')
  .requiredOption('--server [value]', 'Discord server (guild) ID')
  .action(({ source, token, server, out, include, exclude }) => {
    
    const sourcePath = source || process.cwd();
    const outPath = out || './out';
    const parentChannel = 'MIGRATION';
    const includeList = include ? include.split(',') : [];
    const excludeList = exclude ? exclude.split(',') : [];
    
    console.log(`run ${sourcePath} ${outPath} ${token} ${includeList} ${excludeList}`);

    parse(sourcePath, outPath, includeList, excludeList);
    send(outPath, token, server, parentChannel);

  });

program
  .command('parse')
  .option('-s, --source [value]', 'Slack messages source path')
  .option('-o, --out [value]', 'Parsed message output path')
  .option('-i, --include [value]', 'Include channels')
  .option('-e, --exclude [value]', 'Exclude channels')
  .action(({ source, out, include, exclude }) => {
    
    const sourcePath = source || process.cwd();
    const outPath = out || './out';
    const includeList = include ? include.split(',') : [];
    const excludeList = exclude ? exclude.split(',') : [];

    console.log(`parse ${sourcePath} ${outPath} ${includeList} ${excludeList}`);

    parse(sourcePath, outPath, includeList, excludeList);
  });
  
program.parse(process.argv);