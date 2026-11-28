
const YEAR=new Date().getFullYear(),TODAY=new Date().toISOString().slice(0,10);
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=(t,a)=>(t+'|'+a).toLowerCase().replace(/\s+/g,' ').trim();
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
/* ---------- cloud (Supabase). Leave both blank to run in local demo mode ---------- */
const SB_URL='https://mltikckphcxkbtgmgjvw.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sdGlrY2twaGN4a2J0Z21nanZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NTY1NzEsImV4cCI6MjExMTIzMjU3MX0.8nwf4Bf881Wv-JTX2--PTR1iqJdt2C7NQEKhdCBNp1M';
const cloud={on:!!(SB_URL&&SB_KEY&&window.supabase),sb:null,user:null,clubs:[],friends:[],recs:[],invs:[],fcode:'',synced:false,ready:false,err:''};
if(cloud.on)cloud.sb=window.supabase.createClient(SB_URL,SB_KEY);
let pushT;
const blank=()=>({v:1,goal:24,custom:[],dismissed:[],books:[],clubs:[],sort:'recent',profile:{name:'Reader',since:new Date().getFullYear(),vis:'friends',priv:{},imported:0}});
function gate(){if(!cloud.on)return '';
 if(!cloud.ready)return '<div class="inner"><p class="hint" style="text-align:center;padding:40px 0">Loading…</p></div>';
 if(cloud.user)return '';
 const inv=store.get('readers.join',''),fin=store.get('readers.friend','');return `<div class="inner">${inv||fin?`<div class="card" style="max-width:560px;margin:24px auto 0;text-align:center"><b>${inv?'You have been invited to a book club.':'A friend invited you to connect.'}</b><p class="hint" style="margin:6px 0 0">Create an account or sign in and ${inv?'you will join':'the request will be sent'} automatically.</p></div>`:''}<section class="land"><div class="landhero"><img class="landlogo" src="${logo.src}" alt=""><h2>Your reading life, all in <em>one place.</em></h2><p class="lead">Readers is a home for daily readers. Keep a history of every book you finish, then start book clubs where nobody can spoil the ending.</p><div class="btnrow"><button class="btn pri big" data-act="signup">Create free account</button><button class="btn big" data-act="signin">Sign in</button></div></div><div class="landgrid"><div class="landc"><span class="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H4z"/><path d="M20 5h-6a3 3 0 0 0-3 3"/></svg></span><h3>Track your reading</h3><p>Add books, rate them, keep notes and watch your yearly goal fill up.</p></div><div class="landc"><span class="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.5c3 0 4.8 1.7 4.8 4.5"/></svg></span><h3>Spoiler free book clubs</h3><p>Start a club in seconds with a link. Discussion unlocks chapter by chapter, so you only see what you have already read.</p></div><div class="landc"><span class="li"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg></span><h3>Find your next book</h3><p>Recommendations based on what you actually finished, plus picks from friends. Nothing is sponsored.</p></div></div></section></div>`}
const fail=e=>toast((e&&e.message)||'Something went wrong');
const db={
 async getData(){const{data,error}=await cloud.sb.from('user_data').select('data').eq('user_id',cloud.user.id).maybeSingle();if(error)throw error;return data&&data.data},
 async putData(d){const{error}=await cloud.sb.from('user_data').upsert({user_id:cloud.user.id,data:d,updated_at:new Date().toISOString()});if(error)throw error},
 async clubs(){const{data,error}=await cloud.sb.from('clubs').select('*,club_members(user_id,name,ch),club_posts(id,user_id,name,ch,text,created_at)').order('created_at');if(error)throw error;return data||[]},
 async newClub(row,me){const{data,error}=await cloud.sb.from('clubs').insert(row).select().single();if(error)throw error;const r=await cloud.sb.from('club_members').insert({club_id:data.id,name:me.name,ch:me.ch});if(r.error)throw r.error;return data},
 async join(code,name){const{data,error}=await cloud.sb.rpc('join_club',{p_code:code,p_name:name});if(error)throw error;return data},
 async leave(c){if(c.owner===cloud.user.id){if(c.members.length){const u=await cloud.sb.from('clubs').update({owner:c.members[0].uid}).eq('id',c.id);if(u.error)throw u.error}else{const d=await cloud.sb.from('clubs').delete().eq('id',c.id);if(d.error)throw d.error;return}}
  const{error}=await cloud.sb.from('club_members').delete().eq('club_id',c.id).eq('user_id',cloud.user.id);if(error)throw error},
 async post(p){const{data,error}=await cloud.sb.from('club_posts').insert(p).select().single();if(error)throw error;return data},
 async progress(id,ch,name){const{error}=await cloud.sb.from('club_members').update({ch,name}).eq('club_id',id).eq('user_id',cloud.user.id);if(error)throw error},
 async feedback(text){const{error}=await cloud.sb.from('feedback').insert({text,page});if(error)throw error},
 async putProfile(name,shared,disc,un){const{error}=await cloud.sb.from('profiles').upsert({user_id:cloud.user.id,name,shared,discoverable:!!disc,username:un||null,updated_at:new Date().toISOString()});if(error)throw error},
 async find(q){const{data,error}=await cloud.sb.rpc('find_readers',{p_q:q});if(error)throw error;return data||[]},
 async reqUser(uid){const{data,error}=await cloud.sb.rpc('request_friend_user',{p_user:uid});if(error)throw error;return data},
 async sendInvites(rows){const{error}=await cloud.sb.from('club_invites').upsert(rows,{onConflict:'from_user,to_user,code',ignoreDuplicates:true});if(error)throw error},
 async invites(){const{data,error}=await cloud.sb.from('club_invites').select('*').eq('to_user',cloud.user.id).order('created_at',{ascending:false});if(error)throw error;return data||[]},
 async dropInvite(id){const{error}=await cloud.sb.from('club_invites').delete().eq('id',id);if(error)throw error},
 async sendRec(row){const{error}=await cloud.sb.from('recommendations').insert({...row,from_user:cloud.user.id});if(error)throw error},
 async recs(){const{data,error}=await cloud.sb.from('recommendations').select('*').eq('to_user',cloud.user.id).order('created_at',{ascending:false}).limit(50);if(error)throw error;return data||[]},
 async myCode(){const{data,error}=await cloud.sb.from('profiles').select('code').eq('user_id',cloud.user.id).maybeSingle();if(error)throw error;return data&&data.code},
 async friends(){const{data,error}=await cloud.sb.rpc('my_friends');if(error)throw error;return data||[]},
 async reqFriend(code){const{data,error}=await cloud.sb.rpc('request_friend',{p_code:code});if(error)throw error;return data},
 async respond(id,acc){const{error}=await cloud.sb.rpc('respond_friend',{p_id:id,p_accept:acc});if(error)throw error},
 async unfriend(id){const{error}=await cloud.sb.rpc('remove_friend',{p_id:id});if(error)throw error}
};
const cloudSoon=()=>{if(!cloud.user||!cloud.synced)return;clearTimeout(pushT);pushT=setTimeout(cloudFlush,1500)};
const CLS=()=>cloud.user?cloud.clubs:S.clubs;
const C=['#0F6E56','#DB5F33','#2C4A41','#7C9A5E','#3D6C8C','#8C4A3A','#6B5B95','#B5893C','#1F5F7A','#A0463A','#4F6D3A','#34495E'];
const MOODS=['Reflective','Cozy','Dark','Epic','Magical','Funny','Emotional','Mysterious','Hopeful','Atmospheric','Adventurous','Heartwarming'];
const SH={reading:'Currently reading',want:'Want to Read',finished:'Finished',dnf:'Did Not Finish'};
const GOAL_UNLOCK=10;

/* ---------- catalog used by the recommendation engine ---------- */
const CAT=[
['Beach Read','Emily Henry',['Romance','Funny','Heartwarming'],361],
['Book Lovers','Emily Henry',['Romance','Funny','Cozy'],377],
['The Hating Game','Sally Thorne',['Romance','Funny','Fast paced'],384],
['Red, White and Royal Blue','Casey McQuiston',['Romance','Funny','Heartwarming'],421],
['The Starless Sea','Erin Morgenstern',['Magical','Atmospheric','Mysterious','Fantasy'],512],
['Hyperion','Dan Simmons',['Epic','Science fiction','Adventurous'],482],
['The Glass Castle','Jeannette Walls',['Memoir','Emotional','Hopeful'],288],
['If We Were Villains','M. L. Rio',['Dark','Academic','Mysterious'],368],
['A Man Called Ove','Fredrik Backman',['Funny','Heartwarming','Cozy'],337],
['The Buried Giant','Kazuo Ishiguro',['Reflective','Slow paced','Literary','Fantasy'],317],
['An Artist of the Floating World','Kazuo Ishiguro',['Reflective','Literary','Historical'],206],
['Jonathan Strange & Mr Norrell','Susanna Clarke',['Magical','Epic','Slow paced','Fantasy'],782],
['Children of Time','Adrian Tchaikovsky',['Science fiction','Epic','Adventurous'],600],
['The Left Hand of Darkness','Ursula K. Le Guin',['Science fiction','Reflective','Literary'],304],
['Remarkably Bright Creatures','Shelby Van Pelt',['Heartwarming','Cozy','Hopeful'],368],
['The Ocean at the End of the Lane','Neil Gaiman',['Magical','Atmospheric','Dark'],181],
['Gone Girl','Gillian Flynn',['Dark','Mysterious','Thriller','Fast paced'],422],
['The Seven Husbands of Evelyn Hugo','Taylor Jenkins Reid',['Emotional','Historical','Hopeful'],389],
['Where the Crawdads Sing','Delia Owens',['Atmospheric','Mysterious','Emotional'],368],
['Sapiens','Yuval Noah Harari',['Reflective','Informative'],443],
['The Splendid and the Vile','Erik Larson',['Historical','Informative','Adventurous'],545],
['The Goldfinch','Donna Tartt',['Dark','Literary','Emotional'],771],
['Mexican Gothic','Silvia Moreno-Garcia',['Dark','Atmospheric','Mysterious'],301],
['The Rosie Project','Graeme Simsion',['Funny','Heartwarming','Cozy'],295],
['Small Things Like These','Claire Keegan',['Reflective','Emotional','Literary','Historical'],116],
['Mistborn','Brandon Sanderson',['Epic','Adventurous','Fast paced','Fantasy'],541],
['The Hobbit','J. R. R. Tolkien',['Adventurous','Cozy','Fantasy'],310],
['Wild','Cheryl Strayed',['Memoir','Emotional','Hopeful','Adventurous'],315],
['Recursion','Blake Crouch',['Science fiction','Fast paced','Mysterious'],329],
['The Hitchhiker\'s Guide to the Galaxy','Douglas Adams',['Funny','Science fiction','Adventurous'],224],
['The Thursday Murder Club','Richard Osman',['Mystery','Funny','Cozy'],382],
['And Then There Were None','Agatha Christie',['Mystery','Dark','Mysterious'],272],
['Gone Girl','Gillian Flynn',['Thriller','Dark','Mysterious'],422],
['The Girl with the Dragon Tattoo','Stieg Larsson',['Mystery','Dark','Fast paced'],465],
['In the Woods','Tana French',['Mystery','Atmospheric','Dark'],429],
['The Silent Patient','Alex Michaelides',['Thriller','Mysterious','Fast paced'],336],
['Big Little Lies','Liane Moriarty',['Mystery','Funny','Emotional'],460],
['The Shining','Stephen King',['Horror','Dark','Atmospheric'],447],
['Mexican Gothic','Silvia Moreno-Garcia',['Horror','Atmospheric','Mysterious'],301],
['The Haunting of Hill House','Shirley Jackson',['Horror','Atmospheric','Dark'],246],
['Pet Sematary','Stephen King',['Horror','Dark','Emotional'],374],
['The Name of the Wind','Patrick Rothfuss',['Fantasy','Epic','Adventurous'],662],
['The Hobbit','J.R.R. Tolkien',['Fantasy','Adventurous','Cozy'],310],
['Circe','Madeline Miller',['Fantasy','Reflective','Atmospheric'],393],
['The Fifth Season','N.K. Jemisin',['Fantasy','Epic','Dark'],468],
['Mistborn: The Final Empire','Brandon Sanderson',['Fantasy','Epic','Adventurous'],541],
['Good Omens','Terry Pratchett and Neil Gaiman',['Fantasy','Funny','Adventurous'],400],
['Project Hail Mary','Andy Weir',['Science fiction','Funny','Hopeful'],476],
['The Martian','Andy Weir',['Science fiction','Funny','Adventurous'],369],
['Ender\'s Game','Orson Scott Card',['Science fiction','Fast paced','Emotional'],324],
['Station Eleven','Emily St. John Mandel',['Science fiction','Atmospheric','Hopeful'],333],
['The Left Hand of Darkness','Ursula K. Le Guin',['Science fiction','Reflective','Slow paced'],304],
['All the Light We Cannot See','Anthony Doerr',['Historical','Emotional','Atmospheric'],531],
['The Book Thief','Markus Zusak',['Historical','Emotional','Hopeful'],552],
['Pachinko','Min Jin Lee',['Historical','Emotional','Reflective'],490],
['The Nightingale','Kristin Hannah',['Historical','Emotional','Heartwarming'],440],
['Wolf Hall','Hilary Mantel',['Historical','Literary','Slow paced'],604],
['Educated','Tara Westover',['Memoir','Emotional','Hopeful'],334],
['Born a Crime','Trevor Noah',['Memoir','Funny','Hopeful'],304],
['When Breath Becomes Air','Paul Kalanithi',['Memoir','Reflective','Emotional'],228],
['Into the Wild','Jon Krakauer',['Memoir','Adventurous','Reflective'],207],
['Bossypants','Tina Fey',['Memoir','Funny','Cozy'],275],
['Sapiens','Yuval Noah Harari',['Informative','Historical','Reflective'],443],
['Atomic Habits','James Clear',['Informative','Hopeful','Fast paced'],320],
['A Short History of Nearly Everything','Bill Bryson',['Informative','Funny','Adventurous'],544],
['The Immortal Life of Henrietta Lacks','Rebecca Skloot',['Informative','Emotional','Historical'],381],
['Braiding Sweetgrass','Robin Wall Kimmerer',['Informative','Reflective','Hopeful'],391],
['Normal People','Sally Rooney',['Literary','Emotional','Reflective'],266],
['Tomorrow, and Tomorrow, and Tomorrow','Gabrielle Zevin',['Literary','Emotional','Hopeful'],416],
['Where the Crawdads Sing','Delia Owens',['Literary','Atmospheric','Mysterious'],368],
['The Midnight Library','Matt Haig',['Literary','Hopeful','Reflective'],288],
['Remarkably Bright Creatures','Shelby Van Pelt',['Literary','Heartwarming','Cozy'],368],
['The Seven Husbands of Evelyn Hugo','Taylor Jenkins Reid',['Romance','Emotional','Historical'],389],
['The Kiss Quotient','Helen Hoang',['Romance','Heartwarming','Funny'],320],
['Pride and Prejudice','Jane Austen',['Romance','Funny','Cozy'],279],
['The Da Vinci Code','Dan Brown',['Thriller','Fast paced','Mysterious'],454]
].map(([t,a,tags,pages])=>({id:key(t,a),t,a,tags,pages}));
{const s=new Set();for(let i=CAT.length-1;i>=0;i--){if(s.has(CAT[i].id))CAT.splice(i,1);else s.add(CAT[i].id)}}
const CATID=Object.fromEntries(CAT.map(c=>[c.id,c]));

/* ---------- data store: one source of truth, saved to localStorage ---------- */
const B=(t,a,shelf,o={})=>({id:key(t,a),t,a,shelf,tags:[],pages:0,rating:null,pr:0,fin:null,custom:[],notes:[],cats:{},method:'',started:null,img:null,...o});
const addDays=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const STAR='M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z';
const PEP='M5.5 9.5C8 6.8 13 7.2 15.6 10.6c2.4 3.2 4.2 6.6 5.6 10.2-5.4-.6-10.6-2.8-13.6-7C5.9 11.4 5 10.4 5.5 9.5z';
const PSTEM='M6.4 8.6C5.4 6.2 6.2 4.2 8.6 3c.3 1.2.1 2.3-.8 3.2';
const isRom=b=>(b.tags||[]).includes('Romance');
const method=b=>b.method||(isRom(b)?'chili':'stars');
const CATS=[['plot','Plot'],['characters','Characters'],['world','World building'],['ending','Ending']];
const unit=(k,v)=>k==='chili'?(v===1?'pepper':'peppers'):(v===1?'star':'stars');
const rtext=(k,v)=>v?v+' '+unit(k,v):'Not rated';
const fmtD=d=>d?new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',...(d.slice(0,4)!==String(YEAR)?{year:'numeric'}:{})}):'';
function ico(kind,v){/* v is how much of this icon is filled: 0, .5 or 1 */
 const sv=(c)=>kind==='chili'?`<svg viewBox="3 2 19 20" aria-hidden="true"><path d="${PEP}" fill="${c}"/><path d="${PSTEM}" fill="none" stroke="${v?'#3f8f3a':'rgba(127,127,127,.4)'}" stroke-width="2" stroke-linecap="round"/></svg>`:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR}" fill="${c}"/></svg>`;
 const on=kind==='chili'?'#d9381e':'#e8a317',off='rgba(127,127,127,.3)';
 return `<span class="ic">${sv(off)}${v?`<span class="fl" style="width:${v*100}%">${sv(on)}</span>`:''}</span>`}
function iconsRow(kind,val){return [1,2,3,4,5].map(i=>ico(kind,Math.max(0,Math.min(1,(val||0)-(i-1))))).join('')}
function raterBlock(b,f,label){const k=method(b),val=f==='overall'?b.rating:(b.cats||{})[f];
 return `<div class="rater" data-f="${f}"><div class="rlab"><span>${esc(label)}</span><output>${rtext(k,val)}</output></div><div class="rrow" role="group" aria-label="${esc(label)} rating">${[1,2,3,4,5].map(i=>`<button type="button" class="rb" data-act="rate" data-f="${f}" data-v="${i}" aria-label="${i} ${unit(k,i)}">${ico(k,Math.max(0,Math.min(1,(val||0)-(i-1))))}</button>`).join('')}${val?`<button type="button" class="rclear" data-act="rate" data-f="${f}" data-v="0">Clear</button>`:''}</div></div>`}
function datesHTML(b){const st=b.started,fi=b.fin;
 if(b.shelf==='finished')return `<span class="dt"><em>Started</em> ${st?fmtD(st):'not set'}</span><span class="dt"><em>Finished</em> ${fi?fmtD(fi):'not set'}</span>`;
 if(b.shelf==='reading')return `<span class="dt"><em>Started</em> ${st?fmtD(st):'not set'}</span><span class="dt"><em>Finished</em> reading now</span>`;
 if(b.shelf==='dnf')return `<span class="dt"><em>Started</em> ${st?fmtD(st):'not set'}</span><span class="dt"><em>Finished</em> did not finish</span>`;
 return `<span class="dt"><em>Started</em> not yet</span>`}
