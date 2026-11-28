# Source

`index.html` in the repo root is built, not hand edited. Edit the files here and rebuild.

| File | What it is |
| --- | --- |
| `Readers_Bookshelf_Nav7.html` | The shell: `<head>`, fonts, markup frame, the `<style>` and `<script>` slots |
| `app.css` | All styles. Appended blocks must stay above the final `</style>`, which has to remain the last line |
| `app.js` | The whole app: state, render, views, Supabase calls |
| `build.py` | Inlines the CSS and JS into the shell and injects the Supabase keys, favicon, manifest and PWA tags |

## Building

```
cd src && python3 build.py ../index.html
```

With no argument it writes `index.html` beside itself. The built file is a single self contained page; GitHub Pages serves it from the repo root.

## Testing

See `tests/README.md`. Run the five jsdom suites before every push.
