import { assetUrl } from './asset-url';
import './style.css';
import './reference-layout.css';
import { SYMBOLS, PAYLINES, BETS, createPreviewResult, type Grid, type SpinResult, type PreviewKind } from './engine';
import { GameState } from './state';
import { ReelRenderer } from './renderer';
import { AudioManager } from './audio';
import { AnimationController } from './animations';
import { BonusFeatureController } from './bonus';
import { AssetManager } from './assets';
import { ResponsiveLayoutManager } from './layout';
import { icon } from './icons';

const $ = <T extends HTMLElement = HTMLElement>(selector:string):T => document.querySelector<T>(selector)!;
const credits = (value:number) => value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const app = $('#app');
app.innerHTML = `
<div class="world" aria-hidden="true"><div class="scene sky-layer"></div><div class="sun-glow"></div><div class="cloud-haze"></div><div class="distant-buildings scene-layer"></div><div class="city-skyline scene-layer"></div><div class="skyline-lights"></div><div class="palm-shadow palm-left"></div><div class="palm-shadow palm-right"></div><div class="palm-art scene-layer"></div><div class="ocean-haze"></div><div class="street-reflections scene-layer"></div><div class="foreground-art scene-layer"></div><div class="helicopter"></div><div class="passing-lights"></div><div class="film-grain"></div></div>
<div class="game-shell" id="game-shell">
  <div class="reference-caption">VICE CITY NIGHTS | DEMO · VIRTUAL CREDITS</div>
  <main class="reference-game">
    <section class="game-stage" aria-label="Slot game">
      <aside class="kingpin-aside" aria-hidden="true"><picture><source media="(min-width:621px) and (min-height:481px)" srcset="${assetUrl('/assets/characters/kingpin_desktop.webp')}"/><img src="${assetUrl('/assets/characters/kingpin.png')}" alt=""/></picture></aside>
      <div class="cabinet-wrap">
        <div class="reference-masthead">
          <img class="game-logo" src="${assetUrl('/assets/branding/logo.svg')}" alt="Vice City Nights"/>
          <div class="prize-face" aria-label="Current VIP prize"><div class="prize-brand"><small>THE NIGHTCLUB</small><strong>TAKEOVER</strong><span>VIP PRIZE</span></div><div class="prize-readout"><strong id="prize-value">1,000.00</strong><small>VIRTUAL CREDITS · 1,000× TOTAL BET</small></div></div>
        </div>
        <div class="cabinet"><span class="cabinet-corner corner-tl"></span><span class="cabinet-corner corner-tr"></span><span class="cabinet-corner corner-bl"></span><span class="cabinet-corner corner-br"></span><div class="line-markers" aria-hidden="true"><b>2</b><b>1</b><b>3</b></div><div class="reels" id="reels" role="img" aria-label="Five reels with three symbols each"></div><svg class="payline-overlay" id="payline-overlay" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"></svg></div>
        <div class="control-panel">
          <div class="reference-budget">
            <div class="bet-control"><span class="control-label">BET</span><div><button id="bet-minus" class="step-button" aria-label="Decrease bet">${icon('minus')}</button><button id="bet-value" aria-label="Choose bet">1.00</button><button id="bet-plus" class="step-button" aria-label="Increase bet">${icon('plus')}</button></div></div>
            <div class="wallet"><span class="balance-mark" aria-hidden="true">◆</span><strong id="balance">1,000.00</strong><small>CR</small></div>
          </div>
          <div class="status-strip"><span id="status" aria-live="polite">Press spin to start</span><div class="win-control"><span>WIN</span><strong id="win">0.00</strong><small>CR</small></div><span id="spin-count" class="spin-count" hidden></span><div class="reference-tools"><button class="icon-button" id="settings" aria-label="Game menu" title="Menu">${icon('menu')}</button><button class="icon-button" id="sound" aria-label="Enable sound" title="Sound">${icon('muted')}</button></div></div>
          <div class="play-controls"><button id="turbo" class="aux-button" aria-label="Turbo mode" aria-pressed="false" title="Turbo">${icon('turbo')}</button><button id="autoplay" class="aux-button" aria-label="Autoplay" aria-pressed="false" title="Autoplay">${icon('play')}</button><button id="spin" class="spin-button" aria-label="Spin"><span class="spin-inner">${icon('spin')}</span></button></div>
        </div>
      </div>
    </section>
    <nav class="game-footer" aria-label="Game information" hidden><button id="paytable">PAYTABLE & RULES</button><button id="history">HISTORY</button><button id="tour-mobile">FEATURE TOUR</button><button id="feature-tour">FEATURE TOUR</button><button id="fullscreen" aria-label="Enter fullscreen">FULLSCREEN</button></nav>
  </main>
</div>
<div class="particles" id="particles" aria-hidden="true"></div>
<dialog id="modal" class="modal" aria-labelledby="modal-title"><div class="modal-header"><div><span class="eyebrow" id="modal-kicker">VICE CITY NIGHTS</span><h2 id="modal-title">The high life</h2></div><button id="modal-close" class="icon-button" aria-label="Close dialog">${icon('close')}</button></div><div id="modal-body" class="modal-body"></div></dialog>
<div id="celebration" class="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title" hidden><div class="celebration-rays"></div><div class="celebration-content"><span id="celebration-kicker" class="eyebrow"></span><h2 id="celebration-title"></h2><strong id="celebration-value"></strong><span class="celebration-unit">VIRTUAL CREDITS</span><p id="celebration-note"></p><button id="celebration-continue" class="neon-button">CONTINUE ${icon('chevron')}</button></div></div>
<section class="loading" id="loading"><div class="loading-shade"></div><div class="loading-content"><span class="eyebrow">WELCOME TO THE HIGH LIFE</span><img src="${assetUrl('/assets/branding/logo.svg')}" alt="Vice City Nights"/><div class="loading-logo-space"></div><div class="loading-progress"><i id="loading-bar"></i></div><span id="loading-status">Lighting up Ocean Drive…</span><button id="enter" class="neon-button" disabled>ENTER THE NIGHT ${icon('chevron')}</button><p class="loading-disclaimer">PLAY WITH VIRTUAL CREDITS<br/>No cash value.</p></div><span class="loading-year">OCEAN DRIVE / 1986</span></section>
`;

