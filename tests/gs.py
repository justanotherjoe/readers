from playwright.sync_api import sync_playwright
import json
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
docs=[{"key":"/works/OL1W","title":"Dune","author_name":["Frank Herbert"],"first_publish_year":1965,"number_of_pages_median":600}]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for n,w,h,m in [('d',1280,800,False),('m',390,844,True)]:
        pg=b.new_context(viewport={'width':w,'height':h},device_scale_factor=1 if not m else 2,is_mobile=m,has_touch=m).new_page()
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.add_init_script(fake)
        pg.route("**/openlibrary.org/search.json*",lambda r:r.fulfill(status=200,content_type='application/json',body=json.dumps({"docs":docs})))
        pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(500)
        out={}
        for v in ['home','shelf','discover','clubs','stats','profile','friends','notes']:
            pg.evaluate(f"go('{v}')");pg.wait_for_timeout(250);out[v]=pg.locator('#q').count()
        print(n,out)
        pg.evaluate("go('home')");pg.wait_for_timeout(250);pg.fill('#q','Dune');pg.wait_for_timeout(1000)
        print(n,'results',pg.locator('.res').count())
        pg.screenshot(path=f'/home/claude/shots/gs_{n}.png')
        print(errs)
    b.close()
