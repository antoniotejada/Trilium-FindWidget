# Trilium-FindWidget

Find in note [Trilium](https://github.com/zadam/trilium/) widget to replace the crappy ctrl+f search.

## Features
- For the time being it only works on notes tagged with #findWidget (this is just a safety measure while I'm developing it, will remove it at some point).
- Works on code and text notes.
- Hardcoded keys:
  - F3/ctrl+f, to start a search (you will need to disable ctrl+f shortcut in Trilium shortcut dialog box so the widget can receive it).
  - F3/enter shift+f3/shift+enter to go to the next/prev occurrence
  - esc or click on note to end the search and go back to the note
- Doesn't work on readonly notes, no firm plans to make it work there.
- Enable debugging setting the label #debug on the script code note.

## Todo
- Refactoring, code cleanup
- Regexp, case, whole word search.
- Find & Replace
- Behavior cleanup to make it like vscode search (allow F3 to repeat last search and don't hide the findbox in that case, etc).

## Discussions

https://github.com/zadam/trilium/discussions/2806

## Video

https://user-images.githubusercontent.com/6446344/164783791-196d2280-5ca8-4058-9257-d5565baffa30.mp4