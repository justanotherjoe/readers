const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/tmp/test_cloud.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push((e.detail&&e.detail.stack)||e.message));
let listeners=[],session=null;
const fakeSb={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:cb=>{listeners.push(cb)},
 signUp:async({email,password,options})=>{session={user:{id:'u1',email,user_metadata:options.data}};listeners.forEach(f=>f('SIGNED_IN',session));return{data:{session}}},
 signInWithPassword:async()=>({error:{message:'Invalid login credentials'}}),signOut:async()=>{session=null},resetPasswordForEmail:async(e,o)=>{global.RESET={e,o};return{error:null}},updateUser:async x=>{global.NEWPW=x;return{error:null}}}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/?friend=FRIEND01',
 beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.fetch=()=>Promise.reject(1);
 w.supabase={createClient:()=>fakeSb};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.Element.prototype.scrollBy=()=>{}}});
const w=dom.window,d=w.document,wait=ms=>new Promise(r=>setTimeout(r,ms));
const txt=()=>d.getElementById('main').textContent.replace(/\s+/g,' ');
(async()=>{
 await wait(100);
 // fake server
 const T={data:null,clubs:[],posts:[]};
 w.eval(`Object.assign(db,{
  getData:async()=>window.__T.data,putData:async x=>{window.__T.data=JSON.parse(JSON.stringify(x))},
  clubs:async()=>window.__T.clubs.map(c=>({...c,club_members:c.m,club_posts:window.__T.posts.filter(p=>p.club_id===c.id)})),
  newClub:async(row,me)=>{const c={...row,id:'c'+(window.__T.clubs.length+1),code:'abc123',owner:cloud.user.id,m:[{user_id:cloud.user.id,name:me.name,ch:me.ch}]};window.__T.friends=[];T.sent=[];T.clubs.push(c);return c},
  join:async(code,name)=>{const c=window.__T.clubs.find(x=>x.code===code);if(!c)throw new Error('No club found for that code');c.m.push({user_id:'u9',name,ch:0});return c},
  progress:async(id,ch,name)=>{const c=window.__T.clubs.find(x=>x.id===id);c.m.find(m=>m.user_id===cloud.user.id).ch=ch},
  post:async p=>{const r={...p,id:'p'+Math.random(),user_id:cloud.user.id,created_at:new Date().toISOString()};window.__T.posts.push(r);return r},
  leave:async c=>{window.__T.clubs=window.__T.clubs.filter(x=>x.id!==c.id)},feedback:async t=>{window.__T.fb=t}})`);
 T.friends=[];T.sent=[];T.clubs.push({id:'c1',name:'Friends Club',code:'abc123',owner:'u0',book_title:'Dune',book_author:'Frank Herbert',pages:600,chapters:['a','b','c','d'],sched:[],m:[{user_id:'u0',name:'Joe',ch:2}]});w.eval(`Object.assign(db,{
  putProfile:async(n,s,d,u)=>{if(u==='taken')throw new Error('duplicate key value violates unique constraint');window.__T.prof={n,s,d,u}},myCode:async()=>'me123456',
  friends:async()=>window.__T.friends,recs:async()=>window.__T.recs||[],
  find:async q=>q==='nobody'?[]:[{code:'aaaa1111',name:'Sam Rivera',username:'samr'}],
  reqFriend:async c=>{window.__T.friends=[...window.__T.friends,{id:'f'+c,other:'u'+c,name:c==='aaaa1111'?'Sam Rivera':'Sam',status:'pending',incoming:false,shared:[]}];return{name:'Sam',status:'pending'}},
  reqUser:async uid=>{window.__T.friends=[...window.__T.friends,{id:'fx'+uid,other:uid,name:'Dana',status:'pending',incoming:false,shared:[]}];return{name:'Dana',status:'pending'}},
  sendRec:async r=>{window.__T.sent.push(r)},
  respond:async()=>{},unfriend:async id=>{window.__T.friends=window.__T.friends.filter(f=>f.id!==id)}})`);w.__T=T;
 await wait(50);
 const ck=(l,v)=>console.log((v?'PASS ':'FAIL ')+l);
 d.querySelector('[data-act=signup]').click();
 const f=d.getElementById('authf');
 // forgot password on sign in form
 d.querySelector('[data-act=signin]').click();
 const f2=d.getElementById('authf');f2.querySelector('[name=email]').value='pat@x.com';d.querySelector('[data-act=forgot]').click();await wait(100);
 ck('forgot password sends reset',global.RESET&&global.RESET.e==='pat@x.com'&&/localhost/.test(global.RESET.o.redirectTo));
 d.querySelector('[data-act=signup]').click();
 const f3=d.getElementById('authf');f3.querySelector('[name=name]').value='Pat';f3.querySelector('[name=email]').value='pat@x.com';f3.querySelector('[name=pw]').value='secret1';
 f3.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(900);
 ck('friend link lands on Friends page',w.eval('page')==='friends');
 ck('QR code rendered',!!d.querySelector('.qrbox svg'));
 ck('share link + code shown',txt().includes('me123456')&&!!d.querySelector('[data-act=sharef]'));
 // add some books and rate so checklist etc work
 w.eval("S=blank();S.profile.name='Pat';normalize();render()");
 w.eval("go('home')");await wait(100);
 ck('checklist on fresh home',txt().includes('Getting started')&&txt().includes('of 4'));
 d.querySelector('[data-act=hidecheck]').click();ck('checklist hides',!txt().includes('Getting started'));
 // privacy toggle + username
 w.eval("go('friends')");await wait(50);
 const cb=d.querySelector('[data-p2=disc]');cb.checked=true;cb.dispatchEvent(new w.Event('change',{bubbles:true}));
 ck('discoverable toggled',w.eval('S.profile.discoverable')===true);
 d.getElementById('unin').value='taken';d.querySelector('[data-act=saveun]').click();await wait(150);
 ck('username conflict handled',/taken/.test(d.querySelector('.toast').textContent)&&!w.eval('S.profile.username'));
 d.getElementById('unin').value='pat_reads';d.querySelector('[data-act=saveun]').click();await wait(150);
 ck('username saved',w.eval('S.profile.username')==='pat_reads'&&w.__T.prof.u==='pat_reads'&&w.__T.prof.d===true);
 // search
 const ff=()=>d.querySelector('[data-form=findf]');
 ff().querySelector('input').value='sam';ff().dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(150);
 ck('search results shown',txt().includes('Sam Rivera')&&txt().includes('@samr'));
 d.querySelector('[data-act=addcode]').click();await wait(200);
 ck('request sent from search',w.__T.friends.some(x=>x.id==='faaaa1111')&&txt().includes('Waiting for a reply'));
 ff().querySelector('input').value='nobody';ff().dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(150);
 ck('no results message',txt().includes('No readers found'));
 // club suggestions
 w.eval("cloud.clubs=[{id:'c1',name:'Friends Club',code:'abc123',bookId:key('Dune','Frank Herbert'),bt:'Dune',ba:'Frank Herbert',pages:600,chapters:['a','b','c','d'],sched:[],myCh:1,myName:'Pat',members:[{n:'Dana',ch:3,uid:'u77'}],posts:[]}];render()");
 ck('people you may know',txt().includes('People you may know')&&txt().includes('Dana'));
 d.querySelector('[data-act=addm]').click();await wait(200);
 ck('add from club',w.__T.friends.some(x=>x.other==='u77'));
 // accepted friend with shared books
 const today=new Date().toISOString().slice(0,10);
 w.eval("S.books=[];['A','B','C','D'].forEach((n,i)=>{S.books.push(B('Book '+n,'Auth','finished',{rating:[5,4,4,2][i],tags:['Fantasy']}))});normalize();");
 w.__T.friends=[{id:'f1',other:'u7',name:'Sam',status:'accepted',incoming:false,shared:[{t:'Book A',a:'Auth',r:5,tg:['Fantasy'],p:200,f:'2020-01-01'},{t:'Book B',a:'Auth',r:4,tg:['Fantasy'],p:200,f:null},{t:'Book C',a:'Auth',r:3,tg:['Fantasy'],p:100},{t:'New Gem',a:'Z',r:5,tg:['Mystery'],p:300,f:today}]}];
 w.eval("loadFriends().then(()=>{fid='f1';render()})");await wait(200);
 ck('friend profile shows taste match',/\d+%/.test(txt())&&txt().includes('You both loved 2'));
 ck('books friend loved list',txt().includes('Books Sam loved')&&txt().includes('New Gem'));
 d.querySelector('[data-act=recto]').click();await wait(50);
 const rf=d.querySelector('#fm form');rf.querySelector('[name=n]').value='You will love it';rf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
 ck('recommendation sent',w.__T.sent.length===1&&w.__T.sent[0].note==='You will love it'&&w.__T.sent[0].to_user==='u7');
 // activity on home
 w.eval("fid=null;go('home')");await wait(100);
 ck('friend activity on home',txt().includes('Friend activity')&&txt().includes('New Gem'));
 // received recommendation in discover
 w.__T.recs=[{id:'r1',from_user:'u7',from_name:'Sam',title:'Sent Book',author:'Q',tags:['Cozy'],pages:200,note:'Cozy and short'}];
 await w.eval('loadFriends()');
 w.eval("S.books=seed().books;normalize();go('discover')");await wait(100);
 const hd=[...d.querySelectorAll('.lanehd h3')].map(h=>h.textContent);
 ck('sent lane first',hd[0]==='Sent to you by friends'&&txt().includes('Cozy and short'));
 // nudge
 w.eval("S.books.find(b=>b.id===key('Dune','Frank Herbert'))||S.books.push(B('Dune','Frank Herbert','reading',{}));const bb=bk(key('Dune','Frank Herbert'));bb.chapters=['a','b','c','d'];bb.cur=0;cloud.clubs[0].bookId=bb.id;go('home')");await wait(100);
 ck('club nudge on home',txt().includes('Dana is 3 chapters ahead of you'));
 w.eval("cid='c1';go('clubs')");await wait(100);
 ck('club nudge line',txt().includes('ahead of you.'));
 // undo remove
 w.eval("go('shelf')");const cnt=w.eval('S.books.length');
 w.eval("const bid=S.books[0].id;openBook(bid)");d.querySelector('#bd [data-act=remove]').click();await wait(50);
 ck('removed',w.eval('S.books.length')===cnt-1);d.querySelector('.tundo').click();await wait(50);
 ck('undo restores book',w.eval('S.books.length')===cnt);
 // menu items
 d.getElementById('acct').click();
 const mt=d.getElementById('acctmenu').textContent;ck('menu has Friends, Release notes, Install',mt.includes('Friends')&&mt.includes('Release notes')&&mt.includes('Install app'));
 console.log('ERRS:',errs.length?errs.join('\n'):'none');process.exit(0)})();
