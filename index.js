'use strict';

const http = require('http');
const Url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

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
      const urlObj = Url.parse(req.url);
      let query = urlObj.query ? querystring.parse(urlObj.query) : {};

      chunks = Buffer.concat(chunks).toString()
      let body = {};
      if (chunks) {
        body = JSON.parse(chunks);
      }

      req.query = query;
      req.body = body;

      let handler = getHandler(urlObj);
      await handler({ req, res });

      res.end()
    } catch(err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ errMsg: err.stack }));
    }
  });
});

server.listen(2233, () => {
  console.log('server start on port 2233');
});

function getHandler({ pathname }) {
  if (pathname[pathname.length - 1] === '/') {
    pathname = pathname.substr(0, pathname.length - 1);
  }

  switch (pathname) {
    default:
      return emptyResponse;
  }
}

function emptyResponse({ req, res }) {
  return new Promise(resolve => {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    resolve();
  });
}

function getApi(method, opts = {}) {
  let { id, query } = opts;

  switch(method) {
  }

  return '';
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