$('#game-shell').inert=true;
const initialGrid:Grid = [[{id:'queen'},{id:'car'},{id:'enforcer'}],[{id:'cash',value:10},{id:'kingpin'},{id:'queen'}],[{id:'racer'},{id:'vip'},{id:'cocktail'}],[{id:'queen'},{id:'car'},{id:'fixer'}],[{id:'enforcer'},{id:'cash',value:20},{id:'kingpin'}]];
const state = new GameState();
const renderer = new ReelRenderer($('#reels'), initialGrid);
const audio = new AudioManager();
const animation = new AnimationController($('#particles'));
const bonus = new BonusFeatureController($('#celebration'));
const layout = new ResponsiveLayoutManager($('#game-shell'));
const assets = new AssetManager();
const modal = $<HTMLDialogElement>('#modal');
let entered = false, busy = false, previewing = false, turbo = false, autoRemaining = 0, stopOnWin = false, spinNumber = 0;
let musicVolume = .18, sfxVolume = .55;
let shownGrid = initialGrid;
let celebrationResolve: (()=>void) | null = null;
let focusReturn: HTMLElement | null = null;

function status(message:string):void { $('#status').textContent = message; }
function updateControls():void {
  $('#balance').textContent = credits(state.balance);
  $('#prize-value').textContent = credits(state.bet*1000);
  $('#bet-value').textContent = credits(state.bet);
  const locked = busy || autoRemaining > 0 || state.phase !== 'ready';
  for(const id of ['bet-minus','bet-plus','bet-value']) $(id.startsWith('#')?id:`#${id}`).toggleAttribute('disabled',locked);
  $<HTMLButtonElement>('#spin').disabled = busy || !state.canSpin;
  $('#spin').classList.toggle('is-spinning',busy);
  $('#spin-count').hidden=autoRemaining===0;
  $('#spin-count').textContent = autoRemaining ? `${autoRemaining} AUTO SPINS LEFT` : spinNumber ? `ROUND ${spinNumber.toString().padStart(3,'0')}` : 'VIRTUAL PLAY';
  $('#autoplay').setAttribute('aria-label',autoRemaining ? 'Stop autoplay' : 'Autoplay');
  $('#autoplay').setAttribute('aria-pressed',String(autoRemaining>0));
  $('#autoplay').innerHTML = `${icon(autoRemaining ? 'pause' : 'play')}`;
  $('#turbo').setAttribute('aria-pressed',String(turbo));
  for(const id of ['settings','paytable','history','feature-tour','tour-mobile']) $<HTMLButtonElement>(`#${id}`).disabled=busy;
}
function updateSound():void {
  const muted = audio.muted;
  $('#sound').innerHTML = icon(muted ? 'muted' : 'sound');
  $('#sound').setAttribute('aria-label',muted ? 'Enable sound' : 'Mute sound');
}
function stopAuto():void { autoRemaining=0; updateControls(); }
function closeModal():void { modal.close(); focusReturn?.focus(); }
function openModal(title:string,body:string,kicker='THE AFTER HOURS COLLECTION'):void {
  if(busy)return;
  stopAuto(); focusReturn = document.activeElement as HTMLElement;
  $('#modal-title').textContent=title; $('#modal-kicker').textContent=kicker; $('#modal-body').innerHTML=body;
  if(!modal.open) modal.showModal();
  audio.play('click');
}
$('#modal-close').addEventListener('click',closeModal);
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect(); if((event as MouseEvent).clientX<r.left||(event as MouseEvent).clientX>r.right||(event as MouseEvent).clientY<r.top||(event as MouseEvent).clientY>r.bottom) closeModal();}});
modal.addEventListener('cancel',()=>{stopAuto();});

