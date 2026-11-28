from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':430,'height':930});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(800)
    pg.evaluate("S.clubs=[];save();go('clubs')");pg.wait_for_timeout(400)
    print('has empt:',pg.locator('.empt').count())
    print(pg.inner_text('.empt')[:400])
    pg.screenshot(path='/tmp/e1.png',full_page=True)
    # no books case
    pg.evaluate("S.books.forEach(b=>{if(b.shelf==='reading'||b.shelf==='want')b.shelf='finished'});save();render()")
    pg.wait_for_timeout(300)
    print('--- no books ---');print(pg.inner_text('.empt .hint'))
    pg.screenshot(path='/tmp/e2.png',full_page=True)
    print('errs',errs)
    b.close()
