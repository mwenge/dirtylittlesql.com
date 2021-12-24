'use strict';

var CACHE_NAME = 'DirtyLittleSQL';
var urlsToCache = [
  'sql-wasm.wasm',
  'separators-pre.js',
  'worker.sql-wasm.js',
  'serviceworker.js',
  'tips.js',
  '3rdparty/json2csv.js',
  '3rdparty/chart.min.js',
  '3rdparty/localforage.min.js',
  '3rdparty/hotkeys.min.js',
  '3rdparty/xlsx.full.min.js',
  '3rdparty/codemirror/show-hint.js',
  '3rdparty/codemirror/sql-hint.js',
  '3rdparty/codemirror/sql.min.js',
  '3rdparty/codemirror/codemirror.js',
  'gui.js',
  'separators.js',
  'index.html',
  '3rdparty/codemirror/3024-night.css',
  '3rdparty/codemirror/3024-day.css',
  '3rdparty/codemirror/show-hint.css',
  '3rdparty/codemirror/codemirror.css',
  'fonts.css',
  'demo.css',
  'ABCFavoritMono-Regular.woff',
  'ABCFavoritMono-Light.woff2',
  'ABCFavoritMono-Light.woff',
  'ABCFavoritMono-Regular.woff2',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