function drawLines(result:SpinResult):void {
  const colors=['#ff2d95','#00e5ff','#ffd700','#ff8c42','#a97bff'];
  $('#payline-overlay').innerHTML = result.wins.filter(w=>w.line>0).map(w=>`<polyline points="${PAYLINES[w.line-1].map((row,reel)=>`${reel*20+10},${row*20+10}`).join(' ')}" fill="none" stroke="${colors[w.line-1]}" stroke-width=".4"/>`).join('');
}
function clearLines():void { $('#payline-overlay').innerHTML=''; }

async function celebrate(result:SpinResult, isPreview=false):Promise<void> {
  if(!result.totalWin) return;
  renderer.highlight(result); drawLines(result);
  const multiple=result.totalWin/result.bet;
  const large=multiple>=20 || result.feature;
  if(!layout.reducedMotion.matches) animation.cashBurst(large?(multiple>=200?320:multiple>=80?240:180):36,large?undefined:$('#reels').getBoundingClientRect(),large);
  audio.play(result.feature?'vip':large?'bigwin':'win');
  if(!large){await animation.count($('#win'),result.totalWin,turbo?250:750);status(`${result.wins.length} winning ${result.wins.length===1?'line':'lines'} · ${credits(result.totalWin)} credits`);return;}
  const overlay=$('#celebration');
  overlay.classList.toggle('vip-celebration',result.feature);
  $('#celebration-kicker').textContent=isPreview?'FEATURE PREVIEW · BALANCE UNCHANGED':result.feature?'THE NIGHTCLUB TAKEOVER':'THE CITY IS PAYING';
  $('#celebration-title').textContent=result.feature?'OWN THE NIGHT':multiple>=200?'OWN THE CITY!':multiple>=80?'MEGA WIN':'BIG WIN';
  $('#celebration-note').textContent=result.feature?'Three VIPs. One unforgettable night.':`${result.wins.length} winning ${result.wins.length===1?'line':'lines'}. Welcome to the high life.`;
  $('#celebration-value').textContent='0.00'; overlay.hidden=false;
  const continueButton=$<HTMLButtonElement>('#celebration-continue'); continueButton.focus();
  $('#game-shell').inert=true;
  const waitForContinue=new Promise<void>(resolve=>{celebrationResolve=resolve;});
  if(result.feature){audio.setMode('vip');await bonus.enter(layout.reducedMotion.matches);}
  await animation.count($('#celebration-value'),result.totalWin,layout.reducedMotion.matches?100:1600);
  $('#win').textContent=credits(result.totalWin);
  await waitForContinue;
  overlay.hidden=true;bonus.exit(); $('#game-shell').inert=false; audio.setMode('main'); animation.clear();
  status(`${credits(result.totalWin)} credits · The night belongs to you.`);
  $('#spin').focus({preventScroll:true});
}
$('#celebration-continue').addEventListener('click',()=>{celebrationResolve?.();celebrationResolve=null;});

