SeoSuite.panel.MetaTag = function(config) {
    config = config || {};

    SeoSuite.currentCaretPosition = [];

    Ext.applyIf(config, {
        itemCls     : 'seosuite-meta-field',
        items       : [{
            xtype       : 'hidden',
            description : MODx.expandHelp ? '' : config.description,
            name        : config.name,
            id          : 'seosuite-preview-editor-' + config.id,
            value       : config.value,
            listeners   : {
                change      : {
                    fn          : this.onUpdateValue,
                    scope       : this
                }
            }
        }, {
            xtype       : 'button',
            cls         : 'seosuite-meta-field-btn',
            text        : '<i class="icon icon-plus"></i> ' + _('seosuite.tab_meta.add_variable'),
            target_field    : 'seosuite-variables-preview-' + config.id,
            handler     : function (btn) {

                var type = 'description';

                if (btn.target_field === 'seosuite-variables-preview-title') {
                    type = 'title';
                }

                /* Set default position if needed. */
                if (!SeoSuite.currentCaretPosition[type]) {
                    SeoSuite.currentCaretPosition[type]             = [];
                    SeoSuite.currentCaretPosition[type]['element']  = Ext.query('#' + btn.target_field)[0];
                    SeoSuite.currentCaretPosition[type]['position'] = 0;
                }

                this.showVariableWindow(btn);
            },
            scope       : this,
        }, {
            cls         : 'seosuite-meta-editor',
            html        : '<div class="x-form-text" id="seosuite-meta-editor-' + config.id + '" contenteditable="true" spellcheck="false"></div>',
            listeners   : {
                afterrender : {
                    fn          : this.onAfterRender,
                    scope       : this
                }
            }
        }, {
            html        : '<div id="seosuite-variables-preview-' + config.id + '"></div>',
            listeners   : {
                afterRender: function () {
                    Ext.get('seosuite-variables-preview-' + config.id).dom.innerHTML = this.renderVariablesPreview(config.value);

                    var self = this;
                    document.getElementById('seosuite-variables-preview-' + config.id).addEventListener('input', function(event) {
                        SeoSuite.currentCaretPosition            = [];
                        SeoSuite.currentCaretPosition[config.id] = self.getCaretPosition();

                        var parent = self.getSelectionBoundaryElement('start');
                        if (parent.tagName === 'DIV') {
                            var parts = [];
                            event.target.innerHTML.split(/<\/span>/gm).forEach(function (value) {
                                /* If string does not start with span, prepend it with a span element. */
                                if (!value.startsWith('<span')) {
                                    /* If the string does include a span, make sure we close the span before. */
                                    if (value.includes('<span')) {
                                        value = value.replace('<span', '</span><span');
                                    }

                                    value = '<span id="' + SeoSuite.generateUniqueID() + '">' + value;
                                }

                                value += '</span>';

                                parts.push(value);
                            });

                            var position = self.getCaretPosition(document.getElementById('seosuite-variables-preview-' + config.id))['position'];

                            event.target.innerHTML = parts.join('');

                            self.setCaretPosition('seosuite-variables-preview-' + config.id, position);
                        }

                        SeoSuite.currentCaretPosition            = [];
                        SeoSuite.currentCaretPosition[config.id] = self.getCaretPosition();

                        SeoSuite.updateHiddenMetafieldValue(config.id);
                    }, false);

                    var elements = document.querySelectorAll('.seosuite-snippet-variable');
                    for (i = 0; i < elements.length; ++i) {
                        elements[i].addEventListener('click', function (event) {
                            SeoSuite.selectElementById(event.target.id);
                        });
                    }

                    document.getElementById('seosuite-variables-preview-' + config.id).addEventListener('focusin', function() {
                        /* Make sure to reset current caret position, in case other field is focused upon. */
                        SeoSuite.currentCaretPosition            = [];
                        SeoSuite.currentCaretPosition[config.id] = self.getCaretPosition();
                    });

                    document.getElementById('seosuite-variables-preview-' + config.id).addEventListener('click', function() {
                        /* Make sure to reset current caret position, in case other field is focused upon. */
                        SeoSuite.currentCaretPosition            = [];
                        SeoSuite.currentCaretPosition[config.id] = self.getCaretPosition();
                    });

                    document.getElementById('seosuite-variables-preview-' + config.id).addEventListener('keyup', function(event) {
                        /* If left arrow or right arrow. */
                        if (event.keyCode === 37 || event.keyCode === 39) {
                            var selection = window.getSelection();

                            /* If arrow cursor is moved by arrow key and cursor is inside seosuite snippet variable, then auto select the element. */
                            if (selection.anchorNode.parentNode.classList.contains('seosuite-snippet-variable') && selection.type !== 'Range') {

                                /* Ignore if already selected. */
                                console.log(event);
                                SeoSuite.selectElementById(selection.anchorNode.parentNode.id);
                            }

                            SeoSuite.currentCaretPosition            = [];
                            SeoSuite.currentCaretPosition[config.id] = self.getCaretPosition();
                        }
                    });
                },
                scope: this
            }
        }, {
            xtype: MODx.expandHelp ? 'label' : 'hidden',
            html : config.description,
            cls  : 'desc-under'
        }]
    });

    SeoSuite.panel.MetaTag.superclass.constructor.call(this, config);

    this.addEvents('change');
};

