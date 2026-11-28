from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,w,h in [('m',390,844),('d',1280,800)]:
        pg=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1).new_page()
        pg.add_init_script(fake)
        pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(600)
        for v in ['home','shelf','clubs','discover']:
            pg.evaluate(f"go('{v}')");pg.wait_for_timeout(300);pg.screenshot(path=f'/home/claude/shots/ux_{n}_{v}.png')
    b.close()
