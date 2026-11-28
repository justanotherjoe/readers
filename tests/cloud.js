const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/tmp/test_cloud.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push((e.detail&&e.detail.stack)||e.message));
let listeners=[],session=null;
const fakeSb={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:cb=>{listeners.push(cb)},
 signUp:async({email,password,options})=>{session={user:{id:'u1',email,user_metadata:options.data}};listeners.forEach(f=>f('SIGNED_IN',session));return{data:{session}}},
 signInWithPassword:async()=>({error:{message:'Invalid login credentials'}}),signOut:async()=>{session=null}}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',
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
  newClub:async(row,me)=>{const c={...row,id:'c'+(window.__T.clubs.length+1),code:'abc123',owner:cloud.user.id,m:[{user_id:cloud.user.id,name:me.name,ch:me.ch}]};window.__T.clubs.push(c);return c},
  join:async(code,name)=>{const c=window.__T.clubs.find(x=>x.code===code);if(!c)throw new Error('No club found for that code');c.m.push({user_id:'u9',name,ch:0});return c},
  progress:async(id,ch,name)=>{const c=window.__T.clubs.find(x=>x.id===id);c.m.find(m=>m.user_id===cloud.user.id).ch=ch},
  post:async p=>{const r={...p,id:'p'+Math.random(),user_id:cloud.user.id,created_at:new Date().toISOString()};window.__T.posts.push(r);return r},
  leave:async c=>{window.__T.clubs=window.__T.clubs.filter(x=>x.id!==c.id)},feedback:async t=>{window.__T.fb=t}})`);
 w.__T=T;
 d.querySelector('.book[data-p=clubs]').click();await wait(400);
 console.log('SIGNED OUT view:',txt().slice(0,120),'| books in memory:',w.eval('S.books.length'));
 for(const p of ['home','shelf','stats','profile']){d.querySelector('.book[data-p='+p+']').click();await wait(350);console.log(p,'gated:',txt().includes('Welcome to Readers'))}
 d.querySelector('[data-act=signin]').click();console.log('auth open:',d.getElementById('fm').hasAttribute('open'));
 d.querySelector('[data-act=signup]').click();
 const f=d.getElementById('authf');f.querySelector('[name=name]').value='Pat';f.querySelector('[name=email]').value='pat@x.com';f.querySelector('[name=pw]').value='secret1';
 f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(400);
 console.log('signed in, books:',w.eval('S.books.length'),'name:',w.eval('S.profile.name'),'synced:',w.eval('cloud.synced'));
 for(const p of ['home','shelf','discover','clubs','stats','profile']){d.querySelector('.book[data-p='+p+']').click();await wait(350);console.log(p.toUpperCase(),'ok:',txt().slice(0,90))}
 // add a book, create a club
 w.eval("addBook({t:'Piranesi',a:'Susanna Clarke',pages:272,tags:['Magical']},'want')");
 d.querySelector('.book[data-p=clubs]').click();await wait(350);
 d.querySelector('[data-act=newclub]').click();
 const nf=d.querySelector('#fm form');nf.querySelector('[name=name]').value='Test Club';nf.querySelector('[name=n]').value='10';nf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(400);
 console.log('CLUB:',txt().slice(0,200));console.log('code shown:',txt().includes('abc123'));
 // finish chapter then post
 d.querySelector('[data-act=clubnext]').click();await wait(100);
 const pf=d.querySelector('[data-form=post]');pf.querySelector('input').value='Hello club';pf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
 console.log('post visible:',txt().includes('Hello club'));
 await wait(1800);console.log('progress synced to server:',T.clubs[0].m[0].ch,'data pushed books:',T.data.books.length);
 // friend join flow (same user for test)
 d.querySelector('[data-act=joinclub]').click();const jf=d.querySelector('#fm form');jf.querySelector('[name=code]').value='zzz';jf.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
 console.log('toast bad code:',d.querySelector('.toast').textContent);
 d.querySelector('[data-act=joinclub]').click();const jf2=d.querySelector('#fm form');jf2.querySelector('[name=code]').value='abc123';jf2.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(200);
 console.log('toast join:',d.querySelector('.toast').textContent);
 // feedback + signout
 d.querySelector('.book[data-p=profile]').click();await wait(350);
 d.getElementById('fbtext').value='Love it';d.querySelector('[data-act=sendfb]').click();await wait(100);console.log('feedback:',T.fb);
 d.querySelector('[data-act=signout]').click();await wait(400);console.log('after signout books:',w.eval('S.books.length'),'user:',w.eval('!!cloud.user'));
 console.log('ERRS:',errs.length?errs.join('\n'):'none');process.exit()})();
