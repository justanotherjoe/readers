from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True).new_page();pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(500)
    pg.evaluate("""cloud.user={id:'u1',email:'a@b'};cloud.synced=true;cloud.ready=true;S=seed();normalize();
cloud.friends=[{id:'f1',other:'u7',name:'Sam Rivera',status:'accepted',shared:[]},{id:'f2',other:'u8',name:'Pat Lee',status:'accepted',shared:[]},{id:'f3',other:'u9',name:'Dana Fox',status:'accepted',shared:[]}];
cloud.invs=[{id:'i1',from_name:'Sam Rivera',club_name:'Sunday Readers',book_title:'Circe',code:'zzz999'}];go('clubs')""");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/inv_card.png')
    pg.evaluate("inviteDialog({code:'abc123',name:'Sunday Readers',book:'Circe'})");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/inv_dlg.png')
    b.close()