const REM=["Prologue: July 1956","Day One, Evening: Salisbury","Day Two, Morning: Salisbury","Day Two, Afternoon: Mortimer's Pond","Day Three, Morning: Taunton","Day Three, Evening: Moscombe","Day Four, Afternoon: Little Compton","Day Six, Evening: Weymouth"];
const genCh=n=>Array.from({length:n},(_,i)=>'Chapter '+(i+1));
function seed(){
 const f=(t,a,rating,fin,pages,tags,o={})=>B(t,a,'finished',{rating,fin,pages,tags,started:addDays(fin,-(6+pages%11)),...o});
 const w=(t,a,tags,pages=0,custom=[])=>B(t,a,'want',{tags,pages,custom});
 const y=YEAR;
 return{v:1,goal:24,custom:['Cozy reads'],dismissed:[],
 profile:{name:'Joe Ingram',since:y,vis:'friends',priv:{},imported:0},
 books:[
  B('The Remains of the Day','Kazuo Ishiguro','reading',{pages:258,tags:['Reflective','Literary','Slow paced','Historical'],chapters:REM,cur:5,started:addDays(TODAY,-9)}),
  B('Piranesi','Susanna Clarke','reading',{pages:272,tags:['Magical','Atmospheric','Mysterious','Fantasy'],chapters:genCh(12),cur:4,started:addDays(TODAY,-4)}),
  w('Tomorrow, and Tomorrow, and Tomorrow','Gabrielle Zevin',['Emotional','Hopeful','Literary'],416),
  w('The Overstory','Richard Powers',['Reflective','Literary','Epic'],502),
  w('Station Eleven','Emily St. John Mandel',['Atmospheric','Science fiction','Hopeful'],333),
  w('A Gentleman in Moscow','Amor Towles',['Historical','Heartwarming','Literary'],462),
  w('The Name of the Wind','Patrick Rothfuss',['Epic','Magical','Adventurous','Fantasy'],662),
  w('Hamnet','Maggie O\'Farrell',['Emotional','Historical','Literary'],305),
  w('Klara and the Sun','Kazuo Ishiguro',['Reflective','Science fiction','Literary'],303),
  w('The Book Thief','Markus Zusak',['Historical','Emotional','Hopeful'],552),
  w('Lessons in Chemistry','Bonnie Garmus',['Funny','Hopeful','Historical'],390),
  w('Project Hail Mary','Andy Weir',['Science fiction','Funny','Adventurous','Fast paced'],476),
  w('The Midnight Library','Matt Haig',['Reflective','Hopeful','Emotional'],304),
  w('Legends and Lattes','Travis Baldree',['Cozy','Heartwarming','Fantasy'],304,['Cozy reads']),
  w('The House in the Cerulean Sea','TJ Klune',['Cozy','Heartwarming','Magical'],398,['Cozy reads']),
  w('A Psalm for the Wild Built','Becky Chambers',['Cozy','Hopeful','Science fiction'],160,['Cozy reads']),
  w('The Thursday Murder Club','Richard Osman',['Funny','Cozy','Mysterious'],382,['Cozy reads']),
  f('People We Meet on Vacation','Emily Henry',4,y+'-11-02',364,['Romance','Funny','Heartwarming'],{cats:{plot:4,characters:5,ending:4},notes:[{id:'n1',t:'The road trip flashbacks were my favorite part.',ts:y+'-11-01T20:10:00'},{id:'n2',t:'Finished in two sittings. Need more of this author.',ts:y+'-11-02T22:30:00'}]}),
  f('Born a Crime','Trevor Noah',4,y+'-10-18',304,['Memoir','Funny','Hopeful']),
  f('Anxious People','Fredrik Backman',3.5,y+'-09-27',336,['Funny','Heartwarming','Cozy']),
  f('Never Let Me Go','Kazuo Ishiguro',4.5,y+'-08-30',288,['Reflective','Literary','Slow paced','Emotional']),
  f('The Secret History','Donna Tartt',4,y+'-07-19',559,['Dark','Academic','Mysterious','Literary']),
  f('Dune','Frank Herbert',5,y+'-06-24',612,['Epic','Science fiction','Adventurous'],{cats:{plot:5,characters:4,world:5,ending:4}}),
  f('Educated','Tara Westover',4,y+'-05-11',334,['Memoir','Emotional','Hopeful']),
  f('The Night Circus','Erin Morgenstern',4.5,y+'-04-02',387,['Magical','Atmospheric','Mysterious','Fantasy']),
  f('The Martian','Andy Weir',4,y+'-03-08',387,['Science fiction','Funny','Fast paced','Adventurous']),
  f('Pachinko','Min Jin Lee',4,y+'-02-14',496,['Historical','Emotional','Epic','Literary']),
  f('Circe','Madeline Miller',4.5,y+'-01-19',393,['Magical','Epic','Fantasy','Emotional']),
  B('Infinite Jest','David Foster Wallace','dnf',{pages:1079,tags:['Literary','Dark']})
 ],
 clubs:[
  {id:'tnr',name:'Thursday Night Readers',bookId:key('Piranesi','Susanna Clarke'),
   members:[{n:'Priya',ch:9},{n:'Marcus',ch:6},{n:'Dana',ch:4}],
   sched:[{upto:6,due:y+'-12-03'},{upto:12,due:y+'-12-17'}],
   posts:[{id:'p1',ch:1,who:'Priya',text:'The setting already feels like a character. Anyone else reading slowly on purpose?',ts:y+'-11-12T19:40:00'},
    {id:'p2',ch:2,who:'Marcus',text:'I love how matter of fact the narrator is about the strange parts.',ts:y+'-11-14T20:10:00'},
    {id:'p3',ch:4,who:'Dana',text:'The notebook habit is growing on me. Small details matter here.',ts:y+'-11-19T18:25:00'},
    {id:'p4',ch:6,who:'Marcus',text:'That last page made me stop and stare at the wall for a minute.',ts:y+'-11-21T21:05:00'},
    {id:'p5',ch:8,who:'Priya',text:'No hints from me. Just keep going.',ts:y+'-11-23T19:15:00'}]},
  {id:'ish',name:'Ishiguro Readalong',bookId:key('The Remains of the Day','Kazuo Ishiguro'),
   members:[{n:'Sam',ch:7},{n:'Lena',ch:5}],
   sched:[{upto:4,due:y+'-12-01'},{upto:8,due:y+'-12-15'}],
   posts:[{id:'p6',ch:1,who:'Sam',text:'Stevens is careful with every single word, and it is wonderful.',ts:y+'-11-16T17:30:00'},
    {id:'p7',ch:3,who:'Lena',text:'The humor is so dry I almost missed it.',ts:y+'-11-20T20:45:00'},
    {id:'p8',ch:7,who:'Sam',text:'This one changed how I read everything before it.',ts:y+'-11-24T18:00:00'}]}
 ]};
}
let S=store.get('readers.v1',null);
if(!S||!Array.isArray(S.books))S=cloud.on?blank():seed();
function normalize(){S.onbHide=!!S.onbHide;S.fold=S.fold||{};S.track=S.track==='pages'?'pages':'chapters';S.order=Array.isArray(S.order)?S.order:[];S.notif=Object.assign({friends:true,invites:true,recs:true,club:true},S.notif||{});S.nseen=S.nseen||[];S.liked=S.liked||{};S.nope=S.nope||{};S.custom=S.custom||[];S.dismissed=S.dismissed||[];S.clubs=S.clubs||[];S.profile=S.profile||{name:'Reader',since:YEAR,vis:'friends',priv:{}};S.goal=S.goal||24;S.sort=S.sort||'recent';
 S.books.forEach(b=>{b.tags=b.tags||[];b.custom=b.custom||[];if(!Array.isArray(b.notes)){b.notes=b.note?[{id:'n'+Date.now()+Math.random().toString(36).slice(2,5),t:b.note,ts:new Date().toISOString()}]:[]}delete b.note;b.cats=b.cats||{};b.method=b.method||'';if(b.started===undefined)b.started=null})}
normalize();
let saveT;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>store.set('readers.v1',S),150);cloudSoon()};
addEventListener('pagehide',()=>{store.set('readers.v1',S);if(cloud.user&&cloud.synced)cloudFlush()});

/* ---------- derived values ---------- */
const bk=id=>S.books.find(b=>b.id===id);
const onShelf=s=>S.books.filter(b=>b.shelf===s);
const progress=b=>b.shelf==='finished'?100:(b.pages&&b.pg!=null)?Math.min(100,Math.round(b.pg/b.pages*100)):b.chapters?Math.round(b.cur/b.chapters.length*100):(b.pr||0);
const setCh=(b,v)=>{const n=b.chapters.length;b.cur=Math.max(0,Math.min(n,+v||0));b.pr=Math.round(b.cur/n*100);if(b.pages)b.pg=Math.round(b.cur/n*b.pages)};
const setPg=(b,v)=>{if(!b.pages)return;b.pg=Math.max(0,Math.min(b.pages,Math.round(+v||0)));b.pr=Math.round(b.pg/b.pages*100);if(b.chapters)b.cur=Math.min(b.chapters.length,Math.floor(b.pg/b.pages*b.chapters.length))};
const pgMode=()=>S.track==='pages';
const byFin=(a,b)=>(b.fin||'').localeCompare(a.fin||'');
const finYear=()=>onShelf('finished').filter(b=>b.fin&&b.fin.startsWith(YEAR));
const col=b=>C[(b.t.length+b.a.length)%C.length];
const cvAttrs=o=>`data-cv data-t="${esc(o.t)}" data-a="${esc(o.a)}"${o.img?` data-img="${esc(o.img)}"`:''}`;
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});
const ago=ts=>{const m=(Date.now()-new Date(ts))/6e4;return m<60?Math.max(1,Math.round(m))+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
const initials=n=>n.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
function addBook(o,shelf='want',extra={}){const id=key(o.t,o.a);let b=bk(id);if(b)return b;b=B(o.t,o.a,shelf,{tags:o.tags||[],pages:o.pages||0,img:o.img||null,...extra});S.books.unshift(b);save();return b}
function setShelf(b,s){b.shelf=s;if((s==='reading'||s==='finished'||s==='dnf')&&!b.started&&s==='reading')b.started=TODAY;if(s==='finished'){b.fin=b.fin||TODAY;if(b.chapters)b.cur=b.chapters.length;b.pr=100}save()}
function place(b,val){if(val.startsWith('c:')){const n=val.slice(2);if(!b.custom.includes(n))b.custom.push(n);save()}else setShelf(b,val)}

/* ---------- covers: queued, cached on this device, loaded only when visible ---------- */
const covers=store.get('readers.covers',{});let cvT;const saveCovers=()=>{clearTimeout(cvT);cvT=setTimeout(()=>store.set('readers.covers',covers),500)};
const jobs=[];let active=0;
function limit(fn){return new Promise((res,rej)=>{jobs.push({fn,res,rej});pump()})}
function pump(){while(active<4&&jobs.length){const j=jobs.shift();active++;j.fn().then(j.res,j.rej).finally(()=>{active--;pump()})}}
const inflight=new Map();
const descs=store.get('readers.descs',{});let dsT;const saveDescs=()=>{clearTimeout(dsT);dsT=setTimeout(()=>store.set('readers.descs',descs),500)};
const dflight=new Map();
const tidy=d=>String(d||'').replace(/<[^>]*>/g,' ').replace(/\[[^\]]*\]\([^)]*\)/g,'').replace(/\s+/g,' ').trim().slice(0,700);
function findDesc(t,a){const k=key(t,a);if(k in descs)return Promise.resolve(descs[k]||'');if(dflight.has(k))return dflight.get(k);
 const p=limit(async()=>{let d='',err=false;
  try{const r=await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=1&q='+encodeURIComponent('intitle:'+t+' inauthor:'+a));const j=await r.json();d=tidy(j.items&&j.items[0]&&j.items[0].volumeInfo&&j.items[0].volumeInfo.description)}catch(e){err=true}
  if(!d){try{const r=await fetch('https://openlibrary.org/search.json?title='+encodeURIComponent(t)+'&author='+encodeURIComponent(a)+'&limit=1&fields=key');const j=await r.json();const wk=j.docs&&j.docs[0]&&j.docs[0].key;
   if(wk){const w=await fetch('https://openlibrary.org'+wk+'.json').then(x=>x.json());d=tidy(typeof w.description==='string'?w.description:(w.description&&w.description.value)||'')}err=false}catch(e){err=true}}
  if(d||!err){descs[k]=d;saveDescs()}dflight.delete(k);return d});
 dflight.set(k,p);return p}
function bookPreview(id){const c=CATID[id];if(!c)return;
 const on=S.books.find(b=>b.id===id);
 bd.dataset.id='';
 bd.innerHTML=`<div class="dq"><div class="big" id="pvbig" style="background-color:${col(c)};background-size:cover;background-position:center"></div><div><h4>${esc(c.t)}</h4><div class="sub">${esc(c.a)}</div><p class="hint" style="margin:6px 0 0">${[c.pages?c.pages+' pages':'',(c.tags||[]).slice(0,3).join(' · ')].filter(Boolean).join(' · ')}</p><p class="pvdesc hint" id="pvdesc" style="margin:12px 0;line-height:1.5">Loading description…</p>${on?`<p class="hint" style="margin:0 0 10px">Already on your shelf.</p><div class="acts"><button class="btn" data-act="close-dlg">Back</button></div>`:`<div class="fld"><label>Add to<select id="pvshelf">${shelfOpts()}</select></label></div><div class="acts"><button class="btn pri" data-act="recadd" data-id="${esc(c.id)}">Add to shelf</button><button class="btn" data-act="close-dlg">Back</button></div>`}</div></div>`;
 if(!bd.open)bd.showModal();
 findCover(c.t,c.a).then(u=>{const el=$('#pvbig');if(u&&el&&bd.open)el.style.backgroundImage='url('+u.replace('-M.jpg','-L.jpg').replace('zoom=1','zoom=2')+')'}).catch(()=>{});
 findDesc(c.t,c.a).then(d=>{const el=$('#pvdesc');if(el&&bd.open)el.textContent=d||'No description available for this one yet.'}).catch(()=>{const el=$('#pvdesc');if(el&&bd.open)el.textContent='No description available for this one yet.'})}
function recAdd(btn){const c=CATID[btn.dataset.id];if(!c)return;const val=$('#pvshelf').value;
 const b=addBook(c,val.startsWith('c:')?'want':val);
 if(val.startsWith('c:'))place(b,val);else if(b.shelf!==val)setShelf(b,val);
 bd.close();toast('Added '+c.t);refreshRails();render()}

function findCover(t,a){const k=key(t,a);if(k in covers)return Promise.resolve(covers[k]||null);if(inflight.has(k))return inflight.get(k);
 const p=limit(async()=>{let url=null,err=false;
  try{const r=await fetch('https://openlibrary.org/search.json?title='+encodeURIComponent(t)+'&author='+encodeURIComponent(a)+'&limit=1&fields=cover_i');const j=await r.json();if(j.docs&&j.docs[0]&&j.docs[0].cover_i)url='https://covers.openlibrary.org/b/id/'+j.docs[0].cover_i+'-M.jpg'}catch(e){err=true}
  if(!url){try{const r=await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=1&q='+encodeURIComponent('intitle:'+t+' inauthor:'+a));const j=await r.json();const im=j.items&&j.items[0].volumeInfo.imageLinks;if(im)url=(im.thumbnail||im.smallThumbnail).replace('http:','https:');err=false}catch(e){err=true}}
  if(url||!err){covers[k]=url||'';saveCovers()}inflight.delete(k);return url});
 inflight.set(k,p);return p}
async function paint(el){const url=el.dataset.img||await findCover(el.dataset.t,el.dataset.a);if(!url||!el.isConnected)return;
 const im=new Image();im.alt='';im.onload=()=>{if(im.naturalWidth<5||!el.isConnected)return;
  if(el.classList.contains('cover')){el.prepend(im);el.classList.add('hasimg');requestAnimationFrame(()=>im.classList.add('ok'))}else el.style.backgroundImage='url("'+url+'")'};im.src=url}
const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){io.unobserve(e.target);paint(e.target)}}),{rootMargin:'250px'}):null;
const lazy=root=>{$$('[data-cv]',root).forEach(el=>io?io.observe(el):paint(el));requestAnimationFrame(()=>$$('.track',root).forEach(arrows))};
function arrows(t){const r=t.parentElement,l=$('.l',r),x=$('.r',r);if(!l)return;l.disabled=t.scrollLeft<5;x.disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-5}
document.addEventListener('scroll',e=>{if(e.target.classList&&e.target.classList.contains('track'))arrows(e.target)},true);

/* ---------- recommendation engine: scores the catalog against your ratings ---------- */
function recommend(mood){
 const w={},au={};
 S.books.forEach(b=>{const s=b.shelf==='finished'?(b.rating!=null?b.rating-3:.5):b.shelf==='dnf'?-1.5:b.shelf==='reading'?.5:.25;
  b.tags.forEach(t=>w[t]=(w[t]||0)+s);au[b.a]=(au[b.a]||0)+s});
 Object.keys(S.liked).forEach(t=>w[t]=(w[t]||0)+.6*S.liked[t]);Object.keys(S.nope).forEach(t=>w[t]=(w[t]||0)-.8*S.nope[t]);
 const seen=new Set(S.books.map(b=>b.id).concat(S.dismissed));
 const src=S.books.filter(b=>(b.shelf==='finished'&&b.rating>=3.5)||b.shelf==='reading');
 return CAT.filter(c=>!seen.has(c.id)&&(!mood||c.tags.includes(mood))).map(c=>{
  const sc=c.tags.reduce((a,t)=>a+(w[t]||0),0)/Math.sqrt(c.tags.length)+2*(au[c.a]||0);
  let best=null,bv=-1,shared=[];
  src.forEach(b=>{const sh=b.tags.filter(t=>c.tags.includes(t));const v=sh.length*(b.rating!=null?b.rating-3:.5)+(b.a===c.a?5:0);if(v>bv){bv=v;best=b;shared=sh}});
  return{c,sc,why:why(c,best,shared)}}).sort((x,y)=>y.sc-x.sc)}

/* ---------- lanes: close matches, friends, stretch picks, something different ---------- */
const GENRES=new Set(['Romance','Fantasy','Science fiction','Memoir','Academic','Thriller','Informative','Literary','Historical','Mystery','Horror']);
const gOf=c=>c.tags.filter(t=>GENRES.has(t)),mOf=c=>c.tags.filter(t=>!GENRES.has(t));
function taste(){const g={},m={},tried=new Set();
 S.books.forEach(b=>{const s=b.shelf==='finished'?(b.rating!=null?b.rating-3:.5):b.shelf==='dnf'?-1.5:b.shelf==='reading'?.5:.25;
  b.tags.forEach(t=>{const o=GENRES.has(t)?g:m;o[t]=(o[t]||0)+s;if(GENRES.has(t))tried.add(t)})});
 Object.keys(S.liked).forEach(t=>{const o=GENRES.has(t)?g:m;o[t]=(o[t]||0)+.6*S.liked[t]});
 Object.keys(S.nope).forEach(t=>{const o=GENRES.has(t)?g:m;o[t]=(o[t]||0)-.8*S.nope[t]});
 return{g,m,tried}}
