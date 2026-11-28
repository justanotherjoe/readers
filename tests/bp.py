from playwright.sync_api import sync_playwright
JS_H = "Math.round((document.querySelector('.now')||{getBoundingClientRect:()=>({height:0})}).getBoundingClientRect().height)"
JS_OV = """(()=>{const w=document.documentElement.clientWidth;
  return [...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>w+1).length})()"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    errs=[]
    for w,h in [(390,844),(430,930),(760,1024),(901,900),(1280,900)]:
        pg=b.new_page(viewport={'width':w,'height':h})
        pg.on('pageerror',lambda e,w=w:errs.append(f'{w}: '+str(e)[:90]))
        pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(1100)
        print(f"{w}x{h}: overflow={pg.evaluate(JS_OV)} hero={pg.evaluate(JS_H)}px")
        if w==390: pg.screenshot(path='/tmp/hm_final.png')
        pg.close()
    pg=b.new_page(viewport={'width':390,'height':844})
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(1100)
    for t in ['light','dark','sepia','christmas']:
        pg.evaluate(f"theme('{t}')");pg.wait_for_timeout(250)
        pg.screenshot(path=f'/tmp/th_{t}.png')
    print('themes rendered. errs:',errs)
    b.close()
