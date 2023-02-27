const path = require('path');
const fs = require('fs');

fs.mkdir(path.join('.', '.logs'), { recursive: true }, (err) => {
  if (err) throw err;
});

const logFile = fs.createWriteStream(path.join('.', '.logs', 'debug.log'), {flags : 'w'});

const info = (msg, ...optionals) => {
  log('INFO', msg, ...optionals);
}

const error = (msg, ...optionals) => {
  log('ERR', msg, ...optionals);
}

const log = (logLevel, msg, ...optionals) => {
  writeLog(`[${logLevel}] ${msg}\n`);
  if (optionals.length > 0) {
    optionals.forEach(o => writeLog(`[${logLevel}] ${o}\n`));
  }
}

const writeLog = (logMsg) => {
  console.log(logMsg)
  logFile.write(logMsg);
}

module.exports = {
  info,
  error
}