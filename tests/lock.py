from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True).new_page()
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(700)
    pg.evaluate("go('home')");pg.wait_for_timeout(300)
    pg.evaluate("window.scrollTo(0,document.body.scrollHeight)");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/home_unlocked.png')
    pg.evaluate("S.books.filter(b=>b.shelf==='finished').slice(3).forEach(b=>b.shelf='want');render();window.scrollTo(0,document.body.scrollHeight)");pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/home_locked.png')
    print(pg.evaluate("[document.body.dataset.recs,getComputedStyle(document.querySelector('main')).paddingBottom]"))
    b.close()
