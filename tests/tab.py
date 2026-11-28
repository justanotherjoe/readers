from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
cases=[('phone',390,844,True),('tablet_portrait_touch',768,1024,True),('tablet_land_touch',1024,768,True),('ipad_pro_touch',1180,820,True),('small_win_mouse',800,700,False),('desktop',1280,800,False)]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,w,h,t in cases:
        pg=b.new_context(viewport={'width':w,'height':h},has_touch=t,is_mobile=t).new_page();pg.add_init_script(fake)
        pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(400)
        r=pg.evaluate("""()=>{const bc=document.querySelector('.bookcase').getBoundingClientRect(),b=document.querySelector('.book'),cs=getComputedStyle(b);return {pos:getComputedStyle(document.querySelector('.bookcase')).position,left:Math.round(bc.left),top:Math.round(bc.top),w:Math.round(bc.width),shelfShown:getComputedStyle(document.querySelector('.shelf')).display!=='none',bookH:Math.round(b.getBoundingClientRect().height),dir:getComputedStyle(document.querySelector('nav')).flexDirection}}""")
        print(n,r)
        pg.screenshot(path=f'/home/claude/shots/tab_{n}.png')
    b.close()
