from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True).new_page()
    pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(700)
    pg.evaluate("""()=>{cloud.user={id:'u1',email:'joe@example.com'};cloud.synced=true;cloud.ready=true;cloud.fcode='a1b2c3d4';S=seed();normalize();
      cloud.friends=[{id:'f1',name:'Sam Rivera',status:'accepted',incoming:false,shared:[{t:'Piranesi Fake Title',a:'Susanna Clarke',r:5,tg:['Fantasy','Cozy'],p:272},{t:'Project Hail Mary',a:'Andy Weir',r:5,tg:['Science fiction','Funny'],p:476}]},{id:'f2',name:'Pat Lee',status:'pending',incoming:true,shared:[]}];
      go('discover')}""");pg.wait_for_timeout(600)
    pg.screenshot(path='/home/claude/shots/lane_top.png')
    pg.evaluate("document.querySelector('.lane-stretch').scrollIntoView()");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/lane_stretch.png')
    pg.evaluate("go('profile')");pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('[data-form=addfriend]').scrollIntoView({block:'center'})");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/friends_card.png')
    b.close()
