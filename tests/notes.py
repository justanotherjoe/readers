from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True).new_page()
    pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(700)
    pg.evaluate("""()=>{cloud.user={id:'u1',email:'joe@example.com'};cloud.synced=true;cloud.ready=true;S=seed();normalize();go('home')}""");pg.wait_for_timeout(400)
    pg.tap('#acct');pg.wait_for_timeout(300);pg.screenshot(path='/home/claude/shots/notes_menu.png')
    pg.tap('[data-act=gonotes]');pg.wait_for_timeout(400);pg.screenshot(path='/home/claude/shots/notes_page.png')
    print(pg.evaluate("[document.body.dataset.new, localStorage.getItem('readers.seen')]"))
    b.close()
