const fs = require('fs');

const logFile = fs.createWriteStream(__dirname + '/../logs/debug.log', {flags : 'w'});

const info = (msg, ...optionals) => {
  log('INFO', msg, optionals);
}

const error = (msg, ...optionals) => {
  log('ERR', msg, optionals);
}

const log = (logLevel, msg, ...optionals) => {
  logFile.write(`[${logLevel}] ${msg}\n`);
  if (optionals) {
    optionals.forEach(o => logFile.write(`[${logLevel}] ${o}\n`));
  }
}

module.exports = {
  info,
  error
}