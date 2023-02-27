#!/usr/bin/env node
const { program } = require('commander');
const package = require('../package.json')
const runCommand = require('./commands/runCommand');
const rmChannelsCommand = require('./commands/rmChannelsCommand');

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
    .action(runCommand);

  program
    .command('rm-channels')
    .requiredOption('-ch, --channels [value]', 'Channel nameßs to delete')
    .requiredOption('-t, --token [value]', 'Discord bot token')
    .requiredOption('-sid, --server-id [value]', 'Discord server (guild) ID')
    .action(rmChannelsCommand)

  await program.parseAsync(process.argv);
}

main();