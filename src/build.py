# Builds index.html from app.css + app.js (the shell comes from Readers_Bookshelf_Nav7.html)
import sys
h=open('/home/claude/readers/Readers_Bookshelf_Nav7.html').read()
js=open('/home/claude/readers/app.js').read().lstrip('\n')
css=open('/home/claude/readers/app.css').read().rstrip('\n')
ICO={'home':'<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>','shelf':'<rect x="4" y="3" width="4" height="18" rx="1"/><rect x="10" y="6" width="4" height="15" rx="1"/><path d="M16.5 20.5l3.5-14 3 .8"/>','discover':'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>','clubs':'<circle cx="9" cy="8" r="3"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.5c3 0 4.8 1.7 4.8 4.5"/>','stats':'<path d="M5 20V10M12 20V4M19 20v-7"/>','profile':'<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>'}
def bk(cls,p,label,act=''):
    return f'<button class="book {cls}{act}" data-p="{p}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICO[p]}</svg><span>{label}</span></button>'
nv='<nav aria-label="Main">\n'+'\n'.join([bk('b1','home','Home',' active'),bk('b2','shelf','My Shelf'),bk('b3','discover','Discover'),bk('b4','clubs','Clubs'),bk('b5','stats','Stats'),bk('b6','profile','Profile')])+'\n</nav>'
n0=h.index('<nav aria-label="Main">');n1=h.index('</nav>',n0)+6
h=h[:n0]+nv+h[n1:]
if 'name="viewport"' not in h:
    m=h.index('<meta charset');m=h.index('>',m)+1
    h=h[:m]+'\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+h[m:]
a=h.index('<style id="app-css">');b=h.index('</style>',a)+8;k=h.index('const YEAR=')
qr='<script>'+open('/home/claude/readers/pwa/qr.min.js').read()+'</script>\n'
hd='<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="icon" type="image/png" sizes="32x32" href="icon-192.png"><link rel="shortcut icon" href="icon-192.png"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><meta name="theme-color" content="#0F6E56"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Readers">\n'
sb=hd+qr+'<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n'
out=h[:a]+sb+css+h[b:k]+js+'</script></body></html>\n'
dest=sys.argv[1] if len(sys.argv)>1 else '/home/claude/readers/index.html'
open(dest,'w').write(out);print(dest,len(out))
