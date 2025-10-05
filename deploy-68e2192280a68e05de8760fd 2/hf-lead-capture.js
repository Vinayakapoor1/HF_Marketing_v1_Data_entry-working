/*! HF Drop‑in Lead Capture (NO design changes) */
(function(){
  var WEBHOOK_URL = (window.CONFIG && window.CONFIG.WEBHOOK_URL)
    || "https://script.google.com/macros/s/AKfycbzgjFPQUxXMtYptehvtHA1O0-AIVNWLxUgSUOunWjmc1cPWjVMP2tjsamkNG6vgFbHagA/exec";
  var SOURCE = "linkedin-qr";
  var DEBUG = (function(){ try { return new URLSearchParams(location.search).get('debug') === '1'; } catch(_) { return false; } })();
  function log(){ if (DEBUG && console && console.log) try { console.log.apply(console, arguments); } catch(_){} }

  function visible(el){ if(!el) return false; var s=getComputedStyle(el); return s.display!=='none' && s.visibility!=='hidden' && el.offsetParent!==null; }
  function inputs(){ return Array.from(document.querySelectorAll('input,select,textarea')).filter(visible); }
  function pickEmail(){
    var list = inputs();
    var el = list.find(function(i){ return (i.type||'').toLowerCase()==='email'; })
         || list.find(function(i){ return /mail/i.test((i.name||'')+(i.id||'')); })
         || list.find(function(i){ return /@/.test((i.value||'')); });
    return (el && el.value || '').trim();
  }
  function pickName(){
    var list = inputs();
    var el = list.find(function(i){ return /name|full\s*name|fullname|first/i.test((i.name||'')+(i.id||'')+(i.placeholder||'')); });
    if (el && el.value) return el.value.trim();
    var f = list.find(function(i){ return /first/i.test((i.name||'')+(i.id||'')); });
    var l = list.find(function(i){ return /last/i.test((i.name||'')+(i.id||'')); });
    if (f || l) return [(f&&f.value)||'', (l&&l.value)||''].join(' ').trim();
    var cand = list.filter(function(i){ return /text|search|textarea/i.test(i.type||i.tagName) && !/@/.test(i.value||''); })
                   .sort(function(a,b){ return (b.value||'').length - (a.value||'').length; });
    return cand[0] && cand[0].value ? cand[0].value.trim() : '';
  }
  function pickOrg(){
    var list = inputs();
    var el = list.find(function(i){ return /org|company|organisation|organization|employer|business/i.test((i.name||'')+(i.id||'')+(i.placeholder||'')); });
    return (el && el.value || '').trim();
  }
  function pickTraining(){
    var list = inputs();
    var sel = list.find(function(i){ return i.tagName==='SELECT' && /train|awareness|security/i.test((i.name||'')+(i.id||'')); });
    if (sel && sel.value) return sel.value;
    var r = Array.from(document.querySelectorAll('input[type="radio"]'))
      .find(function(x){ return /train|awareness/i.test((x.name||'')+(x.id||'')) && x.checked; });
    if (r) return r.value;
    var el = document.getElementById('training') || document.getElementById('hasTraining');
    return (el && el.value) || 'not-sure';
  }
  function collect(){
    var data = {
      name: pickName(),
      email: pickEmail(),
      organisation: pickOrg(),
      hasTraining: pickTraining(),
      source: SOURCE,
      url: location.href
    };
    log('HF collect:', data);
    return data;
  }

  function send(data){
    try {
      var payload = JSON.stringify(data||{});
      try { var ok = navigator.sendBeacon(WEBHOOK_URL, new Blob([payload], {type:'text/plain'})); log('sendBeacon ok:', ok); } catch(_){}
      fetch(WEBHOOK_URL, { method:'POST', mode:'no-cors', body:new Blob([payload], {type:'text/plain'}), keepalive:true })
        .then(function(){ log('fetch no-cors sent'); })
        .catch(function(e){ log('fetch error:', e); });
    } catch(e){ log('send error:', e); }
  }

  window.HF = window.HF || {};
  window.HF.submitLead = function(ev){
    try { if (ev) { ev.stopPropagation(); } } catch(_){}
    send(collect());
    try { if (typeof showView === 'function') showView('success'); } catch(_){}
    return false;
  };

  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('a,button');
    if (!el) return;
    var t = (el.textContent || '').toLowerCase();
    if (el.matches && (el.matches('#cta-get-risk') || el.matches('[data-hf-submit]') || /get my risk/.test(t))) {
      window.HF.submitLead(e);
    }
  }, true);

  document.addEventListener('submit', function(e){
    try { send(collect()); } catch(_) {}
  }, true);
})();
