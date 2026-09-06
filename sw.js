/* SpoTLight Service Worker - オフライン対応 */
var CACHE_NAME = 'spotlight-cache-v1';
var PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  try{
    event.waitUntil(
      caches.open(CACHE_NAME).then(function(cache){
        return cache.addAll(PRECACHE_URLS).catch(function(){ /* 一部失敗しても続行 */ });
      }).then(function(){
        return self.skipWaiting();
      })
    );
  }catch(e){ /* インストール失敗してもブラウザ標準動作にフォールバック */ }
});

self.addEventListener('activate', function(event){
  try{
    event.waitUntil(
      caches.keys().then(function(keys){
        return Promise.all(
          keys.filter(function(key){ return key !== CACHE_NAME; })
              .map(function(key){ return caches.delete(key); })
        );
      }).then(function(){
        return self.clients.claim();
      })
    );
  }catch(e){}
});

self.addEventListener('fetch', function(event){
  try{
    if(event.request.method !== 'GET'){ return; }
    event.respondWith(
      caches.match(event.request).then(function(cached){
        if(cached){ return cached; }
        return fetch(event.request).then(function(response){
          try{
            if(response && response.status === 200 && response.type === 'basic'){
              var responseClone = response.clone();
              caches.open(CACHE_NAME).then(function(cache){
                try{ cache.put(event.request, responseClone); }catch(e){}
              });
            }
          }catch(e){}
          return response;
        }).catch(function(){
          return caches.match('./index.html');
        });
      }).catch(function(){
        return fetch(event.request);
      })
    );
  }catch(e){ /* fetchハンドラ内エラーでもService Worker全体は停止させない */ }
});
