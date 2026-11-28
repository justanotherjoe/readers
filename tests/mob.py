from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
    pg=ctx.new_page();pg.goto('file:///tmp/test_local.html');pg.wait_for_timeout(500)
    pg.screenshot(path='/home/claude/shots/mob_home.png')
    pg.evaluate("go('shelf')");pg.wait_for_timeout(500);pg.screenshot(path='/home/claude/shots/mob_shelf.png')
    pg.evaluate("go('profile')");pg.wait_for_timeout(400);pg.screenshot(path='/home/claude/shots/mob_profile.png')
    pg.evaluate("go('shelf')");pg.wait_for_timeout(300)
    pg.locator('.cw .cover').first.tap();pg.wait_for_timeout(400);pg.screenshot(path='/home/claude/shots/mob_dialog.png')
    d=b.new_page(viewport={'width':1100,'height':800});d.goto('file:///tmp/test_local.html');d.wait_for_timeout(500);d.screenshot(path='/home/claude/shots/desk_home.png')
    b.close()
