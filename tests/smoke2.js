const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/home/claude/readers/index.html','utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',
 beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.fetch=()=>Promise.reject(new Error('offline'));
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.Element.prototype.scrollBy=()=>{};}});
const w=dom.window,d=w.document;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const text=()=>d.getElementById('main').textContent.replace(/\s+/g,' ').slice(0,160);
(async()=>{
 await wait(100);console.log('HOME:',text());
 for(const p of ['shelf','discover','clubs','stats','profile']){
  d.querySelector('.book[data-p='+p+']').click();await wait(400);console.log(p.toUpperCase()+':',text());}
 // shelf interactions
 d.querySelector('.book[data-p=shelf]').click();await wait(400);
 console.log('covers on shelf:',d.querySelectorAll('.cover').length);
 d.querySelector('.cover').click();console.log('book dialog open:',d.getElementById('bd').hasAttribute('open'),d.getElementById('bd').textContent.replace(/\s+/g,' ').slice(0,100));
 const sel=d.querySelector('#bd select[data-f=shelf]');sel.value='finished';sel.dispatchEvent(new w.Event('change',{bubbles:true}));
 console.log('rater present:',!!d.querySelector('#bd .rater'));
 d.querySelector('#bd .rb[data-v="4"]').click();console.log('rating text:',d.querySelector('#bd .rlab output').textContent);
 const ta=d.getElementById('newnote');ta.value='First note';d.querySelector('[data-act=addnote]').click();
 d.getElementById('newnote').value='Second note';d.querySelector('[data-act=addnote]').click();
 console.log('notes:',[...d.querySelectorAll('#bd .nt')].map(x=>x.textContent).join(' | '));
 d.querySelector('[data-act=delnote]').click();console.log('after delete:',[...d.querySelectorAll('#bd .nt')].map(x=>x.textContent).join(' | '));
 console.log('info dates:',d.querySelector('.cover .info').textContent);
 const sb=d.getElementById('sortby');
 d.getElementById('bd').close();await wait(50);
 // clubs
 d.querySelector('.book[data-p=clubs]').click();await wait(400);
 const next=d.querySelector('[data-act=clubnext]');next&&next.click();await wait(50);
 const sel2=d.querySelector('[data-act=chsel]');sel2.value='9';sel2.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(50);console.log('LOCKED:',!!d.querySelector('.lock'));
 sel2.value='1';
 const s3=d.querySelector('[data-act=chsel]');s3.value='3';s3.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(50);
 const f=d.querySelector('[data-form=post]');f.querySelector('input').value='Test post';f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(50);
 console.log('post visible:',d.getElementById('main').textContent.includes('Test post'));
 // goodreads import
 d.querySelector('.book[data-p=profile]').click();await wait(400);
 const csv='Book Id,Title,Author,My Rating,Exclusive Shelf,Number of Pages,Date Read,Bookshelves\n1,"Dune (Dune, #1)",Frank Herbert,5,read,612,2024/05/01,\n2,"Neuromancer",William Gibson,4,read,271,2023/02/02,"cyberpunk, read"\n3,Emma,Jane Austen,0,to-read,474,,\n';
 w.eval('importGR('+JSON.stringify(csv)+')');await wait(50);console.log('imported toast:',d.querySelector('.toast').textContent);
 d.querySelector('.book[data-p=stats]').click();await wait(400);console.log('STATS2:',text());
 d.querySelector('.book[data-p=home]').click();await wait(400);d.querySelector('[data-act=openq]')&&d.querySelector('[data-act=openq]').click();
 console.log('queue:',d.getElementById('dq').textContent.replace(/\s+/g,' ').slice(0,140));
 d.querySelector('[data-q=want]').click();d.querySelector('[data-q=no]').click();console.log('queue2:',d.getElementById('dq').textContent.replace(/\s+/g,' ').slice(0,80));
 console.log('ERRORS:',errs.length?errs:'none');process.exit(0)})();
