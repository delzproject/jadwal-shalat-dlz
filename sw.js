// DELZ Service Worker v4 - LENGKAP
let JADWAL = {Subuh:"04:35",Dzuhur:"11:47",Ashar:"15:08",Maghrib:"17:55",Isya:"19:07"};
let AKTIF = {Subuh:true,Dzuhur:true,Ashar:true,Maghrib:true,Isya:true};
let NOTIF_ON = false;
let timerId = null;
const CACHE_NAME = 'delz-v4';
const FILES = ['./','./index.html','./manifest.json','./quran.js','./sw.js','./icon5.jpg','./animasi3.mp4'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>clients.claim())
  );
  scheduleNext();
});
self.addEventListener('fetch', e=>{
  if(e.request.url.includes('api.aladhan') || e.request.url.includes('api.alquran') || e.request.url.includes('equran')) return;
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      let clone=res.clone();
      if(e.request.method==='GET' && res.status===200) caches.open(CACHE_NAME).then(c=>c.put(e.request, clone));
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});
self.addEventListener('message', e=>{
  if(!e.data) return;
  if(e.data.type==='UPDATE_JADWAL'){ JADWAL=e.data.jadwal||JADWAL; AKTIF=e.data.aktif||AKTIF; NOTIF_ON=e.data.notifOn; scheduleNext(); }
  if(e.data.type==='SHOLAT'){ showNotif(e.data.nama, e.data.jam); }
});
function keMenit(j){ let p=j.split(':'); return parseInt(p[0])*60+parseInt(p[1]); }
function showNotif(nama, jam){
  return self.registration.showNotification('hy delz, shalat yuk?', {
    body: 'Sudah masuk waktu '+nama+' - '+jam+' WIB. Sholat dulu ya!',
    icon: 'icon5.jpg', badge: 'icon5.jpg', tag: 'sholat-'+nama,
    silent: true, vibrate: [], renotify: false, requireInteraction: false
  });
}
function scheduleNext(){
  if(timerId) clearTimeout(timerId);
  if(!NOTIF_ON) return;
  let now=new Date(); let nowMenit=now.getHours()*60+now.getMinutes();
  let urutan=['Subuh','Dzuhur','Ashar','Maghrib','Isya'];
  let next=null; let diffMin=99999;
  urutan.forEach(n=>{
    if(!AKTIF[n]) return;
    let m=keMenit(JADWAL[n]); let diff=m-nowMenit; if(diff<=0) diff+=1440;
    if(diff<diffMin){ diffMin=diff; next=n; }
  });
  if(!next) return;
  let delayMs = diffMin*60*1000 - now.getSeconds()*1000 - now.getMilliseconds();
  if(delayMs<0) delayMs=0;
  timerId=setTimeout(()=>{ if(NOTIF_ON && AKTIF[next]) showNotif(next, JADWAL[next]); scheduleNext(); }, delayMs);
}
self.addEventListener('notificationclick', e=>{ e.notification.close(); e.waitUntil(clients.openWindow('./index.html')); });
