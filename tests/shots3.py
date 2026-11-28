from playwright.sync_api import sync_playwright
fake="window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){},signOut:async()=>{}}})}"
import datetime
today=datetime.date.today().isoformat()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True).new_page()
    pg.add_init_script(fake)
    pg.goto('file:///tmp/test_cloud.html');pg.wait_for_timeout(700)
    pg.evaluate("""(today)=>{cloud.user={id:'u1',email:'joe@example.com'};cloud.synced=true;cloud.ready=true;cloud.fcode='a1b2c3d4';S=seed();normalize();S.onbHide=false;
      S.books=S.books.slice(0,2);S.books.forEach(b=>b.rating=null);
      cloud.friends=[{id:'f1',other:'u7',name:'Sam Rivera',status:'accepted',incoming:false,shared:[{t:'Dune',a:'Frank Herbert',r:5,tg:['Epic'],p:600,f:today},{t:'Project Hail Mary',a:'Andy Weir',r:5,tg:['Science fiction'],p:476,f:today},{t:'Circe',a:'Madeline Miller',r:4,tg:['Fantasy'],p:393,f:'2026-01-01'}]},{id:'f2',other:'u8',name:'Pat Lee',status:'pending',incoming:true,shared:[]}];
      cloud.clubs=[{id:'c1',name:'Friends Club',code:'k7m2qx',bookId:S.books[0].id,bt:S.books[0].t,ba:S.books[0].a,pages:300,chapters:['a','b','c','d'],sched:[],myCh:0,myName:'Joe',members:[{n:'Sam Rivera',ch:2,uid:'u7'},{n:'Dana Fox',ch:1,uid:'u9'}],posts:[]}];
      S.books[0].chapters=['a','b','c','d'];S.books[0].cur=0;S.books[0].shelf='reading';
      go('home')}""",today);pg.wait_for_timeout(500)
    pg.screenshot(path='/home/claude/shots/v3_home.png',full_page=False)
    pg.evaluate("window.scrollTo(0,700)");pg.wait_for_timeout(200);pg.screenshot(path='/home/claude/shots/v3_home2.png')
    pg.evaluate("go('friends')");pg.wait_for_timeout(500);pg.screenshot(path='/home/claude/shots/v3_friends.png')
    pg.evaluate("window.scrollTo(0,document.body.scrollHeight)");pg.wait_for_timeout(300);pg.screenshot(path='/home/claude/shots/v3_friends_bottom.png')
    pg.evaluate("fid='f1';go('friends')");pg.wait_for_timeout(400);pg.screenshot(path='/home/claude/shots/v3_friend.png')
    pg.evaluate("go('home');toast('Removed Dune',()=>{})");pg.wait_for_timeout(300);pg.screenshot(path='/home/claude/shots/v3_toast.png')
    b.close()
