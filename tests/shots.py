from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for name,w,h,theme in [('d',1100,900,'light'),('m',390,844,'dark')]:
        pg=b.new_page(viewport={'width':w,'height':h})
        pg.goto('file:///home/claude/readers/Readers_Bookshelf_Nav7.html')
        pg.evaluate(f"theme('{theme}')")
        for s in ['discover','clubs','stats','profile']:
            pg.evaluate(f"go('{s}')");pg.wait_for_timeout(300)
            pg.screenshot(path=f'/home/claude/shots/{name}_{s}.png',full_page=True)
    b.close()
