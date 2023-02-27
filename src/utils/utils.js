/**
 * Delay task for defined milliseconds
 * @param {number} ms
 */
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Format given date
 * @param {Date} date
 */
const dateFormat = date => {
  const YYYY = date.getFullYear();
  const MM = date.getMonth() + 1;
  const DD = date.getDate();
  const hh = date.getHours();
  const mm = date.getMinutes();
  return `${DD < 10 ? '0' + DD : DD}/${MM < 10 ? '0' + MM : MM}/${YYYY} ${hh < 10 ? '0' + hh : hh}:${mm < 10 ? '0' + mm : mm}`;
}

/**
 * Remove escape slashes from URL string
 * @param {string} url 
 */
const unescapeUrl = url => {
  if (url) {
    return url.replace(/\\\//g, '/');
  }
  return '';
}

/**
 * Split text into max length size chunks.
 * @param {string} text 
 * @param {number} maxLength 
 */
const splitText = (text, maxLength) => {
  if (text.length > maxLength) {
    return text.match(new RegExp('(.|[\r\n]){1,' + maxLength + '}', 'g'));
  }
  return [text];
}

const flatMap = (arr) => {
  return arr.reduce((acc, item) => acc.concat(item), []);
}

module.exports = {
  delay,
  dateFormat,
  unescapeUrl,
  splitText,
  flatMap
}