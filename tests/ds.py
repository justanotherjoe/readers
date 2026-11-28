from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1200,'height':800});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(800)
    pg.evaluate("S.custom.push('Did not finish ever');S.books[0].custom=['Did not finish ever'];save();go('shelf')")
    pg.wait_for_timeout(400)
    print(pg.locator('.delsh').count(),pg.evaluate("S.custom"))
    pg.locator('.delsh').first.scroll_into_view_if_needed();pg.screenshot(path='/tmp/ds1.png')
    pg.locator('.delsh').first.click();pg.wait_for_timeout(300)
    print(pg.inner_text('#fm') if pg.locator('#fm').count() else '')
    pg.screenshot(path='/tmp/ds2.png')
    pg.click('#fm button.pri');pg.wait_for_timeout(400)
    print(pg.evaluate("[S.custom,S.books[0].custom]"),pg.locator('.delsh').count(),errs)
    b.close()
