from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)[:150]))
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(1500)
    H=lambda: pg.evaluate("Math.round((document.querySelector('.now')||{getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height)")
    P=lambda: pg.evaluate("document.querySelector('main').scrollHeight")
    for d in ['compact','roomy','lines']:
        pg.evaluate(f"S.home.d='{d}';save();render()");pg.wait_for_timeout(500)
        print(f"{d:8} hero={H():4}px page={P():5}px")
        pg.screenshot(path=f'/tmp/hm_{d}.png')
    pg.evaluate("S.home.d='compact';save();render()");pg.wait_for_timeout(300)
    print('also rows:',pg.locator('.alsor .alr').count(),' club rows:',pg.locator('.cstrip .alr').count())
    # customize screen
    pg.evaluate("go('custom')");pg.wait_for_timeout(500)
    print('rows:',pg.locator('.hlist li').count(),'switches:',pg.locator('.sw').count())
    pg.screenshot(path='/tmp/hm_custom.png')
    order_before=pg.evaluate("hOrd().join(',')")
    pg.locator('[data-act=hmv][data-d="-1"]').nth(2).click();pg.wait_for_timeout(400)
    print('reorder:',order_before,'->',pg.evaluate("hOrd().join(',')"))
    pg.locator('[data-act=htg]').first.click();pg.wait_for_timeout(400)
    print('off map:',pg.evaluate("JSON.stringify(S.home.off)"))
    pg.evaluate("go('home')");pg.wait_for_timeout(500)
    print('goal visible after toggle:',pg.locator('.goalbar').count())
    pg.evaluate("go('custom')");pg.click('[data-act=hreset]');pg.wait_for_timeout(400)
    print('after reset:',pg.evaluate("JSON.stringify(S.home)"))
    print('errs',errs)
    b.close()