async function spin():Promise<void> {
  if(!entered||busy||modal.open) return;
  if(!state.canSpin){stopAuto();status('Not enough demo credits. Lower your bet or reset credits in Settings.');return;}
  busy=true; animation.clear(); clearLines(); renderer.clearWins(); $('#win').textContent='0.00';
  status(turbo?'Fast lane. Hold tight.':'Making moves on Ocean Drive…');
  try {
    const resultPromise=state.startSpin(); updateControls(); audio.play('spin');
    const result=await resultPromise;
    await renderer.spin(result,turbo,layout.reducedMotion.matches,()=>audio.play('stop'));
    shownGrid=result.grid;
    if(!state.settle(result.id)) throw new Error('The round could not be settled.');
    spinNumber++; updateControls();
    if(result.totalWin>0) await celebrate(result);
    else status('The city never sleeps. Your next move awaits.');
    state.finishCelebration();
    if(result.feature||(stopOnWin&&result.totalWin>0)) autoRemaining=0;
    if(autoRemaining>0) autoRemaining--;
  } catch(error) {
    autoRemaining=0;
    // If a renderer fails after a valid result, recover accounting before reopening controls.
    const result=state.currentResult;
    if(state.phase==='spinning'&&result){state.settle(result.id);state.finishCelebration();renderer.render(result.grid,result.bet);shownGrid=result.grid;}
    status(error instanceof Error ? error.message : 'Something interrupted the round. Please try again.');
  } finally {busy=false; updateControls();}
  if(autoRemaining>0){await new Promise<void>(resolve=>setTimeout(resolve,turbo?180:600));if(autoRemaining>0&&!document.hidden) void spin();}
}
$('#spin').addEventListener('click',()=>{void audio.unlock();void spin();});
$('#turbo').addEventListener('click',()=>{turbo=!turbo;audio.play('click');updateControls();});

function chooseBet(value:number):void {if(state.setBet(value)){audio.play('click');updateControls();renderer.render(shownGrid,state.bet);clearLines();renderer.clearWins();$('#win').textContent='0.00';}}
$('#bet-minus').addEventListener('click',()=>chooseBet(BETS[Math.max(0,BETS.indexOf(state.bet)-1)]));
$('#bet-plus').addEventListener('click',()=>chooseBet(BETS[Math.min(BETS.length-1,BETS.indexOf(state.bet)+1)]));
$('#bet-value').addEventListener('click',()=>{
  if(busy) return;
  openModal('Choose your stake',`<p class="modal-intro">Every move starts here. All five paylines are active at every bet.</p><div class="bet-grid">${BETS.map(b=>`<button class="choice-button ${b===state.bet?'selected':''}" data-bet="${b}">${credits(b)}</button>`).join('')}</div><p class="fineprint">Amounts are virtual credits. No deposits or withdrawals.</p>`,'TOTAL BET · VIRTUAL CREDITS');
  $('#modal-body').querySelectorAll<HTMLButtonElement>('[data-bet]').forEach(b=>b.addEventListener('click',()=>{chooseBet(Number(b.dataset.bet));closeModal();}));
});
$('#autoplay').addEventListener('click',()=>{
  if(autoRemaining){stopAuto();status('Autoplay stopped. The current round will finish.');return;}
  if(busy) return;
  openModal('Let the night ride',`<p class="modal-intro">Choose a finite run. Stop at any time with the AUTO control.</p><div class="auto-grid">${[10,25,50,100,500].map(n=>`<button class="choice-button" data-auto="${n}">${n}<small>SPINS</small></button>`).join('')}</div><label class="toggle-row"><input type="checkbox" id="stop-win" ${stopOnWin?'checked':''}/><span>Stop after any winning spin</span></label><p class="fineprint">Autoplay also stops when this tab is hidden, a menu is opened, credits are insufficient, or the VIP feature lands. Large celebrations wait for Continue.</p>`,'AUTOPLAY');
  $('#modal-body').querySelectorAll<HTMLButtonElement>('[data-auto]').forEach(b=>b.addEventListener('click',()=>{stopOnWin=$<HTMLInputElement>('#stop-win').checked;autoRemaining=Number(b.dataset.auto);closeModal();updateControls();void spin();}));
});

