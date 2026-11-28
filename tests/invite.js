const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/tmp/test_cloud.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push((e.detail&&e.detail.stack)||e.message));
let listeners=[],session=null;
const fakeSb={auth:{getSession:async()=>({data:{session}}),onAuthStateChange:cb=>{listeners.push(cb)},
 signUp:async({email,password,options})=>{session={user:{id:'u1',email,user_metadata:options.data}};listeners.forEach(f=>f('SIGNED_IN',session));return{data:{session}}},
 signInWithPassword:async()=>({error:{message:'Invalid login credentials'}}),signOut:async()=>{session=null}}};
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/?join=ABC123',
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
 T.clubs.push({id:'c1',name:'Friends Club',code:'abc123',owner:'u0',book_title:'Dune',book_author:'Frank Herbert',pages:600,chapters:['a','b','c','d'],sched:[],m:[{user_id:'u0',name:'Joe',ch:2}]});w.__T=T;
 const acct=()=>d.getElementById('acct');
 console.log('url cleaned:',w.location.search==='' ,'pending:',w.localStorage.getItem('readers.join'));
 console.log('banner:',txt().includes('invited to a book club'),'| acct btn:',acct().textContent);
 console.log('tg removed:',!d.getElementById('tg'));
 d.querySelector('[data-act=signup]').click();
 const f=d.getElementById('authf');f.querySelector('[name=name]').value='Pat';f.querySelector('[name=email]').value='pat@x.com';f.querySelector('[name=pw]').value='secret1';
 f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(700);
 console.log('after signup page:',w.eval('page'),'club:',w.eval('cid'),'pending cleared:',w.localStorage.getItem('readers.join')===null);
 console.log('clubs view:',txt().slice(0,160));
 console.log('acct now:',acct().textContent,acct().className);
 acct().click();console.log('menu open:',!!d.getElementById('acctmenu'),d.getElementById('acctmenu')&&d.getElementById('acctmenu').textContent.replace(/\s+/g,' '));
 d.body.click();console.log('menu closed on outside click:',!d.getElementById('acctmenu'));
 // share invite
 let shared=null;w.navigator.share=async x=>{shared=x};
 d.querySelector('[data-act=shareinv]').click();await wait(100);
 console.log('shared:',JSON.stringify(shared));
 acct().click();d.querySelector('#acctmenu [data-act=signout]').click();await wait(500);
 console.log('after signout acct:',acct().textContent,'| gated:',txt().includes('Welcome to Readers'));
 console.log('ERRS:',errs.length?errs.join('\n'):'none');process.exit(0)})();
