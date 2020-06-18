const delay = ms => new Promise(res => setTimeout(res, ms));

const dateFormat = date => {
  const YYYY = date.getFullYear();
  const MM = date.getMonth() + 1;
  const DD = date.getDate();
  const hh = date.getHours();
  const mm = date.getMinutes();
  return `${DD < 10 ? '0' + DD : DD}/${MM < 10 ? '0' + MM : MM}/${YYYY} ${hh < 10 ? '0' + hh : hh}:${mm < 10 ? '0' + mm : mm}`;
}

const concat = (x,y) => x.concat(y);

const groupBy = (list, key) => {
  return list.reduce((acc, elem) => {
    (acc[elem[key]] = acc[elem[key]] || []).push(elem);
    return acc;
  }, {});
};


module.exports = {
  delay,
  dateFormat,
  concat,
  groupBy
}