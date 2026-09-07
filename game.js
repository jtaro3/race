const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s); const keys={};
let state='menu',startAt=0,last=performance.now(),countValue=3,sound=true;
const player={angle:0,speed:0,lateral:0,lap:1,progress:0,best:null,lapStart:0,boost:0};
const rivals=Array.from({length:5},(_,i)=>({progress:.04+i*.105,speed:118+i*7,lane:(i%3-1)*.26,color:['#ff2d8d','#ffd83d','#21e6ff','#8e61ff','#ff713d'][i]}));
const boosts=[.17,.48,.79],boostArmed=boosts.map(()=>true);
function resize(){const d=Math.min(devicePixelRatio,2),r=canvas.getBoundingClientRect();canvas.width=r.width*d;canvas.height=r.height*d;ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys[e.key.toLowerCase()]=true});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key.toLowerCase();b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true;b.setPointerCapture(e.pointerId)});b.addEventListener('pointerup',()=>keys[k]=false);b.addEventListener('pointercancel',()=>keys[k]=false)});
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').textContent=`SOUND ${sound?'ON':'OFF'}`};
$('#startBtn').onclick=startRace;$('#restartBtn').onclick=startRace;
function beep(freq,d=.08){if(!sound)return;const a=beep.a||(beep.a=new AudioContext),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;o.type='square';g.gain.setValueAtTime(.04,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}
function startRace(){Object.assign(player,{speed:0,lateral:0,lap:1,progress:0,best:null,lapStart:0,boost:0});boostArmed.fill(true);rivals.forEach((r,i)=>r.progress=.04+i*.105);$('#startScreen').classList.remove('show');$('#finishScreen').classList.remove('show');state='countdown';countValue=3;startAt=performance.now();showCount('3');beep(220)}
function showCount(t){const el=$('#countdown');el.textContent=t;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
function format(ms){const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,x=Math.floor(ms%1000);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(x).padStart(3,'0')}`}
function update(dt,now){
 if(state==='countdown'){const elapsed=(now-startAt)/1000,newCount=3-Math.floor(elapsed);if(newCount!==countValue&&newCount>0){countValue=newCount;showCount(String(newCount));beep(260+(3-newCount)*110)}if(elapsed>=3){showCount('GO!');beep(660,.16);state='race';startAt=now;player.lapStart=now}return}
 if(state!=='race')return;
 const up=keys.arrowup||keys.w,down=keys.arrowdown||keys.s,left=keys.arrowleft||keys.a,right=keys.arrowright||keys.d;
 if(up)player.speed+=105*dt;else player.speed-=37*dt;if(down)player.speed-=150*dt;
 const off=Math.abs(player.lateral)>.72;player.speed=Math.max(0,Math.min(player.boost>0?250:205,player.speed-(off?72*dt:0)));player.boost=Math.max(0,player.boost-dt);
 const steer=(right?1:0)-(left?1:0);player.lateral+=steer*dt*(.7+player.speed/180);player.lateral*=Math.pow(.93,dt*60);player.lateral=Math.max(-1.2,Math.min(1.2,player.lateral));
 const prev=player.progress;player.progress=(player.progress+player.speed*dt/6500)%1;
 boosts.forEach((b,i)=>{let d=Math.abs(player.progress-b);if(d>.5)d=1-d;if(d>.04){boostArmed[i]=true;return}if(d<.028&&Math.abs(player.lateral)<.52&&boostArmed[i]){boostArmed[i]=false;player.boost=1.5;player.speed=Math.max(player.speed,230);beep(880,.12)}});
 if(player.progress<prev){const lapTime=now-player.lapStart;player.best=player.best?Math.min(player.best,lapTime):lapTime;player.lapStart=now;if(player.lap>=3){finish(now);return}player.lap++}
 rivals.forEach((r,i)=>{r.speed=132+i*4+Math.sin(now/800+i)*7;r.progress=(r.progress+r.speed*dt/6500)%1});
 let ahead=0;rivals.forEach(r=>{let d=(r.progress-player.progress+1)%1;if(d<.88)ahead++});$('#position').textContent=Math.min(6,ahead+1);$('#lap').textContent=player.lap;$('#speed').textContent=String(Math.round(player.speed)).padStart(3,'0');$('#raceTime').textContent=format(now-startAt);$('#bestLap').textContent=player.best?format(player.best):'--:--.---';
}
function finish(now){state='finish';const pos=$('#position').textContent,suffix=pos==='1'?'ST':pos==='2'?'ND':pos==='3'?'RD':'TH';$('#finishPlace').textContent=pos+suffix;$('#finalTime').textContent=format(now-startAt);setTimeout(()=>$('#finishScreen').classList.add('show'),400);beep(520,.25)}
function roadX(y,w,h){const horizon=h*.34,t=(y-horizon)/(h-horizon),curve=Math.sin(player.progress*Math.PI*2+1.1)*w*.12*(1-t)+Math.sin(player.progress*Math.PI*4)*w*.035;return w/2+curve-player.lateral*w*.18*t}
function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
 const g=ctx.createLinearGradient(0,0,0,h*.55);g.addColorStop(0,'#071023');g.addColorStop(1,'#301143');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 // skyline
 ctx.fillStyle='#080c18';for(let i=0;i<36;i++){const x=i*w/35,bh=18+((i*37)%90);ctx.fillRect(x,h*.34-bh,w/34+2,bh);if(i%2===0){ctx.fillStyle=i%4?'#21e6ff55':'#ff2d8d55';ctx.fillRect(x+4,h*.34-bh+8,2,Math.max(4,bh-15));ctx.fillStyle='#080c18'}}
 ctx.fillStyle='#101526';ctx.fillRect(0,h*.34,w,h*.66);
 const slices=70,hz=h*.34;for(let i=0;i<slices;i++){const t=i/slices,t2=(i+1)/slices,y=hz+(h-hz)*t,y2=hz+(h-hz)*t2,half=w*(.035+.53*t),half2=w*(.035+.53*t2),x=roadX(y,w,h),x2=roadX(y2,w,h);ctx.beginPath();ctx.moveTo(x-half,y);ctx.lineTo(x+half,y);ctx.lineTo(x2+half2,y2);ctx.lineTo(x2-half2,y2);ctx.fillStyle=(i+Math.floor(player.progress*800))%8<4?'#252a35':'#20242e';ctx.fill();if(i%7<3){ctx.strokeStyle='#dce6ff44';ctx.lineWidth=Math.max(1,8*t);for(const lane of [-.34,.34]){ctx.beginPath();ctx.moveTo(x+half*lane,y);ctx.lineTo(x2+half2*lane,y2);ctx.stroke()}}}
 // neon edges
 for(const side of [-1,1]){ctx.beginPath();for(let i=0;i<=30;i++){const t=i/30,y=hz+(h-hz)*t,half=w*(.035+.53*t),x=roadX(y,w,h)+half*side;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=side<0?'#ff2d8d':'#21e6ff';ctx.lineWidth=4;ctx.shadowBlur=18;ctx.shadowColor=ctx.strokeStyle;ctx.stroke();ctx.shadowBlur=0}
 // boost pads
 boosts.forEach(b=>{let d=(b-player.progress+1)%1;if(d<.22){const t=1-Math.pow(d/.22,.55),y=hz+(h-hz)*t,x=roadX(y,w,h),ww=w*(.035+.53*t)*.46,hh=8+17*t,color='#ffe45c';ctx.fillStyle='#111321';ctx.fillRect(x-ww/2-3,y-hh/2-3,ww+6,hh+6);ctx.fillStyle=color;ctx.shadowBlur=22;ctx.shadowColor=color;ctx.fillRect(x-ww/2,y-hh/2,ww,hh);ctx.fillStyle='#ffffff';for(let stripe=-.38;stripe<=.38;stripe+=.38)ctx.fillRect(x+ww*stripe-ww*.055,y-hh/2,ww*.11,hh);ctx.shadowBlur=0}});
 // rivals
 rivals.forEach(r=>{let d=(r.progress-player.progress+1)%1;if(d>.015&&d<.32){const t=1-Math.pow(d/.32,.55),y=hz+(h-hz)*t,half=w*(.035+.53*t),x=roadX(y,w,h)+half*r.lane,sz=10+38*t;drawKart(x,y,sz,r.color,false)}});
 drawKart(w/2+player.lateral*w*.06,h*.82,52,'#caff3d',true);if(player.boost>0)drawBoostStatus(w,h);drawMiniMap(w,h);drawParticles(w,h);
}
function trackPoint(progress,cx,cy,scale){const a=progress*Math.PI*2-Math.PI/2,r=1+.13*Math.sin(a*3)-.07*Math.cos(a*2);return{x:cx+Math.cos(a)*scale*r,y:cy+Math.sin(a)*scale*.62*r}}
function drawMiniMap(w,h){
 const size=Math.min(166,w*.19),mobile=w<720,x=w-size-18,y=mobile?h*.43:h-size-18,cx=x+size/2,cy=y+size/2;
 ctx.save();
 ctx.fillStyle='#07101ddd';ctx.strokeStyle='#526078';ctx.lineWidth=1;ctx.fillRect(x,y,size,size);ctx.strokeRect(x+.5,y+.5,size-1,size-1);
 ctx.fillStyle='#9ba8be';ctx.font='700 9px Inter, sans-serif';ctx.letterSpacing='1px';ctx.fillText('TRACK MAP',x+11,y+17);
 ctx.beginPath();for(let i=0;i<=96;i++){const p=trackPoint(i/96,cx,cy,size*.34);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.closePath();ctx.strokeStyle='#111827';ctx.lineWidth=size*.115;ctx.stroke();
 ctx.beginPath();for(let i=0;i<=96;i++){const p=trackPoint(i/96,cx,cy,size*.34);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.closePath();ctx.strokeStyle='#73809a';ctx.lineWidth=size*.037;ctx.stroke();
 const boostColor='#ffe45c';boosts.forEach(p=>{const b=trackPoint(p,cx,cy,size*.34);ctx.fillStyle=boostColor;ctx.shadowBlur=10;ctx.shadowColor=boostColor;ctx.beginPath();ctx.arc(b.x,b.y,size*.032,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0});
 rivals.forEach(r=>{const k=trackPoint(r.progress,cx,cy,size*.34);ctx.fillStyle=r.color;ctx.beginPath();ctx.arc(k.x,k.y,size*.027,0,Math.PI*2);ctx.fill()});
 const me=trackPoint(player.progress,cx,cy,size*.34),ahead=trackPoint((player.progress+.012)%1,cx,cy,size*.34),angle=Math.atan2(ahead.y-me.y,ahead.x-me.x),playerColor='#f7ffce';ctx.translate(me.x,me.y);ctx.rotate(angle);ctx.fillStyle=playerColor;ctx.shadowBlur=12;ctx.shadowColor=playerColor;ctx.beginPath();ctx.moveTo(size*.06,0);ctx.lineTo(-size*.037,-size*.035);ctx.lineTo(-size*.02,0);ctx.lineTo(-size*.037,size*.035);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
 ctx.restore();
}
function drawBoostStatus(w,h){ctx.save();ctx.textAlign='center';ctx.font=`italic 800 ${Math.max(16,w*.022)}px "Barlow Condensed", sans-serif`;ctx.fillStyle='#ff354d';ctx.shadowBlur=18;ctx.shadowColor='#ff354d';ctx.fillText('BOOST ACTIVE',w/2,h*.64);ctx.restore()}
function drawKart(x,y,s,c,hero){ctx.save();ctx.translate(x,y);if(hero&&player.speed>20){const boosted=player.boost>0,flame=boosted?1.65:1,flameColor=boosted?'#ff354d':'#21e6ff99';ctx.fillStyle=flameColor;ctx.shadowBlur=boosted?24:0;ctx.shadowColor=flameColor;ctx.beginPath();ctx.moveTo(-s*.18,s*.35);ctx.lineTo(0,s*(.8+Math.random()*.35)*flame);ctx.lineTo(s*.18,s*.35);ctx.fill();if(boosted){ctx.fillStyle='#ffd35a';ctx.beginPath();ctx.moveTo(-s*.08,s*.35);ctx.lineTo(0,s*(.72+Math.random()*.18)*flame);ctx.lineTo(s*.08,s*.35);ctx.fill()}ctx.shadowBlur=0}ctx.shadowBlur=hero?22:8;ctx.shadowColor=c;ctx.fillStyle='#090b10';ctx.fillRect(-s*.55,-s*.05,s*.18,s*.55);ctx.fillRect(s*.37,-s*.05,s*.18,s*.55);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-s*.42,s*.32);ctx.lineTo(-s*.28,-s*.22);ctx.lineTo(0,-s*.42);ctx.lineTo(s*.28,-s*.22);ctx.lineTo(s*.42,s*.32);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#101724';ctx.fillRect(-s*.18,-s*.2,s*.36,s*.35);ctx.fillStyle='#fff';ctx.fillRect(-s*.06,-s*.06,s*.12,s*.12);ctx.restore()}
function drawParticles(w,h){const motion=player.speed/210;ctx.strokeStyle='#dbe9ff44';ctx.lineWidth=1;for(let i=0;i<28;i++){const seed=(i*83+Math.floor(performance.now()*.04*motion))%997,x=(seed*17)%w,y=h*.35+(seed*11)%(h*.65);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-w/2)*.018*motion,y+10+30*motion);ctx.stroke()}}
function loop(now){const dt=Math.min(.035,(now-last)/1000);last=now;update(dt,now);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
