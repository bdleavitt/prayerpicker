# prayerpicker
A basic web app that helps give ideas of things one can be grateful for.

## Prayer Picker website

A simple, mobile-friendly, Mad-Libs style prayer builder for children (ages ~6-9)
in the latter-day Saint tradition. Tap or drag words from the word banks (or use
"Surprise me!" to randomly pick some) to fill in:

- **Dear Heavenly Father,**
- **I am thankful for...** (gratitude phrases)
- **Please bless...** (request phrases)
- **In the name of Jesus Christ, amen.**

Each section shows a random preview of a few words by default; use "Show all
words" to expand the full list with a search box, or type your own phrase in
the "Type your own..." box. The "My Prayer" preview lists each phrase on its
own line.

### Editing the word bank

The gratitude and blessing phrases live in [`word-bank.json`](./word-bank.json),
which is loaded by the page at runtime. Edit the `gratitude` and `request`
arrays in that file to add, remove, or change phrases without touching any
JavaScript.

### Running locally

This is a static site with no build step, but it loads `word-bank.json` via
`fetch`, which requires serving the files over HTTP (opening `index.html`
directly with a `file://` URL will not work in most browsers). Serve the
folder with any static file server, e.g.:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
 
