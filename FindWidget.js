/*
 * Find in note replacement for ctrl+f search (c) Antonio Tejada 2022
 */
const TPL = `<div style="contain: none;">
<div id="findBox" style="padding: 10px; border-top: 1px solid var(--main-border-color); ">
    <input type="text" id="input">
    <input type="checkbox" id="case">&nbsp;case
    <input type="checkbox" id="regexp">&nbsp;regexp
    <span style="font-weight: bold;" id="curFound">0</span>/<span style="font-weight: bold;" id="numFound">0</span>
</div>
</div`;

const showDebug = true;
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
        
        findWidget.$input.keyup(function (e) {
            dbg("keyup on input " + e.key);
            if ((e.key == 'Enter') || (e.key == 'F3')) {
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
                        let component = glob.appContext.getComponentByEl("div.note-detail-code-editor");
                        let codeEditor = component.codeEditor;
                        let doc = codeEditor.doc;
                        
                        let marker;
                        let pos;
                        
                        // Dehighlight current, highlight next
                        marker = findWidget.findResult[curFound];
                        pos = marker.find();
                        marker.clear();
                        marker = doc.markText( pos.from, pos.to, { "className" : "ck-find-result" });
                        findWidget.findResult[curFound] = marker;
                        
                        marker = findWidget.findResult[nextFound];
                        pos = marker.find();
                        marker.clear();
                        marker = doc.markText( pos.from, pos.to, { "className" : "ck-find-result_selected" });
                        findWidget.findResult[nextFound] = marker;
                        
                        codeEditor.scrollIntoView(pos.from);
                    } else {
                        // XXX Assumes text
                        api.getActiveTabTextEditor(textEditor => {
                            const model = textEditor.model;
                            const doc = model.document;
                            const root = doc.getRoot();
                            // See 
                            // Parameters are callback/text, options.matchCase=false, options.wholeWords=false
                            // See https://github.com/ckeditor/ckeditor5/blob/b95e2faf817262ac0e1e21993d9c0bde3f1be594/packages/ckeditor5-find-and-replace/src/findcommand.js#L44
                            // XXX Need to use the callback version for regexp
                            // needle = escapeRegExp(needle);
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
                    let component = glob.appContext.getComponentByEl("div.note-detail-code-editor");
                    let codeEditor = component.codeEditor;

                    codeEditor.focus();
                } else {
                    // XXX Assumes text
                    api.getActiveTabTextEditor(textEditor => {
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
                let component = glob.appContext.getComponentByEl("div.note-detail-code-editor");
                let codeEditor = component.codeEditor;
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
                    let viewport = codeEditor.getViewport();
                    dbg("Viewport is " + viewport.from + "," + viewport.to);
                    let curLine = 0;
                    let curChar = 0;
                    let curMatch = null;
                    findResult = [];
                    // ck-find-result and ck-find-result_selected are the styles ck-editor 
                    // uses for highlighting matches, use the same one on CodeMirror 
                    // for consistency
                    let className = "ck-find-result_selected";
                    // All those markText take several seconds on eg this ~500-line script,
                    // batch them inside an operation so they become unnoticeable
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
                                // XXX When the word being marked is already highlighted by 
                                //     of CodeMirror automatic word highlighting, the marker is not visible
                                //     remove that one and restore it later?
                                let marker = doc.markText( fromPos, toPos, { "className" : className });
                                className = "ck-find-result";
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
                // XXX Assumes "text"

                // Do this even if the needle is empty so the markers
                // are cleared and the counters updated
                api.getActiveTabTextEditor(textEditor => {
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
            
            // Clear markers
            // XXX We could have two states, esc closes the find box
            //     and removes markers, clicking on the 
            //     note keeps the find box open and the markers (which is
            //     the mode needed for F3/shift+F3)
            let numFound = parseInt(findWidget.$numFound.text());
            if (numFound > 0) {
                let curFound = parseInt(findWidget.$curFound.text()) - 1;
                const note = api.getActiveTabNote();
                if (note.type == "code") {
                    let component = glob.appContext.getComponentByEl("div.note-detail-code-editor");
                    let codeEditor = component.codeEditor;
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
                    findWidget.findResult = null;
                } else {
                    // XXX Assumes text
                    api.getActiveTabTextEditor(textEditor => {
                        const model = textEditor.model;
                        // XXX This clears the results, we cannot just removeMarker
                        // from the document because because the next time 
                        // findreplace is invoked will try to removeMarker
                        // and assert, there should be a better way?
                        
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
                }
            }
            
        });
    }
    // higher value means position towards the bottom/right
    get position() { return 100; } 

    get parentWidget() { return 'center-pane'; }

    isEnabled() {
        return super.isEnabled()
            && ((this.note.type === 'text') || (this.note.type === 'code'))
            && this.note.hasLabel('findWidget');
    }

    doRender() {
        this.$findBox.hide();
        return this.$widget;
    }

    async refreshWithNote(note) {
        const {content} = await note.getNoteComplement();

        const text = $(content).text(); // get plain text only
    }

    async entitiesReloadedEvent({loadResults}) {
        if (loadResults.isNoteContentReloaded(this.noteId)) {
            this.refresh();
        }
    }
}

info("Creating FindWidget");
let findWidget = new FindWidget();
module.exports = findWidget;

$(window).keydown(function (e){
    dbg("keydown on window " + e.key);
    // XXX Missing hooking F3/shift-F3 for next/previous without showing the 
    //     findbox
    //     In general ctrl+f should show the findbox and focus it, f3 should 
    //     show the findbox but not focus 
    if ((e.key == 'F3') || 
        // For ctrl+f to work, needs to be disabled from Trilium shortcut
        // config menu
        ((e.metaKey || e.ctrlKey) && (e.key == 'f'))) { 
        
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

                // Initialize the input field to the first selection, if any
                // XXX Start the search from the current cursor position
                findWidget.$input.val("");
                
                if (note.type == "code") {
                    // XXX Missing
                } else {
                    api.getActiveTabTextEditor(textEditor => {
                        const selection = textEditor.model.document.selection;
                        const range = selection.getFirstRange();

                        for (const item of range.getItems()) {
                            // XXX This needs to force a search, since no keys
                            //     were pressed, the search is missing
                            findWidget.$input.val(item.data);
                            findWidget.$input.select();
                            break;
                        }
                    });
                }
            } else if (e.key != 'F3') {
                // If ctrl+f is pressed when the findbox is shown,
                // select the whole input to find
                findWidget.$input.select();
            }
            e.preventDefault();
            return false;
        }
    }
    return true;
});