function lineDiagram(rows:readonly number[],i:number):string {return `<div class="line-diagram"><span>${i+1}</span><div>${Array.from({length:15},(_,n)=>`<i class="${Math.floor(n/5)===rows[n%5]?'active':''}"></i>`).join('')}</div></div>`;}
function showPaytable():void {
  if(busy)return;
  const regular=Object.entries(SYMBOLS).filter(([id])=>id!=='cash'&&id!=='vip');
  openModal('The rules of the night',`<div class="info-tabs"><button class="selected" data-tab="pays">PAYTABLE</button><button data-tab="rules">HOW TO PLAY</button></div><section id="info-content"></section>`,'GAME INFORMATION');
  const content=$('#info-content');
  function tab(name:string):void {
    $('#modal-body').querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',(b as HTMLElement).dataset.tab===name));
    if(name==='pays')content.innerHTML=`<p class="modal-intro">Match 3, 4 or 5 from the left on one of five paylines. Values below are credits at your current total bet of <b>${credits(state.bet)}</b>.</p><div class="paytable-grid">${regular.map(([id,s])=>`<article class="pay-symbol"><img src="${s.asset}" alt="${s.label}"/><div><h3>${s.label}</h3><p>${s.pays.map((p,i)=>`<span><b>${i+3}</b> ${credits(p*state.bet)}</span>`).join('')}</p></div></article>`).join('')}</div><div class="special-rule"><img src="${SYMBOLS.cash.asset}" alt="Cash coin"/><div><h3>Cash is king</h3><p>3 or more consecutive coins starting on reel 1 pay the sum of their displayed credit values on that line. Values scale with total bet. A coin can participate in more than one winning line.</p></div></div><div class="special-rule"><img src="${SYMBOLS.vip.asset}" alt="VIP scatter"/><div><h3>The Nightclub Takeover</h3><p>Land one VIP anywhere on each of reels 2, 3 and 4 for <b>1,000× total bet</b> (${credits(state.bet*1000)} credits). An instant prize and cinematic celebration. No additional spins.</p></div></div><h3 class="section-label">FIVE FIXED PAYLINES</h3><div class="payline-diagrams">${PAYLINES.map(lineDiagram).join('')}</div>`;
    else if(name==='rules')content.innerHTML=`<div class="rules-copy"><h3>Your next move</h3><p>Choose a total bet, then press SPIN or the spacebar. Your bet is deducted once; all five lines play. </p><h3>Follow the line</h3><p>Ordinary symbols and coins must match consecutively from the far-left reel. Three or more pay. Only the highest win for each line is awarded; different lines are added together. VIP pays independently across the middle reels.</p><h3>Set your pace</h3><p>TURBO speeds up the reels. AUTO offers 10, 25, 50, 100 or 500 spins and a stop-on-win option. You can stop a run at any time; the current round finishes.</p><h3>A night worth remembering</h3><p>BIG WIN at 20×, MEGA WIN at 80×, OWN THE CITY at 200× total bet. The VIP feature uses its own nightclub scene. Feature Tour shows scripted examples and leaves your balance unchanged.</p><h3>Keep it enjoyable</h3><p>This experience uses virtual credits without cash value. There are no deposits, prizes of money or redemption. Take breaks and play at your own pace. Reset your balance in Sound & settings.</p><h3>Controls</h3><p>Space = spin · Escape = close a menu or celebration. Music and effects have separate volume controls. Reduce Motion follows your device preference.</p></div>`;

  }
  $('#modal-body').querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab!)));tab('pays');
}
$('#paytable').addEventListener('click',showPaytable);
$('#history').addEventListener('click',()=>{
  if(busy)return;
  openModal('Your nights on record',state.history.length?`<div class="history-table"><div class="history-heading"><span>ROUND</span><span>BET</span><span>WIN</span><span>BALANCE</span></div>${state.history.map((h,i)=>`<div><span>${String(spinNumber-i).padStart(3,'0')}${h.feature?' · VIP':''}</span><span>${credits(h.bet)}</span><strong class="${h.win?'positive':''}">${credits(h.win)}</strong><span>${credits(h.balance)}</span></div>`).join('')}</div><p class="fineprint">Last 30 rounds in this session. All amounts are virtual credits.</p>`:`<div class="empty-state">${icon('history')}<h3>A clean slate.</h3><p>Your completed spins will appear here.</p></div>`,'SESSION HISTORY');
});