function lanes(mood){
 const{g,m,tried}=taste(),seen=new Set(S.books.map(b=>b.id).concat(S.dismissed)),used=new Set(),out=[];
 const bad=c=>c.tags.some(t=>(S.nope[t]||0)>=2);
 const take=(arr,n)=>{const r=arr.slice(0,n);r.forEach(x=>used.add(x.c.id));return r};
 const diverse=(arr,n,per)=>{const cnt={},r=[];for(const x of arr){const k=gOf(x.c)[0]||'x';if((cnt[k]||0)>=per)continue;cnt[k]=(cnt[k]||0)+1;r.push(x);if(r.length>=n)break}return r};
 const pool=CAT.filter(c=>!seen.has(c.id)&&(!mood||c.tags.includes(mood)));
 const fav=S.books.filter(b=>b.shelf==='finished'&&b.rating>=4).sort((a,b)=>b.rating-a.rating)[0];
 const anchor=mo=>S.books.filter(b=>b.shelf==='finished'&&b.rating>=3.5&&b.tags.includes(mo)).sort((a,b)=>b.rating-a.rating)[0];
 const SI=[];(cloud.user?(cloud.recs||[]):[]).forEach(r=>{const id=key(r.title,r.author);if(seen.has(id)||SI.some(x=>x.c.id===id)||(mood&&!(r.tags||[]).includes(mood)))return;const c=regCat(id,{t:r.title,a:r.author,tags:r.tags||[],pages:r.pages||0});SI.push({c,sc:0,why:`<b>${esc(r.from_name)}</b> recommends this${r.note?': \u201c'+esc(r.note)+'\u201d':'.'}`})});
 if(SI.length)out.push({k:'sent',title:'Sent to you by friends',sub:'Personal picks from people who know you.',items:take(SI,6)});
 const L1=take(recommend(mood).filter(r=>gOf(r.c).some(t=>g[t]>0)&&r.sc>0),6);
 if(L1.length)out.push({k:'close',title:fav?'Because you loved '+fav.t:'More of what you love',sub:'The closest matches to the books you rated highly.',items:L1});
 const fr=cloud.user?(cloud.friends||[]).filter(f=>f.status==='accepted'):[],fm={};
 fr.forEach(f=>(f.shared||[]).forEach(x=>{if(!(x.r>=4))return;const id=key(x.t,x.a);if(seen.has(id)||used.has(id))return;(fm[id]=fm[id]||{x,by:[]}).by.push({n:f.name,r:x.r})}));
 const FI=Object.keys(fm).filter(id=>!mood||(fm[id].x.tg||[]).includes(mood)).map(id=>{const v=fm[id],c=CATID[id]||{id,t:v.x.t,a:v.x.a,tags:v.x.tg||[],pages:v.x.p||0};CATID[id]=c;
  const n=v.by.map(b=>'<b>'+esc(b.n)+'</b>'),avg=v.by.reduce((a,b)=>a+b.r,0)/v.by.length;
  const why=v.by.length===1?`${n[0]} rated this ${v.by[0].r} out of 5.`:v.by.length===2?`${n[0]} and ${n[1]} both rated this highly.`:`${n[0]}, ${n[1]} and ${v.by.length-2} more friend${v.by.length>3?'s':''} rated this highly.`;
  return{c,sc:v.by.length*10+avg,why}}).sort((a,b)=>b.sc-a.sc);
 if(FI.length)out.push({k:'friends',title:'Friends loved these',sub:'Books your friends rated 4 stars or more that are not on your shelves yet.',items:take(FI,6)});
 const st=pool.filter(c=>!used.has(c.id)&&!bad(c)).map(c=>{const cg=gOf(c);if(!cg.length||cg.some(t=>g[t]>0))return null;const sh=mOf(c).filter(t=>m[t]>0);if(!sh.length)return null;
  const mo=sh.sort((a,b)=>m[b]-m[a])[0],b=anchor(mo);
  return{c,sc:sh.reduce((a,t)=>a+m[t],0),why:`New genre, familiar feel. You enjoy <b>${esc(mo.toLowerCase())}</b> reads${b?', like <b>'+esc(b.t)+'</b>':''}, and this one is ${esc(cg[0].toLowerCase())}.`}}).filter(Boolean).sort((x,y)=>y.sc-x.sc);
 const L2=take(diverse(st,4,1),4);
 if(L2.length)out.push({k:'stretch',title:'Stretch picks',sub:'A new genre with a feel you already love, so it is an easy step outside your usual.',items:L2});
 const day=Math.floor(Date.now()/864e5),hs=s=>[...s].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
 const df=pool.filter(c=>!used.has(c.id)&&!bad(c)).filter(c=>{const cg=gOf(c);return cg.length&&cg.every(t=>!tried.has(t))}).map(c=>({c,sc:(hs(c.id)+day)%1000,
  why:`A genre you have not tried yet: <b>${esc(gOf(c)[0].toLowerCase())}</b>. ${c.pages<=320?'At '+c.pages+' pages it is an easy first step.':'A good place to start exploring it.'}`})).map(x=>({...x,sc:x.sc+(L2.some(y=>gOf(y.c).includes(gOf(x.c)[0]))?0:1000)})).sort((x,y)=>y.sc-x.sc);
 const L3=take(diverse(df,5,1),5);
 if(L3.length)out.push({k:'different',title:'Something different',sub:'Genres you have not tried yet. Low pressure, one book each.',items:L3});
 return out}
function topPicks(){const ls=lanes(),r=[];for(let i=0;i<3&&r.length<6;i++)ls.forEach(l=>{if(l.items[i]&&r.length<6)r.push(l.items[i])});
 if(r.length<6){const ids=new Set(r.map(x=>x.c.id));recommend().forEach(x=>{if(r.length<6&&!ids.has(x.c.id))r.push(x)})}return r}
function why(c,b,sh){
 if(!b||(!sh.length&&b.a!==c.a))return `Popular with readers who like <b>${esc(c.tags[0].toLowerCase())}</b> stories.`;
 const rated=b.rating!=null;
 return `You ${rated?'rated':'are reading'} <b>${esc(b.t)}</b>${rated?' '+b.rating+' '+unit(method(b),b.rating):''}`+(b.a===c.a?' and this is by the same author.':`. Shared vibe: ${sh.slice(0,3).map(x=>esc(x.toLowerCase())).join(', ')}.`)}

/* ---------- navigation ---------- */
const main=$('#main'),logo=$('#logo'),tg=$('#tg'),dq=$('#dq'),bd=$('#bd'),fm=$('#fm');
let page='home';
const VIEWS={home:()=>vHome(),shelf:()=>vShelf(),discover:()=>vDiscover(),clubs:()=>vClubs(),stats:()=>vStats(),profile:()=>vProfile(),notes:()=>vNotes(),friends:()=>vFriends()};
const WIDE={shelf:1,discover:1,clubs:1,stats:1};
function render(){renderAcct();document.body.dataset.new=hasNew()&&page!=='notes'?'1':'';document.body.dataset.freq=S.notif.friends&&(cloud.friends||[]).some(f=>f.status==='pending'&&f.incoming)?'1':'';refreshNotif();document.body.dataset.recs=onShelf('finished').length<GOAL_UNLOCK?'locked':'open';main.className=WIDE[page]?'wide':'home';const g=gate();document.body.dataset.gate=g?'1':'';const gs=(!g&&page!=='shelf'&&page!=='profile')?`<div class="search${WIDE[page]?'':' flat'}"><input id="q" type="search" placeholder="Search any book or author" autocomplete="off" aria-label="Search books"><div class="results" id="results"></div></div>`:'';main.innerHTML='<div class="page">'+gs+(g||VIEWS[page]())+'</div>';lazy(main);if(!g&&page!=='profile')wireSearch();if(page==='shelf'){shelfEdit=false;syncFoldAll()}}
const phone=()=>matchMedia('(max-width:700px),(hover:none) and (max-width:900px)').matches;
function go(p){page=p;$$('.book').forEach(x=>x.classList.toggle('active',x.dataset.p===p||(phone()&&(p==='stats'||p==='notes'||p==='friends')&&x.dataset.p==='profile')));render();if(document.scrollingElement)document.scrollingElement.scrollTop=0}
$$('.book').forEach(b=>b.onclick=()=>{
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return go(b.dataset.p);
 $$('.book').forEach(x=>x.classList.remove('active'));b.classList.add('opening');
 setTimeout(()=>{b.classList.remove('opening');go(b.dataset.p)},280)});
function toast(m,undo){let t=$('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}
 t.textContent=m;t.classList.toggle('act',!!undo);
 if(undo){const b=document.createElement('button');b.type='button';b.className='tundo';b.textContent='Undo';b.onclick=()=>{clearTimeout(t._h);t.classList.remove('show');undo()};t.appendChild(b)}
 t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),undo?6500:2400)}

/* ---------- shared pieces ---------- */
function coverBtn(b){const p=progress(b),k=method(b);
 const cap=b.shelf==='reading'?`<span class="dt">${p}% read</span>`:`${b.rating?`<span class="mini">${iconsRow(k,b.rating)}</span>`:''}<span class="dt">${b.shelf==='finished'?(b.fin?fmtD(b.fin):'Finished'):b.shelf==='dnf'?'Did not finish':b.started?'Started '+fmtD(b.started):''}</span>`;
 return `<div class="cw"><button class="cover" data-act="book" data-id="${esc(b.id)}" ${cvAttrs(b)} style="background:${col(b)}"><i>${esc(b.a)}</i><b>${esc(b.t)}</b>${b.shelf==='reading'?`<div class="prog"><span style="width:${p}%"></span></div>`:''}<div class="info"><strong>${esc(b.t)}</strong>${b.shelf==='reading'?`<span class="dt">${p}% read</span>`:''}${b.rating?`<span class="mini">${iconsRow(k,b.rating)}</span>`:''}${datesHTML(b)}</div></button><div class="cap">${cap}</div></div>`}
function rail(name,count,books,extra=''){const shut=!!(S.fold||{})[name];
 return `<section class="row${shut?' shut':''}"><h3><button type="button" class="fold" data-act="fold" data-k="${esc(name)}" aria-expanded="${!shut}"><svg class="chv" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg><span>${esc(name)}</span> <small>${count}</small></button>${extra}</h3>`+(shut?'':`<div class="rail"><button class="arrow l" aria-label="Scroll left" data-act="scroll" data-d="-1">‹</button><div class="track">${books.length?books.map(coverBtn).join(''):'<p class="hint">Nothing here yet.</p>'}</div><button class="arrow r" aria-label="Scroll right" data-act="scroll" data-d="1">›</button></div>`)+`</section>`}
const nb=n=>n+(n===1?' book':' books');
function recCard(r,actions=true){const c=r.c;return `<article class="rc"><button type="button" class="cv2 tapc" ${cvAttrs(c)} style="background-color:${col(c)}" data-act="prev" data-id="${esc(c.id)}" aria-label="About ${esc(c.t)}"></button><div><h4>${esc(c.t)}</h4><div class="sub">${esc(c.a)} · ${c.pages} pages</div><div class="why">${r.why}</div><div class="tags">${c.tags.slice(0,3).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${actions?`<div class="acts"><button class="btn pri" data-act="rec-want" data-id="${esc(c.id)}">Want to Read</button><button class="btn" data-act="rec-no" data-id="${esc(c.id)}">Not for me</button></div>`:''}</div></article>`}
const meter=(n,of)=>`<div class="meter"><div class="bar"><i style="width:${Math.min(100,n/of*100)}%"></i></div><small>${n} of ${of} books logged</small></div>`;

/* ---------- HOME ---------- */
function vHome(){
 const rd=onShelf('reading'),r=rd.find(b=>b.chapters)||rd[0];let hero;
 if(r){const n=r.chapters&&r.chapters.length,c=r.cur;
  hero=`<section class="now"><div class="cv" ${cvAttrs(r)}></div><div><div class="lbl">Currently reading</div><h2>${esc(r.t)}</h2><p class="by">${esc(r.a)}</p>`+
  (pgMode()&&r.pages?`<div class="chap">Page ${r.pg||0} of ${r.pages}<small>${progress(r)}% read${n&&c<n?' · chapter '+(c+1)+' of '+n:''}</small></div><div class="bar" style="max-width:420px;margin:12px 0"><i style="width:${progress(r)}%;background:var(--page-orange);display:block;height:100%"></i></div><div class="pgform"><label>Now on page <input type="number" inputmode="numeric" min="0" max="${r.pages}" value="${r.pg||0}" aria-label="Current page"></label><button class="btn pri" data-act="setpg" data-id="${esc(r.id)}">Update page</button></div>`:n?`<div class="chap">${c<n?'Chapter '+(c+1)+' of '+n:'All '+n+' chapters read'}<small>${c<n?esc(r.chapters[c]):'Ready to mark as finished'}</small></div><div class="ticks" aria-hidden="true">${r.chapters.map((_,i)=>`<span class="${i<c?'done':i===c?'cur':''}" title="${esc(r.chapters[i])}"></span>`).join('')}</div>`
   :`<div class="chap">${progress(r)}% read</div><div class="bar" style="max-width:420px;margin:12px 0"><i style="width:${progress(r)}%;background:var(--page-orange);display:block;height:100%"></i></div>`)+
  `<div class="btnrow">${pgMode()&&r.pages?(r.pg>=r.pages?`<button class="btn pri" data-act="finish" data-id="${esc(r.id)}">Mark as finished</button>`:''):n&&c<n?`<button class="btn pri" data-act="nextch" data-id="${esc(r.id)}">Finished this chapter</button>`:`<button class="btn pri" data-act="finish" data-id="${esc(r.id)}">Mark as finished</button>`}<button class="btn" data-act="note" data-id="${esc(r.id)}">Add a note</button><button class="btn" data-act="book" data-id="${esc(r.id)}">Details</button></div>${rd.length>1?`<p class="also">Also reading: ${rd.filter(x=>x!==r).map(x=>`<button class="lnk" data-act="book" data-id="${esc(x.id)}">${esc(x.t)} (${progress(x)}%)</button>`).join(', ')}</p>`:''}</div></section>`}
 else hero=`<section class="card"><h3 style="margin:0 0 6px;font:700 22px Space Grotesk,system-ui,sans-serif">Nothing in progress</h3><p style="margin:0 0 14px">Pick something from Want to Read and start a new chapter.</p><button class="btn pri" data-go="shelf">Open My Shelf</button></section>`;
 const fy=finYear().length,done=onShelf('finished').length,recs=topPicks();
 const goal=`<section class="goalbar"><div><b>${fy} of ${S.goal}</b> books finished in ${YEAR}</div><div class="bar"><i style="width:${Math.min(100,fy/S.goal*100)}%;background:var(--page-green);display:block;height:100%"></i></div><button class="lnk" data-go="stats">See stats</button></section>`;
 const LOCK='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
 const rc=done<GOAL_UNLOCK?`<section class="recs locked"><div class="rl"><h3><span class="lk">${LOCK}</span>Recommendations unlock at ${GOAL_UNLOCK} books</h3><p>Readers learns your taste from the books you finish and rate. ${GOAL_UNLOCK-done===1?'Just 1 more to go.':(GOAL_UNLOCK-done)+' more to go.'} Nothing here is sponsored.</p>${meter(done,GOAL_UNLOCK).replace('books logged','finished books')}</div><div class="btnrow" style="margin:0"><button class="btn pri" data-go="shelf">Add books</button><button class="btn" data-go="profile">Import from Goodreads</button></div></section>`
 :`<section class="recs"><div><h3>Your recommendations are ready</h3><p>${Math.min(6,recs.length)} books picked from the ${done} you have finished. Go through them one at a time.</p></div><div style="display:flex;align-items:center;gap:18px"><div class="stack">${recs.slice(0,4).map(x=>`<div ${cvAttrs(x.c)}></div>`).join('')}</div><button class="btn pri" data-act="openq">See recommendations</button></div></section>`;
 return `<div class="hgrid"><div class="hmain">${hero}${goal}${rc}</div><aside class="hside">${invitesCard()}${checklist()}${nudgeCard()}${actCard()}</aside></div>`}
let QR=[],qi=0;
function renderQ(){
 if(qi>=QR.length){dq.innerHTML='<div class="dqend"><h4 style="font:700 26px Space Grotesk,system-ui,sans-serif;margin:0 0 8px">That is your queue for now</h4><p style="color:var(--page-sub)">Finish another book and Readers will build a new one.</p><button class="btn pri" data-act="close-dlg">Done</button></div>';return}
 const x=QR[qi],c=x.c;
 dq.innerHTML=`<div class="dq"><div class="big" ${cvAttrs(c)} style="background-color:${col(c)}"></div><div><div class="count">Recommendation ${qi+1} of ${QR.length}</div><h4>${esc(c.t)}</h4><div style="color:var(--page-sub)">${esc(c.a)}</div><div class="why">${x.why}</div><div class="tags">${c.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div><div class="acts"><button class="btn pri" data-q="want">Add to Want to Read</button><button class="btn" data-q="read">Already read</button><button class="btn" data-q="no">Not for me</button></div></div></div><div class="dqfoot"><div class="dots">${QR.map((_,i)=>`<i class="${i===qi?'on':''}"></i>`).join('')}</div><div style="display:flex;gap:8px"><button class="btn" data-act="close-dlg">Close</button><button class="btn" data-q="skip">Next</button></div></div>`;lazy(dq)}
function queueAct(a){const c=QR[qi].c;
 if(a==='want'){addBook(c,'want');toast('Added '+c.t+' to Want to Read')}
 if(a==='read'){const b=addBook(c,'finished');if(b.shelf!=='finished')setShelf(b,'finished');b.fin=null;toast('Added to Finished. Set a rating and date from My Shelf.')}
 if(a==='no'){S.dismissed.push(c.id);save();toast('Thanks. Fewer books like this one.')}
 qi++;renderQ()}

/* ---------- SHELF ---------- */
const SORTS=[['recent','Recently added'],['rating','Top rated overall'],...CATS.map(([c,l])=>[c,'Top for '+l.toLowerCase()]),['title','Title A to Z'],['author','Author A to Z']];
const metric=(b,m)=>m==='rating'?b.rating:(b.cats||{})[m];
function sorted(list){const m=S.sort;if(m==='title')return list.slice().sort((a,b)=>a.t.localeCompare(b.t));if(m==='author')return list.slice().sort((a,b)=>a.a.localeCompare(b.a));
 if(m==='recent')return list;return list.slice().sort((a,b)=>(metric(b,m)||-1)-(metric(a,m)||-1))}
let shelfEdit=false,shelfKeys=[];
function orderItems(items){const o=S.order||[],by=new Map(items.map(x=>[x.k,x]));const first=o.filter(k=>by.has(k)).map(k=>by.get(k)),rest=items.filter(x=>!o.includes(x.k));return first.concat(rest)}
function railsHTML(){
 const fin=onShelf('finished').sort(byFin),fy=fin.filter(b=>b.fin&&b.fin.startsWith(YEAR));
 const m=['rating',...CATS.map(c=>c[0])].includes(S.sort)?S.sort:'rating',top=S.books.filter(b=>metric(b,m)).sort((a,b)=>metric(b,m)-metric(a,b)).slice(0,10);
 const items=[],add=(name,count,books)=>items.push({k:name,count,html:rail(name,count,books)});
 if(top.length)add('Top ranked',m==='rating'?'by overall rating':'by '+(CATS.find(c=>c[0]===m)||[0,m])[1].toLowerCase(),top);
 add(SH.reading,nb(onShelf('reading').length),sorted(onShelf('reading')));add(SH.want,nb(onShelf('want').length),sorted(onShelf('want')));
 add('Finished in '+YEAR,nb(fy.length),sorted(fy));
 if(fin.length>fy.length)add('Finished earlier or undated',nb(fin.length-fy.length),sorted(fin.filter(b=>!fy.includes(b))));
 S.custom.forEach(n=>{const l=S.books.filter(b=>b.custom.includes(n));items.push({k:n,count:'',html:rail(n,'Custom shelf · '+nb(l.length),sorted(l),`<button type="button" class="delsh" data-act="delshelf" data-k="${esc(n)}" aria-label="Delete shelf ${esc(n)}" title="Delete shelf"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg></button>`)})});
 add(SH.dnf,nb(onShelf('dnf').length),sorted(onShelf('dnf')));
 const ord=orderItems(items);shelfKeys=ord.map(x=>x.k);
 if(!shelfEdit)return ord.map(x=>x.html).join('');
 return `<div class="inner"><p class="hint" style="margin:0 0 12px">Use the arrows or drag a shelf to change the order. Your choice is saved.</p><div class="ordlist">${ord.map((x,i)=>`<div class="ord" draggable="true" data-k="${esc(x.k)}"><span class="grip" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span><span class="on"><b>${esc(x.k)}</b><small>${esc(x.count)}</small></span><button class="btn mv" data-act="mv" data-k="${esc(x.k)}" data-d="-1" aria-label="Move ${esc(x.k)} up"${i===0?' disabled':''}>↑</button><button class="btn mv" data-act="mv" data-k="${esc(x.k)}" data-d="1" aria-label="Move ${esc(x.k)} down"${i===ord.length-1?' disabled':''}>↓</button></div>`).join('')}</div><p style="margin:14px 0 0"><button class="lnk" data-act="resetorder">Reset to default order</button></p></div>`}
