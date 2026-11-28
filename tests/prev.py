from playwright.sync_api import sync_playwright, Route
import json
DESC="A lonely man lives in a vast labyrinth of halls and statues, keeping a careful journal, until he begins to suspect he is not alone."
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':430,'height':930});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    # stub google books + open library
    pg.route("**googleapis.com**", lambda r: r.fulfill(status=200,content_type="application/json",
        body=json.dumps({"items":[{"volumeInfo":{"description":"<p>"+DESC+"</p>"}}]})))
    pg.route("**openlibrary.org**", lambda r: r.fulfill(status=200,content_type="application/json",body="{}"))
    pg.on('request',lambda r: errs.append('REQ '+r.url[:60]) if 'googleapis' in r.url else None)
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(700)
    pg.evaluate("go('discover')");pg.wait_for_timeout(600)
    n=pg.locator('button.cv2.tapc').count(); print('tappable covers:',n)
    pg.locator('button.cv2.tapc').first.click(); pg.wait_for_timeout(900)
    print('dialog open:',pg.evaluate("bd.open"))
    print('desc:',pg.inner_text('#pvdesc')[:140])
    print('has add:',pg.locator('[data-act=recadd]').count())
    pg.screenshot(path='/tmp/p1.png')
    before=pg.evaluate("S.books.length")
    pg.select_option('#pvshelf','want'); pg.click('[data-act=recadd]'); pg.wait_for_timeout(600)
    print('added:',pg.evaluate("S.books.length")-before)
    print('cached:',pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('readers.descs')||'{}')).length"))
    print('errs',errs)
    b.close()
