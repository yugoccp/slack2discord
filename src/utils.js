const delay = ms => new Promise(res => setTimeout(res, ms));

const dateFormat = date => {
  const YYYY = date.getFullYear();
  const MM = date.getMonth() + 1;
  const DD = date.getDate();
  
  return `${DD < 10 ? '0' + DD : DD}/${MM < 10 ? '0' + MM : MM}/${YYYY}`;
}

module.exports = {
  delay,
  dateFormat
}