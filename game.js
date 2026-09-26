'use strict';
const $=id=>document.getElementById(id);
const canvas=$('game'), renderer=new LumiRenderer(canvas);
let game=LumiCore.create(), mode='start', last=0, accumulator=0;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, muted=true, audio;
const held=new Set(), touches=new Map();
let jumpPressed=false,jumpReleased=false,resetPressed=false;
function clearInput(){held.clear();touches.clear();jumpPressed=jumpReleased=resetPressed=false;}
function isHeld(action){return held.has(action)||[...touches.values()].includes(action);}
function showMode(next){mode=next;clearInput();$('overlay').hidden=next==='playing';$('startPanel').hidden=next!=='start';$('pausePanel').hidden=next!=='paused';$('winPanel').hidden=next!=='won';$('pauseButton').textContent=next==='paused'?'Continuar':'Pausar';if(next==='playing')canvas.focus();else $(next==='won'?'explore':next==='start'?'start':'resume').focus();}
function say(text){$('message').textContent=text;clearTimeout(say.timer);say.timer=setTimeout(()=>$('message').textContent='',3200);}
function tone(freq){if(muted)return;try{audio ||= new AudioContext();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.frequency.value=freq;v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.connect(v).connect(audio.destination);o.start();o.stop(audio.currentTime+.2);}catch{muted=true;}}
function restart(){game=LumiCore.create();renderer.camera=0;renderer.fx=[];showMode('playing');say('Siga as estrelas. Segure o pulo para alcançar mais alto.');}
const keyAction={a:'left',arrowleft:'left',d:'right',arrowright:'right',w:'jump',arrowup:'jump',' ':'jump',s:'down',arrowdown:'down'};
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!e.repeat){if(mode==='playing')showMode('paused');else if(mode==='paused')showMode('playing');return;}
  if(mode!=='playing'||/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName))return;
  const a=keyAction[e.key.toLowerCase()];if(a){e.preventDefault();if(!held.has(a)&&a==='jump')jumpPressed=true;held.add(a);}
  if(e.key.toLowerCase()==='r'&&!e.repeat)resetPressed=true;
});
addEventListener('keyup',e=>{const a=keyAction[e.key.toLowerCase()];if(a){held.delete(a);if(a==='jump')jumpReleased=true;}});
addEventListener('blur',()=>{if(mode==='playing')showMode('paused');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing')showMode('paused');});
document.querySelectorAll('[data-action]').forEach(b=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(mode!=='playing')return;b.setPointerCapture(e.pointerId);touches.set(e.pointerId,b.dataset.action);if(b.dataset.action==='jump')jumpPressed=true;});
  const release=e=>{const a=touches.get(e.pointerId);touches.delete(e.pointerId);if(a==='jump'&&!isHeld('jump'))jumpReleased=true;};
  b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
});
$('start').onclick=()=>{showMode('playing');say('A/D ou setas para andar. Segure Espaço para um salto alto.');};
$('resume').onclick=()=>showMode('playing');
$('pauseButton').onclick=()=>{if(mode==='playing')showMode('paused');else if(mode==='paused')showMode('playing');};
$('restart').onclick=restart;$('replay').onclick=restart;
$('explore').onclick=()=>{game.won=false;showMode('playing');};
$('motionButton').checked=reduced;
$('motionButton').onchange=e=>{reduced=e.target.checked;};
$('soundButton').onclick=()=>{muted=!muted;$('soundButton').textContent=muted?'Som: desligado':'Som: ligado';$('soundButton').setAttribute('aria-pressed',!muted);tone(600);canvas.focus();};
$('contrastButton').onchange=e=>document.body.classList.toggle('high-contrast',e.target.checked);
function processEvents(){for(const e of game.events){
  if(['land','jump','star','respawn'].includes(e.type))renderer.burst(e);
  if(e.type==='star')tone(e.secret?920:720);
  if(e.type==='checkpoint')say(`Ponto seguro ativado: ${e.name}.`);
  if(e.type==='respawn')say('De volta ao ponto seguro. Suas estrelas continuam com você.');
  if(e.type==='stage')say(`Novo estágio: ${game.level.stages[e.stage].name}.`);
  if(e.type==='win'){showMode('won');$('result').textContent=`20/20 estrelas principais · ${game.secret}/3 secretas`;tone(1040);}
}}
function frame(now){
  const elapsed=Math.min(.1,(now-last)/1000||0);last=now;
  if(mode==='playing'){
    accumulator+=elapsed;
    while(accumulator>=LumiCore.DT){
      LumiCore.step(game,{left:isHeld('left'),right:isHeld('right'),down:isHeld('down'),jumpPressed,jumpReleased,respawn:resetPressed});
      jumpPressed=jumpReleased=resetPressed=false;processEvents();accumulator-=LumiCore.DT;
      if(mode!=='playing'){accumulator=0;break;}
    }
  } else accumulator=0;
  renderer.draw(game,mode==='playing'?elapsed:0,reduced);
  $('progressText').textContent=`★ ${game.main}/20　✧ ${game.secret}/3`;
  $('progress').value=game.main;
  $('checkpointText').textContent=`Estágio ${game.stage+1}/5 · ${game.level.stages[game.stage].name}`;
  requestAnimationFrame(frame);
}
showMode('start');requestAnimationFrame(frame);
