const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync('/home/claude/readers/Readers_Bookshelf_Nav8.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){}});w.fetch=()=>Promise.reject(1);w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};w.Element.prototype.scrollBy=()=>{}}});
const w=dom.window,d=w.document;
setTimeout(()=>{d.querySelector('.book[data-p=shelf]').click();setTimeout(()=>{
 const c=[...d.querySelectorAll('.cover')].find(x=>x.dataset.id.startsWith('people we meet'));c.click();
 const r=()=>d.querySelector('#bd .rater .rlab output').textContent;console.log(r());
 d.querySelector('#bd .rb[data-v="2"]').click();console.log(r());
 d.querySelector('#bd .rb[data-v="2"]').click();console.log(r());
 d.querySelector('#bd .rclear')&&0;
 const m=d.querySelector('#bd select[data-f=method]');m.value='stars';m.dispatchEvent(new w.Event('change',{bubbles:true}));console.log(r());
 process.exit()},300)},100)
