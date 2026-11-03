// Tema, ilk boyamadan önce uygulanır (FOUC yok). `data-theme` ve `color-scheme`
// sunucuda yok; tarayıcıda eklenir. `<html>` üzerinde `suppressHydrationWarning`
// kullanılmalı ki React bu bilinçli farkı hata olarak raporlamasın.
export const themeScript = `(function(){try{var s=localStorage.getItem('theme');var user=s==='dark'||s==='light';var t=user?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.setAttribute('data-theme',t);r.style.colorScheme=t;r.dataset.themeSource=user?'user':'system';var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',t==='dark'?'#0e0e10':'#f7f7f5');}catch(e){}})();`;
