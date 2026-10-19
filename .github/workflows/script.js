(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start');
  const title = document.getElementById('overlay-title');
  const overlayText = document.getElementById('overlay-text');
  const coinsEl = document.getElementById('coins');
  const scoreEl = document.getElementById('score');
  const speedEl = document.getElementById('speed');
  const bestEl = document.getElementById('best');
  const pauseBtn = document.getElementById('pause');

  let W=360,H=560,dpr=1,running=false,paused=false,gameOver=false;
  let lane=1,playerX=0,objects=[],particles=[],distance=0,coins=0,score=0,speed=1,spawnTimer=0,lastTime=0,best=0;
  try { best=Number(localStorage.getItem('humaita1Best')||0); } catch(e) {}
  bestEl.textContent=best;

  function resize(){
    const rect=canvas.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    W=Math.max(280,rect.width); H=Math.max(300,rect.height);
    canvas.width=Math.round(W*dpr); canvas.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw();
  }
  function laneX(l){return W*(0.22+l*0.28)}
  function reset(){
    lane=1;playerX=laneX(lane);objects=[];particles=[];distance=0;coins=0;score=0;speed=1;spawnTimer=.4;gameOver=false;paused=false;
    updateHud();
  }
  function updateHud(){coinsEl.textContent=coins;scoreEl.textContent=score;speedEl.textContent=speed.toFixed(1)+'x';bestEl.textContent=best}
  function start(){
    reset();running=true;overlay.classList.add('hidden');pauseBtn.textContent='Ⅱ PAUSAR';lastTime=performance.now();requestAnimationFrame(loop);
  }
  function end(){
    running=false;gameOver=true;
    if(score>best){best=score;try{localStorage.setItem('humaita1Best',String(best))}catch(e){}}
    updateHud();title.innerHTML='FIM DE<br><span>JOGO!</span>';overlayText.textContent=`Você fez ${score} pontos e pegou ${coins} moedas. Tente de novo para bater seu recorde!`;
    startBtn.textContent='JOGAR DE NOVO ↻';overlay.classList.remove('hidden');
  }
  function move(dir){if(!running||paused)return;lane=Math.max(0,Math.min(2,lane+dir));}
  function togglePause(){
    if(!running&&!paused)return;
    if(!paused){paused=true;running=false;pauseBtn.textContent='▶ CONTINUAR';title.innerHTML='JOGO<br><span>PAUSADO</span>';overlayText.textContent='Respire um pouco. Sua corrida está esperando!';startBtn.textContent='CONTINUAR ▶';overlay.classList.remove('hidden');}
    else {paused=false;running=true;overlay.classList.add('hidden');pauseBtn.textContent='Ⅱ PAUSAR';lastTime=performance.now();requestAnimationFrame(loop);}
  }
  function spawn(){
    const laneIdx=Math.floor(Math.random()*3);
    const isCoin=Math.random()<.57;
    objects.push({lane:laneIdx,y:-30,type:isCoin?'coin':'block',r:isCoin?11:15,spin:Math.random()*6});
    if(Math.random()<.16)objects.push({lane:(laneIdx+1+Math.floor(Math.random()*2))%3,y:-95,type:'coin',r:11,spin:0});
  }
  function glow(color,blur=15){ctx.shadowColor=color;ctx.shadowBlur=blur}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
  function draw(){
    ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#0b1231');bg.addColorStop(1,'#050715');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // stars
    for(let i=0;i<35;i++){let x=(i*71+23)%W,y=(i*127+distance*.25)%H;ctx.fillStyle=i%3===0?'#a855f7':'#5beeff';ctx.globalAlpha=.25+(i%4)*.12;ctx.fillRect(x,y,1.5,1.5)}ctx.globalAlpha=1;
    // futuristic road
    ctx.beginPath();ctx.moveTo(W*.12,0);ctx.lineTo(W*.88,0);ctx.lineTo(W*.99,H);ctx.lineTo(W*.01,H);ctx.closePath();ctx.fillStyle='#0b1230';ctx.fill();
    ctx.strokeStyle='#42f5ff66';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.12,0);ctx.lineTo(W*.01,H);ctx.moveTo(W*.88,0);ctx.lineTo(W*.99,H);ctx.stroke();
    for(let l=1;l<=2;l++){let x=W*(.12+l*.253);ctx.strokeStyle='#8b5cf755';ctx.lineWidth=1.5;ctx.setLineDash([13,13]);ctx.lineDashOffset=-(distance%26);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(W*(.01+l*.326),H);ctx.stroke()}ctx.setLineDash([]);
    // horizon grid
    ctx.strokeStyle='#24356a77';ctx.lineWidth=1;for(let y=(distance*1.2)%34;y<H;y+=34){ctx.beginPath();ctx.moveTo(W*.04,y);ctx.lineTo(W*.96,y);ctx.stroke()}
    // objects
    for(const o of objects){
      const x=laneX(o.lane),y=o.y;
      if(o.type==='coin'){
        glow('#ffd84d',18);ctx.strokeStyle='#ffe889';ctx.lineWidth=3;ctx.fillStyle='#ffbf36';ctx.beginPath();ctx.arc(x,y,o.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
        ctx.fillStyle='#fff4b0';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',x,y+1);
      }else{
        glow('#ff3d87',18);roundRect(x-15,y-15,30,30,6);ctx.fillStyle='#ff367e';ctx.fill();ctx.strokeStyle='#ff9abf';ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;
        ctx.strokeStyle='#64123c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,y-8);ctx.lineTo(x+8,y+8);ctx.moveTo(x+8,y-8);ctx.lineTo(x-8,y+8);ctx.stroke();
      }
    }
    // menino correndo: sombra, tênis, pernas animadas, braços, cabeça e cabelo
    const px=laneX(lane),py=H*.79;
    const runFrame = Math.floor(distance/12)%2;
    glow('#42f5ff',14);ctx.fillStyle='#42f5ff';ctx.beginPath();ctx.ellipse(px,py+24,19,5,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // pernas em movimento
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='#263b8b';ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(px-3,py+5);ctx.lineTo(px+(runFrame?9:-10),py+15);ctx.lineTo(px+(runFrame?16:-5),py+21);ctx.stroke();
    ctx.beginPath();ctx.moveTo(px+3,py+5);ctx.lineTo(px+(runFrame?-9:10),py+15);ctx.lineTo(px+(runFrame?-5:16),py+21);ctx.stroke();
    ctx.strokeStyle='#d9f7ff';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(px+(runFrame?11:-8),py+21);ctx.lineTo(px+(runFrame?17:-2),py+21);ctx.stroke();
    ctx.beginPath();ctx.moveTo(px+(runFrame?-3:15),py+21);ctx.lineTo(px+(runFrame?3:20),py+21);ctx.stroke();
    // tronco com camiseta neon
    glow('#a855f7',12);ctx.fillStyle='#a855f7';roundRect(px-10,py-13,20,23,6);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle='#42f5ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-2,py-8);ctx.lineTo(px+3,py+3);ctx.stroke();
    // braços balançando
    ctx.strokeStyle='#f2b58b';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(px-8,py-8);ctx.lineTo(px+(runFrame?-15:-13),py+1);ctx.lineTo(px+(runFrame?-10:-18),py+5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(px+8,py-8);ctx.lineTo(px+(runFrame?13:15),py+1);ctx.lineTo(px+(runFrame?18:10),py+5);ctx.stroke();
    // cabeça e cabelo
    ctx.fillStyle='#f2b58b';ctx.beginPath();ctx.arc(px,py-22,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#20152f';ctx.beginPath();ctx.arc(px-1,py-25,10,Math.PI,Math.PI*2);ctx.lineTo(px+8,py-21);ctx.lineTo(px+3,py-23);ctx.lineTo(px-3,py-20);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(px+4,py-22,1.5,0,Math.PI*2);ctx.fill();
    // bottom line
    ctx.fillStyle='#42f5ff';ctx.globalAlpha=.7;ctx.fillRect(W*.08,H-5,W*.84,2);ctx.globalAlpha=1;
  }
  function loop(now){
    if(!running)return;
    const dt=Math.min((now-lastTime)/1000,.035);lastTime=now;
    distance+=dt*100*speed;speed=Math.min(2.6,1+score/850);
    spawnTimer-=dt;
    if(spawnTimer<=0){spawn();spawnTimer=Math.max(.42,1.0/speed+(Math.random()*.35-.1));}
    for(let i=objects.length-1;i>=0;i--){
      const o=objects[i];o.y+=dt*(210*speed);o.spin+=dt*4;
      if(o.y>H+40){objects.splice(i,1);continue}
      const playerY=H*.79;
      if(Math.abs(o.y-playerY)<24&&o.lane===lane){
        if(o.type==='coin'){coins++;score+=10;objects.splice(i,1);for(let p=0;p<8;p++)particles.push({x:laneX(lane),y:o.y,vx:(Math.random()-.5)*100,vy:(Math.random()-.5)*100,life:.35})}
        else {end();return}
      }
    }
    for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)particles.splice(i,1);else{ctx.globalAlpha=Math.max(0,p.life/.35);ctx.fillStyle='#ffe889';ctx.fillRect(p.x,p.y,3,3);ctx.globalAlpha=1}}
    score+=Math.floor(dt*speed*2);updateHud();draw();requestAnimationFrame(loop);
  }
  startBtn.addEventListener('click',()=>{if(paused)togglePause();else start()});
  document.getElementById('left').addEventListener('click',()=>move(-1));
  document.getElementById('right').addEventListener('click',()=>move(1));
  pauseBtn.addEventListener('click',togglePause);
  canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingClientRect();move(e.clientX-r.left<r.width/2?-1:1)});
  window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')move(-1);if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')move(1);if(e.code==='Space'){e.preventDefault();togglePause()}});
  window.addEventListener('resize',resize);
  resize();
})();