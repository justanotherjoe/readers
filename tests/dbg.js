const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/home/claude/readers/Readers_Bookshelf_Nav8.html','utf8');
const vc=new VirtualConsole();vc.on('jsdomError',e=>console.log('ERR',e.detail&&e.detail.message||e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://localhost/',beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.fetch=()=>Promise.reject(1);w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.Element.prototype.scrollBy=()=>{}}});
const w=dom.window,d=w.document;
setTimeout(()=>{d.querySelector('.book[data-p=shelf]').click();setTimeout(()=>{
 const c=d.querySelector('.cover');console.log(c.dataset.id);c.click();
 const sel=d.querySelector('#bd select[data-f=shelf]');console.log(sel.value);sel.value='finished';sel.dispatchEvent(new w.Event('change',{bubbles:true}));
 console.log(d.querySelector('#bd select[data-f=shelf]').value, !!d.querySelector('#bd .rater'));
 console.log(d.querySelector('#bd').innerHTML.replace(/<option.*?<\/option>/g,'').slice(300,1500));process.exit()},400)},100)
