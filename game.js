(() => {
  const $ = id => document.getElementById(id);
  const canvas = $('gameCanvas'), ctx = canvas.getContext('2d');
  const overlay = $('overlay'), title = $('dialogTitle'), text = $('dialogText');
  const primary = $('dialogPrimary'), secondary = $('dialogSecondary'), input = $('pilotName');
  const modalBackdrop = $('modalBackdrop');
  let W=800,H=450, running=false, paused=false, over=false, last=0, elapsed=0, score=0, stage=1, ammo=40, health=100, losses=0, shots=0, lastHit=0, spawnClock=0, skyClock=0;
  let pilot=localStorage.getItem('redsky-pilot')||'', enemies=[], bullets=[], supplies=[], particles=[], ship={x:0,y:0}, keys={}, joystick={x:0,y:0}, firing=false, adTimer=0, lastAdAt=0, hitFlash=0;
  const highKey='redsky-highscore', scoresKey='redsky-scores';
  let high=Number(localStorage.getItem(highKey)||0);
  const rand=(a,b)=>Math.random()*(b-a)+a;
  function resize(){const r=canvas.getBoundingClientRect(); const d=Math.min(devicePixelRatio||1,2); W=Math.max(1,r.width);H=Math.max(1,r.height);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);}
  new ResizeObserver(resize).observe(canvas); resize();
  function showDialog(head,body,button='START MISSION',second=''){overlay.classList.remove('hidden');$('dialogEyebrow').textContent='PILOT BRIEFING';title.textContent=head;text.textContent=body;primary.textContent=button;secondary.classList.toggle('hidden',!second);secondary.textContent=second;input.classList.toggle('hidden',!!pilot);input.value=pilot;}
  function hideDialog(){overlay.classList.add('hidden');}
  function newRun(){score=0;stage=1;ammo=40;health=100;elapsed=0;spawnClock=0;enemies=[];bullets=[];supplies=[];particles=[];ship={x:0,y:0};over=false;paused=false;running=true;last=performance.now();updateHud();hideDialog();$('alert').textContent='MISSION IN PROGRESS';requestAnimationFrame(loop);}
  function updateHud(){$('score').textContent=score;$('stage').textContent=stage;$('ammo').textContent=ammo;$('healthBar').style.width=health+'%';}
  function spawnEnemy(){const lane=rand(-.42,.42);enemies.push({x:W*(.5+lane),y:rand(H*.08,H*.3),z:rand(.25,.55),hp:1,drift:rand(-.25,.25),phase:rand(0,7),kind:Math.random()<.13?'ace':'fighter'});}
  function spawnSupply(){supplies.push({x:rand(W*.2,W*.8),y:-10,type:Math.random()<.5?'ammo':'health',speed:rand(30,55)});}
  function fire(){if(!running||paused||over)return;if(ammo<=0){flash('OUT OF AMMO — FIND A SUPPLY');return;}ammo--;shots++;bullets.push({x:W/2+ship.x*W*.22,y:H*.44,r:3,speed:480});updateHud();}
  function flash(s){$('alert').textContent=s;clearTimeout(flash.timer);flash.timer=setTimeout(()=>$('alert').textContent=running?'MISSION IN PROGRESS':'MISSION READY',1600);}
  function addExplosion(x,y,color='#ff7b35'){for(let i=0;i<18;i++)particles.push({x,y,vx:rand(-100,100),vy:rand(-100,100),life:rand(.25,.7),max:.7,color,r:rand(1,4)});}
  function gameOver(reason){if(over)return;over=true;running=false;losses++;localStorage.setItem(highKey,String(Math.max(high,score)));high=Math.max(high,score);saveScore();updateHud();$('alert').textContent='MISSION FAILED';showDialog('AIRCRAFT LOST',`${reason} Final score: ${score}. Personal best: ${high}.`, 'RESTART MISSION','LEADERBOARD');}
  function saveScore(){let list=[];try{list=JSON.parse(localStorage.getItem(scoresKey)||'[]')}catch{}list.push({name:pilot||'Pilot',score,when:Date.now()});list.sort((a,b)=>b.score-a.score);localStorage.setItem(scoresKey,JSON.stringify(list.slice(0,10)));}
  function openLeaderboard(){let list=[];try{list=JSON.parse(localStorage.getItem(scoresKey)||'[]')}catch{}const rows=$('leaderboardRows');rows.innerHTML='';if(!list.length){rows.innerHTML='<p style="color:#9aa9bc;font-size:12px">No scores yet. Fly a mission to create your first record.</p>'}else list.forEach((r,i)=>{const el=document.createElement('div');el.className='rank-row';const name=document.createElement('span');name.textContent=`${i+1}. ${r.name}`;const pts=document.createElement('span');pts.textContent=r.score;el.append(name,pts);rows.append(el)});$('modalTitle').textContent='LEADERBOARD';modalBackdrop.classList.remove('hidden');}
  function pauseGame(){if(!running||over)return;paused=true;running=false;showDialog('MISSION PAUSED','Your mission is paused. Resume when ready.','RESUME','EXIT MISSION');}
  function drawScene(dt){
    const horizon=H*.58 + Math.sin(elapsed*.07)*H*.015;
    let grad=ctx.createLinearGradient(0,0,0,horizon);const phase=(Math.sin(skyClock*.035)+1)/2;
    grad.addColorStop(0,phase>.72?'#f29a72':'#2771b6');grad.addColorStop(.6,phase>.72?'#f9bd8b':'#8bc8ee');grad.addColorStop(1,'#e8e9dd');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    // Sun and layered clouds
    const sunX=W*(.72+Math.sin(elapsed*.025)*.08),sunY=H*.19;
    const sg=ctx.createRadialGradient(sunX,sunY,3,sunX,sunY,H*.18);sg.addColorStop(0,'#fff8c8aa');sg.addColorStop(1,'#fff5d000');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H*.6);
    for(let i=0;i<15;i++){const x=((i*137+elapsed*(8+i%4)*dt*3)% (W+180))-80;const y=H*(.08+(i%5)*.075);ctx.fillStyle=`rgba(255,255,255,${.13+(i%3)*.06})`;ctx.beginPath();ctx.ellipse(x,y,35+(i%4)*12,7+(i%3)*5,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#1d668d';ctx.beginPath();ctx.moveTo(0,horizon);ctx.lineTo(W,horizon);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    for(let i=0;i<24;i++){let y=horizon+((i*23+elapsed*55)%(H-horizon));let spread=(y-horizon)/(H-horizon);ctx.strokeStyle=`rgba(210,239,255,${.06+spread*.2})`;ctx.lineWidth=1+spread*2;ctx.beginPath();ctx.moveTo(W*.5+(i%2?1:-1)*spread*W*.5,y);ctx.lineTo(W*.5+(i%2?1:-1)*spread*W*.8,y+2);ctx.stroke();}
    // distant ship appears as mission progresses
    if(elapsed>20){const sx=W*.68,sy=horizon+H*.11;ctx.fillStyle='#34434d';ctx.fillRect(sx-W*.09,sy,W*.18,H*.025);ctx.fillStyle='#667783';ctx.fillRect(sx-W*.04,sy-H*.035,W*.08,H*.035);ctx.fillRect(sx-W*.01,sy-H*.06,W*.02,H*.025);ctx.strokeStyle='#b4c4cd';ctx.beginPath();ctx.moveTo(sx,sy-H*.06);ctx.lineTo(sx,sy-H*.105);ctx.stroke();}
    // faint atmospheric horizon shift
    if(phase>.75){ctx.fillStyle='#e85c4080';ctx.fillRect(0,horizon-3,W,5);}
    // cockpit framing, lower instrument panel and nose
    ctx.fillStyle='#0b1119';ctx.beginPath();ctx.moveTo(0,H);ctx.lineTo(0,H*.89);ctx.lineTo(W*.16,H*.91);ctx.lineTo(W*.34,H*.84);ctx.lineTo(W*.44,H*.76);ctx.lineTo(W*.56,H*.76);ctx.lineTo(W*.66,H*.84);ctx.lineTo(W*.84,H*.91);ctx.lineTo(W,H*.89);ctx.lineTo(W,H);ctx.fill();
    let nose=ctx.createLinearGradient(W*.3,H*.8,W*.7,H);nose.addColorStop(0,'#293643');nose.addColorStop(.35,'#788895');nose.addColorStop(.52,'#3b4b59');nose.addColorStop(1,'#1b2732');
    ctx.fillStyle=nose;ctx.beginPath();ctx.moveTo(W*.44,H*.74);ctx.lineTo(W*.56,H*.74);ctx.lineTo(W*.69,H);ctx.lineTo(W*.31,H);ctx.closePath();ctx.fill();ctx.strokeStyle='#a6b8c7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.44,H*.74);ctx.lineTo(W*.31,H);ctx.moveTo(W*.56,H*.74);ctx.lineTo(W*.69,H);ctx.stroke();
    ctx.fillStyle='#17232f';ctx.fillRect(W*.48,H*.82,W*.04,H*.18);ctx.fillStyle='#b8c8d2';ctx.fillRect(W*.495,H*.82,W*.01,H*.18);
    if(hitFlash>0){ctx.fillStyle=`rgba(255,20,20,${hitFlash*.22})`;ctx.fillRect(0,0,W,H);hitFlash-=dt;}
  }
  function drawEnemy(e){const scale=1.2-e.z;const x=e.x,y=e.y;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(Math.sin(e.phase+elapsed)*.1);ctx.fillStyle=e.kind==='ace'?'#b5b8ba':'#303b48';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(8,-3);ctx.lineTo(30,8);ctx.lineTo(8,7);ctx.lineTo(4,20);ctx.lineTo(0,14);ctx.lineTo(-4,20);ctx.lineTo(-8,7);ctx.lineTo(-30,8);ctx.lineTo(-8,-3);ctx.closePath();ctx.fill();ctx.strokeStyle='#aab8c2';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#e7f4ff';ctx.fillRect(-2,-8,4,5);ctx.restore();}
  function loop(now){if(!running)return;const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;skyClock+=dt;spawnClock+=dt;
    if(elapsed>0&&Math.floor(elapsed/35)+1>stage){stage=Math.floor(elapsed/35)+1;flash('STAGE '+stage+' — ENEMY WAVE');}
    drawScene(dt);
    if(spawnClock>Math.max(.65,1.6-stage*.06)){spawnClock=0;for(let i=0;i<3;i++)spawnEnemy();if(Math.random()<.38)spawnSupply();}
    enemies.forEach((e)=>{e.y+=(45+stage*4)*dt*(.6+e.z);e.x+=Math.sin(elapsed*1.2+e.phase)*e.drift*30*dt;drawEnemy(e);if(e.y>H*.73&&Math.abs(e.x-(W/2+ship.x*W*.22))<W*.12&&now-lastHit>700){health-=12;lastHit=now;hitFlash=.8;addExplosion(e.x,e.y,'#ff4141');e.y=H+100;updateHud();}});
    enemies=enemies.filter(e=>e.y<H*.82);
    bullets.forEach(b=>{b.y-=b.speed*dt;ctx.fillStyle='#fff6a4';ctx.shadowColor='#ff9b33';ctx.shadowBlur=10;ctx.fillRect(b.x-2,b.y,4,13);ctx.shadowBlur=0;for(const e of enemies){if(!e.dead&&Math.abs(b.x-e.x)<(12+(1-e.z)*15)&&Math.abs(b.y-e.y)<20){e.dead=true;score+=e.kind==='ace'?30:10;addExplosion(e.x,e.y);updateHud();b.y=-100;}}});
    bullets=bullets.filter(b=>b.y>-30);enemies=enemies.filter(e=>!e.dead);
    supplies.forEach(s=>{s.y+=s.speed*dt;ctx.fillStyle=s.type==='ammo'?'#ffd66e':'#68f2a0';ctx.beginPath();ctx.arc(s.x,s.y,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#10202a';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(s.type==='ammo'?'A':'+',s.x,s.y+4);if(s.y>H*.7&&Math.abs(s.x-(W/2+ship.x*W*.22))<45){if(s.type==='ammo'){ammo=Math.min(80,ammo+20);flash('AMMO RESTORED')}else{health=Math.min(100,health+28);flash('HEALTH RESTORED')}s.y=H+100;updateHud();}});
    supplies=supplies.filter(s=>s.y<H+10);
    particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});particles=particles.filter(p=>p.life>0);
    // Aim position reacts to joystick and keyboard.
    if(joystick.x||joystick.y){ship.x=Math.max(-1,Math.min(1,ship.x+joystick.x*dt*1.6));}
    if(keys.ArrowLeft||keys.a)ship.x=Math.max(-1,ship.x-dt*1.3);if(keys.ArrowRight||keys.d)ship.x=Math.min(1,ship.x+dt*1.3);
    if(keys.ArrowUp||keys.w)ship.y=Math.max(-1,ship.y-dt);if(keys.ArrowDown||keys.s)ship.y=Math.min(1,ship.y+dt);
    if(firing&&now-(loop.lastShot||0)>180){loop.lastShot=now;fire();}
    if(health<=0){gameOver('Your aircraft took too much damage.');return;}
    if(ammo===0&&Math.floor(elapsed)%7===0){} // Ammo pickup remains available in the scene.
    updateHud();requestAnimationFrame(loop);
  }
  primary.addEventListener('click',()=>{if(paused){paused=false;running=true;hideDialog();last=performance.now();requestAnimationFrame(loop);return;}if(over){newRun();return;}if(!pilot){pilot=input.value.trim()||'Rookie Pilot';localStorage.setItem('redsky-pilot',pilot);}newRun();});
  secondary.addEventListener('click',()=>{if(over){openLeaderboard();}else{paused=false;running=false;over=true;showDialog('MISSION EXITED','Your run has ended. Your best score is saved in this browser.','START MISSION');}});
  $('playNow').addEventListener('click',()=>{document.querySelector('#game').scrollIntoView({behavior:'smooth'});if(!running&&!over)showDialog('READY FOR TAKEOFF?','Enter a nickname (not your real name) and launch your mission.');});
  $('howToPlay').addEventListener('click',()=>{document.querySelector('#controls').scrollIntoView({behavior:'smooth'});});
  $('pause').addEventListener('click',pauseGame);$('leaderboard').addEventListener('click',openLeaderboard);$('leaderboardTop').addEventListener('click',openLeaderboard);
  $('modalClose').addEventListener('click',()=>modalBackdrop.classList.add('hidden'));$('modalOk').addEventListener('click',()=>modalBackdrop.classList.add('hidden'));modalBackdrop.addEventListener('click',e=>{if(e.target===modalBackdrop)modalBackdrop.classList.add('hidden')});
  $('fire').addEventListener('pointerdown',e=>{e.preventDefault();firing=true;fire();});['pointerup','pointercancel','pointerleave'].forEach(ev=>$('fire').addEventListener(ev,()=>firing=false));
  window.addEventListener('keydown',e=>{keys[e.key]=true;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(e.key===' '){fire();}if(e.key.toLowerCase()==='p')pauseGame();});window.addEventListener('keyup',e=>keys[e.key]=false);
  const joy=$('joystick'),knob=$('joyKnob');let joyActive=false;
  function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.29;const len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}joystick.x=dx/max;joystick.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`;}
  joy.addEventListener('pointerdown',e=>{joyActive=true;joy.setPointerCapture(e.pointerId);joyMove(e)});joy.addEventListener('pointermove',e=>{if(joyActive)joyMove(e)});function joyEnd(){joyActive=false;joystick.x=joystick.y=0;knob.style.transform='translate(0,0)'}joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
  window.addEventListener('beforeunload',()=>{if(score>high)localStorage.setItem(highKey,String(score));});
  // Demo ad flow: after three losses, show a clearly labelled simulated ad screen; no real ad is served.
  const originalGameOver=gameOver;
  gameOver=function(reason){originalGameOver(reason);if(losses%3===0){$('dialogEyebrow').textContent='DEMO AD PLACEMENT';title.textContent='SPONSORED BREAK (DEMO)';text.textContent='This is a simulated ad placeholder for manual testing. No advertisement is being served.';primary.textContent='CONTINUE TO RESTART';secondary.classList.remove('hidden');secondary.textContent='CLOSE';}};
  // Watch-ad test entry: game-over screen's primary restarts; the secondary button exposes leaderboard after loss.
  // The placeholder is intentionally labelled to avoid misrepresenting ad-network integration.
  showDialog('READY FOR TAKEOFF?','Enter a nickname (not your real name) and launch your mission.','START MISSION');
})();