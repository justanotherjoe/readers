from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
setup="""cloud.user={id:'u1',email:'a@b'};cloud.synced=true;cloud.ready=true;S=seed();normalize();
cloud.friends=[{id:'f1',other:'u7',name:'Sam Rivera',status:'accepted',shared:[]},{id:'f2',other:'u8',name:'Pat Lee',status:'pending',incoming:true,shared:[]}];
cloud.invs=[{id:'i1',from_name:'Sam Rivera',club_name:'Sunday Readers',book_title:'Circe',code:'zzz999'}];
cloud.recs=[{id:'r1',from_name:'Sam Rivera',title:'Piranesi',author:'Susanna Clarke',tags:[]}];
go('home')"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,w,h,m in [('m',390,844,True),('d',1280,800,False)]:
        pg=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1 if not m else 2,is_mobile=m,has_touch=m).new_page()
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.add_init_script(fake)
        pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(500);pg.evaluate(setup);pg.wait_for_timeout(300)
        print(n,'badge',pg.inner_text('#bell .bn'))
        pg.click('#bell');pg.wait_for_timeout(300);pg.screenshot(path=f'/home/claude/shots/bell_{n}.png')
        pg.click('#notifmenu [data-act=dropinv]');pg.wait_for_timeout(300)
        print(n,'after dismiss',pg.inner_text('#bell .bn'),'panel open',pg.locator('#notifmenu').count())
        pg.mouse.click(5,300);pg.wait_for_timeout(200);print(n,'closed',pg.locator('#notifmenu').count())
        pg.evaluate("S.notif.friends=false;S.notif.recs=false;S.notif.invites=false;S.notif.club=false;render()");print(n,'all off badge hidden',pg.evaluate("document.querySelector('#bell .bn').hidden"))
        pg.evaluate("S.notif.friends=true;go('profile')");pg.wait_for_timeout(300)
        if n=='m': pg.evaluate("document.querySelector('#notifset').scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path=f'/home/claude/shots/notifset_{n}.png')
        print(n,errs)
    b.close()
