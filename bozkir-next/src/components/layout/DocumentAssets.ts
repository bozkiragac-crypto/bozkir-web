// Tema, ilk boyamadan önce uygulanır (FOUC yok).
export const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark')t='light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}})();`;
