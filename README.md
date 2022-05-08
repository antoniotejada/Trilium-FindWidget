# Trilium-FindWidget

Find in note [Trilium](https://github.com/zadam/trilium/) widget to replace the crappy ctrl+f search.

## Video

https://user-images.githubusercontent.com/6446344/164783791-196d2280-5ca8-4058-9257-d5565baffa30.mp4

## Features
- Works on code and text notes.
- Hardcoded keys:
  - F3/ctrl+f, to start a search (you will need to disable ctrl+f shortcut in Trilium shortcut dialog box so the widget can receive it).
  - F3/enter shift+f3/shift+enter to go to the next/prev occurrence
  - esc or click on note to end the search and go back to the note
- Doesn't work on readonly notes, no firm plans to make it work there.
- Tested on Trilium Desktop 0.50.3

## Installation
- Create a code note of type JS Frontend with the contents of FindWidget.js
- Set the owned attributes (alt-a) to #widget
- Set the owned attributes of any note you don't want to enable finding to #noFindWidget
- Disable Ctrl+f shorcut in Trilium options

## Configuration Attributes
### In the Text Note
- noFindWidget: Set on the text notes you don't want to show the ToC for
### In the Script Note
- findWidgetDelayMillis: Number of milliseconds to wait from the time a key is
  pressed until the search is performed. Prevents stalls typing the first chars
  search word in long notes. Set to negative to force enter to be pressed in order
  to search. Default is 250
- debugLevel: Enable output to the javascript console, default is "info"
  (without quotes): 
    - "error" no javascript console output
    - "warn" enable warn statements to the javascript console
    - "info" enable info and previous levels statements to the javascript console
    - "log" enable log and previous levels statements to the javascript console
    - "debug" enable debug and previous levels statements to the javascript console


## Todo
- Refactoring, code cleanup
- Regexp, case, whole word search.
- Find & Replace

## Discussions

https://github.com/zadam/trilium/discussions/2806