Ext.extend(SeoSuite.panel.MetaTag, MODx.Panel, {
    onAfterRender: function() {
        this.editor = Ext.get('seosuite-meta-editor-' + this.id);

        //this.editor.addListener('keyup', function(event) {
        //    console.log('keyup', event, this);
        //});

        //this.editor.addListener('click', function(event) {
        //    console.log('click', event);
        //});



        this.editor.addListener('keydown', function(event, tf) {
            if (event.keyCode === 13) {
                event.preventDefault();
            }
        });

        this.editor.addListener('keyup', (function(event, tf) {
            var data    = [];
            var matches = tf.innerHTML.match(/<span[^>]*>*.*?<\/span>/gm);

            if (matches) {
                matches.forEach(function (snippet) {
                    var value = snippet.match(/<span.*?data-type="(.*?)"?.*?>(.*?)<\/span>/);

                    if (value) {
                        data.push({
                            type    : value[1],
                            value   : value[2]
                        });
                    }
                });
            }

            this.data = data;
        }).bind(this));

        if (this.value) {
            this.setValue(this.value);
        }
    },
    setValue: function(value) {
        this.data = this.parseEditorData(value);

        this.onUpdateEditorValue();
    },
    getValue: function() {
        return this.data;
    },
    parseEditorData: function(value) {
        var data = [];

        if (!Ext.isEmpty(value)) {
            var json = Ext.decode(value);

            if (json) {
                json.forEach(function(item) {
                    data.push({
                        type    : item.type,
                        value   : item.value || ''
                    });
                });
            }
        }

        return data;
    },
    onUpdateHiddenValue: function() {
    },
    onUpdateEditorValue: function() {
        var output = [];

        this.data.forEach(function(item) {
            if (item.type === 'variable' || item.type === 'placeholder') {
                output.push('<span data-type="variable" contenteditable="false" spellcheck="false">' + item.value.replace(/&nbsp;/g, ' ') + '</span>');
            } else {
                output.push('<span data-type="string" spellcheck="false">' + item.value.replace(/&nbsp;/g, ' ') + '</span>');
            }
        });

        this.editor.dom.innerHTML = output.join('');
    },
    onUpdateValue: function(tf) {
        this.fireEvent('change', this, tf.getValue());
    },
    getSelectionBoundaryElement: function (isStart) {
        var range, sel, container;
        if (document.selection) {
            range = document.selection.createRange();
            range.collapse(isStart);
            return range.parentElement();
        } else {
            sel = window.getSelection();
            if (sel.getRangeAt) {
                if (sel.rangeCount > 0) {
                    range = sel.getRangeAt(0);
                }
            } else {
                // Old WebKit
                range = document.createRange();
                range.setStart(sel.anchorNode, sel.anchorOffset);
                range.setEnd(sel.focusNode, sel.focusOffset);

                // Handle the case when the selection was selected backwards (from the end to the start in the document)
                if (range.collapsed !== sel.isCollapsed) {
                    range.setStart(sel.focusNode, sel.focusOffset);
                    range.setEnd(sel.anchorNode, sel.anchorOffset);
                }
            }

            if (range) {
                container = range[isStart ? "startContainer" : "endContainer"];

                /* Check if the container is a text node and return its parent if so. */
                return container.nodeType === 3 ? container.parentNode : container;
            }
        }
    },
    getCaretPosition: function (element) {
        if (typeof element === 'undefined') {
            /* Set element to span element. */
            var element = this.getSelectionBoundaryElement();
        }

        var caretOffset = 0;
        var doc         = element.ownerDocument || element.document;
        var win         = doc.defaultView || doc.parentWindow;
        var sel;

        if (typeof win.getSelection != "undefined") {
            sel = win.getSelection();

            if (sel.rangeCount > 0) {
                var range         = win.getSelection().getRangeAt(0);
                var preCaretRange = range.cloneRange();

                preCaretRange.selectNodeContents(element);
                preCaretRange.setEnd(range.endContainer, range.endOffset);

                caretOffset = preCaretRange.toString().length;
            }
        } else if ( (sel = doc.selection) && sel.type != "Control") {
            var textRange         = sel.createRange();
            var preCaretTextRange = doc.body.createTextRange();

            preCaretTextRange.moveToElementText(element);
            preCaretTextRange.setEndPoint("EndToEnd", textRange);

            caretOffset = preCaretTextRange.text.length;
        }

        return {
            element : this.getSelectionBoundaryElement('start'),
            position: caretOffset
        };
    },
    createRange: function (node, chars, range) {
        if (!range) {
            range = document.createRange()
            range.selectNode(node);
            range.setStart(node, 0);
        }

        if (chars.count === 0) {
            range.setEnd(node, chars.count);
        } else if (node && chars.count > 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.length < chars.count) {
                    chars.count -= node.textContent.length;
                } else {
                    range.setEnd(node, chars.count);
                    chars.count = 0;
                }
            } else {
                for (var lp = 0; lp < node.childNodes.length; lp++) {
                    range = this.createRange(node.childNodes[lp], chars, range);

                    if (chars.count === 0) {
                        break;
                    }
                }
            }
        }

        return range;
    },
    setCaretPosition: function (elemId, pos) {
        var selection = window.getSelection();

        var range = this.createRange(document.getElementById(elemId), { count: pos });
        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    },
    node_walk: function (node, func) {
        var result = func(node);

        for (node = node.firstChild; result !== false && node; node = node.nextSibling) {
            result = this.node_walk(node, func);
        }

        return result;
    },
    renderVariablesPreview: function (json) {
        var output = '<div class="x-form-text" contenteditable="true">';

        if (json && json.length > 0) {
            var jsonObject = JSON.parse(json);

            for (var property in jsonObject) {
                if (jsonObject.hasOwnProperty(property)) {
                    var uniqueID = SeoSuite.generateUniqueID();

                    if (jsonObject[property].type === 'placeholder') {
                        output += '<span class="seosuite-snippet-variable" spellcheck="false" id="' + uniqueID + '">' + jsonObject[property].value + '</span>';
                    } else {
                        output += '<span id="' + uniqueID + '">' + jsonObject[property].value + '</span>';
                    }
                }
            }
        }

        output += '</div>';

        return output;
    },
    showVariableWindow: function(btn) {
        if (this.variablesWindow) {
            this.variablesWindow.destroy();
        }

        this.variablesWindow = MODx.load({
            xtype       : 'seosuite-window-insert-variable',
            closeAction : 'close',
            listeners   : {
                submit      : {
                    fn          : function(record) {
                        this.insertVariable(record.variable, 'last');
                    },
                    scope       : this
                }
            }
        });

        this.variablesWindow.show();
    },
    insertVariable: function(variable, position) {
        var record = {
            type    : 'variable',
            value   : variable
        };

        if (position === 'first') {
            var prefix = this.data[0];

            if (prefix && prefix.type !== 'string') {
                this.data.unshift({
                    type    : 'string',
                    value   : ' '
                });
            }

            this.data.unshift(record);
        } else if (position === 'last') {
            var prefix = this.data[this.data.length - 1];

            if (prefix && prefix.type !== 'string') {
                this.data.push({
                    type    : 'string',
                    value   : ' '
                });
            }

            this.data.push(record);
        }

        this.onUpdateEditorValue();
    }
});

