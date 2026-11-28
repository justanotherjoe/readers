from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1280,'height':900}).new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.add_init_script(fake)
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(500);pg.evaluate("go('shelf')");pg.wait_for_timeout(300)
    pg.click('#reorderbtn');pg.wait_for_timeout(200)
    pg.drag_and_drop('.ord[data-k="Did Not Finish"]','.ord[data-k="Top ranked"]');pg.wait_for_timeout(300)
    print(pg.evaluate("[...document.querySelectorAll('#rails .ord b')].map(x=>x.textContent)"),errs)
    b.close()
