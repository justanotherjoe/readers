const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/tmp/test_local.html','utf8');const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.fetch=()=>Promise.reject(1);w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.Element.prototype.scrollBy=()=>{}}});
const w=dom.window,d=w.document,wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{await wait(200);
 console.log('CAT size',w.eval('CAT.length'));
 const show=()=>w.eval("lanes('').map(l=>l.k+': '+l.items.map(x=>x.c.t+' ['+gOf(x.c)[0]+']').join(' | ')).join('\\n')");
 console.log(show());
 console.log('--- stretch why sample:',w.eval("(lanes('').find(l=>l.k==='stretch')||{items:[{why:'none'}]}).items[0].why"));
 console.log('--- different why sample:',w.eval("(lanes('').find(l=>l.k==='different')||{items:[{why:'none'}]}).items[0].why"));
 // Not for me twice on a stretch genre removes it
 const g=w.eval("(lanes('').find(l=>l.k==='stretch')||{items:[]}).items.map(x=>x.c.id)");
 if(g.length){const id=g[0];const gen=w.eval("gOf(CATID['"+id.replace(/'/g,"\\'")+"'])[0]");w.eval("S.nope['"+gen+"']=2");console.log('after nope x2 on',gen,'-> stretch has it:',w.eval("(lanes('').find(l=>l.k==='stretch')||{items:[]}).items.some(x=>gOf(x.c)[0]==='"+gen+"')"))}
 // friends lane hidden w/o friends
 console.log('friends lane present w/o friends:',w.eval("lanes('').some(l=>l.k==='friends')"));
 w.eval("cloud.user={id:'u1'};cloud.friends=[{id:'f1',name:'Sam',status:'accepted',incoming:false,shared:[{t:'Piranesi Fake',a:'X Y',r:5,tg:['Fantasy','Cozy'],p:200},{t:'Low',a:'Z',r:2,tg:['Romance']}]},{id:'f2',name:'Pat',status:'pending',incoming:true,shared:[]}]");
 console.log('friends lane items:',w.eval("(lanes('').find(l=>l.k==='friends')||{items:[]}).items.map(x=>x.c.t+' :: '+x.why)"));
 w.eval("page='discover';render()");console.log('discover:',[...d.querySelectorAll('.lanehd h3')].map(h=>h.textContent),d.querySelector('#main').textContent.slice(0,80));
 w.eval("page='friends';render()");console.log('friends card:',d.querySelector('#main').textContent.includes('Requests'),'| badge flag:',d.body.dataset.freq);
 console.log('topPicks',w.eval('topPicks().length'),'ERRS:',errs.length?errs.join(';'):'none');process.exit(0)})();
