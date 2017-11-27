'use strict';

const fs = require('fs');

module.exports = {
  grep
};

const KB = 1024;
const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

let openingFiles = {};

function grep(fname, matchStr = '', timeRange, bufSize = 4) {
  bufSize = bufSize * KB;
  // 文件锁，防止重复打开正在使用中的文件
  if (openingFiles[fname] !== undefined) {
    throw new Error(`${fname} file is busy`);
  }

  const fd = fs.openSync(fname, 'r');
  openingFiles[fname] = fd;

  try {
    const stats = fs.fstatSync(fd);
    let pos = stats.size - bufSize;
    if (pos < 0) {
      pos = 0;
    }

    let buf = Buffer.alloc(bufSize);
    let capSize = bufSize;  

    let bytesRead = fs.readSync(fd, buf, 0, bufSize, pos);
    // 若是第一次匹配成功直接返回，或者当 matchStr 为空字符串时，只返回最后一块数据
    if (bytesRead > 0 && buf.indexOf(matchStr) !== -1) {
      return buf.slice(0, bytesRead);
    }

    const endDateStartIdx = buf.lastIndexOf('\n', bytesRead - 2) + 1;
    const endDate = new Date(buf.slice(endDateStartIdx, buf.indexOf(' ', endDateStartIdx)).toString());
    const scanTermDate = _getAvailableStartDate(endDate, timeRange);
    let bufStartDate = _getBufStartDate(buf);

    // 如果第一次扫描的数据块的起始时间超过了扫描终止时间，直接返回空字符串
    if (bufStartDate.getTime() <= scanTermDate.getTime()) {
      return '';
    }

    // 若是第一次匹配没成功，循环迭代匹配（不用递归的方式是怕文件太大爆栈）
    while (bytesRead >= capSize && pos > 0) {
      let tailChunkSize = buf.indexOf('\n') + 1;
      let tailChunkStr = buf.slice(0, tailChunkSize).toString();

      capSize = bufSize - tailChunkSize;
      pos -= capSize
      if (pos < 0) {
        pos = 0;
      }

      bytesRead = fs.readSync(fd, buf, 0, capSize, pos);
      // 上一次读取块中截断数据作为下一次读取块的尾部内容
      buf.write(tailChunkStr, bytesRead);

      if (bytesRead > 0 && buf.indexOf(matchStr) !== -1) {
        return buf.slice(0, bytesRead);
      }

      // 提取出时间
      let dateStartIdx = buf.indexOf('\n') + 1;
      let date = new Date(buf.slice(dateStartIdx, buf.indexOf(' ', dateStartIdx)).toString());
      if (date.getTime() <= scanTermDate.getTime()) {
        return '';
      }
    }
  } finally {
    // 关闭文件，并解除文件锁
    fs.closeSync(fd)
    delete openingFiles[fname];    
  }
}

function _getBufStartDate(buf) {
  let dateStartIdx = buf.indexOf('\n') + 1;
  let date = new Date(buf.slice(dateStartIdx, buf.indexOf(' ', dateStartIdx)).toString());

  return date;
}

function _getAvailableStartDate(endDate, rgStr) {
  let ms = _parseTimeRange(rgStr);

  if (!ms) {
    ms = 30 * ONE_MINUTE;
  } else if (ms > ONE_DAY) {
    ms = ONE_DAY;
  }

  return new Date(endDate.getTime() - ms);
}

function _parseTimeRange(rgStr) {
  let unit = rgStr[rgStr.length - 1];
  let num = parseInt(rgStr.slice(0, rgStr.length - 1));
  switch(unit) {
    case 'm':
      return num * ONE_MINUTE;
    case 'h':
      return num * ONE_HOUR;
  }
}
