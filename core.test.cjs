const assert=require('node:assert/strict');
const C=require('./core.js');
const tick=(g,input={},n=1)=>{for(let i=0;i<n;i++)C.step(g,input);};
function go(g,x){let frames=0;while(!g.won&&(Math.abs(g.player.x-x)>2||Math.abs(g.player.vx)>1)){const d=x-g.player.x;tick(g,{right:d>2,left:d< -2});if(++frames>3000)throw Error(`walk blocked at ${g.player.x} target ${x}`);}}
function leap(g,x){tick(g,{jumpPressed:true});let frames=0;while(!g.player.grounded){const d=x-g.player.x;tick(g,{right:d>2,left:d< -2});if(++frames>500)throw Error('jump never landed');}return frames;}
// A full traversal uses only controls, no teleporting or direct star collection.
let g=C.create();
assert.deepEqual(g.level.stages.map(s=>s.name),['Entrada da Floresta','Bosque dos Cogumelos','Riacho Azul','Clareira das Estrelas','Árvore Ancestral']);
assert.equal(g.level.checkpoints.length,4);
go(g,210);
for(let i=0;i<20;i++){
  const p=g.level.platforms[i], target=p.x+p.w/2-g.player.w/2;
  if(i>0)go(g,g.level.platforms[i-1].x+g.level.platforms[i-1].w-42);
  leap(g,target);
  assert.equal(g.player.support,p.id,`landing ${i}: ${JSON.stringify(g.player)}`);
  go(g,target);
  if([3,9,16].includes(i))leap(g,target);
  assert.ok(g.level.stars[i].got,`star ${i} missing`);
}
go(g,g.level.treeX);
assert.equal(g.main,20);assert.equal(g.secret,3);assert.equal(g.won,true);assert.equal(g.deaths,0);
assert.equal(g.stage,4);
console.log('PASS complete journey: 20 main + 3 secret stars, all 20 landings, ending, no respawns');
// Jump edges, variable height and coyote time.
g=C.create();tick(g,{jumpPressed:true});let top=g.player.y;for(let i=0;i<140;i++){tick(g);top=Math.min(top,g.player.y);}assert.ok(g.player.grounded);assert.ok(460-top>155);
g=C.create();tick(g,{jumpPressed:true});tick(g,{jumpReleased:true});let short=g.player.y;for(let i=0;i<100;i++){tick(g);short=Math.min(short,g.player.y);}assert.ok(460-short<80);
tick(g,{},120);assert.equal(g.player.y,460);
g=C.create();Object.assign(g.player,{x:440,y:390,grounded:true,support:'ledge-0',vx:280});tick(g,{right:true},3);assert.ok(!g.player.grounded);tick(g,{jumpPressed:true,right:true});assert.ok(g.player.vy<0);
console.log('PASS high/short jump, no automatic repeat, coyote window');
// Buffered jump just before contact and deliberate drop through.
g=C.create();Object.assign(g.player,{x:300,y:384,grounded:false,vy:180,coyote:0});tick(g,{jumpPressed:true});tick(g,{},8);assert.ok(g.player.vy<0);
g=C.create();Object.assign(g.player,{x:300,y:390,grounded:true,support:'ledge-0'});tick(g,{down:true,jumpPressed:true});tick(g,{},70);assert.equal(g.player.support,'earth-a');
g.main=4;g.checkpoint=1;g.player.y=720;tick(g);assert.equal(g.main,4);assert.equal(g.player.x,1500);assert.equal(g.deaths,1);
console.log('PASS jump buffer, drop-through, safe respawn retaining progress');
// A bridge crossing stays on the visible deck at floor height.
g=C.create();g.player.x=2030;tick(g,{right:true},320);assert.ok(g.player.x>2750);assert.equal(g.deaths,0);assert.equal(g.player.y,460);
console.log('PASS continuous bridge crossing');
