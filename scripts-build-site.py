"""Build the deployed site into /tmp/nomo-site/.

Each source file in marketing/ is content-only (title + style + body).
For GitHub Pages, we wrap it with a proper <html>/<head>/<body> that
sets the viewport, charset, and social-share meta. Every page inherits
the same shell — change here, all pages update.
"""
import os
import re

OUT = "/tmp/nomo-site"
os.makedirs(OUT, exist_ok=True)

PAGES = [
    # source              → deployed as         → OG title / description
    ("marketing/index.html", "index.html",
     "Nomo: ten guaranteed matches a day, no photos until you talk",
     "Ten guaranteed matches a day, chosen by AI and ranked by your vibe. You know their minds, not their faces. One hour to talk. Two reveals. Join the waitlist."),
    ("marketing/privacy.html", "privacy.html",
     "Nomo · Privacy Policy",
     "How Nomo handles the one thing we currently collect: your email. Plain-English, honest, and short."),
    ("marketing/terms.html", "terms.html",
     "Nomo · Terms of Service",
     "The terms for visiting nomosingle.com and joining the waitlist. Waitlist-stage, plain-English."),
]

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Cache-Control" content="no-cache, must-revalidate">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="No more fake connections. No more talk that goes nowhere.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://nomosingle.com/">
<meta name="twitter:card" content="summary_large_image">
<style>html,body{{margin:0;padding:0;background:#0a0b0d}}</style>
</head>
<body>
'''
TAIL = "\n</body>\n</html>\n"

for src, dst, title, desc in PAGES:
    if not os.path.exists(src):
        print(f"skip: {src} not found")
        continue
    body = open(src, encoding="utf-8").read()
    # source files start with their own <title>; strip it so the head
    # can inject the canonical one exactly once.
    body = re.sub(r"^\s*<title>.*?</title>\s*", "", body, count=1, flags=re.DOTALL)
    html = HEAD.format(title=title, desc=desc) + body + TAIL
    open(os.path.join(OUT, dst), "w", encoding="utf-8").write(html)
    print(f"built {dst}")

print("done")
