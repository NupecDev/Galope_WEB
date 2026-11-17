/* Interfaz de la calculadora de ración. Requiere js/racion-calculo.js cargado antes. */
(function(){
var BAG={BALANCE:"img/saco-balance.webp",ALTO:"img/saco-alto-rendimiento.webp",ZEN:"img/saco-zen.webp",REPRO:"img/saco-reproductoras.webp"};
var LITE={BALANCE:'var(--l-balance)',ALTO:'var(--l-alto)',ZEN:'var(--l-zen)',REPRO:'var(--l-repro)'};
var $=function(id){return document.getElementById(id)};
var peso=$('t-peso'),mcal=$('t-mcal'),sel=$('t-forage'),rows=$('lv-rows');
var L={hum:$('l-hum'),pc:$('l-pc'),fdn:$('l-fdn'),fda:$('l-fda'),ee:$('l-ee'),cen:$('l-cen')};
var state={work:'mod',stage:'g3'};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function num(el,d){var v=parseFloat(el.value);return isFinite(v)?v:d}
function bw(){return Math.min(1000,Math.max(150,num(peso,500)))}
function isMare(){return $('t-mare-si').checked}
function fmt(x,d){return x.toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:d===undefined?2:d})}
function mc(x){return x.toLocaleString('es-MX',{minimumFractionDigits:1,maximumFractionDigits:1})}

FORAGE.forEach(function(f){var o=document.createElement('option');o.value=f.id;o.textContent=f.n;sel.appendChild(o)});
function fillLab(){var f=FORAGE.filter(function(x){return x.id===sel.value})[0];Object.keys(L).forEach(function(k){L[k].value=f[k]})}
function forage(){var f=FORAGE.filter(function(x){return x.id===sel.value})[0],o={};Object.keys(L).forEach(function(k){o[k]=Math.max(0,num(L[k],f[k]))});o.hum=Math.min(90,o.hum);if(o.fda>o.fdn)o.fda=o.fdn;return o}

function drawLevels(){
  var mare=isMare(),list=mare?MARE:WORK,cur=mare?state.stage:state.work,w=bw();
  $('lv-title').textContent=mare?'2. Su etapa':'2. Su trabajo';
  $('lv-h1').textContent=mare?'Etapa':'Nivel';
  rows.innerHTML=list.map(function(l){
    return '<label class="lv"><input type="radio" name="lv" value="'+l.id+'"'+(l.id===cur?' checked':'')+'>'+
      '<span class="nm">'+esc(l.n)+(l.h?'<small>'+esc(l.h)+'</small>':'')+'</span><span class="ex">'+esc(l.ex)+'</span><span class="mc">'+mc(l.f*w)+'</span></label>';
  }).join('');
  $('lv-src').textContent='Energía digestible para '+(mare?'una yegua':'un caballo')+' de '+fmt(w,0)+' kg. Fuente: Nutrient Requirements of Horses, 6.ª edición, National Research Council (2007).';
  $('q-nerv-wrap').hidden=mare;
}
rows.addEventListener('change',function(e){if(e.target.name==='lv'){if(isMare())state.stage=e.target.value;else state.work=e.target.value;calc()}});

function calc(){
  var w=bw(),mare=isMare(),f=forage();
  var r=ration({bw:w,mare:mare,stage:state.stage,work:state.work,nervous:!mare&&$('t-nerv-si').checked,custom:num(mcal,0),forage:f});
  var g=GALOPE[r.key];
  $('fo-out').innerHTML='Energía estimada de esta pastura: <b>'+fmt(r.deFfed)+' Mcal por kg</b>, tal como se ofrece.';
  $('r-bag').src=BAG[r.key];$('r-bag').alt='Bulto de Galope '+g.name;
  $('r-name').textContent='Galope '+g.name;$('r-tag').textContent=g.tag;
  var a='<div><b>'+fmt(r.forageKg,1)+' kg</b><span>de pastura al día</span></div><div><b>'+fmt(r.galopeKg)+' kg</b><span>de Galope '+esc(g.name)+' al día</span></div>';
  if(r.energyKg>0)a+='<div><b>'+fmt(r.energyKg,1)+' kg</b><span>de Galope Energy al día</span></div>';
  $('r-amounts').innerHTML=a;
  var tot=Math.max(r.sup,r.req),seg=[['Pastura',r.eF,'var(--l-forage)'],['Galope '+g.name,r.eG,LITE[r.key]]];
  if(r.energyKg>0)seg.push(['Galope Energy',r.eE,'var(--l-energy)']);
  $('r-bar').innerHTML=seg.map(function(s){return '<i style="width:'+(s[1]/tot*100).toFixed(1)+'%;background:'+s[2]+'"></i>'}).join('');
  $('r-bar').setAttribute('aria-label',seg.map(function(s){return s[0]+' '+mc(s[1])+' Mcal'}).join(', '));
  $('r-legend').innerHTML=seg.map(function(s){return '<span><i style="background:'+s[2]+'"></i>'+esc(s[0])+': '+mc(s[1])+' Mcal</span>'}).join('');
  $('r-sum').textContent='Requiere '+mc(r.req)+' Mcal al día'+(num(mcal,0)>0?' (tu dato)':'')+'. Esta ración aporta '+mc(r.sup)+' Mcal.';
  var n=[];
  if(r.cover<0.96)n.push(['warn','Con esta pastura no se alcanza su requerimiento sin pasarse de concentrado. Busca una pastura de mejor calidad o revísalo con un asesor.']);
  if(r.cover>1.08)n.push(['warn','Con esta pastura la ración aporta más energía de la que requiere. Vigila su condición corporal.']);
  if(r.energyKg>0)n.push(['','Sumamos Galope Energy porque, con esta pastura, el alimento solo no alcanza.']);
  n.push(['','La pastura equivale a '+fmt(r.foragePct,1)+'% de su peso en materia seca.']);
  if(r.totPct>2.75)n.push(['','Es una ración voluminosa: entre pastura y alimento suma '+fmt(r.totPct,1)+'% de su peso. Si no se termina la pastura, busca una de mejor calidad o revísalo con un asesor.']);
  n.push(['',r.meals===1?'Puedes darle el Galope en una sola comida al día.':'Reparte el Galope en '+r.meals+' comidas iguales al día, para no pasar de 1.1 g de almidón por kg de peso en cada una.']);
  n.push(['','Haz el cambio poco a poco, en 7 a 10 días, y deja siempre agua limpia y sal a su alcance.']);
  $('r-notes').innerHTML=n.map(function(x){return '<li'+(x[0]?' class="'+x[0]+'"':'')+'>'+esc(x[1])+'</li>'}).join('');
}
sel.addEventListener('change',function(){fillLab();calc()});
Object.keys(L).forEach(function(k){L[k].addEventListener('input',calc)});
peso.addEventListener('input',function(){drawLevels();calc()});
mcal.addEventListener('input',calc);
['t-mare-no','t-mare-si'].forEach(function(id){$(id).addEventListener('change',function(){drawLevels();calc()})});
['t-nerv-no','t-nerv-si'].forEach(function(id){$(id).addEventListener('change',calc)});
$('tool').addEventListener('submit',function(e){e.preventDefault()});
fillLab();drawLevels();calc();
})();
