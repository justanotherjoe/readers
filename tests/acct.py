from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True).new_page()
    pg.route("**/*supabase*",lambda r:r.abort()) if False else None
    pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(800)
    pg.screenshot(path='/home/claude/shots/acct_out.png')
    pg.evaluate("""()=>{cloud.user={id:'u1',email:'pat@example.com'};cloud.synced=true;cloud.ready=true;S.profile.name='Pat Reader';S.books=seed().books;normalize();
      const b=S.books.find(x=>x.shelf==='reading');b.chapters=['a','b','c','d'];b.cur=1;
      cloud.clubs=[{id:'c1',name:'Friends Club',code:'k7m2qx',bookId:key(b.t,b.a),bt:b.t,ba:b.a,pages:300,chapters:b.chapters,sched:[{upto:2,due:'2026-12-20'},{upto:4,due:'2027-01-10'}],myCh:1,myName:'Pat',members:[{n:'Joe',ch:2,uid:'u0'}],posts:[]}];
      go('clubs')}""");pg.wait_for_timeout(500)
    pg.screenshot(path='/home/claude/shots/acct_clubs.png')
    pg.tap('#acct');pg.wait_for_timeout(300)
    pg.screenshot(path='/home/claude/shots/acct_menu.png')
    b.close()