function vShelf(){return `<div class="inner"><div class="pagehead"><div><h2>My Shelf</h2><p>Your shelves, your rules. Open any book to rate it, move it or add notes.</p></div><div class="hdacts"><label class="sortl">Sort <select id="sortby">${SORTS.map(([k,l])=>`<option value="${k}"${S.sort===k?' selected':''}>${l}</option>`).join('')}</select></label><button class="btn" id="foldall" data-act="foldall">Collapse all</button><button class="btn" id="reorderbtn" data-act="reorder">Reorder</button><button class="btn" data-act="newshelf">New shelf</button></div></div></div><div class="search"><input id="q" type="search" placeholder="Search any book or author" autocomplete="off" aria-label="Search books"><div class="results" id="results"></div></div><div id="rails">${railsHTML()}</div>`}

let dragK=null;
document.addEventListener('dragstart',e=>{const r=e.target.closest&&e.target.closest('.ord');if(!r)return;dragK=r.dataset.k;r.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragK)}catch(x){}});
document.addEventListener('dragover',e=>{if(dragK&&e.target.closest&&e.target.closest('.ord'))e.preventDefault()});
document.addEventListener('dragend',()=>{dragK=null;$$('.ord.dragging').forEach(x=>x.classList.remove('dragging'))});
document.addEventListener('drop',e=>{const r=e.target.closest&&e.target.closest('.ord');if(!r||!dragK)return;e.preventDefault();const to=r.dataset.k;if(to===dragK){dragK=null;return}
 const a2=shelfKeys.filter(k=>k!==dragK),i=a2.indexOf(to),from=shelfKeys.indexOf(dragK),toI=shelfKeys.indexOf(to);a2.splice(from<toI?i+1:i,0,dragK);S.order=a2;dragK=null;save();refreshRails()});
function syncFoldAll(){const rb=$('#reorderbtn');if(rb)rb.textContent=shelfEdit?'Done':'Reorder';const b=$('#foldall');if(!b)return;b.hidden=shelfEdit;const ks=$$('#rails .fold').map(x=>x.dataset.k);b.textContent=ks.some(k=>!S.fold[k])?'Collapse all':'Expand all'}
function refreshRails(){const r=$('#rails');if(r){r.innerHTML=railsHTML();lazy(r)}}
const qcache=new Map();let sAbort,sTimer,lastRes=[];
async function searchBooks(q,signal){if(qcache.has(q))return qcache.get(q);let res=[];
 try{const r=await fetch('https://openlibrary.org/search.json?limit=8&fields=key,title,author_name,cover_i,first_publish_year,number_of_pages_median&q='+encodeURIComponent(q),{signal});const j=await r.json();
  res=(j.docs||[]).map(d=>({key:d.key,t:d.title,a:(d.author_name||['Unknown author'])[0],y:d.first_publish_year,pages:d.number_of_pages_median||0,img:d.cover_i?'https://covers.openlibrary.org/b/id/'+d.cover_i+'-M.jpg':null,src:'Open Library'}))}catch(e){if(e.name==='AbortError')throw e}
 if(res.length<4){try{const r=await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=8&q='+encodeURIComponent(q),{signal});const j=await r.json();
  const seen=new Set(res.map(x=>key(x.t,x.a)));
  (j.items||[]).forEach(v=>{const i=v.volumeInfo,x={t:i.title,a:(i.authors||['Unknown author'])[0],y:(i.publishedDate||'').slice(0,4),desc:(i.description||'').replace(/<[^>]*>/g,''),pages:i.pageCount||0,img:i.imageLinks?(i.imageLinks.thumbnail||'').replace('http:','https:'):null,src:'Google Books'};if(!seen.has(key(x.t,x.a)))res.push(x)})}catch(e){if(e.name==='AbortError')throw e}}
 res=res.slice(0,10);if(res.length)qcache.set(q,res);return res}
function wireSearch(){const inp=$('#q'),box=$('#results');if(!inp)return;
 inp.oninput=()=>{clearTimeout(sTimer);const q=inp.value.trim();if(q.length<3){box.classList.remove('open');return}
  box.classList.add('open');box.innerHTML='<div class="status">Searching…</div>';
  sTimer=setTimeout(async()=>{if(sAbort)sAbort.abort();sAbort=new AbortController();let res;
   try{res=await searchBooks(q,sAbort.signal)}catch(e){return}
   if(inp.value.trim()!==q)return;lastRes=res;
   if(!res.length){box.innerHTML='<div class="status">No books found. If this keeps happening, your browser may be blocking outside requests.</div>';return}
   const opts=Object.entries(SH).map(([k,v])=>`<option value="${k}"${k==='want'?' selected':''}>${v}</option>`).join('')+S.custom.map(n=>`<option value="c:${esc(n)}">${esc(n)}</option>`).join('');
   box.innerHTML=res.map((r,i)=>`<div class="res"><button type="button" class="resmain" data-act="sprev" data-i="${i}" aria-label="Preview ${esc(r.t)}"><span class="th" style="${r.img?'background-image:url('+esc(r.img)+')':''}"></span><span class="tx"><b>${esc(r.t)}</b><small>${esc(r.a)}${r.y?' · '+r.y:''}${r.pages?' · '+r.pages+' pages':''}</small><small class="more">Tap for details</small></span></button><div class="resact"><select aria-label="Shelf">${opts}</select><button data-act="sadd" data-i="${i}">Add</button></div></div>`).join('')},350)}}

function shelfOpts(){return Object.entries(SH).map(([k,v])=>`<option value="${k}"${k==='want'?' selected':''}>${v}</option>`).join('')+S.custom.map(n=>`<option value="c:${esc(n)}">${esc(n)}</option>`).join('')}
function searchPreview(i){const r=lastRes[i];if(!r)return;const big=r.img?r.img.replace('-M.jpg','-L.jpg').replace('zoom=1','zoom=2'):'';
 bd.dataset.id='';bd.innerHTML=`<div class="dq"><div class="big" style="${big?'background-image:url('+esc(big)+');':''}background-color:#7C9A5E;background-size:cover;background-position:center"></div><div><h4>${esc(r.t)}</h4><div class="sub">${esc(r.a)}</div><p class="hint" style="margin:6px 0 0">${[r.y,r.pages?r.pages+' pages':'',r.src].filter(Boolean).join(' · ')}</p><p class="pvdesc hint" id="pvdesc" style="margin:12px 0;line-height:1.5">${r.desc?esc(r.desc.slice(0,600)):(r.key?'Loading description…':'No description available.')}</p><div class="fld"><label>Add to<select id="pvshelf">${shelfOpts()}</select></label></div><div class="acts"><button class="btn pri" data-act="sadd2" data-i="${i}">Add to shelf</button><button class="btn" data-act="close-dlg">Back</button></div></div></div>`;
 if(!bd.open)bd.showModal();
 if(!r.desc&&r.key&&!r.dtried){r.dtried=1;fetch('https://openlibrary.org'+r.key+'.json').then(x=>x.json()).then(j=>{const d=typeof j.description==='string'?j.description:(j.description&&j.description.value)||'';r.desc=d.replace(/\[[^\]]*\]\([^)]*\)/g,'').split('\n')[0].slice(0,600);const el=$('#pvdesc');if(el&&bd.open)el.textContent=r.desc||'No description available.'}).catch(()=>{const el=$('#pvdesc');if(el)el.textContent='No description available.'})}
 else if(!r.desc&&!r.key){}
}
function searchAdd2(btn){const r=lastRes[+btn.dataset.i],val=$('#pvshelf').value;const b=addBook(r,val.startsWith('c:')?'want':val);if(val.startsWith('c:'))place(b,val);else if(b.shelf!==val)setShelf(b,val);bd.close();const rb=document.querySelector('.res [data-act=sadd][data-i="'+btn.dataset.i+'"]');if(rb){rb.textContent='Added';rb.disabled=true}toast('Added '+r.t);refreshRails()}
function searchAdd(btn){const r=lastRes[+btn.dataset.i],val=btn.previousElementSibling.value;
 const b=addBook(r,val.startsWith('c:')?'want':val);if(val.startsWith('c:'))place(b,val);else if(b.shelf!==val)setShelf(b,val);
 btn.textContent='Added';btn.disabled=true;toast('Added '+r.t);refreshRails()}