function showSettings():void {
  if(busy)return;
  openModal('Make it your night',`<div class="settings-block"><h3>THE SOUND OF MIAMI</h3><label class="volume-row" for="music-volume"><span>Music</span><input id="music-volume" type="range" min="0" max="1" step=".01" value="${musicVolume}"/><output id="music-value">${Math.round(musicVolume*100)}%</output></label><label class="volume-row" for="sfx-volume"><span>Sound effects</span><input id="sfx-volume" type="range" min="0" max="1" step=".01" value="${sfxVolume}"/><output id="sfx-value">${Math.round(sfxVolume*100)}%</output></label><button id="settings-mute" class="choice-button">${audio.muted?'ENABLE SOUND':'MUTE ALL SOUND'}</button></div><div class="settings-block"><h3>YOUR SESSION</h3><p>Balance: ${credits(state.balance)} virtual credits. A fresh start restores 1,000 credits and clears history.</p><button id="reset" class="outline-button" ${busy?'disabled':''}>RESET DEMO CREDITS</button></div><p class="fineprint">Motion preference: ${layout.reducedMotion.matches?'reduced':'cinematic'}. Your device setting is respected. Audio begins after a user gesture.</p>`,'SETTINGS');
  $<HTMLInputElement>('#music-volume').addEventListener('input',e=>{musicVolume=Number((e.target as HTMLInputElement).value);audio.setMusicVolume(musicVolume);$('#music-value').textContent=`${Math.round(musicVolume*100)}%`;});
  $<HTMLInputElement>('#sfx-volume').addEventListener('input',e=>{sfxVolume=Number((e.target as HTMLInputElement).value);audio.setSfxVolume(sfxVolume);$('#sfx-value').textContent=`${Math.round(sfxVolume*100)}%`;});
  $('#settings-mute').addEventListener('click',()=>{void audio.unlock();audio.toggleMute();updateSound();$('#settings-mute').textContent=audio.muted?'ENABLE SOUND':'MUTE ALL SOUND';});
  $('#reset').addEventListener('click',()=>{if(state.resetCredits()){spinNumber=0;shownGrid=initialGrid;renderer.render(initialGrid,state.bet);clearLines();$('#win').textContent='0.00';status('A fresh start. 1,000 credits. The city is yours.');updateControls();closeModal();}});
}
function showMenu():void {
  openModal('Game menu',`<div class="reference-menu"><button data-menu="pays">${icon('info')}<span>Paytable & rules</span>${icon('chevron')}</button><button data-menu="history">${icon('history')}<span>Round history</span>${icon('chevron')}</button><button data-menu="tour">${icon('play')}<span>Feature tour</span>${icon('chevron')}</button><button data-menu="audio">${icon('sound')}<span>Sound & settings</span>${icon('chevron')}</button><button data-menu="fullscreen">${icon('fullscreen')}<span>Fullscreen</span>${icon('chevron')}</button></div>`,'VICE CITY NIGHTS');
  $('#modal-body').querySelectorAll<HTMLButtonElement>('[data-menu]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.menu; closeModal();
    if(action==='pays')showPaytable(); else if(action==='history')$('#history').click(); else if(action==='tour')showTour(); else if(action==='audio')showSettings(); else $('#fullscreen').click();
  }));
}
$('#settings').addEventListener('click',showMenu);
$('#sound').addEventListener('click',()=>{void audio.unlock();audio.toggleMute();updateSound();audio.play('click');});
$('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{status('Fullscreen is unavailable here. The game still fits your screen.');}
});
function showTour():void {
  if(busy)return;
  openModal('Get to know the city',`<p class="modal-intro">See the features in action. These scripted previews never change your balance.</p><div class="tour-grid"><button data-preview="line"><img src="${SYMBOLS.kingpin.asset}" alt=""/><strong>THE CONNECTION</strong><span>Three Kingpins. A line win.</span></button><button data-preview="cash"><img src="${SYMBOLS.cash.asset}" alt=""/><strong>CASH IS KING</strong><span>Coins connect. Values add up.</span></button><button data-preview="big"><img src="${SYMBOLS.car.asset}" alt=""/><strong>OWN THE CITY</strong><span>The full-screen celebration.</span></button><button data-preview="vip"><img src="${SYMBOLS.vip.asset}" alt=""/><strong>NIGHTCLUB TAKEOVER</strong><span>Three VIPs. An instant prize.</span></button></div><p class="fineprint">Preview values use a 1-credit illustrative bet.</p>`,'FEATURE TOUR · NO CREDIT CHANGES');
  $('#modal-body').querySelectorAll<HTMLButtonElement>('[data-preview]').forEach(b=>b.addEventListener('click',()=>{closeModal();void preview(b.dataset.preview as PreviewKind);}));
}
async function preview(kind:PreviewKind):Promise<void> {
  if(busy)return;
  busy=true;previewing=true;animation.clear();updateControls();clearLines();
  const saved=shownGrid;const savedWin=$('#win').textContent;const result=createPreviewResult(kind);
  status('FEATURE PREVIEW · Your balance is unchanged.');
  try{await renderer.spin(result,turbo,layout.reducedMotion.matches,()=>audio.play('stop'));await celebrate(result,true);if(result.totalWin<20)await new Promise<void>(resolve=>setTimeout(resolve,1400));}
  finally{animation.clear();renderer.render(saved,state.bet);$('#win').textContent=savedWin;clearLines();busy=false;previewing=false;updateControls();status('Preview complete. Your balance is unchanged.');$('#spin').focus();}
}
$('#feature-tour').addEventListener('click',showTour);$('#tour-mobile').addEventListener('click',showTour);

