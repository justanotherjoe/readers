from playwright.sync_api import sync_playwright
import json
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
docs=[{"key":"/works/OL1W","title":"Band of Brothers: E Company, 506th Regiment, 101st Airborne from Normandy to Hitler's Eagle's Nest","author_name":["Stephen E. Ambrose"],"first_publish_year":1992,"number_of_pages_median":432},
{"key":"/works/OL2W","title":"Beyond Band of Brothers","author_name":["Richard D. Winters"],"first_publish_year":2005,"number_of_pages_median":320}]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True).new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.add_init_script(fake)
    pg.route("**/openlibrary.org/search.json*",lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"docs":docs})))
    pg.route("**/openlibrary.org/works/*",lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"description":{"value":"The story of Easy Company, from training at Toccoa to the war's end.\r\n\r\nSecond paragraph."}})))
    pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(500)
    pg.evaluate("go('shelf')");pg.wait_for_timeout(300)
    pg.fill('#q','Band of Brothers');pg.wait_for_timeout(1200)
    pg.screenshot(path='/home/claude/shots/s_list.png')
    pg.tap('.resmain >> nth=0');pg.wait_for_timeout(800)
    pg.screenshot(path='/home/claude/shots/s_prev.png')
    pg.tap('[data-act=sadd2]');pg.wait_for_timeout(400)
    print('open dialog after add:',pg.evaluate("document.querySelector('#bd').open"),'on shelf:',pg.evaluate("S.books.some(b=>b.t.startsWith('Band of Brothers'))"))
    print(errs)
    b.close()
