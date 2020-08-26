#!/usr/bin/env node
const { program } = require('commander');
program.version('0.0.1');

program
  .command('parse')
  .requiredOption('-s, --source [value]', 'source path')
  .option('-o, --out [value]', 'output path')
  .action(({ source, out }) => {
    console.log(`parse ${source} ${out}`);
  })

program
  .command('send')
  .requiredOption('-s, --source [value]', 'source path')
  .requiredOption('-t, --token [value]', 'discord bot token')
  .action(({ source, token }) => {
    console.log(`send ${source} ${token}`);
  });
  

program
  .command('exec')
  .requiredOption('-s, --source [value]', 'source path')
  .requiredOption('-t, --token [value]', 'discord bot token')
  .action(({ source, token }) => {
    console.log(`exec ${source} ${token}`);
  });

program.parse(process.argv);