/* ---------- book dialog: rate, move, track progress, note ---------- */
function notesHTML(b){return b.notes.length?`<ol class="nlist">${b.notes.map(n=>`<li><div class="nt">${esc(n.t)}</div><div class="nm"><small>${fmtD((n.ts||'').slice(0,10))}</small><button type="button" class="nx" data-act="delnote" data-id="${esc(b.id)}" data-n="${esc(n.id)}" aria-label="Remove note">Remove</button></div></li>`).join('')}</ol>`:'<p class="hint" style="margin:6px 0">No notes yet.</p>'}
function openBook(id,focusNote){const b=bk(id);if(!b)return;const n=b.chapters&&b.chapters.length;
 bd.dataset.id=id;
 bd.innerHTML=`<div class="dq"><div class="big" ${cvAttrs(b)} style="background-color:${col(b)}"></div><div><h4>${esc(b.t)}</h4><div class="sub">${esc(b.a)}${b.pages?' · '+b.pages+' pages':''}</div>${b.tags.length?`<div class="tags" style="margin-top:10px">${b.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
 <div class="fld"><label>Shelf<select data-f="shelf">${Object.entries(SH).map(([k,v])=>`<option value="${k}"${b.shelf===k?' selected':''}>${v}</option>`).join('')}</select></label></div>
 ${b.shelf==='finished'?`<div class="fld"><label>Rating style<select data-f="method"><option value=""${!b.method?' selected':''}>Auto (${isRom(b)?'chili peppers for romance':'stars'})</option><option value="stars"${b.method==='stars'?' selected':''}>Stars</option><option value="chili"${b.method==='chili'?' selected':''}>Chili peppers</option></select></label></div>${raterBlock(b,'overall','Overall')}<details class="rank"><summary>Rank the details</summary>${CATS.map(([c,l])=>raterBlock(b,c,l)).join('')}</details>`:''}
 ${b.shelf!=='want'?`<div class="dates">${b.shelf!=='want'?`<div class="fld"><label>Started on<input type="date" data-f="started" value="${b.started||''}" max="${TODAY}"></label></div>`:''}${b.shelf==='finished'?`<div class="fld"><label>Finished on<input type="date" data-f="fin" value="${b.fin||''}" max="${TODAY}"></label></div>`:''}</div>`:''}
 ${b.shelf==='reading'?`<div class="fld"><span class="lbl2">Track progress by</span><div class="seg" role="group" aria-label="Track progress by"><button type="button" class="${pgMode()?'':'on'}" data-act="track" data-v="chapters" aria-pressed="${!pgMode()}">Chapters</button><button type="button" class="${pgMode()?'on':''}" data-act="track" data-v="pages" aria-pressed="${pgMode()}">Pages</button></div></div>`+(pgMode()?(b.pages?`<div class="fld"><label>Current page <output>${b.pg||0} of ${b.pages}</output><input type="range" min="0" max="${b.pages}" step="1" value="${b.pg||0}" data-f="pg"></label><label class="pgnum">Or type it <input type="number" inputmode="numeric" min="0" max="${b.pages}" value="${b.pg||0}" data-f="pgn"></label><p class="hint" style="margin:6px 0 0">${progress(b)}% read${n?' · about chapter '+Math.min(n,(b.cur||0)+1)+' of '+n:''}</p></div>`:`<div class="fld"><label>Total pages<input type="number" inputmode="numeric" min="1" max="20000" placeholder="e.g. 320" data-f="pages"></label><p class="hint" style="margin:6px 0 0">Add the page count to track by page.</p></div>`):(n?`<div class="fld"><label>Chapters finished <output>${b.cur} of ${n}</output><input type="range" min="0" max="${n}" step="1" value="${b.cur}" data-f="cur"></label>${b.pages?`<p class="hint" style="margin:6px 0 0">About page ${b.pg||0} of ${b.pages} · ${progress(b)}% read</p>`:''}</div>`:`<div class="fld"><label>Progress <output>${b.pr||0}%</output><input type="range" min="0" max="100" step="1" value="${b.pr||0}" data-f="pr"></label></div>`)):''}
 ${S.custom.length?`<div class="fld"><span class="lab">Custom shelves</span><div class="chips" style="margin:6px 0 0">${S.custom.map(c=>`<label class="chip chk"><input type="checkbox" data-f="custom" data-name="${esc(c)}"${b.custom.includes(c)?' checked':''}> ${esc(c)}</label>`).join('')}</div></div>`:''}
 <div class="fld notes"><span class="lab">Notes <small>${b.notes.length?b.notes.length+' in the order you added them':''}</small></span>${notesHTML(b)}<textarea id="newnote" rows="2" placeholder="Quotes, thoughts, where you stopped"></textarea><button class="btn" type="button" data-act="addnote" data-id="${esc(b.id)}">Add note</button></div>
 <div class="acts"><button class="btn pri" data-act="close-dlg">Done</button>${cloud.user&&accepted().length?`<button class="btn" data-act="recfriend" data-id="${esc(b.id)}">Recommend to a friend</button>`:''}<button class="btn danger" data-act="remove" data-id="${esc(b.id)}">Remove</button></div></div></div>`;
 if(!bd.open)bd.showModal();lazy(bd);if(focusNote)$('#newnote',bd).focus()}
bd.addEventListener('input',e=>{if(e.target.type==='range'){const o=$('output',e.target.closest('label'));const f=e.target.dataset.f,v=e.target.value;if(o)o.textContent=f==='pr'?v+'%':f==='pg'?v+' of '+bk(bd.dataset.id).pages:v+' of '+bk(bd.dataset.id).chapters.length}});
bd.addEventListener('change',e=>{const b=bk(bd.dataset.id),f=e.target.dataset.f;if(!b||!f)return;const v=e.target.value;
 if(f==='shelf'){setShelf(b,v);openBook(b.id)}
 else if(f==='method'){b.method=v;save();openBook(b.id)}
 else if(f==='started'){b.started=v||null;save()}
 else if(f==='fin'){b.fin=v||null;save()}
 else if(f==='cur'){setCh(b,v);save();setTimeout(()=>openBook(b.id),0)}
 else if(f==='pr'){b.pr=+v;save()}
 else if(f==='pg'||f==='pgn'){setPg(b,v);save();setTimeout(()=>openBook(b.id),0)}
 else if(f==='pages'){const n=Math.round(+v);if(n>0){b.pages=n;b.pg=Math.round((b.pr||0)*n/100);save();setTimeout(()=>openBook(b.id),0)}}
 else if(f==='custom'){const n=e.target.dataset.name;b.custom=e.target.checked?[...new Set([...b.custom,n])]:b.custom.filter(x=>x!==n);save()}});
bd.addEventListener('close',()=>{render()});
dq.addEventListener('close',()=>{render()});

/* ---------- generic small form dialog ---------- */
function openForm(title,fields,submit,cta='Save'){
 fm.innerHTML=`<form class="fmbody"><h4 style="font:700 22px Space Grotesk,system-ui,sans-serif;margin:0 0 14px">${title}</h4>${fields}<div class="acts" style="margin-top:18px"><button class="btn pri" type="submit">${cta}</button><button class="btn" type="button" data-act="close-dlg">Cancel</button></div></form>`;
 $('form',fm).onsubmit=e=>{e.preventDefault();submit(new FormData(e.target));fm.close()};fm.showModal();const f=$('input,select',fm);if(f)f.focus()}

/* ---------- DISCOVER ---------- */
let dm='';
function vDiscover(){const done=onShelf('finished').length;
 if(done<GOAL_UNLOCK)return `<div class="inner"><div class="pagehead"><div><h2>Suggestions unlock at ${GOAL_UNLOCK} books</h2><p>Log ${GOAL_UNLOCK-done} more finished books and Readers will start suggesting what to read next. No ads, no buy buttons.</p></div></div>${meter(done,GOAL_UNLOCK)}<div class="btnrow"><button class="btn pri" data-go="profile">Import from Goodreads</button><button class="btn" data-go="shelf">Add books on My Shelf</button></div></div>`;
 const ls=lanes(dm);
 return `<div class="inner"><div class="pagehead"><div><h2>Picked for you</h2><p>Some picks match your taste, and some are here to take you somewhere new. Nothing is sponsored.</p></div></div>
 <div class="chips" role="group" aria-label="Filter by mood"><button class="chip" aria-pressed="${!dm}" data-act="mood" data-m="">All moods</button>${MOODS.map(m=>`<button class="chip" aria-pressed="${dm===m}" data-act="mood" data-m="${m}">${m}</button>`).join('')}</div>
 ${ls.length?ls.map(l=>`<section class="lane lane-${l.k}"><div class="lanehd"><h3>${esc(l.title)}</h3><p>${esc(l.sub)}</p></div><div class="rcs">${l.items.map(x=>recCard(x)).join('')}</div></section>`).join(''):`<div class="card"><p style="margin:0">No more ${dm?esc(dm.toLowerCase())+' ':''}suggestions right now. Try another mood or finish a few more books.</p></div>`}</div>`}

/* ---------- CLUBS ---------- */
let cid=null,cch=null;
function vClubs(){
 const head=`<div class="pagehead"><div><h2>Book clubs</h2>${CLS().length?'<p>Discussion threads open as you reach each chapter, so there are no spoilers.</p>':''}</div>${CLS().length?`<div class="btnrow" style="margin:0">${cloud.user?'<button class="btn" data-act="joinclub">Join with code</button>':''}<button class="btn pri" data-act="newclub">Start a club</button></div>`:''}</div>${cloud.on&&!cloud.user?'<div class="card" style="margin-bottom:16px"><p style="margin:0 0 10px"><b>These are demo clubs.</b> Sign in to start real clubs and invite friends with a code.</p><button class="btn pri" data-act="signin">Sign in or sign up</button></div>':''}`;
 if(!CLS().length)return `<div class="inner">${head}${invitesCard()}${clubsEmpty()}</div>`;
 const cl=CLS().find(c=>c.id===cid)||CLS()[0];if(cid!==cl.id){cid=cl.id;cch=null}
 const b=bk(cl.bookId);if(!b)return `<div class="inner">${head}${invitesCard()}<div class="card"><p>The book for this club is no longer in your library.</p><button class="btn danger" data-act="delclub" data-id="${cl.id}">Delete club</button></div></div>`;
 if(!b.chapters){b.chapters=genCh(12);b.cur=Math.round((b.pr||0)*12/100)}
 const n=b.chapters.length,me=b.cur;if(cch==null)cch=Math.max(1,Math.min(me||1,n));
 const nxt=cl.sched.find(s=>me<s.upto),prev=nxt?(cl.sched[cl.sched.indexOf(nxt)-1]||{upto:0}).upto:0;
 const days=nxt?Math.ceil((new Date(nxt.due+'T23:59:59')-Date.now())/864e5):0;
 const mile=nxt?`Chapters ${prev+1} to ${nxt.upto} by ${fmtDate(nxt.due)}`:'You are caught up on every milestone';
 const sub=nxt?`${nxt.upto-me} chapter${nxt.upto-me===1?'':'s'} to go · ${days>0?days+' days left':'due now'}`:'Nice work.';
 const mem=[{n:'You',ch:me,me:1},...cl.members].sort((x,y)=>y.ch-x.ch);
 const posts=cl.posts.filter(p=>p.ch===cch).sort((x,y)=>x.ts.localeCompare(y.ts)),locked=cch>me;
 return `<div class="inner">${head}${invitesCard()}<div class="chips" role="group" aria-label="Your clubs">${CLS().map(c=>`<button class="chip" aria-pressed="${c.id===cl.id}" data-act="club" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>
 <div class="grid club">
 <section class="card"><div class="lbl">Current pick</div><h3 class="ct">${esc(b.t)}</h3><p class="by" style="margin:0 0 14px">${esc(b.a)}</p>
  ${cl.code?`<p class="by" style="margin:0 0 14px">Invite code <b class="code">${esc(cl.code)}</b> <button class="btn" data-act="copycode" data-code="${esc(cl.code)}">Copy</button> <button class="btn pri" data-act="shareinv" data-code="${esc(cl.code)}" data-name="${esc(cl.name)}" data-book="${esc(b.t)}">Share invite</button></p>`:''}
  <div class="chap">${esc(mile)}<small>${sub}</small></div>
  <div class="ticks" aria-hidden="true">${b.chapters.map((_,i)=>`<span class="${i<me?'done':i===me?'cur':''}"></span>`).join('')}</div>
  <p class="by" style="margin:6px 0 0">You are on chapter ${Math.min(me+1,n)} of ${n}</p>${nudgeLine(cl,me)}
  <div class="btnrow">${me<n?`<button class="btn pri" data-act="clubnext" data-id="${esc(b.id)}">Finished chapter ${me+1}</button>`:`<button class="btn pri" data-act="finish" data-id="${esc(b.id)}">Mark book finished</button>`}<button class="btn" data-act="delclub" data-id="${cl.id}">Leave club</button></div></section>
 <section class="card"><h3 class="ct">Members <small>${mem.length}</small></h3>${mem.map(m=>`<div class="mem"><span class="av${m.me?' me':''}">${initials(m.n)}</span><span class="mn">${esc(m.n)}</span><span class="mp">Chapter ${Math.min(m.ch+1,n)}</span><span class="bar"><i style="width:${m.ch/n*100}%"></i></span></div>`).join('')}</section></div>
 <section class="card" style="margin-top:16px"><div class="pagehead" style="margin-bottom:10px"><h3 class="ct" style="margin:0">Discussion</h3><label class="chsel">Chapter <select data-act="chsel">${b.chapters.map((t,i)=>`<option value="${i+1}"${i+1===cch?' selected':''}>${i+1}${i+1>me?' (locked)':''}</option>`).join('')}</select></label></div>
 ${locked?`<div class="lock"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><div><b>Chapter ${cch} is locked</b><br><small>${cloud.user?'Finish chapter '+(me+1)+(cch>me+1?' through '+cch:'')+' to read the comments.':posts.length+' comment'+(posts.length===1?'':'s')+' waiting. Finish chapter '+(me+1)+(cch>me+1?' through '+cch:'')+' to read them.'}</small></div></div>`
 :`${posts.length?posts.map(p=>`<div class="post"><span class="av${(p.who==='You'||(cloud.user&&p.uid===cloud.user.id))?' me':''}">${initials(p.who)}</span><div><b>${esc(p.who)}</b> <small>${ago(p.ts)}</small><p>${esc(p.text)}</p></div></div>`).join(''):'<p class="hint">No comments on this chapter yet. Start the conversation.</p>'}
 <form class="composer" data-form="post"><input name="text" required maxlength="400" placeholder="Add to the chapter ${cch} discussion" aria-label="Add a comment"><button class="btn pri" type="submit">Post</button></form>`}</section></div>`}
function clubNext(id){const b=bk(id);if(b&&b.chapters&&b.cur<b.chapters.length){b.cur++;save();toast('Chapter '+b.cur+' done. Chapter '+b.cur+' discussion unlocked.');cch=b.cur;render()}}
function newClub(){const opts=S.books.filter(b=>b.shelf==='reading'||b.shelf==='want');
 if(!opts.length)return toast('Add a book to your shelf first');
 openForm('Start a book club',`<div class="fld"><label>Club name<input name="name" required maxlength="40" placeholder="Sunday Page Turners"></label></div><div class="fld"><label>Book<select name="book">${opts.map(b=>`<option value="${esc(b.id)}">${esc(b.t)}</option>`).join('')}</select></label></div><div class="fld"><label>Chapters to discuss<input name="n" type="number" min="2" max="60" value="12"></label></div>`,
 fd=>{const b=bk(fd.get('book')),n=Math.max(2,Math.min(60,+fd.get('n')||12));
  if(!b.chapters){b.chapters=genCh(n);b.cur=Math.round((b.pr||0)*n/100)}
  const d=k=>new Date(Date.now()+k*864e5).toISOString().slice(0,10),N=b.chapters.length;
  const c={id:'c'+Date.now(),name:fd.get('name'),bookId:b.id,members:[],sched:[{upto:Math.ceil(N/2),due:d(14)},{upto:N,due:d(28)}],posts:[]};
  if(cloud.user){const row={name:fd.get('name').trim(),book_title:b.t,book_author:b.a,pages:b.pages||0,chapters:b.chapters,sched:c.sched};
   db.newClub(row,{name:S.profile.name,ch:b.cur||0}).then(async r=>{if(b.shelf==='want'){setShelf(b,'reading');b.fin=null;b.pr=0}await loadClubs();cid=r.id;cch=null;toast('Club created. Invite code '+r.code);render()}).catch(fail);return}
  S.clubs.push(c);if(b.shelf==='want')setShelf(b,'reading'),b.fin=null,b.pr=0;cid=c.id;cch=null;save();toast('Club created');render()},'Create club')}
function joinClub(){openForm('Join a club','<div class="fld"><label>Invite code<input name="code" required maxlength="12" autocapitalize="none" autocomplete="off" placeholder="a1b2c3"></label></div>',
 fd=>{db.join(fd.get('code').trim().toLowerCase(),S.profile.name).then(async r=>{await loadClubs();cid=r.id;cch=null;toast('Joined '+r.name);render()}).catch(fail)},'Join club')}

/* ---------- STATS (all derived from your shelves) ---------- */
function catStats(rated){const rows=[['rating','Overall'],...CATS].map(([k,l])=>{const v=all_(k);return v}).filter(Boolean);
 function all_(k){const l=S.books.filter(b=>metric(b,k));if(!l.length)return null;const nm=k==='rating'?'Overall':(CATS.find(c=>c[0]===k)||[0,k])[1];return{nm,avg:l.reduce((a,b)=>a+metric(b,k),0)/l.length,n:l.length}}
 const ch=rated.filter(b=>method(b)==='chili'),st=rated.filter(b=>method(b)!=='chili'),av=l=>l.length?(l.reduce((a,b)=>a+b.rating,0)/l.length).toFixed(1):'';
 if(!rows.length)return '';
 return `<section class="card" style="margin-top:16px"><h3 class="ct">Your rankings</h3><div class="dist">${rows.map(r=>`<div class="d wide"><span>${r.nm}</span><div class="bar"><i style="width:${r.avg/5*100}%;display:block;height:100%;background:var(--page-orange)"></i></div><span>${r.avg.toFixed(1)}</span></div>`).join('')}</div>${ch.length?`<p class="hint" style="margin:8px 0 0">Romance, in chili peppers: ${av(ch)} average across ${ch.length}. Everything else, in stars: ${av(st)||'none yet'}.</p>`:''}</section>`}
function vStats(){
 const fy=finYear(),all=onShelf('finished'),n=fy.length,goal=S.goal;
 const rated=all.filter(b=>b.rating!=null),avg=rated.length?(rated.reduce((a,b)=>a+b.rating,0)/rated.length).toFixed(1):'None yet';
 const months=Array(12).fill(0);fy.forEach(b=>months[+b.fin.slice(5,7)-1]++);const mx=Math.max(1,...months),cm=new Date().getMonth();
 const dist=[5,4,3,2,1].map(s=>({s,c:rated.filter(b=>Math.round(b.rating)===s).length})),dmx=Math.max(1,...dist.map(d=>d.c));
 const mood={};fy.forEach(b=>b.tags.filter(t=>MOODS.includes(t)).forEach(t=>mood[t]=(mood[t]||0)+1));
 const moods=Object.entries(mood).sort((a,b)=>b[1]-a[1]).slice(0,6);
 const pages=fy.reduce((a,b)=>a+(b.pages||0),0),withP=fy.filter(b=>b.pages),long=withP.slice().sort((a,b)=>b.pages-a.pages)[0];
 const doy=Math.floor((Date.now()-new Date(YEAR,0,0))/864e5),left=Math.max(0,goal-n),dl=Math.max(1,365-doy),proj=Math.round(n/doy*365);
 const ci=2*Math.PI*52,pct=Math.min(1,n/goal);
 const msg=left===0?'Goal reached. Nice work.':`${left} to go, about one book every ${(dl/left).toFixed(1)} days. At your current pace you will finish ${proj}.`;
 return `<div class="inner"><div class="pagehead"><div><h2>${n} books toward your goal of ${goal}</h2><p>${moods.length?`Most read mood this year: ${moods[0][0].toLowerCase()}. `:''}Average rating ${avg}.</p></div><div class="stepper" role="group" aria-label="Yearly goal"><button class="btn" data-act="goal" data-d="-1" aria-label="Lower goal">−</button><span>Goal ${goal}</span><button class="btn" data-act="goal" data-d="1" aria-label="Raise goal">+</button></div></div>
 <div class="grid"><section class="card ringcard"><svg viewBox="0 0 120 120" width="132" height="132" role="img" aria-label="${n} of ${goal} books"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(127,127,127,.25)" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="var(--page-orange)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${pct*ci} ${ci}" transform="rotate(-90 60 60)"/><text x="60" y="66" text-anchor="middle" font-family="Space Grotesk,system-ui,sans-serif" font-size="26" font-weight="700" fill="currentColor">${Math.round(pct*100)}%</text></svg><p>${msg}</p></section>
 <section class="card"><div class="stat-grid"><div class="kpi"><b>${n}</b><small>Finished in ${YEAR}</small></div><div class="kpi"><b>${pages.toLocaleString()}</b><small>Pages read</small></div><div class="kpi"><b>${withP.length?Math.round(pages/withP.length):0}</b><small>Avg pages per book</small></div></div>${long?`<p class="hint" style="margin:0">Longest read: <b>${esc(long.t)}</b> (${long.pages} pages)</p>`:''}</section></div>
 <section class="card" style="margin-top:16px"><h3 class="ct">Books finished by month</h3><div class="mbars">${months.map((v,i)=>`<div class="mb"><span class="mv">${v||''}</span><i class="${i===cm?'cur':''}" style="height:${v/mx*100}%"></i><small>${'JFMAMJJASOND'[i]}</small></div>`).join('')}</div></section>
 ${catStats(rated)}<div class="grid" style="margin-top:16px"><section class="card"><h3 class="ct">How you rate</h3><div class="dist">${dist.map(d=>`<div class="d"><span>${d.s} ★</span><div class="bar"><i style="width:${d.c/dmx*100}%;display:block;height:100%;background:var(--page-orange)"></i></div><span>${d.c}</span></div>`).join('')}</div></section>
 <section class="card"><h3 class="ct">Moods you read</h3>${moods.length?`<div class="chips" style="margin:0">${moods.map(([m,c])=>`<span class="chip">${m} · ${c}</span>`).join('')}</div>`:'<p class="hint">Finish a few books to see your moods.</p>'}</section></div></div>`}

/* ---------- PROFILE ---------- */
function accountCard(){if(!cloud.on)return '';
 if(!cloud.user)return `<section class="card sec"><h3 class="ct">Account</h3><p class="hint" style="margin:0 0 10px">You are using demo data stored on this device. Create an account to save your shelves online and join real book clubs.</p><div class="btnrow" style="margin:0"><button class="btn pri" data-act="signup">Create account</button><button class="btn" data-act="signin">Sign in</button></div></section>`;
 return `<section class="card sec"><h3 class="ct">Account</h3><p class="hint" style="margin:0 0 10px">Signed in as ${esc(cloud.user.email)}. Your shelves, ratings, notes and clubs are saved to your account.${cloud.err?' <b>Sync problem: '+esc(cloud.err)+'</b>':''}</p><div class="btnrow" style="margin:0"><button class="btn" data-act="signout">Sign out</button></div></section>
 <section class="card sec"><h3 class="ct">Send feedback</h3><div class="fld"><textarea id="fbtext" rows="3" maxlength="2000" placeholder="What is confusing, broken or missing?" aria-label="Feedback" style="width:100%;box-sizing:border-box"></textarea></div><button class="btn pri" data-act="sendfb">Send</button></section>`}

function friendsCard(){if(!cloud.user)return '';const fr=cloud.friends||[],ok=fr.filter(f=>f.status==='accepted').length,inc=fr.filter(f=>f.status==='pending'&&f.incoming).length;
 return `<section class="card sec"><h3 class="ct">Friends</h3><p class="hint" style="margin:0 0 10px">${ok} friend${ok===1?'':'s'}${inc?', '+inc+' request'+(inc===1?'':'s')+' waiting':''}. Add friends to see the books they loved in Discover.</p><button class="btn pri" data-act="gofriends">Open Friends</button></section>`}
function vProfile(){const p=S.profile,sh=[...Object.keys(SH),...S.custom.map(c=>'c:'+c)],nm=k=>k.startsWith('c:')?k.slice(2):SH[k];
 const vis=(v,f)=>['public','friends','private'].map(o=>`<option value="${o}"${v===o?' selected':''}>${o[0].toUpperCase()+o.slice(1)}</option>`).join('');
 return `<div class="mobonly" style="margin:0 0 14px"><button class="btn" data-go="stats" style="width:100%">See your reading stats</button></div><div class="profhead"><span class="av big">${esc(initials(p.name||'R'))}</span><div><h2 style="text-align:left;margin:0">${esc(p.name)}</h2><p style="margin:2px 0 0;text-align:left">Reading since ${p.since}. ${S.books.length} books in your library${p.imported?`, ${p.imported} imported from Goodreads`:''}.</p></div></div>
 ${accountCard()}${friendsCard()}${notifCard()}<section class="card sec"><h3 class="ct">Profile</h3><div class="fld"><label>Display name<input data-p="name" value="${esc(p.name)}" maxlength="40"></label></div><div class="fld"><label>Profile visibility<select data-p="vis">${vis(p.vis)}</select></label></div></section>
 <section class="card sec"><h3 class="ct">Shelf privacy</h3>${sh.map(k=>`<div class="prow"><span>${esc(nm(k))}</span><select data-p="priv" data-k="${esc(k)}" aria-label="${esc(nm(k))} visibility">${vis(p.priv[k]||p.vis)}</select></div>`).join('')}</section>
 <section class="card sec"><h3 class="ct">Bring your books</h3><p class="hint" style="margin:0 0 10px">In Goodreads, open My Books, choose Import and export, then Export Library. Drop the CSV here. Books already in your library are skipped.</p><div class="btnrow" style="margin:0"><label class="btn pri filebtn">Import Goodreads CSV<input type="file" accept=".csv,text/csv" data-import="csv" hidden></label></div></section>
 <section class="card sec"><h3 class="ct">Your data</h3><p class="hint" style="margin:0 0 10px">${cloud.on?'Your library is saved to your account. You can also export a backup any time.':'Everything is stored on this device. Export a backup any time.'}</p><div class="btnrow" style="margin:0"><button class="btn" data-act="export">Export backup</button><label class="btn filebtn">Restore backup<input type="file" accept=".json,application/json" data-import="json" hidden></label><button class="btn" data-act="clearcovers">Refresh covers</button>${cloud.on?'<button class="btn" data-act="sample">Add sample books</button>':'<button class="btn danger" data-act="reset">Reset demo data</button>'}</div></section>`}
function parseCSV(s){const rows=[];let r=[],f='',q=false;
 for(let i=0;i<s.length;i++){const c=s[i];
  if(q){if(c==='"'){if(s[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;else if(c===','){r.push(f);f=''}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;r.push(f);f='';if(r.length>1||r[0]!=='')rows.push(r);r=[]}else f+=c}
 if(f!==''||r.length){r.push(f);rows.push(r)}return rows}
function importGR(text){const rows=parseCSV(text);if(rows.length<2)return toast('That file has no rows');
 const h=rows[0].map(x=>x.trim().toLowerCase()),ix=n=>h.indexOf(n);
 const [it,ia,ir,is,ip,id,ib]=['title','author','my rating','exclusive shelf','number of pages','date read','bookshelves'].map(ix);
 if(it<0||ia<0)return toast('This does not look like a Goodreads export');
 let add=0,skip=0;
 rows.slice(1).forEach(r=>{const t=(r[it]||'').replace(/\s*\([^)]*#[^)]*\)\s*$/,'').trim(),a=(r[ia]||'').trim();if(!t)return;
  if(bk(key(t,a))){skip++;return}
  const sh={read:'finished','currently-reading':'reading','to-read':'want'}[(r[is]||'').trim()]||'want',d=(r[id]||'').replace(/\//g,'-').slice(0,10);
  const cust=(r[ib]||'').split(',').map(x=>x.trim()).filter(x=>x&&!['read','to-read','currently-reading'].includes(x));
  cust.forEach(n=>{if(!S.custom.includes(n))S.custom.push(n)});
  S.books.push(B(t,a,sh,{rating:+r[ir]||null,pages:+r[ip]||0,fin:sh==='finished'&&/^\d{4}-\d\d-\d\d$/.test(d)?d:null,custom:cust}));add++});
 S.profile.imported=(S.profile.imported||0)+add;save();toast('Imported '+nb(add)+(skip?' ('+skip+' already in your library)':''));render()}
let resetArm=0;

/* ---------- one delegated event layer for the whole app ---------- */
document.addEventListener('click',e=>{
 if(e.target.tagName==='DIALOG')return e.target.close();
 if(!e.target.closest('.search')){const r=$('#results');if(r)r.classList.remove('open')}
 const go_=e.target.closest('[data-go]');if(go_)return go(go_.dataset.go);
 const q=e.target.closest('[data-q]');if(q)return queueAct(q.dataset.q);
 const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,id=el.dataset.id||(el.closest('#bd')?bd.dataset.id:undefined),b=id&&bk(id);
 if(a==='book')openBook(id);
 else if(a==='note')openBook(id,true);
 else if(a==='close-dlg')el.closest('dialog').close();
 else if(a==='rate'&&b){const f=el.dataset.f,k=method(b);let v=+el.dataset.v;
  if(v&&k==='stars'&&e.detail>0){const r=el.getBoundingClientRect();if(e.clientX<r.left+r.width/2)v-=.5}
  const cur=f==='overall'?b.rating:b.cats[f];if(v===cur)v=0;
  if(f==='overall')b.rating=v||null;else if(v)b.cats[f]=v;else delete b.cats[f];save();
  const box=el.closest('.rater');if(box){const lab=$('.rlab span',box).textContent;box.outerHTML=raterBlock(b,f,lab)}}
 else if(a==='addnote'&&b){const ta=$('#newnote',bd),t=ta.value.trim();if(!t)return ta.focus();b.notes.push({id:'n'+Date.now()+Math.random().toString(36).slice(2,5),t,ts:new Date().toISOString()});save();openBook(id,true)}
 else if(a==='delnote'&&b){const ni=b.notes.findIndex(n=>n.id===el.dataset.n),nn=b.notes[ni];b.notes=b.notes.filter(n=>n.id!==el.dataset.n);save();openBook(id);
  if(nn)toast('Note removed',()=>{const bb=bk(id);if(!bb)return;bb.notes.splice(Math.min(ni,bb.notes.length),0,nn);save();if(bd.open)openBook(id)})}
 else if(a==='scroll'){const t=el.closest('.rail').querySelector('.track');t.scrollBy({left:t.clientWidth*.8*(+el.dataset.d)})}
 else if(a==='track'){S.track=el.dataset.v==='pages'?'pages':'chapters';save();if(bd.open&&bd.dataset.id)openBook(bd.dataset.id);else render()}
 else if(a==='setpg'&&b){const i=el.closest('.pgform').querySelector('input');setPg(b,i.value);save();toast('Saved page '+(b.pg||0));render()}
 else if(a==='nextch'&&b){if(b.cur<b.chapters.length){setCh(b,b.cur+1);save();toast('Now on chapter '+Math.min(b.cur+1,b.chapters.length));render()}}
 else if(a==='finish'&&b){setShelf(b,'finished');render();openBook(id);toast('Marked as finished. Add a rating.')}
 else if(a==='openq'){QR=topPicks();qi=0;renderQ();dq.showModal()}
 else if(a==='remove'){const ob=bk(id),oi=S.books.indexOf(ob);S.books=S.books.filter(x=>x.id!==id);save();bd.close();toast('Removed '+(ob?ob.t:'book'),()=>{if(ob&&!bk(id)){S.books.splice(Math.min(oi,S.books.length),0,ob);save();render()}});render()}
 else if(a==='delshelf'){const n=el.dataset.k,c=S.books.filter(x=>x.custom.includes(n)).length;openForm('Delete shelf?',`<p style="margin:0">Delete <b>${esc(n)}</b>? ${c?'The '+(c===1?'1 book':c+' books')+' on it will stay in your library, they just will not be on this shelf.':'It has no books on it.'} This cannot be undone.</p>`,()=>{S.custom=S.custom.filter(x=>x!==n);S.books.forEach(x=>{x.custom=x.custom.filter(y=>y!==n)});delete S.fold[n];S.order=S.order.filter(x=>x!==n);if(S.profile.priv)delete S.profile.priv['c:'+n];save();render();toast('Deleted shelf '+n)},'Delete shelf')}
 else if(a==='newshelf')openForm('New shelf','<div class="fld"><label>Shelf name<input name="name" required maxlength="30" placeholder="Beach reads"></label></div>',fd=>{const n=fd.get('name').trim();if(n&&!S.custom.includes(n)&&!Object.values(SH).includes(n)){S.custom.push(n);save();refreshRails();toast('Created '+n)}},'Create shelf');
 else if(a==='sadd')searchAdd(el);
 else if(a==='fold'){const k=el.dataset.k;S.fold[k]=!S.fold[k];save();refreshRails();const f=$('#rails .fold[data-k="'+k.replace(/"/g,'\\"')+'"]');if(f)f.focus();syncFoldAll()}
 else if(a==='reorder'){shelfEdit=!shelfEdit;refreshRails();syncFoldAll()}
 else if(a==='mv'){const k=el.dataset.k,d=+el.dataset.d,i=shelfKeys.indexOf(k),j=i+d;if(i<0||j<0||j>=shelfKeys.length)return;const a2=shelfKeys.slice();[a2[i],a2[j]]=[a2[j],a2[i]];S.order=a2;save();refreshRails();const nb2=$('#rails .mv[data-k="'+k.replace(/"/g,'\\"')+'"][data-d="'+d+'"]');if(nb2&&!nb2.disabled)nb2.focus()}
 else if(a==='resetorder'){S.order=[];save();refreshRails()}
 else if(a==='foldall'){const ks=$$('#rails .fold').map(x=>x.dataset.k),some=ks.some(k=>!S.fold[k]);ks.forEach(k=>{S.fold[k]=some});save();refreshRails();syncFoldAll()}
 else if(a==='sprev')searchPreview(+el.dataset.i);
 else if(a==='sadd2')searchAdd2(el);
 else if(a==='mood'){dm=el.dataset.m;render()}
 else if(a==='prev'){bookPreview(id)}
 else if(a==='recadd'){recAdd(el)}
 else if(a==='rec-want'){const c=CATID[id];addBook(c,'want');(c.tags||[]).forEach(t=>S.liked[t]=(S.liked[t]||0)+1);save();toast('Added '+c.t+' to Want to Read');render()}
 else if(a==='rec-no'){const c=CATID[id];S.dismissed.push(id);if(c)c.tags.forEach(t=>S.nope[t]=(S.nope[t]||0)+1);save();toast('Got it. You will see fewer picks like that.',()=>{S.dismissed=S.dismissed.filter(x=>x!==id);if(c)c.tags.forEach(t=>{S.nope[t]=Math.max(0,(S.nope[t]||0)-1)});save();render()});render()}
 else if(a==='copyf'){try{navigator.clipboard.writeText(cloud.fcode);toast('Friend code copied')}catch(x){toast('Code: '+cloud.fcode)}}
 else if(a==='sharef')shareFriend();
 else if(a==='facc')db.respond(id,true).then(async()=>{await loadFriends();toast('You are now friends');render()}).catch(fail);
 else if(a==='fdec')db.respond(id,false).then(async()=>{await loadFriends();render()}).catch(fail);
 else if(a==='frem'){db.unfriend(id).then(async()=>{if(fid===id)fid=null;await loadFriends();render()}).catch(fail)}
 else if(a==='gofriends'){closeMenu();fid=null;go('friends')}
 else if(a==='fview'){fid=id;render();if(document.scrollingElement)document.scrollingElement.scrollTop=0}
 else if(a==='fback'){fid=null;render()}
 else if(a==='addcode')sendFriend(el.dataset.code)
 else if(a==='addm')db.reqUser(el.dataset.uid).then(async r=>{await loadFriends();toast(r.status==='accepted'?'You are now friends with '+r.name:'Request sent to '+r.name);render()}).catch(fail)
 else if(a==='recto')recommendDialog(null,fid)
 else if(a==='recfriend'){bd.close();recommendDialog(id)}
 else if(a==='hidecheck'){S.onbHide=true;save();render()}
 else if(a==='gocl'){closeNotif();cid=id;cch=null;go('clubs')}
 else if(a==='installapp')installApp()
 else if(a==='forgot')forgotPw()
 else if(a==='saveun'){const v=($('#unin').value||'').trim().replace(/^@/,'');if(v&&!/^[A-Za-z0-9_]{3,20}$/.test(v))return toast('Use 3 to 20 letters, numbers or underscores');
  const old=S.profile.username;S.profile.username=v;profSig='';syncProfile().then(()=>{save();toast(v?'Username saved':'Username removed')}).catch(x=>{S.profile.username=old;profSig='';toast(/duplicate|unique/i.test((x&&x.message)||'')?'That username is taken':((x&&x.message)||'Could not save'))})}
 else if(a==='club'){cid=id;cch=null;render()}
 else if(a==='clubnext')clubNext(id);
 else if(a==='newclub')newClub();
 else if(a==='delclub'){if(cloud.user){const c=cloud.clubs.find(x=>x.id===id);if(c)db.leave(c).then(()=>{cloud.clubs=cloud.clubs.filter(x=>x.id!==id);cid=null;render();toast('You left the club')}).catch(fail);return}S.clubs=S.clubs.filter(c=>c.id!==id);cid=null;save();render()}
 else if(a==='joinclub')joinClub();
 else if(a==='copycode'){try{navigator.clipboard.writeText(el.dataset.code);toast('Code copied')}catch(x){toast('Code: '+el.dataset.code)}}
 else if(a==='shareinv')inviteDialog(el.dataset);
 else if(a==='shareinv-other')shareInvite({code:el.dataset.code,name:el.dataset.name,book:el.dataset.book});
 else if(a==='joininv')joinInvite(el.dataset.id,el.dataset.code);
 else if(a==='dropinv')dropInv(el.dataset.id);
 else if(a==='acct'){e.stopPropagation();closeNotif();acctMenu()}
 else if(a==='bell'){e.stopPropagation();bellMenu()}
 else if(a==='nview'){closeNotif();go('discover')}
 else if(a==='nset'){closeNotif();go('profile');setTimeout(()=>{const n=$('#notifset');if(n)n.scrollIntoView({block:'center'})},50)}
 else if(a==='theme'){theme(el.dataset.k);themeOpen=false;refreshMenu()}
 else if(a==='themeopen'){themeOpen=!themeOpen;refreshMenu()}
 else if(a==='gopro'){closeMenu();go('profile')}
 else if(a==='gonotes'){closeMenu();go('notes')}
 else if(a==='signin'||a==='signup'){e.preventDefault();closeMenu();openAuth(a==='signup'?'up':'in')}
 else if(a==='signout'){closeMenu();cloudFlush().finally(async()=>{try{await cloud.sb.auth.signOut()}catch(x){}onSession(null)})}
 else if(a==='sendfb'){const ta=$('#fbtext');const t=ta.value.trim();if(!t)return ta.focus();db.feedback(t).then(()=>{ta.value='';toast('Thanks for the feedback')}).catch(fail)}
 else if(a==='goal'){S.goal=Math.max(1,Math.min(200,S.goal+(+el.dataset.d)));save();render()}
 else if(a==='export'){const u=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='readers-backup.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 else if(a==='clearcovers'){Object.keys(covers).forEach(k=>{if(!covers[k])delete covers[k]});saveCovers();toast('Missing covers will be retried');render()}
 else if(a==='sample'){const add=seed().books.filter(x=>!bk(x.id));S.books.push(...add);normalize();save();toast(add.length?'Added '+add.length+' sample books':'Sample books are already in your library');render()}
 else if(a==='reset'){if(resetArm){S=seed();normalize();save();resetArm=0;toast('Demo data restored');render()}else{resetArm=1;el.textContent='Click again to confirm';setTimeout(()=>{resetArm=0;if(el.isConnected)el.textContent='Reset demo data'},3000)}}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.dataset.p2==='notif'){S.notif[t.dataset.k]=t.checked;save();render();return}
 if(t.dataset.p2==='disc'){S.profile.discoverable=t.checked;save();toast(t.checked?'Others can now find you by name':'Name search is off');return}
 if(t.id==='sortby'){S.sort=t.value;save();refreshRails();return}
 if(t.dataset.act==='chsel'){cch=+t.value;render();return}
 if(t.dataset.p){const p=S.profile;if(t.dataset.p==='priv')p.priv[t.dataset.k]=t.value;else p[t.dataset.p]=t.value;save();if(t.dataset.p==='name'||t.dataset.p==='vis')render();return}
 if(t.dataset.import&&t.files&&t.files[0]){const f=t.files[0],rd=new FileReader();
  rd.onload=()=>{if(t.dataset.import==='csv')importGR(String(rd.result));
   else try{const j=JSON.parse(rd.result);if(!Array.isArray(j.books))throw 0;S=j;normalize();save();toast('Backup restored');render()}catch(x){toast('That backup could not be read')}};
  rd.readAsText(f)}});
document.addEventListener('submit',e=>{const ff=e.target.closest('[data-form="findf"]');if(ff){e.preventDefault();const q=new FormData(ff).get('q').trim();if(!q)return;fq=q;if(/^[a-f0-9]{8}$/i.test(q)){sendFriend(q);return}db.find(q).then(r=>{fres=r;render()}).catch(fail);return}
 const af=e.target.closest('[data-form="addfriend"]');if(af){e.preventDefault();const code=new FormData(af).get('code').trim();if(code)sendFriend(code);return}
 const f=e.target.closest('[data-form="post"]');if(!f)return;e.preventDefault();
 const cl=CLS().find(c=>c.id===cid),txt=new FormData(f).get('text').trim();if(!txt||!cl)return;
 if(cloud.user){db.post({club_id:cl.id,name:S.profile.name,ch:cch,text:txt}).then(r=>{cl.posts.push({id:r.id,ch:r.ch,who:r.name,uid:r.user_id,text:r.text,ts:r.created_at});render()}).catch(fail);return}
 cl.posts.push({id:'p'+Date.now(),ch:cch,who:'You',text:txt,ts:new Date().toISOString()});save();render()});

/* ---------- accounts, sync and live clubs ---------- */
function openAuth(mode='in'){const up=mode==='up';
 fm.innerHTML=`<form class="fmbody" id="authf"><h4 style="font:700 22px Space Grotesk,system-ui,sans-serif;margin:0 0 6px">${up?'Create your account':'Sign in'}</h4><p class="hint" style="margin:0 0 12px">${up?'Your shelves, ratings and clubs are saved to your account.':'Welcome back.'}</p>${up?'<div class="fld"><label>Display name<input name="name" required maxlength="40" autocomplete="nickname"></label></div>':''}<div class="fld"><label>Email<input name="email" type="email" required autocomplete="email"></label></div><div class="fld"><label>Password<input name="pw" type="password" required minlength="6" autocomplete="${up?'new-password':'current-password'}"></label></div>${up?'':'<p style="margin:-4px 0 10px"><button type="button" class="lnk" data-act="forgot">Forgot password?</button></p>'}<p class="autherr" role="alert" style="color:#c0392b;margin:0 0 8px;min-height:1em"></p><div class="acts"><button class="btn pri" type="submit">${up?'Create account':'Sign in'}</button><button class="btn" type="button" data-act="close-dlg">Cancel</button></div><p style="margin:14px 0 0;font-size:14px">${up?'Already have an account?':'New here?'} <a href="#" data-act="${up?'signin':'signup'}">${up?'Sign in':'Create an account'}</a></p></form>`;
 $('#authf',fm).onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),er=$('.autherr',fm),btn=$('button[type=submit]',fm);btn.disabled=true;er.textContent='';
  try{const r=await authSubmit(up?'up':'in',f.get('email').trim(),f.get('pw'),(f.get('name')||'').trim());
   if(r==='confirm'){er.style.color='inherit';er.textContent='Check your email to confirm your account, then sign in.';btn.disabled=false;return}
   fm.close()}catch(x){er.textContent=x.message||'Something went wrong';btn.disabled=false}};
 if(!fm.open)fm.showModal();const first=$('input',fm);if(first)first.focus()}
async function authSubmit(mode,email,pw,name){const a=cloud.sb.auth;
 if(mode==='up'){const{data,error}=await a.signUp({email,password:pw,options:{data:{name}}});if(error)throw error;if(!data.session)return 'confirm'}
 else{const{error}=await a.signInWithPassword({email,password:pw});if(error)throw error}}
async function onSession(sess){
 if(!sess){cloud.user=null;cloud.clubs=[];cloud.friends=[];cloud.recs=[];cloud.fcode='';profSig='';cloud.synced=false;S=cloud.on?blank():seed();normalize();store.set('readers.v1',S);cid=null;render();return}
 if(cloud.user&&cloud.user.id===sess.user.id)return;
 cloud.ready=true;cloud.user=sess.user;cloud.synced=false;
 try{const d=await db.getData(),md=sess.user.user_metadata||{};
  if(d&&Array.isArray(d.books))S=d;else {S=blank();S.profile.name=md.name||(sess.user.email||'Reader').split('@')[0]}
  S.clubs=[];normalize();store.set('readers.v1',S);
  if(!d)await db.putData(S);
  cloud.synced=true;await loadClubs();try{await syncProfile()}catch(x){}await loadFriends();cloudSoon()}
 catch(e){cloud.err=(e&&e.message)||'Could not load your account';toast('Could not load your account: '+cloud.err)}
 render();await runPendingJoin();await runPendingFriend()}
async function loadClubs(){if(!cloud.user)return;const rows=await db.clubs(),me=cloud.user.id;
 cloud.clubs=rows.map(r=>{const mine=(r.club_members||[]).find(m=>m.user_id===me);
  return{id:r.id,name:r.name,code:r.code,owner:r.owner,bookId:key(r.book_title,r.book_author),bt:r.book_title,ba:r.book_author,pages:r.pages,chapters:r.chapters,sched:r.sched||[],myCh:mine?mine.ch:0,myName:mine?mine.name:'',
   members:(r.club_members||[]).filter(m=>m.user_id!==me).map(m=>({n:m.name,ch:m.ch,uid:m.user_id})),
   posts:(r.club_posts||[]).map(p=>({id:p.id,ch:p.ch,who:p.name,uid:p.user_id,text:p.text,ts:p.created_at}))}});
 cloud.clubs.forEach(c=>{let b=bk(c.bookId);if(!b){b=addBook({t:c.bt,a:c.ba,pages:c.pages},'reading');b.cur=c.myCh;b.started=TODAY}
  if(b.shelf==='want')setShelf(b,'reading');
  b.chapters=c.chapters;b.cur=Math.min(b.cur||0,c.chapters.length)})}
async function cloudFlush(){if(!cloud.user||!cloud.synced)return;
 try{await db.putData({...S,clubs:[]});try{await syncProfile()}catch(x){}let moved=false;
  for(const c of cloud.clubs){const b=bk(c.bookId);if(b&&(b.cur!==c.myCh||c.myName!==S.profile.name)){await db.progress(c.id,b.cur,S.profile.name);if(b.cur!==c.myCh)moved=true;c.myCh=b.cur;c.myName=S.profile.name}}
  cloud.err='';if(moved){await loadClubs();if(page==='clubs')render()}}
 catch(e){cloud.err=(e&&e.message)||'Sync failed'}}
const clubSig=()=>cloud.clubs.map(c=>c.id+':'+c.posts.length+':'+c.members.map(m=>m.n+m.ch).join(',')).join('|');
async function pollClubs(){if(!cloud.user||!cloud.synced||page!=='clubs'||document.hidden||$('dialog[open]'))return;
 const ae=document.activeElement;if(ae&&ae.closest&&ae.closest('.composer')&&ae.value)return;
 const before=clubSig();try{await loadClubs()}catch(e){return}if(clubSig()!==before)render()}
setInterval(pollClubs,15000);
if(cloud.on){cloud.sb.auth.getSession().then(({data})=>{cloud.ready=true;onSession(data.session)}).catch(()=>{cloud.ready=true;onSession(null)});
 cloud.sb.auth.onAuthStateChange((ev,sess)=>{if(ev==='SIGNED_IN'||ev==='SIGNED_OUT')setTimeout(()=>onSession(sess),0);if(ev==='PASSWORD_RECOVERY')setTimeout(openNewPw,500)})}


/* ---------- friends ---------- */
function sharedList(){const p=S.profile,v=(p.priv&&p.priv.finished)||p.vis;if(v==='private')return[];
 return S.books.filter(b=>b.shelf==='finished'&&b.rating!=null).slice(0,500).map(b=>({t:b.t,a:b.a,r:b.rating,tg:(b.tags||[]).slice(0,5),p:b.pages||0,f:b.fin||null}))}
let profSig='';
async function syncProfile(){if(!cloud.user)return;const shared=sharedList(),sig=JSON.stringify([S.profile.name,shared,!!S.profile.discoverable,S.profile.username||'']);if(sig===profSig&&cloud.fcode)return;
 await db.putProfile(S.profile.name||'Reader',shared,S.profile.discoverable,S.profile.username);profSig=sig;if(!cloud.fcode)cloud.fcode=(await db.myCode())||''}
async function loadFriends(){if(!cloud.user)return;try{cloud.friends=await db.friends()}catch(e){}try{cloud.recs=await db.recs()}catch(e){}try{cloud.invs=await db.invites()}catch(e){}}
async function sendFriend(code){try{const r=await db.reqFriend(code);fq='';fres=[];await loadFriends();render();toast(r.status==='accepted'?'You are now friends with '+r.name:r.status==='pending'?'Request sent to '+r.name:'Already connected with '+r.name)}catch(e){fail(e)}}
async function shareFriend(){if(!cloud.fcode)return;const url=location.origin+location.pathname+'?friend='+encodeURIComponent(cloud.fcode),text='Connect with me on Readers so we can share book picks. Tap the link to add me (code '+cloud.fcode+'):';
 try{if(navigator.share){await navigator.share({title:'Add me on Readers',text,url});return}}catch(x){if(x&&x.name==='AbortError')return}
 try{await navigator.clipboard.writeText(text+' '+url);toast('Friend link copied. Paste it into a text or email.')}catch(x){toast('Friend link: '+url)}}
(function(){try{const u=new URL(location.href),c=u.searchParams.get('friend');if(c){store.set('readers.friend',c.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12));u.searchParams.delete('friend');history.replaceState(null,'',u.pathname+u.search+u.hash)}}catch(e){}})();
async function runPendingFriend(){const code=store.get('readers.friend','');if(!code||!cloud.user||!cloud.synced)return;
 try{localStorage.removeItem('readers.friend')}catch(e){}
 try{const r=await db.reqFriend(code);await loadFriends();fid=null;go('friends');toast(r.status==='accepted'?'You are now friends with '+r.name:'Friend request sent to '+r.name)}catch(e){fail(e)}}
const frSig=()=>(cloud.friends||[]).map(f=>f.id+f.status+(f.shared||[]).length).join('|')+'#'+(cloud.recs||[]).length;
async function pollFriends(){if(!cloud.user||!cloud.synced||document.hidden||$('dialog[open]')||(page!=='profile'&&page!=='discover'&&page!=='friends'&&page!=='home'))return;
 const ae=document.activeElement;if(ae&&ae.tagName==='INPUT'&&ae.value)return;const b=frSig();await loadFriends();if(frSig()!==b)render()}
setInterval(pollFriends,20000);

/* ---------- Friends page, activity, checklist, nudges ---------- */
var fid=null,fq='',fres=[],deferredInstall=null;
function regCat(id,x){const c=CATID[id]||{id,t:x.t,a:x.a,tags:x.tg||x.tags||[],pages:x.p||x.pages||0};CATID[id]=c;return c}
function accepted(){return (cloud.friends||[]).filter(f=>f.status==='accepted')}
function friendBadge(){return (cloud.friends||[]).filter(f=>f.status==='pending'&&f.incoming).length}
function friendURL(){return location.origin+location.pathname+'?friend='+encodeURIComponent(cloud.fcode)}
function standalone(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}}
function qrBox(text){if(typeof qrcode==='undefined')return '';try{const q=qrcode(0,'M');q.addData(text);q.make();return `<div class="qrbox" role="img" aria-label="QR code for your friend link">${q.createSvgTag({cellSize:4,margin:0,scalable:true})}</div>`}catch(e){return ''}}
function frRow(av,name,sub,btns){return `<div class="frow"><span class="av">${esc(initials(av||'R'))}</span><span class="fn">${esc(name)}${sub?`<small class="fs">${esc(sub)}</small>`:''}</span>${btns}</div>`}
function vFriends(){
 if(!cloud.user)return `<div class="inner"><div class="card"><p style="margin:0">Sign in to find and connect with friends.</p></div></div>`;
 const fr=cloud.friends||[],inc=fr.filter(f=>f.status==='pending'&&f.incoming),out=fr.filter(f=>f.status==='pending'&&!f.incoming),ok=accepted();
 if(fid){const f=ok.find(x=>x.id===fid);if(f)return vFriend(f);fid=null}
 const known=new Set(fr.map(f=>f.other)),seenU=new Set(),sug=[];
 cloud.clubs.forEach(c=>c.members.forEach(m=>{if(m.uid&&!known.has(m.uid)&&!seenU.has(m.uid)){seenU.add(m.uid);sug.push({uid:m.uid,n:m.n,club:c.name})}}));
 const link=cloud.fcode?friendURL():'';
 return `<div class="inner" style="max-width:760px"><div class="pagehead"><div><h2>Friends</h2><p>Connect with friends to see what they loved, send each other books and compare taste.</p></div></div>
 ${inc.length?`<section class="card sec"><h3 class="ct">Requests <small>${inc.length}</small></h3>${inc.map(f=>frRow(f.name,f.name,'',`<span class="fbt"><button class="btn pri" data-act="facc" data-id="${esc(f.id)}">Accept</button><button class="btn" data-act="fdec" data-id="${esc(f.id)}">Decline</button></span>`)).join('')}</section>`:''}
 <section class="card sec"><h3 class="ct">Find a friend</h3><p class="hint" style="margin:0 0 10px">Search by name or @username, or paste a friend code.</p><form class="composer" data-form="findf"><input name="q" required maxlength="40" autocomplete="off" autocapitalize="none" placeholder="Name, @username or code" value="${esc(fq)}" aria-label="Find a friend"><button class="btn pri" type="submit">Search</button></form>
  ${fq&&!fres.length?`<p class="hint" style="margin:10px 0 0">No readers found for "${esc(fq)}". They may not have turned on name search yet. Share your link or ask for their code.</p>`:''}
  ${fres.map(r=>frRow(r.name,r.name,r.username?'@'+r.username:'',`<span class="fbt"><button class="btn pri" data-act="addcode" data-code="${esc(r.code)}">Add</button></span>`)).join('')}</section>
 ${sug.length?`<section class="card sec"><h3 class="ct">People you may know</h3><p class="hint" style="margin:0 0 6px">From your book clubs.</p>${sug.map(s=>frRow(s.n,s.n,s.club,`<span class="fbt"><button class="btn" data-act="addm" data-uid="${esc(s.uid)}">Add</button></span>`)).join('')}</section>`:''}
 <section class="card sec"><h3 class="ct">Your friends <small>${ok.length}</small></h3>${ok.length?ok.map(f=>frRow(f.name,f.name,(f.shared||[]).length+' finished books shared',`<span class="fbt"><button class="btn" data-act="fview" data-id="${esc(f.id)}">View</button></span>`)).join(''):'<p class="hint" style="margin:0">No friends yet. Search above, add someone from your clubs, or share your link.</p>'}
  ${out.length?'<h4 class="fsub">Waiting for a reply</h4>'+out.map(f=>frRow(f.name,f.name,'',`<span class="fbt"><button class="btn" data-act="frem" data-id="${esc(f.id)}">Cancel</button></span>`)).join(''):''}</section>
 <section class="card sec"><h3 class="ct">Share your link</h3>${link?`<div class="sharebox">${qrBox(link)}<div><p class="by" style="margin:0 0 10px">Friend code <b class="code">${esc(cloud.fcode)}</b></p><div class="btnrow" style="margin:0"><button class="btn pri" data-act="sharef">Share link</button><button class="btn" data-act="copyf">Copy code</button></div><p class="hint" style="margin:10px 0 0">Friends can scan the code or open your link.</p></div></div>`:'<p class="hint" style="margin:0">Your friend code is being set up. Try again in a moment.</p>'}</section>
 <section class="card sec"><h3 class="ct">Privacy</h3><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-p2="disc"${S.profile.discoverable?' checked':''}> <span>Let people find me by name or username<br><small class="hint">Off by default. Friends only see finished books your Shelf privacy allows.</small></span></label>
  <div class="fld" style="margin-top:12px"><label>Username <small class="hint">optional, 3 to 20 letters, numbers or underscores</small><input id="unin" maxlength="20" autocapitalize="none" autocomplete="off" value="${esc(S.profile.username||'')}" placeholder="yourname"></label></div><button class="btn" data-act="saveun">Save username</button></section></div>`}
function vFriend(f){
 const mine=new Map(S.books.filter(b=>b.shelf==='finished'&&b.rating!=null).map(b=>[b.id,b.rating])),sh=f.shared||[];
 const both=sh.filter(x=>mine.has(key(x.t,x.a))),loved=both.filter(x=>x.r>=4&&mine.get(key(x.t,x.a))>=4).length;
 const match=both.length>=3?Math.round(100-both.reduce((a,x)=>a+Math.abs(x.r-mine.get(key(x.t,x.a))),0)/both.length/4*100):null;
 const have=new Set(S.books.map(b=>b.id).concat(S.dismissed));
 const tip=sh.filter(x=>x.r>=4&&!have.has(key(x.t,x.a))).sort((a,b)=>b.r-a.r).slice(0,6);
 return `<div class="inner" style="max-width:760px"><button class="lnk" data-act="fback" style="margin-bottom:10px">Back to Friends</button>
 <div class="profhead"><span class="av big">${esc(initials(f.name))}</span><div><h2 style="text-align:left;margin:0">${esc(f.name)}</h2><p style="margin:4px 0 0;text-align:left">${sh.length} finished book${sh.length===1?'':'s'} shared</p></div></div>
 <section class="card sec"><h3 class="ct">Taste match</h3>${match!==null?`<p class="match" style="margin:0"><b>${match}%</b> alike across the ${both.length} books you have both finished and rated. You both loved ${loved}.</p>`:`<p class="hint" style="margin:0">Finish and rate a few of the same books to see how alike your tastes are. You have ${both.length} in common so far.</p>`}
 <div class="btnrow"><button class="btn pri" data-act="recto">Recommend a book</button><button class="btn danger" data-act="frem" data-id="${esc(f.id)}">Remove friend</button></div></section>
 ${tip.length?`<section class="card sec"><h3 class="ct">Books ${esc(f.name)} loved</h3><p class="hint" style="margin:0 0 6px">Not on your shelves yet.</p>${tip.map(x=>{const id=key(x.t,x.a);regCat(id,x);return `<div class="frow"><span class="fn">${esc(x.t)}<small class="fs">${esc(x.a)} · rated ${x.r} of 5</small></span><span class="fbt"><button class="btn pri" data-act="rec-want" data-id="${esc(id)}">Want to Read</button></span></div>`}).join('')}</section>`:''}
 <section class="card sec"><h3 class="ct">Everything ${esc(f.name)} finished</h3>${sh.length?sh.slice().sort((a,b)=>b.r-a.r).slice(0,40).map(x=>`<div class="frow"><span class="fn">${esc(x.t)}<small class="fs">${esc(x.a)}</small></span><span class="fbt"><small>${x.r} of 5${mine.has(key(x.t,x.a))?' · you '+mine.get(key(x.t,x.a)):''}</small></span></div>`).join(''):'<p class="hint" style="margin:0">Nothing shared yet.</p>'}</section></div>`}
function recommendDialog(bid,fidd){const fr=accepted();if(!fr.length)return toast('Add a friend first');
 const books=S.books.filter(b=>b.shelf==='finished'||b.shelf==='reading');if(!books.length)return toast('Finish or start a book first');
 openForm('Recommend a book',`<div class="fld"><label>Friend<select name="f">${fr.map(f=>`<option value="${esc(f.id)}"${f.id===fidd?' selected':''}>${esc(f.name)}</option>`).join('')}</select></label></div><div class="fld"><label>Book<select name="b">${books.map(b=>`<option value="${esc(b.id)}"${b.id===bid?' selected':''}>${esc(b.t)}</option>`).join('')}</select></label></div><div class="fld"><label>Note <small class="hint">optional</small><textarea name="n" rows="2" maxlength="200" placeholder="Why you think they will love it" style="width:100%;box-sizing:border-box"></textarea></label></div>`,
  fd=>{const f=fr.find(x=>x.id===fd.get('f')),b=bk(fd.get('b'));if(!f||!b)return;db.sendRec({to_user:f.other,from_name:S.profile.name||'A friend',title:b.t,author:b.a,tags:(b.tags||[]).slice(0,5),pages:b.pages||0,note:(fd.get('n')||'').trim().slice(0,200)}).then(()=>toast('Sent to '+f.name)).catch(fail)},'Send')}
function actCard(){if(!cloud.user)return '';const have=new Set(S.books.map(b=>b.id).concat(S.dismissed)),items=[];
 accepted().forEach(f=>(f.shared||[]).forEach(x=>{if(!x.f)return;const d=new Date(x.f+'T12:00:00');if(isNaN(d)||Date.now()-d>30*864e5)return;items.push({f,x,d})}));
 items.sort((a,b)=>b.d-a.d);const top=items.slice(0,4);if(!top.length)return '';
 return `<section class="card sec act"><h3 class="ct">Friend activity</h3>${top.map(({f,x,d})=>{const id=key(x.t,x.a);regCat(id,x);const days=Math.round((Date.now()-d)/864e5);return `<div class="frow"><span class="fn"><span><b>${esc(f.name)}</b> finished <i>${esc(x.t)}</i> and rated it ${x.r} of 5</span><small class="fs">${days<=0?'today':days===1?'yesterday':days+' days ago'}</small></span>${have.has(id)?'':`<span class="fbt"><button class="btn" data-act="rec-want" data-id="${esc(id)}">Want to Read</button></span>`}</div>`}).join('')}</section>`}
function nudgeCard(){if(!cloud.user||!S.notif.club)return '';let worst=null;
 cloud.clubs.forEach(c=>{const b=bk(c.bookId),me=b?b.cur:c.myCh;c.members.forEach(m=>{const gap=m.ch-me;if(gap>0&&(!worst||gap>worst.gap))worst={gap,c,n:m.n}})});
 if(!worst)return '';
 return `<section class="card sec nudge"><div><b>${esc(worst.n)} is ${worst.gap} chapter${worst.gap===1?'':'s'} ahead of you</b><p class="hint" style="margin:2px 0 0;text-align:left">in ${esc(worst.c.name)}. Catch up to join the chapter discussions.</p></div><button class="btn pri" data-act="gocl" data-id="${esc(worst.c.id)}">Open club</button></section>`}
function nudgeLine(cl,me){if(!cl.members.length)return '';const lead=cl.members.reduce((a,m)=>m.ch>a.ch?m:a,cl.members[0]),g=lead.ch-me;
 return `<p class="by nudgeln" style="margin:4px 0 0">${g>0?esc(lead.n)+' is '+g+' chapter'+(g===1?'':'s')+' ahead of you.':me>lead.ch?'You are leading the group.':'You are right with the group.'}</p>`}
function checklist(){if(S.onbHide||!cloud.user)return '';
 const CK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
 const st=[[S.books.length>=3,'Add 3 books to your shelf','shelf','Open My Shelf'],[S.books.some(b=>b.rating!=null),'Rate a book you have read','shelf','Rate a book'],[CLS().length>0,'Join or start a book club','clubs','Open Clubs'],[accepted().length>0,'Connect with a friend','friends','Find friends']];
 const done=st.filter(x=>x[0]).length;if(done===st.length)return '';
 return `<section class="card sec check"><div class="pagehead" style="margin:0 0 8px"><h3 class="ct" style="margin:0">Getting started <small>${done} of ${st.length}</small></h3><button class="lnk" data-act="hidecheck">Hide</button></div><div class="bar" style="margin:0 0 10px"><i style="width:${done/st.length*100}%;background:var(--page-green);display:block;height:100%"></i></div>${st.map(([d,t,g,b])=>`<div class="frow ck${d?' done':''}"><span class="ckb" aria-hidden="true">${d?CK:''}</span><span class="fn">${esc(t)}</span>${d?'':`<span class="fbt"><button class="btn" data-go="${g}">${b}</button></span>`}</div>`).join('')}</section>`}
function forgotPw(){const f=$('#authf',fm),em=f&&f.elements.email.value.trim(),er=$('.autherr',fm);
 if(!em){er.style.color='#c0392b';er.textContent='Enter your email above, then tap Forgot password.';return}
 cloud.sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname}).then(({error})=>{if(error)throw error;er.style.color='inherit';er.textContent='If that email has an account, a reset link is on its way.'}).catch(x=>{er.style.color='#c0392b';er.textContent=(x&&x.message)||'Could not send the email'})}
function openNewPw(){fm.innerHTML=`<form class="fmbody" id="npf"><h4 style="font:700 22px Space Grotesk,system-ui,sans-serif;margin:0 0 6px">Set a new password</h4><p class="hint" style="margin:0 0 12px">Choose a new password for your account.</p><div class="fld"><label>New password<input name="pw" type="password" required minlength="6" autocomplete="new-password"></label></div><p class="autherr" role="alert" style="color:#c0392b;margin:0 0 8px;min-height:1em"></p><div class="acts"><button class="btn pri" type="submit">Save password</button></div></form>`;
 $('#npf',fm).onsubmit=async e=>{e.preventDefault();const er=$('.autherr',fm);try{const{error}=await cloud.sb.auth.updateUser({password:new FormData(e.target).get('pw')});if(error)throw error;fm.close();toast('Password updated')}catch(x){er.textContent=(x&&x.message)||'Could not update password'}};if(!fm.open)fm.showModal()}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e});
function installApp(){closeMenu();if(deferredInstall){deferredInstall.prompt();deferredInstall=null;return}
 fm.innerHTML=`<form method="dialog" class="fmbody"><h4 style="font:700 22px Space Grotesk,system-ui,sans-serif;margin:0 0 10px">Install Readers</h4><p style="margin:0 0 8px"><b>iPhone or iPad:</b> tap the Share button in Safari, then Add to Home Screen.</p><p style="margin:0 0 14px"><b>Android:</b> open your browser menu and choose Install app or Add to Home screen.</p><div class="acts"><button class="btn pri">Got it</button></div></form>`;fm.showModal()}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});

/* ---------- release notes ---------- */
 const RELEASES=[
 {id:'2026-11-27b',date:'November 27, 2026',title:'Know what a book is about',items:[
  ['New','Tap any cover on Discover to see what the book is about. You get the full cover, the page count, a short description and an Add to picker for any of your shelves. Thanks to the tester who asked for this one.'],
  ['Improved','The Clubs page now explains what a club is before you start one, and shows how chapter threads stay locked until you reach them.']]},
 {id:'2026-11-27',date:'November 27, 2026',title:'A fresh new look',items:[
  ['New','A new welcome page that explains what Readers is for: tracking your reading and starting book clubs without spoilers.'],
  ['New','You can now delete a custom shelf you no longer need. Your books stay in your library.'],
  ['New','Track progress by chapters or by page. Switch any time in a book\'s details. Both keep your percentage up to date, and page numbers are the most exact.'],
  ['New','On computers, navigation is now a clean sidebar that matches the phone tab bar. The bookshelf is retired.'],
  ['New','Share a club invite straight to your friends. Pick everyone or just the ones you choose, and they can join from Home or Clubs in one tap.'],
  ['New','A notification bell shows friend requests, club invites, book recommendations and club activity in one place. Choose what you want to see in Profile, under Notifications.'],
  ['Improved','Book search results show the full title and author, and tapping a result opens a preview with a bigger cover and a description so you can be sure it is the right book.'],
  ['New','Shelves on My Shelf can be collapsed and expanded, and Readers remembers how you left them, even on your other devices. Use Collapse all to keep just the shelf you care about open. Tap Reorder to move shelves up or down, or drag them on a computer, and Readers remembers your order.'],
  ['New','Search for any book from any page, not just My Shelf. Results show up right where you are, and you can add a book without leaving the page.'],
  ['Improved','Softer cards, clearer buttons and easier to read text throughout.'],
  ['Improved','Home puts your current book first, with your checklist and friend activity beside it.']]},
 {id:'2026-11-26b',date:'November 26, 2026',title:'Easier friends and everyday polish',items:[
  ['New','A Friends page, found in your profile menu. Search by name or @username, add people from your book clubs, see friend requests, and share a QR code or link. Name search is off until you turn it on.'],
  ['New','Tap a friend to see their taste match, the books they loved that you have not read, and what they finished. You can send them a book with a note too.'],
  ['New','Friend activity on Home shows what your friends finished lately. Books sent to you appear at the top of Discover.'],
  ['New','Forgot password. Tap it on the sign in screen and we will email you a reset link.'],
  ['New','Install Readers on your phone from the profile menu so it opens like an app from your home screen.'],
  ['New','A Getting started checklist on Home for new accounts, and club check ins that tell you when friends are ahead of you.'],
  ['Improved','Undo. Removed a book, a note, or a pick by mistake? Tap Undo in the message that appears.']]},
 {id:'2026-11-26',date:'November 26, 2026',title:'Friends, themes and smarter picks',items:[
  ['New','Friends. Open your profile menu or the Friends card on Profile to share your friend code or link. When a friend accepts, the books they loved can show up in your Discover tab.'],
  ['New','Discover now has lanes: Because you loved, Stretch picks, Something different, and Friends loved these. Stretch picks take you to a new genre with a feel you already enjoy, and each pick explains why it is there.'],
  ['New','Not for me and Want to Read now teach Readers your taste. Skip a genre twice and it stops showing up in your stretch lanes.'],
  ['New','Three more themes in your profile menu: Night reader (warm and dim, easy on tired eyes), Sepia paper, and Christmas.'],
  ['New','Club invite links. Tap Share invite on a club and your friend can join automatically after they sign up.'],
  ['Improved','The profile menu now holds your account, themes and sign out in one place. Signed out visitors can sign in from the same spot.'],
  ['Improved','Discover shows a locked card with a progress bar until you have finished 10 books, so you know what is coming.'],
  ['Improved','The built in book list grew from 30 to 69 books across more genres.'],
  ['Fixed','The recommendations button was hidden behind the bottom tab bar on phones.']]},
 {id:'2026-11-25',date:'November 25, 2026',title:'Accounts, real book clubs and mobile',items:[
  ['New','Create an account and your shelves, ratings and notes are saved online. Every new account starts fresh and empty.'],
  ['New','Real book clubs. Start a club, share the invite code, and friends join with it. Discussion is chapter by chapter, and chapters you have not reached stay locked so nobody gets spoilers.'],
  ['New','A phone friendly layout with a bottom tab bar. Your reading stats are under Profile on phones.'],
  ['Improved','Signed out visitors see a short welcome screen instead of anyone else\'s books.']]},
 {id:'2026-11-24',date:'Earlier',title:'Ratings and notes',items:[
  ['New','Romance books are rated with chili peppers. Every other genre uses stars.'],
  ['New','Choose how you rank a book: overall, or by plot, characters, world building or ending. Sort your shelf by any of them and see a Top ranked row.'],
  ['New','Hover over any cover to see when you started and finished the book. On phones the dates show under the cover.'],
  ['New','Add as many notes to a book as you like. They stay in the order you wrote them, and you can remove any note.']]}];
const seenRel=()=>store.get('readers.seen','');
const hasNew=()=>seenRel()!==RELEASES[0].id;
function vNotes(){store.set('readers.seen',RELEASES[0].id);document.body.dataset.new='';
 const TAG={New:'tg-new',Improved:'tg-imp',Fixed:'tg-fix'};
 return `<div class="inner" style="max-width:760px"><div class="pagehead"><div><h2>Release notes</h2><p>What is new in Readers. Read at your own pace, newest first.</p></div></div>
 ${RELEASES.map((r,i)=>`<details class="rel"${i<2?' open':''}><summary><span class="rd">${esc(r.date)}</span><span class="rt">${esc(r.title)}</span>${i===0?'<span class="rnew">Latest</span>':''}</summary><ul>${r.items.map(([t,x])=>`<li><span class="tag ${TAG[t]||''}">${esc(t)}</span><span>${esc(x)}</span></li>`).join('')}</ul></details>`).join('')}
 <p class="hint" style="margin-top:18px">Something confusing or missing? Tell us in the feedback box on your <button class="lnk" data-go="profile">profile page</button>.</p></div>`}

/* ---------- invites, auto join and the account button ---------- */
const inviteURL=c=>location.origin+location.pathname+'?join='+encodeURIComponent(c);

function inviteDialog(d){const fr=accepted();if(!fr.length)return shareInvite(d);
 const inClub=new Set(((cloud.clubs.find(c=>c.code===d.code)||{}).members||[]).map(m=>m.uid));
 const list=fr.filter(f=>!inClub.has(f.other));
 openForm('Share club invite',`<p class="hint" style="margin:0 0 10px">Invite friends to <b>${esc(d.name)}</b>. They will see it on their Home and Clubs pages.</p>`+(list.length?`<label class="chip chk" style="margin-bottom:8px"><input type="checkbox" onchange="this.form.querySelectorAll('[name=f]').forEach(c=>c.checked=this.checked)"> Select all friends</label><div class="fld">${list.map(f=>`<label class="pick"><input type="checkbox" name="f" value="${esc(f.id)}"><span>${esc(f.name)}</span></label>`).join('')}</div>`:'<p class="hint">All your friends are already in this club.</p>')+`<p style="margin:12px 0 0"><button type="button" class="lnk" data-act="shareinv-other" data-code="${esc(d.code)}" data-name="${esc(d.name)}" data-book="${esc(d.book)}">Share a link another way</button></p>`,
  fd=>{const ids=fd.getAll('f'),pick=list.filter(f=>ids.includes(f.id));if(!pick.length){toast('Pick at least one friend');return}
   db.sendInvites(pick.map(f=>({from_user:cloud.user.id,to_user:f.other,from_name:S.profile.name||'A friend',club_name:d.name,book_title:d.book||'',code:d.code}))).then(()=>toast(pick.length===1?'Invite sent to '+pick[0].name:'Invite sent to '+pick.length+' friends')).catch(fail)},'Send invite')}
async function joinInvite(id,code){try{const r=await db.join(code,S.profile.name);await db.dropInvite(id).catch(()=>{});cloud.invs=cloud.invs.filter(i=>i.id!==id);await loadClubs();cid=r.id;cch=null;page='clubs';$$('.book').forEach(x=>x.classList.toggle('active',x.dataset.p==='clubs'));render();toast('You joined '+r.name)}catch(e){fail(e)}}
async function dropInv(id){try{await db.dropInvite(id);cloud.invs=cloud.invs.filter(i=>i.id!==id);render()}catch(e){fail(e)}}
function clubsEmpty(){
 const books=S.books.filter(b=>b.shelf==='reading'||b.shelf==='want').length;
 const friends=cloud.user?(cloud.friends||[]).filter(f=>f.status==='accepted').length:0;
 const demo=['Chapter 1','Chapter 2','Chapter 3','Chapter 4','Chapter 5','Chapter 6','Chapter 7','Chapter 8'];
 const strip=`<div class="ticks ex" aria-hidden="true">${demo.map((_,i)=>`<span class="${i<3?'done':i===3?'cur':''}"></span>`).join('')}</div>`;
 const lock=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`;
 return `<section class="card empt">
 <h3 class="ct">Read a book with someone</h3>
 <p class="lead">A club is one book and a few people. Each chapter gets its own thread, and a thread stays shut until you have read that far. Nobody can spoil anything, and nobody has to keep pace.</p>
 <div class="demo">
  <div class="dl">What it looks like</div>
  ${strip}
  <div class="drow"><b>Chapter 4</b><span>open to you</span></div>
  <div class="drow mut">${lock}<b>Chapter 5</b><span>opens when you get there</span></div>
 </div>
 ${books?`<div class="btnrow"><button class="btn pri" data-act="newclub">Start a club</button>${cloud.user?'<button class="btn" data-act="joinclub">Join with a code</button>':''}</div>`
  :`<p class="hint" style="margin:0 0 12px">You need a book on your shelf first. Pick one you want to read.</p><div class="btnrow"><button class="btn pri" data-go="shelf">Open My Shelf</button>${cloud.user?'<button class="btn" data-act="joinclub">Join with a code</button>':''}</div>`}
 ${!cloud.user?'<p class="hint" style="margin:12px 0 0">Sign in to read with other people. On your own, a club still tracks your chapters.</p>'
  :friends?`<p class="hint" style="margin:12px 0 0">You can share the invite straight to your ${friends===1?'friend':friends+' friends'} once it exists.</p>`
  :'<p class="hint" style="margin:12px 0 0">Starting one gives you a code to send to anybody. They do not need an account to be asked.</p>'}
 </section>`}
function invitesCard(){if(!cloud.user||!S.notif.invites)return '';const mine=new Set(cloud.clubs.map(c=>c.code)),list=(cloud.invs||[]).filter(i=>!mine.has(i.code));if(!list.length)return '';
 return `<section class="card sec"><h3 class="ct">Club invites</h3>${list.map(i=>`<div class="frow"><span class="fn"><span><b>${esc(i.from_name)}</b> invited you to <b>${esc(i.club_name)}</b>${i.book_title?` to read <i>${esc(i.book_title)}</i>`:''}</span></span><span class="fbt"><button class="btn pri" data-act="joininv" data-id="${esc(i.id)}" data-code="${esc(i.code)}">Join</button><button class="btn" data-act="dropinv" data-id="${esc(i.id)}">Dismiss</button></span></div>`).join('')}</section>`}
async function shareInvite(d){const url=inviteURL(d.code),text='Join my book club "'+d.name+'" for '+d.book+' on Readers. Tap the link to join (code '+d.code+'):';
 try{if(navigator.share){await navigator.share({title:'Join my book club on Readers',text,url});return}}catch(x){if(x&&x.name==='AbortError')return}
 try{await navigator.clipboard.writeText(text+' '+url);toast('Invite message copied. Paste it into a text or email.')}catch(x){toast('Invite link: '+url)}}
(function(){try{const u=new URL(location.href),c=u.searchParams.get('join');if(c){store.set('readers.join',c.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12));u.searchParams.delete('join');history.replaceState(null,'',u.pathname+u.search+u.hash)}}catch(e){}})();
async function runPendingJoin(){const code=store.get('readers.join','');if(!code||!cloud.user||!cloud.synced)return;
 try{localStorage.removeItem('readers.join')}catch(e){}
 try{const r=await db.join(code,S.profile.name);await loadClubs();cid=r.id;cch=null;page='clubs';$$('.book').forEach(x=>x.classList.toggle('active',x.dataset.p==='clubs'));render();toast('You joined '+r.name)}catch(e){fail(e)}}
let themeOpen=false;
function closeMenu(){themeOpen=false;const m=$('#acctmenu');if(m)m.remove()}
const THEMES=[
 {k:'light',n:'Light',d:'Warm paper and green',t:'light',s:'',sw:['#F4EEDD','#0F6E56']},
 {k:'dark',n:'Dark',d:'Deep green, high contrast',t:'dark',s:'',sw:['#10201B','#A6E3CF']},
 {k:'night',n:'Night reader',d:'Warm and dim, easy on tired eyes',t:'dark',s:'night',sw:['#1B1612','#E0B070']},
 {k:'sepia',n:'Sepia paper',d:'Soft tan, like an old paperback',t:'light',s:'sepia',sw:['#EBDCBC','#5E6B3C']},
 {k:'christmas',n:'Christmas',d:'Evergreen, red and gold',t:'dark',s:'christmas',sw:['#0F2A1F','#B3262E']}];
const curTheme=()=>document.body.dataset.tk||'light';
function menuHTML(){const cur=curTheme(),u=cloud.user;
 const top=u?`<div class="am-who"><b>${esc(S.profile.name||'Reader')}</b><small>${esc(u.email||'')}</small></div><button class="am-i" role="menuitem" data-act="gopro">Profile and settings</button><button class="am-i am-r" role="menuitem" data-act="gofriends">Friends${friendBadge()?'<span class="rnew">'+friendBadge()+'</span>':''}</button>`
  :cloud.on?`<button class="am-i am-b" role="menuitem" data-act="signin">Sign in</button><button class="am-i" role="menuitem" data-act="signup">Create account</button>`:'';
 const ct=THEMES.find(x=>x.k===cur)||THEMES[0],CHV=`<svg class="chv" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
 const th=`<button class="am-i am-t am-th" role="menuitem" aria-expanded="${themeOpen}" data-act="themeopen"><span class="sw" style="background:linear-gradient(135deg,${ct.sw[0]} 50%,${ct.sw[1]} 50%)"></span><span class="tn"><b>Theme</b><small>${ct.n}</small></span>${CHV}</button>`+(!themeOpen?'':THEMES.map(x=>`<button class="am-i am-t" role="menuitemradio" aria-checked="${x.k===cur}" data-act="theme" data-k="${x.k}"><span class="sw" style="background:linear-gradient(135deg,${x.sw[0]} 50%,${x.sw[1]} 50%)"></span><span class="tn"><b>${x.n}</b><small>${x.d}</small></span>${x.k===cur?'<svg class="ck" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>':''}</button>`).join('')+'');
 const rel=`<button class="am-i am-r" role="menuitem" data-act="gonotes">Release notes${hasNew()?'<span class="rnew">New</span>':''}</button>`;
 const inst=standalone()?'':'<button class="am-i" role="menuitem" data-act="installapp">Install app</button>';
 return top+rel+inst+'<div class="am-sep"></div>'+th+(u?'<div class="am-sep"></div><button class="am-i" role="menuitem" data-act="signout">Sign out</button>':'')}
function acctMenu(){if($('#acctmenu'))return closeMenu();
 const m=document.createElement('div');m.id='acctmenu';m.setAttribute('role','menu');m.innerHTML=menuHTML();$('header').appendChild(m)}
function refreshMenu(){const m=$('#acctmenu');if(m)m.innerHTML=menuHTML()}
document.addEventListener('click',e=>{const ids=e.composedPath().map(n=>n.id);if(!ids.includes('acctmenu')&&!ids.includes('acct'))closeMenu();if(!ids.includes('notifmenu')&&!ids.includes('bell'))closeNotif()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
function renderAcct(){let tools=$('#tools');
 if(!tools){tools=document.createElement('div');tools.id='tools';tg.parentNode.insertBefore(tools,tg);tg.remove()}
 let b=$('#acct');if(!b){b=document.createElement('button');b.id='acct';b.dataset.act='acct';tools.appendChild(b)}
 let bl=$('#bell');if(!bl){bl=document.createElement('button');bl.id='bell';bl.dataset.act='bell';bl.setAttribute('aria-label','Notifications');bl.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><i class="bn"></i>';tools.insertBefore(bl,b)}
 bl.hidden=!(cloud.user&&cloud.ready);{const n=notifCount();const bi=bl.querySelector('.bn');bi.textContent=n>9?'9+':n;bi.hidden=!n}
 if(cloud.on&&!cloud.ready){b.hidden=true;return}b.hidden=false;
 const CH='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
 if(cloud.user){b.className='acct in';b.innerHTML='<span>'+esc(initials(S.profile.name||cloud.user.email||'R'))+'</span>';b.setAttribute('aria-label','Account and theme menu')}
 else if(cloud.on){b.className='acct out';b.innerHTML='Sign in '+CH;b.setAttribute('aria-label','Sign in and theme menu')}
 else{b.className='acct in anon';b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>';b.setAttribute('aria-label','Theme menu')}}


/* ---------- notifications ---------- */
function notifItems(){const n=S.notif,out=[];if(!cloud.user)return out;
 if(n.friends)(cloud.friends||[]).filter(f=>f.status==='pending'&&f.incoming).forEach(f=>out.push({k:'f'+f.id,t:'friend',unseen:1,html:`<b>${esc(f.name)}</b> wants to connect`,acts:`<button class="btn pri" data-act="facc" data-id="${esc(f.id)}">Accept</button><button class="btn" data-act="fdec" data-id="${esc(f.id)}">Decline</button>`}));
 if(n.invites){const mine=new Set((cloud.clubs||[]).map(c=>c.code));(cloud.invs||[]).filter(i=>!mine.has(i.code)).forEach(i=>out.push({k:'i'+i.id,t:'invite',unseen:1,html:`<b>${esc(i.from_name)}</b> invited you to <b>${esc(i.club_name)}</b>`,acts:`<button class="btn pri" data-act="joininv" data-id="${esc(i.id)}" data-code="${esc(i.code)}">Join</button><button class="btn" data-act="dropinv" data-id="${esc(i.id)}">Dismiss</button>`}))}
 if(n.recs)(cloud.recs||[]).slice(0,5).forEach(r=>out.push({k:'r'+r.id,t:'rec',unseen:!S.nseen.includes(r.id),html:`<b>${esc(r.from_name)}</b> recommended <i>${esc(r.title)}</i>`,acts:`<button class="btn" data-act="nview">See in Discover</button>`}));
 if(n.club){let w=null;(cloud.clubs||[]).forEach(c=>{const b=bk(c.bookId),me=b?b.cur:c.myCh;c.members.forEach(m=>{const g=m.ch-me;if(g>0&&(!w||g>w.g))w={g,c,n:m.n}})});if(w)out.push({k:'c'+w.c.id,t:'club',unseen:1,html:`<b>${esc(w.n)}</b> is ${w.g} chapter${w.g===1?'':'s'} ahead in <b>${esc(w.c.name)}</b>`,acts:`<button class="btn" data-act="gocl" data-id="${esc(w.c.id)}">Open club</button>`})}
 return out}
const notifCount=()=>notifItems().filter(i=>i.unseen).length;
function notifHTML(){const it=notifItems();return `<div class="am-lbl">Notifications</div>`+(it.length?it.map(i=>`<div class="nrow${i.unseen?' un':''}"><div class="nt">${i.html}</div><div class="na">${i.acts}</div></div>`).join(''):'<p class="hint" style="padding:6px 10px 12px">You are all caught up.</p>')+`<div class="am-sep"></div><button class="am-i" data-act="nset">Notification settings</button>`}
function closeNotif(){const m=$('#notifmenu');if(m)m.remove()}
function bellMenu(){if($('#notifmenu'))return closeNotif();closeMenu();
 const m=document.createElement('div');m.id='notifmenu';m.setAttribute('role','dialog');m.setAttribute('aria-label','Notifications');m.innerHTML=notifHTML();$('header').appendChild(m);
 const ids=(cloud.recs||[]).map(r=>r.id).filter(x=>!S.nseen.includes(x));if(ids.length){S.nseen=S.nseen.concat(ids).slice(-200);save()}}
function refreshNotif(){const m=$('#notifmenu');if(m)m.innerHTML=notifHTML()}
function notifCard(){if(!cloud.user)return '';const N=S.notif,row=(k,l,d)=>`<label class="pick"><input type="checkbox" data-p2="notif" data-k="${k}"${N[k]?' checked':''}><span>${l}<small class="hint" style="display:block;font-weight:400">${d}</small></span></label>`;
 return `<section class="card sec" id="notifset"><h3 class="ct">Notifications</h3><p class="hint" style="margin:0 0 6px">Choose what shows in the bell and on your Home page. Turning one off only hides it.</p>${row('friends','Friend requests','When someone wants to connect.')}${row('invites','Club invites','When a friend invites you to a club.')}${row('recs','Book recommendations','When a friend sends you a book.')}${row('club','Club activity','When friends are ahead of you in a club.')}</section>`}

/* ---------- theme ---------- */
function theme(k){const T=THEMES.find(x=>x.k===k)||THEMES[0];document.body.dataset.theme=T.t;document.body.dataset.skin=T.s;document.body.dataset.tk=T.k;logo.src=T.t==='dark'?D:L;store.set('readers.theme',T.k)}
theme(store.get('readers.theme',matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
