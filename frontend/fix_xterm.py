path = 'node_modules/xterm/lib/xterm.js'

with open(path, 'r', encoding='utf-8') as file:
    filedata = file.read()

filedata = filedata.replace(
    '[t.clientX-s.left-n,t.clientY-s.top-o]', 
    '[(t.clientX-s.left-n)/e.reactFlowZoom,(t.clientY-s.top-o)/e.reactFlowZoom]'
)

with open(path, 'w', encoding='utf-8') as file:
    file.write(filedata)