window.addEventListener('keydown',e=>{
  const tag=(e.target as HTMLElement)?.tagName;
  if(e.key==='Escape'&&celebrationResolve){celebrationResolve();celebrationResolve=null;return;}
  if(e.code==='Space'&&!e.repeat&&entered&&!modal.open&&!previewing&&!['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag)){e.preventDefault();void spin();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAuto();});
window.addEventListener('pagehide',event=>{stopAuto();if(!event.persisted){renderer.destroy();animation.destroy();bonus.destroy();audio.destroy();layout.destroy();}});

async function preload():Promise<void> {
  await assets.preload(fraction=>{$('#loading-bar').style.width=`${Math.round(fraction*100)}%`;$('#loading-status').textContent=`Lighting up Ocean Drive… ${Math.round(fraction*100)}%`;});
  if(assets.failed.length){$('#loading-status').textContent='Some artwork could not load. Reload to try again.';$('#enter').textContent='RETRY LOADING';$<HTMLButtonElement>('#enter').disabled=false;$('#enter').onclick=()=>location.reload();return;}
  $('#loading-status').textContent='The city is ready. Are you?';$('#loading').classList.add('loading-ready');$<HTMLButtonElement>('#enter').disabled=false;
}
$('#enter').addEventListener('click',()=>{
  if(assets.failed.length)return;
  entered=true;window.scrollTo({top:0,behavior:'instant'});$('#game-shell').inert=false;$('#loading').classList.add('leaving');void audio.unlock();updateSound();audio.play('click');
  setTimeout(()=>{$('#loading').remove();$('#spin').focus({preventScroll:true});},650);
});
updateControls();updateSound();void preload();
