/* Cálculo de ración. Energías en Mcal de energía digestible (ED) por kg y almidón total: datos de Grupo Nutec. */
var STARCH_MEAL=1.1; /* g de almidón por kg de peso vivo en cada comida (Vervuert) */
var GALOPE={
  BALANCE:{name:'Balance',de:3.10,st:0.2423,tag:'Nutrición completa para el caballo de cada día.'},
  ALTO:{name:'Alto Rendimiento',de:3.40,st:0.3787,tag:'Energía que dura, para las exigencias más altas.'},
  ZEN:{name:'Zen',de:3.17,st:0.2889,tag:'Calma y concentración para competir.'},
  REPRO:{name:'Reproductoras',de:3.20,st:0.4366,tag:'Madres fuertes, potrillos que expresan su potencial.'},
  ENERGY:{name:'Energy',de:4.00,st:0.4311}
};
/* Pastura base, en fracción del peso vivo en materia seca, por nivel de trabajo */
var FORAGE_BASE={mant:0.015,lig:0.015,mod:0.017,int:0.017,muy:0.020}, FORAGE_MARE=0.017;
/* NRC 2007: Mcal de ED por kg de peso vivo */
var WORK=[
  {id:'mant',n:'Mantenimiento',h:'Sin trabajo',ex:'En caballeriza o potrero, sin entrenamiento.',f:0.0333},
  {id:'lig',n:'Ligero',h:'1 a 3 h por semana',ex:'Paseo recreativo, inicio de entrenamiento, concursos ocasionales.',f:0.0333*1.2},
  {id:'mod',n:'Moderado',h:'3 a 5 h por semana',ex:'Adiestramiento y salto con concursos frecuentes, caballos de escuela, polo, trabajo de rancho.',f:0.0333*1.4},
  {id:'int',n:'Intenso',h:'4 a 5 h por semana',ex:'Concursos frecuentes y exigentes, concurso completo de nivel bajo a medio, entrenamiento de carreras.',f:0.0333*1.6},
  {id:'muy',n:'Muy intenso',h:'Variable',ex:'Carreras, endurance, concurso completo de élite.',f:0.0363*1.9}
];
var MARE=[
  {id:'g1',n:'Gestación, meses 1 a 5',h:'',ex:'Mismo requerimiento que en mantenimiento.',f:16.7/500},
  {id:'g2',n:'Gestación, meses 6 a 8',h:'',ex:'El potro empieza a crecer más rápido.',f:17.9/500},
  {id:'g3',n:'Gestación, meses 9 a 11',h:'',ex:'Último tercio: la mayor demanda de la gestación.',f:20.3/500},
  {id:'l1',n:'Lactancia, meses 1 a 3',h:'',ex:'Pico de producción de leche.',f:31.3/500},
  {id:'l2',n:'Lactancia, meses 4 a 6',h:'',ex:'La producción de leche va bajando.',f:28.3/500}
];
/* Pasturas: valores típicos en base seca (%). Todos los henos de referencia van a 10% de humedad, para que los kilos de pastura no cambien al cambiar de tipo */
var FORAGE=[
  {id:'avena',n:'Heno de avena',hum:10,pc:9,fdn:62,fda:39,ee:2.4,cen:8},
  {id:'alfalfa',n:'Heno de alfalfa',hum:10,pc:18.5,fdn:43,fda:33,ee:2.3,cen:9.5},
  {id:'mezcla',n:'Mezcla de alfalfa y avena',hum:10,pc:13.5,fdn:53,fda:36,ee:2.3,cen:8.8},
  {id:'ray1',n:'Ray grass tierno, de buena calidad',hum:10,pc:14,fdn:50,fda:32,ee:3.5,cen:10},
  {id:'ray2',n:'Ray grass maduro',hum:10,pc:8.5,fdn:64,fda:44,ee:2.7,cen:9},
  {id:'bermuda',n:'Heno de pasto bermuda',hum:10,pc:10.5,fdn:68,fda:35,ee:2.2,cen:7.5},
  {id:'rastrojo',n:'Rastrojo de maíz',hum:10,pc:5,fdn:75,fda:47,ee:1.2,cen:7}
];
/* Pagan (1998), ecuación usada por el NRC 2007: ED en Mcal por kg de materia seca */
function forageDE(f){
  var cnf=Math.max(0,100-f.fdn-f.ee-f.cen-f.pc);
  var kcal=2118+12.18*f.pc-9.37*f.fda-3.83*(f.fdn-f.fda)+47.18*f.ee+20.35*cnf-26.3*f.cen;
  return Math.max(0.8,kcal/1000);
}
function pickProduct(o){
  if(o.mare) return 'REPRO';
  if(o.nervous) return 'ZEN';
  return (o.work==='mant'||o.work==='lig')?'BALANCE':'ALTO';
}
function requirement(o){
  if(o.custom>0) return o.custom;
  var list=o.mare?MARE:WORK, id=o.mare?o.stage:o.work;
  for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i].f*o.bw;
  return 0.0333*o.bw;
}
function ration(o){
  var bw=o.bw, key=pickProduct(o), g=GALOPE[key], req=requirement(o);
  var deF=forageDE(o.forage), dm=1-o.forage.hum/100, CDM=0.88;
  var gMin=0.002*bw, gMax=0.010*bw, eMax=0.002*bw;
  /* La pastura es fija: un porcentaje del peso vivo en materia seca según el trabajo. El alimento cubre el resto, hasta su máximo */
  var p0=o.mare?FORAGE_MARE:(FORAGE_BASE[o.work]||0.017);
  var F=p0*bw, need=req-F*deF, G=Math.min(gMax,Math.max(gMin,need/g.de)), E=0;
  var rem=req-F*deF-G*g.de;
  if(rem>0.05) E=Math.min(eMax,rem/GALOPE.ENERGY.de);
  var best={F:F,G:G,E:E};
  var r5=function(x){return Math.round(x*2)/2}, r25=function(x){return Math.round(x*4)/4}, r1=function(x){return Math.round(x*10)/10};
  var Fkg=r5(best.F/dm), Gkg=Math.max(0.25,r25(best.G)), Ekg=best.E>0.04?Math.max(0.1,r1(best.E)):0;
  var eF=Fkg*dm*deF, eG=Gkg*g.de, eE=Ekg*GALOPE.ENERGY.de, sup2=eF+eG+eE;
  var starch=(Gkg*g.st+Ekg*GALOPE.ENERGY.st)*1000, perMeal=STARCH_MEAL*bw;
  var meals=Math.max(1,Math.ceil(starch/perMeal-1e-9));
  return {key:key,req:req,deF:deF,deFfed:deF*dm,forageKg:Fkg,galopeKg:Gkg,energyKg:Ekg,eF:eF,eG:eG,eE:eE,sup:sup2,
          cover:sup2/req,meals:meals,starch:starch,starchMeal:starch/meals/bw,foragePct:Fkg*dm/bw*100,totPct:(Fkg*dm+(Gkg+Ekg)*CDM)/bw*100};
}
if(typeof module!=='undefined') module.exports={ration:ration,forageDE:forageDE,FORAGE:FORAGE,WORK:WORK,MARE:MARE,GALOPE:GALOPE,requirement:requirement};
