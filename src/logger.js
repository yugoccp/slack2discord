const fs = require('fs');

fs.mkdir('./logs', { recursive: true }, (err) => {
  if (err) throw err;
});

const logFile = fs.createWriteStream('./logs/debug.log', {flags : 'w'});

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