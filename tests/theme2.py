from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1280,'height':800}).new_page();pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(500)
    pg.evaluate("cloud.user={id:'u1',email:'a@b'};cloud.synced=true;cloud.ready=true;S=seed();normalize();go('home')");pg.wait_for_timeout(300)
    pg.click('#acct');pg.wait_for_timeout(200);pg.screenshot(path='/home/claude/shots/th_closed.png',clip={'x':880,'y':0,'width':400,'height':520})
    pg.click('.am-th');pg.wait_for_timeout(200);pg.screenshot(path='/home/claude/shots/th_open.png',clip={'x':880,'y':0,'width':400,'height':800})
    pg.click('[data-k=sepia]');pg.wait_for_timeout(200);print(pg.evaluate("document.body.dataset.skin"),pg.locator('.am-th').count(),pg.locator('[data-act=theme]').count())
    b.close()
