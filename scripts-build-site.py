import re, io

content = open("marketing/index.html", encoding="utf-8").read()
# marketing/index.html is content-only (the Claude artifact wraps it).
# For GitHub Pages we must supply our own <head> with a viewport tag.
content = re.sub(r'^\s*<title>.*?</title>\s*', '', content, count=1, flags=re.DOTALL)

head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Nomo: ten people a day, sealed until you talk</title>
<meta name="description" content="Ten people a day, chosen by AI and ranked by your vibe. You know their minds, not their faces. One hour to talk. Two reveals. Join the waitlist.">
<meta property="og:title" content="Nomo — ten people a day, sealed until you talk">
<meta property="og:description" content="No more fake connections. No more talk that goes nowhere.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://jayj221.github.io/nomo-waitlist/">
<meta name="twitter:card" content="summary_large_image">
<style>html,body{margin:0;padding:0;background:#0a0b0d}</style>
</head>
<body>
'''
tail = '\n</body>\n</html>\n'

open("/tmp/nomo-site/index.html", "w", encoding="utf-8").write(head + content + tail)
print("built site index.html with viewport meta")
