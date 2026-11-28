from playwright.sync_api import sync_playwright
import datetime
today=datetime.date.today().isoformat()
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
setup="""(today)=>{cloud.user={id:'u1',email:'joe@example.com'};cloud.synced=true;cloud.ready=true;cloud.fcode='a1b2c3d4';S=seed();normalize();S.onbHide=false;
 cloud.friends=[{id:'f1',other:'u7',name:'Sam Rivera',status:'accepted',incoming:false,shared:[{t:'Dune',a:'Frank Herbert',r:5,tg:['Epic'],p:600,f:today}]},{id:'f2',other:'u8',name:'Pat Lee',status:'pending',incoming:true,shared:[]}];
 S.books[0].chapters=['a','b','c','d'];S.books[0].cur=1;S.books[0].shelf='reading';go('home')}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,w,h,m in [('d',1280,800,False),('m',390,844,True)]:
        pg=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1,has_touch=m,is_mobile=m).new_page()
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.add_init_script(fake)
        pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(600)
        pg.screenshot(path=f'/home/claude/shots/r_{n}_land.png',full_page=n=='m')
        pg.evaluate(setup,today);pg.wait_for_timeout(500)
        for v in ['home','shelf','clubs','discover']:
            pg.evaluate(f"go('{v}')");pg.wait_for_timeout(350);pg.screenshot(path=f'/home/claude/shots/r_{n}_{v}.png')
        print(n,errs)
    b.close()
