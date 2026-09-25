/* Browser and Node share this deterministic game simulation. Units: pixels, seconds. */
(function (root) {
  'use strict';
  const DT = 1 / 120;
  const WIDTH = 5500, FLOOR = 520;
  const heights = [450, 390, 330, 390, 450];
  function level() {
    const platforms = Array.from({length:20}, (_,i) => ({id:`ledge-${i}`,x:260+i*230,y:heights[i%5],w:164,h:28,oneWay:true}));
    const ground = [{id:'earth-a',x:0,y:FLOOR,w:2050,h:200}, {id:'bridge',x:2050,y:FLOOR,w:700,h:22,bridge:true}, {id:'earth-b',x:2750,y:FLOOR,w:WIDTH-2750,h:200}];
    const stars = platforms.map((p,i)=>({id:i,x:p.x+p.w/2,y:p.y-34,secret:false,got:false}));
    [3,9,16].forEach((i,j)=>stars.push({id:20+j,x:platforms[i].x+82,y:platforms[i].y-145,secret:true,got:false}));
    const checkpoints = [{x:90,name:'Início da floresta'},{x:1500,name:'Bosque dos cogumelos'},{x:2850,name:'Depois do riacho'},{x:4140,name:'Clareira ancestral'}];
    return {width:WIDTH,floor:FLOOR,platforms,ground,solids:[...ground,...platforms],stars,checkpoints,treeX:5210};
  }
  function create() {
    return {level:level(), player:{x:90,y:FLOOR-60,w:36,h:60,vx:0,vy:0,grounded:true,support:'earth-a',facing:1,coyote:.12,buffer:0,drop:0,land:0,stride:0},checkpoint:0,time:0,main:0,secret:0,stage:0,won:false,endingSeen:false,deaths:0,events:[]};
  }
  const overlaps = (a,b)=>a.x+a.w>b.x+.1&&a.x<b.x+b.w-.1;
  function respawn(g) {
    const p=g.player, cp=g.level.checkpoints[g.checkpoint];
    Object.assign(p,{x:cp.x,y:FLOOR-p.h,vx:0,vy:0,grounded:true,support:cp.x<2050?'earth-a':'earth-b',coyote:0,buffer:0,drop:0,land:0});
    g.deaths++; g.events.push({type:'respawn',x:p.x,y:FLOOR});
  }
  function step(g,input,dt=DT) {
    const p=g.player, l=g.level;
    g.events=[];
    if(g.won) return;
    g.time+=dt;
    p.land=Math.max(0,p.land-dt); p.drop=Math.max(0,p.drop-dt);
    if(input.respawn) {respawn(g); return;}
    if(p.grounded) p.coyote=.12; else p.coyote=Math.max(0,p.coyote-dt);
    p.buffer=input.jumpPressed?.15:Math.max(0,p.buffer-dt);
    if(input.down&&input.jumpPressed&&l.platforms.some(s=>s.id===p.support)) {
      p.drop=.23; p.y+=3; p.grounded=false; p.coyote=0; p.buffer=0;
    }
    const direction=(input.right?1:0)-(input.left?1:0);
    const target=direction*280, accel=p.grounded?2300:1500;
    p.vx+=Math.max(-accel*dt,Math.min(accel*dt,target-p.vx));
    if(direction) p.facing=direction;
    if(p.buffer>0&&p.coyote>0) {
      p.vy=-740; p.grounded=false; p.support=null; p.buffer=0; p.coyote=0;
      g.events.push({type:'jump',x:p.x+18,y:p.y+p.h});
    }
    if(input.jumpReleased&&p.vy< -310) p.vy=-310;
    const oldX=p.x;
    p.x=Math.max(0,Math.min(l.width-p.w,p.x+p.vx*dt));
    for(const s of l.solids) {
      if(s.oneWay||p.y+p.h<=s.y+.1||p.y>=s.y+s.h) continue;
      if(overlaps(p,s)) {
        if(oldX+p.w<=s.x+.1) {p.x=s.x-p.w;p.vx=0;}
        else if(oldX>=s.x+s.w-.1) {p.x=s.x+s.w;p.vx=0;}
      }
    }
    const oldY=p.y;
    p.vy=Math.min(950,p.vy+1680*dt); p.y+=p.vy*dt;
    p.grounded=false; p.support=null;
    let landing=null;
    for(const s of l.solids) {
      if(!overlaps(p,s)) continue;
      if(s.oneWay&&p.drop>0) continue;
      if(p.vy>=0&&oldY+p.h<=s.y+.1&&p.y+p.h>=s.y) {
        if(!landing||s.y<landing.y) landing=s;
      } else if(!s.oneWay&&p.vy<0&&oldY>=s.y+s.h-.1&&p.y<=s.y+s.h) {p.y=s.y+s.h;p.vy=0;}
    }
    if(landing) {
      if(p.vy>180) {p.land=.12;g.events.push({type:'land',x:p.x+18,y:landing.y});}
      p.y=landing.y-p.h;p.vy=0;p.grounded=true;p.support=landing.id;
    }
    if(p.grounded) p.stride+=Math.abs(p.x-oldX)*.15;
    for(const star of l.stars) {
      if(star.got) continue;
      const nx=Math.max(p.x,Math.min(star.x,p.x+p.w)), ny=Math.max(p.y,Math.min(star.y,p.y+p.h));
      if(Math.hypot(star.x-nx,star.y-ny)<17) {
        star.got=true;star.secret?g.secret++:g.main++;
        g.events.push({type:'star',...star});
      }
    }
    const nextStage=Math.floor(g.main/5);
    if(nextStage!==g.stage) {g.stage=nextStage;g.events.push({type:'stage',stage:g.stage});}
    for(let i=g.checkpoint+1;i<l.checkpoints.length;i++) {
      if(Math.abs(p.x-l.checkpoints[i].x)<65&&p.grounded&&p.y+p.h===FLOOR) {
        g.checkpoint=i;g.events.push({type:'checkpoint',name:l.checkpoints[i].name,x:p.x,y:FLOOR});
      }
    }
    if(p.y>690) respawn(g);
    if(!g.endingSeen&&g.main===20&&Math.abs(p.x-l.treeX)<100&&p.grounded) {
      g.won=true;g.endingSeen=true;p.vx=0;g.events.push({type:'win'});
    }
  }
  root.LumiCore={DT,create,step,respawn};
  if(typeof module!=='undefined') module.exports=root.LumiCore;
})(globalThis);
