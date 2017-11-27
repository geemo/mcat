'use strict';

const http = require('http');
const Url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');
const { grep } = require('./utils');

const server = http.createServer((req, res) => {
  let _end = res.end;
  res.end = (() => {
    let isEnd = false;
    return function(){
      if (isEnd) return;

      isEnd = true;
      return _end.apply(res, arguments);
    };
  })();

  let chunks = [];
  req.on('data', data => {
    chunks.push(data);
  });

  req.on('end', async () => {
    try {
      let argObj = null;

      const urlObj = Url.parse(req.url);
      let query = urlObj.query ? querystring.parse(urlObj.query) : {};
      if (Object.keys(query).length) {
        argObj = query;
      } else {
        chunks = Buffer.concat(chunks).toString()
        if (chunks) {
          argObj = JSON.parse(chunks);
        }
      }

      let {
        fname,
        matchStr,
        timeRange,
        bufSize
      } = argObj;

      bufSize = parseInt(bufSize);
      bufSize = (!bufSize || bufSize > 1024) ? 4 : bufSize;

      let matchChunk = grep(fname, matchStr, timeRange, bufSize);

      res.end(matchChunk);
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errMsg: err.stack }));
    }
  });
});

server.listen(2233, () => {
  console.log('server start on port 2233');
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
