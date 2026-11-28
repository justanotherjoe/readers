from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.add_init_script(fake)
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(500);pg.evaluate("go('shelf')");pg.wait_for_timeout(300)
    pg.tap('#foldall');pg.wait_for_timeout(200)
    pg.tap('#rails .fold[data-k="Currently reading"]');pg.wait_for_timeout(200)
    print('label',pg.inner_text('#foldall'),'open rails',pg.locator('#rails .rail').count())
    pg.screenshot(path='/home/claude/shots/fold.png')
    pg.reload();pg.wait_for_timeout(600);pg.evaluate("go('shelf')");pg.wait_for_timeout(300)
    print('after reload open rails',pg.locator('#rails .rail').count(),'fold saved',pg.evaluate("Object.values(S.fold).filter(Boolean).length"))
    print(errs);b.close()
