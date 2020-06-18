const delay = ms => new Promise(res => setTimeout(res, ms));

const dateFormat = date => {
  const YYYY = date.getFullYear();
  const MM = date.getMonth() + 1;
  const DD = date.getDate();
  
  return `${DD < 10 ? '0' + DD : DD}/${MM < 10 ? '0' + MM : MM}/${YYYY}`;
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