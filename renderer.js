/* Continuous character rig: all parts share a stable foot anchor. */
globalThis.LumiRenderer = class {
  constructor(canvas) {
    this.c=canvas.getContext('2d');this.canvas=canvas;this.camera=0;this.fx=[];
    this.art=new Image();
    this.art.onload=()=>{const b=document.createElement('canvas');b.width=1200;b.height=400;const c=b.getContext('2d');c.filter='blur(2px)';c.drawImage(this.art,0,0,this.art.naturalWidth,this.art.naturalHeight*.48,0,0,1200,400);this.backdrop=b;};
    this.art.src='forest-art.png';
  }
  burst(e) {for(let i=0;i<(e.type==='star'?18:5);i++) this.fx.push({x:e.x,y:e.y,vx:(Math.random()-.5)*130,vy:-30-Math.random()*120,life:.7,color:e.secret?'#dfa0ff':'#ffe9a1'});}
  ellipse(x,y,rx,ry,color) {const c=this.c;c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  path(points,color) {const c=this.c;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  star(x,y,r,color) {const c=this.c;c.save();c.translate(x,y);const p=[];for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,k=i%2?r*.44:r;p.push([Math.cos(a)*k,Math.sin(a)*k]);}this.path(p,color);c.restore();}
  terrain(s,stage) {
    const c=this.c;
    if(s.x+s.w<this.camera-80||s.x>this.camera+1040)return;
    if(s.bridge) {
      c.fillStyle='#705448';c.fillRect(s.x,s.y,s.w,s.h);
      for(let x=s.x;x<s.x+s.w;x+=30){c.fillStyle='#bd956d';c.fillRect(x+1,s.y,27,5);c.strokeStyle='#352d40';c.beginPath();c.moveTo(x,s.y);c.lineTo(x+2,s.y+s.h);c.stroke();}
      c.strokeStyle='#8a6c5c';c.lineWidth=3;c.beginPath();c.moveTo(s.x,s.y-35);c.quadraticCurveTo(s.x+s.w/2,s.y-5,s.x+s.w,s.y-35);c.stroke();
      for(let x=s.x;x<=s.x+s.w;x+=100){c.fillStyle='#796250';c.fillRect(x,s.y-37,7,37);}
      return;
    }
    const gradient=c.createLinearGradient(0,s.y,0,s.y+s.h);gradient.addColorStop(0,'#42475f');gradient.addColorStop(1,'#171d35');
    c.fillStyle=gradient;c.beginPath();c.roundRect(s.x,s.y,s.w,s.h,Math.min(8,s.h/3));c.fill();
    c.strokeStyle='#626177';c.lineWidth=1;
    for(let x=s.x+12;x<s.x+s.w;x+=28){c.beginPath();c.moveTo(x,s.y+8);c.lineTo(x+8,s.y+19);c.lineTo(x-2,s.y+s.h);c.stroke();}
    c.fillStyle=stage>1?'#82aa7a':'#62857c';c.fillRect(s.x,s.y,s.w,5);
    for(let x=s.x+8;x<s.x+s.w-3;x+=17){this.ellipse(x,s.y+3,10,4,stage>1?'#739967':'#4d796c');c.strokeStyle='#88b395';c.beginPath();c.moveTo(x,s.y);c.lineTo(x+3,s.y-5);c.stroke();if((Math.floor(x)%3)===0)this.ellipse(x+3,s.y-5,2,2,stage>1?'#ffdb8e':'#9aa9d2');}
  }
  mushroom(x,y,t,stage) {
    const c=this.c;c.save();c.shadowColor='#c98aff';c.shadowBlur=stage?12:0;
    c.fillStyle='#b9a6cd';c.fillRect(x-3,y-17,6,17);
    this.ellipse(x,y-18,13,8,stage?'#d899f7':'#7474a3');
    this.ellipse(x-5,y-20,2,2,'#f6dafa');this.ellipse(x+4,y-18,2,2,'#f6dafa');c.restore();
  }
  cat(p,t,won,reduced) {
    const c=this.c, speed=Math.min(1,Math.abs(p.vx)/280), stride=p.stride;
    const grounded=p.grounded, land=p.land/.12;
    const gait=grounded&&!reduced?Math.sin(stride)*speed:0;
    const breath=reduced?0:Math.sin(t*2.8)*.5;
    const airborne=!grounded;
    c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.facing,1);
    // Feet remain anchored at the contact surface; only the torso compresses on landing.
    const bob=grounded?-Math.abs(gait)*2:0;
    c.save();c.translate(0,bob+land*3);
    c.strokeStyle='#121a2d';c.lineWidth=8;c.lineCap='round';
    c.beginPath();c.moveTo(-11,-18);c.bezierCurveTo(-39,-16,-37,-38+(reduced?0:Math.sin(t*4)*3),-29,-38);c.stroke();
    c.strokeStyle='#41527b';c.lineWidth=1.6;c.stroke();
    this.ellipse(-4,-24+breath,17,23-land*3,'#1a2235');
    this.ellipse(-8,-24,9,16,'#25314b');
    const leg=(x,phase,far)=>{const swing=airborne?(p.vy<0?-7:5):Math.sin(stride+phase)*speed*6;c.strokeStyle=far?'#131b2c':'#242e44';c.lineWidth=8;c.beginPath();c.moveTo(x,-18);c.quadraticCurveTo(x+swing,-9,x+swing,airborne?-8: -4);c.stroke();this.ellipse(x+swing+2,airborne?-7:-3,6,3,far?'#121a2c':'#2b354e');};
    leg(-9,Math.PI,true);leg(9,0,true);leg(-9,0,false);leg(9,Math.PI,false);
    const tilt=airborne?(p.vy<0?-.13:.12):gait*.025;
    c.save();c.translate(4,-43+breath);c.rotate(tilt);
    this.path([[-20,-8],[-20,-31],[-6,-18]],'#202a43');this.path([[5,-18],[17,-30],[23,-5]],'#202a43');
    this.path([[-17,-12],[-17,-24],[-10,-16]],'#b77ea5');this.path([[10,-15],[16,-24],[19,-10]],'#b77ea5');
    const fur=c.createRadialGradient(-7,-8,2,0,0,27);fur.addColorStop(0,'#36415a');fur.addColorStop(1,'#111a2b');
    this.ellipse(0,0,24,20,fur);
    this.path([[-22,1],[-28,-2],[-23,7],[-28,9],[-19,12]],'#192237');
    this.path([[18,7],[25,8],[22,12],[16,14]],'#192237');
    const blink=!reduced&&t%5.7>5.52;
    for(const x of [-7,12]) {if(blink||won){c.strokeStyle='#ffd587';c.lineWidth=2;c.beginPath();c.arc(x,0,6,Math.PI,Math.PI*2);c.stroke();}else{this.ellipse(x,0,7.6,10,'#0a1221');this.ellipse(x+1,0,6.1,8.5,'#edb244');this.ellipse(x+2,-1,3.1,6.9,'#111528');this.ellipse(x,-4,2.2,2.8,'#fff6d6');}}
    this.ellipse(5,9,6,4,'#32354a');this.path([[2,7],[8,7],[5,10]],'#d798ab');
    c.strokeStyle='#9b90a3';c.lineWidth=.65;for(const k of [-1,1]){c.beginPath();c.moveTo(k<0?-11:15,8);c.lineTo(k<0?-29:29,6);c.moveTo(k<0?-12:16,11);c.lineTo(k<0?-27:28,14);c.stroke();}
    c.restore();
    // Cloth bends continuously with time and speed, rather than changing sprite proportions.
    const wave=reduced?0:Math.sin(t*9)*3*(.3+speed);
    this.path([[-13,-30],[13,-30],[12,-24],[-12,-24]],'#5086dc');
    c.fillStyle='#2856b7';c.beginPath();c.moveTo(-10,-26);c.quadraticCurveTo(-25,-33,-39-speed*10,-28+wave);c.lineTo(-33-speed*8,-19+wave);c.quadraticCurveTo(-21,-25,-9,-22);c.fill();
    c.strokeStyle='#e0b05d';c.lineWidth=1;c.beginPath();c.moveTo(11,-27);c.lineTo(12,-19);c.stroke();c.shadowColor='#ffc957';c.shadowBlur=8;this.star(12,-17,7,'#ffe38e');c.shadowBlur=0;
    c.restore();c.restore();
  }
  draw(g,dt,reduced) {
    const c=this.c,l=g.level,p=g.player,t=reduced?0:g.time;
    const target=Math.max(0,Math.min(l.width-960,p.x-330));
    this.camera+= (target-this.camera)*(1-Math.exp(-7*dt));
    if(Math.abs(target-this.camera)>1100)this.camera=target;
    c.clearRect(0,0,960,600);
    const sky=c.createLinearGradient(0,0,0,600);sky.addColorStop(0,['#08142c','#101a39','#152447','#272044','#283755'][g.stage]);sky.addColorStop(1,'#274065');c.fillStyle=sky;c.fillRect(0,0,960,600);
    if(this.backdrop){c.save();c.globalAlpha=.3+g.stage*.07;const sx=(this.camera/(l.width-960))*360;c.drawImage(this.backdrop,sx,0,840,400,0,0,960,410);c.restore();}
    for(let i=0;i<75;i++){let x=(i*173-this.camera*.09)%1000;if(x<0)x+=1000;this.ellipse(x,25+(i*67)%270,1+(i%6===0),1+(i%6===0),'#c4d5f1');}
    for(let layer=0;layer<2;layer++){c.save();c.globalAlpha=.65;for(let i=0;i<45;i++){const x=i*170-this.camera*(.25+layer*.15),y=480;if(x < -150 || x > 1050)continue;c.fillStyle=layer?'#112b3e':'#20344c';c.fillRect(x+35,y-210,8,210);for(let j=0;j<4;j++)this.path([[x-30-j*8,y-30-j*43],[x+40,y-270-j*2],[x+110+j*8,y-30-j*43]],layer?'#11283c':'#20334b');}c.restore();}
    c.save();c.translate(-this.camera,0);
    c.fillStyle='#1a5b79';c.fillRect(2050,550,700,50);
    for(let i=0;i<35;i++){c.fillStyle='#73bdd5';c.globalAlpha=.4;c.fillRect(2050+(i*43+t*32)%695,555+i%5*9,16,1);}c.globalAlpha=1;
    for(const s of l.ground)this.terrain(s,g.stage);
    for(const s of l.platforms)this.terrain(s,g.stage);
    for(let i=0;i<19;i++){const x=180+i*275;if((x>2020&&x<2780)||x<this.camera-30||x>this.camera+990)continue;this.mushroom(x,520,t,g.stage);}
    for(const [i,cp]of l.checkpoints.entries()){c.save();c.translate(cp.x,520);c.fillStyle='#384561';c.beginPath();c.roundRect(-12,-54,27,54,[14,14,2,2]);c.fill();c.shadowColor=i<=g.checkpoint?'#ffde91':'#91c6e3';c.shadowBlur=14;this.path([[1,-43],[8,-29],[1,-16],[-6,-29]],i<=g.checkpoint?'#ffde91':'#91c6e3');c.restore();}
    const tx=l.treeX;if(tx>this.camera-240&&tx<this.camera+1200){c.save();c.translate(tx,520);c.strokeStyle=g.stage===4?'#ffd78a':'#6e6478';c.shadowColor='#ffd47a';c.shadowBlur=g.stage*6;c.lineCap='round';
    for(let j=0;j<11;j++){const a=(j-5)*.24;c.lineWidth=8+Math.abs(j-5);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-15,-120,Math.sin(a)*120,-200,Math.sin(a)*205,-290+Math.abs(j-5)*13);c.stroke();}c.restore();}
    for(const s of l.stars)if(!s.got&&s.x>this.camera-25&&s.x<this.camera+985){c.save();c.shadowColor=s.secret?'#d7a0ff':'#ffdc7c';c.shadowBlur=14;this.star(s.x,s.y+(reduced?0:Math.sin(t*2+s.id)*3),s.secret?10:12,s.secret?'#e7b6ff':'#ffe396');c.restore();}
    for(let i=0;i<18;i++){const x=this.camera+(i*127)%960,y=220+(i*59)%260;this.ellipse(x+Math.sin(t+i)*14,y+Math.sin(t*.7+i)*12,1.8,1.8,g.stage?'#ffe79f':'#778cb1');}
    this.cat(p,t,g.won,reduced);
    for(const f of this.fx){if(!reduced){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=180*dt;}f.life-=dt;c.globalAlpha=Math.max(0,f.life);this.ellipse(f.x,f.y,2,2,f.color);}this.fx=this.fx.filter(f=>f.life>0);c.globalAlpha=1;
    c.restore();
  }
};