Ext.reg('seosuite-field-metatag', SeoSuite.panel.MetaTag);

SeoSuite.window.InsertVariable = function(config) {
    config = config || {};

    Ext.applyIf(config, {
        autoHeight  : true,
        title       : _('seosuite.tab_meta.insert_variable'),
        fields      : [{
            xtype       : 'seosuite-combo-snippet-variable',
            fieldLabel  : _('seosuite.tab_meta.label_variable'),
            description : MODx.expandHelp ? '' : _('seosuite.tab_meta.label_variable_desc'),
            anchor      : '100%',
            allowBlank  : false
        }, {
            xtype       : MODx.expandHelp ? 'label' : 'hidden',
            html        : _('seosuite.tab_meta.label_variable_desc'),
            cls         : 'desc-under'
        }],
        buttons     : [{
            text        : _('seosuite.tab_meta.submit'),
            handler     : this.submit,
            scope       : this
        }]
    });

    SeoSuite.window.InsertVariable.superclass.constructor.call(this, config);
};

Ext.extend(SeoSuite.window.InsertVariable, MODx.Window, {
    submit: function() {
        var form = this.fp.getForm();

        if (form.isValid()) {
            this.fireEvent('submit', form.getValues());

            if (close) {
                if (this.config.closeAction !== 'close') {
                    this.hide();
                } else {
                    this.close();
                }
            }
        }
    },
});

Ext.reg('seosuite-window-insert-variable', SeoSuite.window.InsertVariable);
