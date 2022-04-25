/*
 * Find in note replacement for ctrl+f search (c) Antonio Tejada 2022
 *
 * Note that many times some common code is replicated between CodeMirror and CKEditor
 * codepaths because the CKEditor update is done inside a callback that is deferred
 * so the code cannot be put outside of the callback or it will execute too early.
 *
 * See https://github.com/zadam/trilium/discussions/2806 for discussions
 */
const TPL = `<div style="contain: none;">
<div id="findBox" style="padding: 10px; border-top: 1px solid var(--main-border-color); ">
    <input type="text" id="input">
    <input type="checkbox" id="case" disabled>&nbsp;case
    <input type="checkbox" id="regexp" disabled>&nbsp;regexp
    <span style="font-weight: bold;" id="curFound">0</span>/<span style="font-weight: bold;" id="numFound">0</span>
</div>
</div`;

const showDebug = (api.startNote.getAttribute("label", "debug") != null);
function dbg(s) {
    if (showDebug) {
        console.debug("FindWidget: " + s);
    }
}

function info(s) {
    console.info("FindWidget: " + s);
}

function warn(s) {
    console.warn("FindWidget: " + s);
}

function assert(e, msg) {
    console.assert(e, "FindWidget: " + msg);
}

function debugbreak() {
    debugger;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getActiveTabCodeEditor() {
    // The code editor hierarchy is
    //   note-split data-ntx-id=XXXX
    //    ...
    //      note-detail-code component
    //          note-detail-code-editor
    //              CodeMirror 
    // See the discussion at https://github.com/zadam/trilium/discussions/2806#discussioncomment-2623695
    // The component has a reference to the CodeMirror editor and ntxId is a
    // per split noteContextId
    // Note there can be multiple code editors, hidden, visible, per tab and per
    // split, but the ntxId makes them unique to the active note in the tab
    // manager
    // This could use glob.appContext.getComponentByEl but it doesn't seem to 
    // be worth it
    
    const activeNtxId =  glob.appContext.tabManager.activeNtxId;
    const component = $(".note-split[data-ntx-id=" + activeNtxId + 
        "] .note-detail-code").prop('component');

    return component.codeEditor;
}

function getActiveTabTextEditor(callback) {
    // Wrapper until this commit is available
    // https://github.com/zadam/trilium/commit/11578b1bc3dda7f29a91281ec28b5fe6f6c63fef
    api.getActiveTabTextEditor(function(textEditor) {
        const textEditorNtxId = textEditor.sourceElement.parentElement.component.noteContext.ntxId;
        if (glob.appContext.tabManager.activeNtxId == textEditorNtxId) {
            callback(textEditor);
        }
    });
}

// ck-find-result and ck-find-result_selected are the styles ck-editor 
// uses for highlighting matches, use the same one on CodeMirror 
// for consistency
const FIND_RESULT_SELECTED_CSS_CLASSNAME = "ck-find-result_selected";
const FIND_RESULT_CSS_CLASSNAME = "ck-find-result";

class FindWidget extends api.NoteContextAwareWidget {
    constructor(...args) {
        super(...args);
        this.$widget = $(TPL);
        this.$findBox = this.$widget.find('#findBox');
        this.$input = this.$widget.find('#input');
        this.$curFound = this.$widget.find('#curFound');
        this.$numFound = this.$widget.find('#numFound');
        this.findResult = null;
        this.prevFocus = null;
        let findWidget = this;
        /*
        findWidget.$input.keyup(function (e) {
            dbg("keyup on input " + e.key);
            if (e.key == 'Enter') {
                let numFound = parseInt(findWidget.$numFound.text());
                let curFound = parseInt(findWidget.$curFound.text()) - 1;
                dbg("Finding " + curFound + "/" + numFound + " occurrence of " + findWidget.$input.val());
                if (numFound > 0) {
                    let delta =  e.shiftKey ? -1 : 1;
                    let nextFound = curFound + delta;
                    // Wrap around
                    if (nextFound > numFound - 1) {
                        nextFound = 0;
                    } if (nextFound < 0) {
                        nextFound = numFound - 1;
                    }

                    let needle = findWidget.$input.val();
                    findWidget.$curFound.text(nextFound + 1);
                    // window.find(findWidget.$input.val());
                    let $prevFocus = $(findWidget.prevFocus)
                    // let $foundElements = $("*:contains('" + needle + "'):eq(" + curFound + ")");
                    let caseInsensitive = true;
                    if (caseInsensitive) {
                        needle = needle.toLowerCase();
                    }
                    let $foundElements = $prevFocus.find('*').filter( 
                        function () {
                            dbg("Filtering " + this.textContent);
                            let text = this.textContent;
                            if (caseInsensitive) {
                                text = text.toLowerCase();
                            } 
                            return (text.indexOf(needle) != -1);
                        }
                    );
                    dbg("Found elements "+ $foundElements.length + ": " + $foundElements);
                    let foundElement = $foundElements[nextFound];
                    dbg("Found element " + $(foundElement).text());
                    // $("window").scrollTop($foundElement.offset().top);
                    foundElement.scrollIntoView();
                }
            } else if (e.key == 'Escape') {
                dbg("focusing back to " + findWidget.prevFocus);
                $(findWidget.prevFocus).focus();
            } 
            // e.preventDefault();
        });
        
        findWidget.$input.on('input', function (e) {
            let prevFocus = findWidget.prevFocus;
            dbg("input " + e.key + " on " + prevFocus.nodeName);
            // Skip the style tags text by going to the -editor class
            let $noteElement = $(prevFocus).closest(".note-detail-editable-text-editor, .note-detail-code-editor");
            let text = $noteElement.text();
            let needle = findWidget.$input.val();
            needle = escapeRegExp(needle);
            dbg("text is " + text + " needle is " + needle);
            let numFound = 0;
            if (needle.length > 0) {
                let re = new RegExp(needle, 'gi');
                let m = text.match(re);
                numFound = m ? m.length : 0;
            }
            findWidget.$numFound.text(numFound);
            // XXX This should go to the first occurrence without waiting for Enter
            if (numFound > 0) {
                findWidget.$curFound.text(1);
            } else {
                findWidget.$curFound.text(0);
            }
        });
        
        */
        
        findWidget.$input.keydown(function (e) {
            dbg("keydown on input " + e.key);
            if ((e.metaKey || e.controlKey) && ((e.key == 'F') || (e.key == 'f'))) {
                // If ctrl+f is pressed when the findbox is shown,
                // select the whole input to find
                findWidget.$input.select();
            } else if ((e.key == 'Enter') || (e.key == 'F3')) {
                let numFound = parseInt(findWidget.$numFound.text());
                let curFound = parseInt(findWidget.$curFound.text()) - 1;
                dbg("Finding " + curFound + "/" + numFound + " occurrence of " + findWidget.$input.val());
                if (numFound > 0) {
                    let delta =  e.shiftKey ? -1 : 1;
                    let nextFound = curFound + delta;
                    // Wrap around
                    if (nextFound > numFound - 1) {
                        nextFound = 0;
                    } if (nextFound < 0) {
                        nextFound = numFound - 1;
                    }

                    let needle = findWidget.$input.val();
                    findWidget.$curFound.text(nextFound + 1);
                    
                    const note = api.getActiveTabNote();
                    if (note.type == "code") {
                        let codeEditor = getActiveTabCodeEditor();
                        let doc = codeEditor.doc;
                        
                        //
                        // Dehighlight current, highlight & scrollIntoView next
                        //
                        
                        let marker = findWidget.findResult[curFound];
                        let pos = marker.find();
                        marker.clear();
                        marker = doc.markText( 
                            pos.from, pos.to, 
                            { "className" : FIND_RESULT_CSS_CLASSNAME }
                        );
                        findWidget.findResult[curFound] = marker;
                        
                        marker = findWidget.findResult[nextFound];
                        pos = marker.find();
                        marker.clear();
                        marker = doc.markText( 
                            pos.from, pos.to, 
                            { "className" : FIND_RESULT_SELECTED_CSS_CLASSNAME }
                        );
                        findWidget.findResult[nextFound] = marker;
                        
                        codeEditor.scrollIntoView(pos.from);
                    } else {
                        assert(note.type == "text", "Expected text note, found " + note.type);
                        getActiveTabTextEditor(textEditor => {
                            const model = textEditor.model;
                            const doc = model.document;
                            const root = doc.getRoot();
                            // See 
                            // Parameters are callback/text, options.matchCase=false, options.wholeWords=false
                            // See https://github.com/ckeditor/ckeditor5/blob/b95e2faf817262ac0e1e21993d9c0bde3f1be594/packages/ckeditor5-find-and-replace/src/findcommand.js#L44
                            // XXX Need to use the callback version for regexp
                            // needle = escapeRegExp(needle);
                            // cufFound wrap around assumes findNext and findPrevious 
                            // wraparound, which is what they do
                            if (delta > 0) {
                                textEditor.execute('findNext', needle);
                            } else {
                                textEditor.execute('findPrevious', needle);
                            }
                        });
                    }
                }
                e.preventDefault();
                return false;
            } else if (e.key == 'Escape') {
                dbg("focusing back to " + findWidget.prevFocus);
                //$(findWidget.prevFocus).focus();
                let numFound = parseInt(findWidget.$numFound.text());

                const note = api.getActiveTabNote();
                if (note.type == "code") {
                    let codeEditor = getActiveTabCodeEditor();

                    codeEditor.focus();
                } else {
                    assert(note.type == "text", "Expected text note, found " + note.type);
                    getActiveTabTextEditor(textEditor => {
                        textEditor.focus();
                    });
                }
            } 
            // e.preventDefault();
        });
                                   
        findWidget.$input.on('input', function (e) {
            let prevFocus = findWidget.prevFocus;
            dbg("input " + e.key + " on " + prevFocus.nodeName);
            let needle = findWidget.$input.val();
            
            const note = api.getActiveTabNote();
            if (note.type == "code") {
                let findResult = null;
                let numFound = 0;
            
                // See https://codemirror.net/addon/search/searchcursor.js for tips
                let codeEditor = getActiveTabCodeEditor();
                let doc = codeEditor.doc;
                let text = doc.getValue();
                
                // Clear all markers
                if (findWidget.findResult != null) {
                    codeEditor.operation(function() {
                        for (let i = 0; i < findWidget.findResult.length; ++i) {
                            let marker = findWidget.findResult[i];
                            marker.clear();
                        }
                    });
                }

                if (needle != "") {
                    needle = escapeRegExp(needle);
                    
                    // Find and highlight matches
                    let re = new RegExp(needle, 'gi');
                    let curLine = 0;
                    let curChar = 0;
                    let curMatch = null;
                    findResult = [];
                    let className = FIND_RESULT_SELECTED_CSS_CLASSNAME;
                    // All those markText take several seconds on eg this ~500-line script,
                    // batch them inside an operation so they become unnoticeable
                    // Alternatively, an overlay could be used, see 
                    // https://codemirror.net/addon/search/match-highlighter.js ?
                    codeEditor.operation(function() {
                        for (let i = 0; i < text.length; ++i) {
                            // Fetch next match if it's the first time or 
                            // if past the current match start
                            if ((curMatch == null) || (curMatch.index < i)) {
                                curMatch = re.exec(text);
                                if (curMatch == null) {
                                    // No more matches
                                    break;
                                }
                            }
                            // Create a highlight marker for the match, scroll to the first match
                            if (i == curMatch.index) {
                                let fromPos = { "line" : curLine, "ch" : curChar };
                                // XXX If multiline is supported, this needs to recalculate curLine
                                //     since the match may span lines
                                let toPos = { "line" : curLine, "ch" : curChar + curMatch[0].length};
                                // XXX or css = "color: #f3"
                                let marker = doc.markText( fromPos, toPos, { "className" : className });
                                className = FIND_RESULT_CSS_CLASSNAME;
                                findResult.push(marker);
                                // Scroll the first match into view
                                if (numFound == 0) {
                                    codeEditor.scrollIntoView(fromPos);
                                }
                                numFound++;
                            }
                            // Do line and char position tracking
                            if (text[i] == "\n") {
                                curLine++;
                                curChar = 0;
                            } else {
                                curChar++;
                            }
                        }
                    });
                }
                findWidget.findResult = findResult;
                findWidget.$numFound.text(numFound);
                findWidget.$curFound.text((numFound == 0) ? 0 : 1);
                
            } else { 
                assert(note.type == "text", "Expected text note, found " + note.type);

                // Do this even if the needle is empty so the markers
                // are cleared and the counters updated
                getActiveTabTextEditor(textEditor => {
                    const model = textEditor.model;
                    let findResult = null;
                    let numFound = 0;
                    
                    // Clear
                    let findAndReplaceEditing = textEditor.plugins.get( 'FindAndReplaceEditing' );
                    findAndReplaceEditing.state.clear(model);
                    findAndReplaceEditing.stop();
                    if (needle != "") {
                        // Parameters are callback/text, options.matchCase=false, options.wholeWords=false
                        // See https://github.com/ckeditor/ckeditor5/blob/b95e2faf817262ac0e1e21993d9c0bde3f1be594/packages/ckeditor5-find-and-replace/src/findcommand.js#L44
                        // XXX Need to use the callback version for regexp
                        // needle = escapeRegExp(needle);
                        // let re = new RegExp(needle, 'gi');
                        // let m = text.match(re);
                        // numFound = m ? m.length : 0;
                        findResult = textEditor.execute('find', needle);
                        numFound = findResult.results.length;
                    }

                    findWidget.findResult = findResult;
                    findWidget.$numFound.text(numFound);
                    findWidget.$curFound.text((numFound == 0) ? 0 : 1);
                });
            }
        });
            
        findWidget.$input.blur(function () {
            findWidget.$findBox.hide();
            findWidget.prevFocus = null; 
            
            // Restore any state, if there's a current occurrence clear markers
            // and scroll to the last occurrence
            
            // XXX Switching to a different tab with crl+tab doesn't invoke
            //     blur and leaves a stale search which then breaks when 
            //     navigating it
            let numFound = parseInt(findWidget.$numFound.text());
            let curFound = parseInt(findWidget.$curFound.text()) - 1;
            const note = api.getActiveTabNote();
            if (note.type == "code") {
                let codeEditor = getActiveTabCodeEditor();
                if (numFound > 0) {
                    let doc = codeEditor.doc;
                    let pos = findWidget.findResult[curFound].find();
                    doc.setCursor(pos.from);
                    // Clear all markers
                    codeEditor.operation(function() {
                        for (let i = 0; i < findWidget.findResult.length; ++i) {
                            let marker = findWidget.findResult[i];
                            marker.clear();
                        }
                    });
                }
                // Restore the highlightSelectionMatches setting
                codeEditor.setOption("highlightSelectionMatches", findWidget.oldHighlightSelectionMatches);
                findWidget.findResult = null;
           } else {
                assert(note.type == "text", "Expected text note, found " + note.type);
                if (numFound > 0) {
                    getActiveTabTextEditor(textEditor => {
                        // Clear the markers and set the caret to the 
                        // current occurrence
                        const model = textEditor.model;
                        let range = findWidget.findResult.results.get(curFound).marker.getRange();
                        // From 
                        // https://github.com/ckeditor/ckeditor5/blob/b95e2faf817262ac0e1e21993d9c0bde3f1be594/packages/ckeditor5-find-and-replace/src/findandreplace.js#L92
                        let findAndReplaceEditing = textEditor.plugins.get( 'FindAndReplaceEditing' );
                        findAndReplaceEditing.state.clear(model);
                        findAndReplaceEditing.stop();
                        model.change(writer => {
                            writer.setSelection(range, 0);
                        });
                        textEditor.editing.view.scrollToTheSelection();
                        findWidget.findResult = null;
                    });
               } else {
                   findWidget.findResult = null;
               }
           }
        });
    }
    
    get position() {
        dbg("getPosition");
        // higher value means position towards the bottom/right
        return 100; 
    } 

    get parentWidget() { 
        dbg("getParentWidget");
        return 'center-pane'; 
    }

    isEnabled() {
        dbg("isEnabled");
        return super.isEnabled()
            && ((this.note.type === 'text') || (this.note.type === 'code'))
            && this.note.hasLabel('findWidget');
    }

    doRender() {
        dbg("doRender");
        this.$findBox.hide();
        return this.$widget;
    }

    async refreshWithNote(note) {
        dbg("refreshWithNote");
    }

    async entitiesReloadedEvent({loadResults}) {
        dbg("entitiesReloadedEvent");
        if (loadResults.isNoteContentReloaded(this.noteId)) {
            this.refresh();
        }
    }
}

info("Creating FindWidget");
let findWidget = new FindWidget();
module.exports = findWidget;

// XXX Use api.bindShortcut
$(window).keydown(function (e){
    dbg("keydown on window " + e.key);
    if ((e.key == 'F3') || 
        // Note that for ctrl+f to work, needs to be disabled in 
        // Trilium's shortcut config menu
        // XXX Maybe not if using bindShorcut?
        ((e.metaKey || e.ctrlKey) && ((e.key == 'f') || (e.key == 'F')))) { 
        
        const note = api.getActiveTabNote();
        // Only writeable text and code supported
        const readOnly = note.getAttribute("label", "readOnly");
        if (!readOnly && ((note.type == "code") || (note.type == "text"))) {
            if (findWidget.prevFocus == null) {
            
                dbg("Focusing in from " + window.document.activeElement);
                findWidget.prevFocus = document.activeElement;
                findWidget.$findBox.show();
                findWidget.$input.focus();
                findWidget.$numFound.text(0);
                findWidget.$curFound.text(0);

                
                // XXX Missing starting the search from the current cursor position
                // Initialize the input field to the text selection, if any
                if (note.type == "code") {
                    let codeEditor = getActiveTabCodeEditor();
                    
                    // highlightSelectionMatches is the overlay that
                    // highlights the words under the cursor. This occludes
                    // the search markers style, save it, disable it. 
                    // Will be restored when the back into the note
                    findWidget.oldHighlightSelectionMatches = codeEditor.getOption("highlightSelectionMatches");
                    codeEditor.setOption("highlightSelectionMatches", false);
                    
                    // Fill in the findbox with the current selection if any
                    const selectedText = codeEditor.getSelection()
                    if (selectedText != "") {
                        findWidget.$input.val(selectedText);
                    }
                    // Trigger the event so the search is performed
                    if (findWidget.$input.val() != "") {
                        findWidget.$input.select();
                        findWidget.$input.trigger('input');
                    }
                } else {
                    getActiveTabTextEditor(textEditor => {
                        const selection = textEditor.model.document.selection;
                        const range = selection.getFirstRange();

                        for (const item of range.getItems()) {
                            // Fill in the findbox with the current selection if any,
                            findWidget.$input.val(item.data);
                            break;
                        }
                        // Trigger the event so the search is performed
                        if (findWidget.$input.val() != "") {
                            findWidget.$input.select();
                            findWidget.$input.trigger('input');
                        }
                    });
                } 
            }
            e.preventDefault();
            return false;
        }
    }
    return true;
});