;(function($){

    String.prototype.pad = function(padLength, padChar) {
        var r = this.toString();
        while (r.length<padLength) {
            r=padChar+r;
        }
        return r;
    }


    var ColorDraw = function(selector) {
        this.context = $(selector);
        this.drawTable = this.createDrawTable(6,6);
    }

    ColorDraw.prototype = {
        init : function() {
            var _this = this;
            this.storage = new ListStorage('colordraw');

            this.menu = this.createMenu();

            this.undo = new Undo(this.menu.get().find('.undocount'), this.menu.get().find('.redocount'));
            this.undo.setChangeCallback(function(data){
                _this.writeData(data);
            });

            this.drawColor = '#fff';
            this.charTable = this.createColorTable(this.drawColor);
            this.context.append(this.menu.get(), this.drawTable, this.charTable);
            
            this.bindEvents();
            
            this.fillAll(this.drawColor);
            this.undo.saveState(this.saveData());

        }

        , createColorTable : function(activeDrawColor) {
            activeDrawColor = activeDrawColor || '#fff';


            var charTable = $('<table></table>').addClass('colorTable')
                //, colorValues = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'] // All Colors
                //, colorValues = ['0','2','4','6','9','b','d','f']
                //, colorValues = ['0','2','5','8','a','d','f'] 
                , colorValues = ['0','3','6','9','c','f'] // Netscape WebColors
                //, colorValues = ['0','4','8','b','f']
                //, colorValues = ['0','5','a','f']
                //, colorValues = ['0','8','f']
                , cellsPerRow = Math.ceil(Math.sqrt(Math.pow(colorValues.length,3)))
                , r = 0
                , g = 0
                , b = 0
            ;

            var tableRow = $('<tr></tr>');
            charTable.append(tableRow);

            for (var cells=0; cells<Math.pow(colorValues.length,3); cells++) {
            
                var color = '#'
                    +colorValues[r]
                    +colorValues[g]
                    +colorValues[b]
                    , cell = $('<td></td>')
                ;

                this.cellSet(cell,color);

                if ((colorValues[r]===colorValues[g]) && (colorValues[g]===colorValues[b])) {
                    cell.addClass('greytone');
                }

                if (activeDrawColor===color) cell.addClass('active');                    

                tableRow.append(cell);

                if (tableRow.find('td').length>=cellsPerRow) {
                    tableRow = $('<tr></tr>');
                    charTable.append(tableRow);                    
                }


                r++;
                if (r>=colorValues.length) {
                    r=0;
                    g++;
                    if (g>=colorValues.length) {
                        g=0;
                        b++;
                        if (b>=colorValues.length) b=0;
                    }                    
                }

            }
            var missingCells = cellsPerRow-tableRow.find('td').length;

            for (var cells=1; cells<=missingCells; cells++) {

                var greyValue = Math.round(256-cells*256/missingCells)
                    , color = '#' + Array(4).join(greyValue.toString(16).pad(2,'0'));
                ;

                cell = $('<td></td>').addClass('greytone');
                this.cellSet(cell,color);
                tableRow.append(cell);
            } 


            return charTable;
        }

        , createDrawTable : function(height,width) {
            var drawTable = $('<table></table>').addClass('drawTable');
            for (var iHeight=0; iHeight<height; iHeight++) {
                var row = $('<tr></tr>');
                drawTable.append(row);
                for (var iWidth=0; iWidth<width; iWidth++) {
                    var cell = $('<td> </td>');
                    row.append(cell);
                }
            }
            return drawTable;
        }

        , resizeDrawTable : function(height,width) {

            var resized = false;

            // Crop Rows
            if (this.drawTable.find('tr').length>height) {
                this.drawTable.find('tr:gt('+(height-1)+')').remove();
                resized = true;
            } else // Add Rows
            while (this.drawTable.find('tr').length<height) {
                this.drawTable.append('<tr></tr>');
                resized = true;
            }
            this.drawTable.find('tr').each(function(i, tr) {
                var row = $(tr);
                if (row.find('td').length>width) {
                    row.find('td:gt('+(width-1)+')').remove();
                    resized = true;
                } else // Add Rows
                while (row.find('td').length<width) {
                    row.append('<td> </td>');
                    resized = true;
                }
            });

            return resized;
        }


        , createMenu : function() {
            var _this = this;
            return new Menu([
                {
                    text:'<img src="data/icons/load.png" />'
                    , title : 'Load image'
                    , href : '#load'
                    , preventDefault : true
                    , callback: function() {
                        var availableItems = _this.storage.getList()
                            menuItems = []
                        ;
                        $.each(availableItems,function(i,itemName) {
                            menuItems.push({
                                text : itemName
                                , href : '#load_'+itemName
                                , preventDefault : true
                                , callback : function() {
                                    _this.writeData(_this.storage.loadItem(itemName));
                                    _this.undo.clearAll();
                                    _this.undo.saveState(_this.saveData());
                                    _this.layer();
                                }
                            });
                        });
                        _this.layer(new Menu(menuItems).get());
                    }
                }, {
                    text:'<img src="data/icons/save.png" />'
                    , title : 'Save image'
                    , href : '#save'
                    , preventDefault : true
                    , callback: function() {
                        var saveName = window.prompt('Name of image to save','image');
                        if (saveName && saveName.length) {
                            _this.storage.saveItem(saveName,_this.saveData());
                        }
                    }
                }, {
                    text:'<img src="data/icons/empty.png" />'
                    , title : 'Empty drawing area'
                    , href : '#empty'
                    , preventDefault : true
                    , callback: function() {
                        _this.fillAll(_this.drawColor);
                        _this.undo.clearAll();
                        _this.undo.saveState(_this.saveData());
                    }
                }, {
                    text:'<img src="data/icons/resize.png" />'
                    , title : 'Resize drawing area'
                    , href : '#resize'
                    , preventDefault : true
                    , callback: function() {
                        var currentDimensions = _this.getCurrentDimensions()
                            , newDim = (window.prompt('Enter new dimensions for drawing area',currentDimensions.width+','+currentDimensions.height)||'').split(',')
                            , newWidth = newDim[0]||currentDimensions.width
                            , newHeight = newDim[1]||currentDimensions.height
                        ;

                        if (_this.resizeDrawTable(newHeight, newWidth)) {
                            _this.undo.clearAll();
                            _this.undo.saveState(_this.saveData());
                        }

                    }
                }, {
                    text:'<img src="data/icons/undo.png" /><span class="undocount">0</span>'
                    , title : 'Undo'
                    , href : '#undo'
                    , preventDefault : true
                    , callback: function() {
                        _this.undo.callUpdate(-1);
                    }
                }, {
                    text:'<img src="data/icons/redo.png" /><span class="redocount">0</span>'
                    , title : 'Redo'
                    , href : '#redo'
                    , preventDefault : true
                    , callback: function() {
                        _this.undo.callUpdate(1);
                    }
                }
            ]);
        }

        , fillAll : function(color) {
            color = color || '#000';
            var _this = this;
            this.drawTable.find('td').each(function(index,cell) {
                _this.cellSet($(cell),color);
            })
        }

        , getCurrentDimensions : function() {
            return {
                width : ~~this.drawTable.find('tr:first td').length
                , height : ~~this.drawTable.find('tr').length
            };
        }

        , writeData : function(data) {
            if (typeof data != 'string' || !data.length) {
                alert('invalid data');
                return;
            }

            var _this = this
                , currentDimenstions = this.getCurrentDimensions()
                , dataRows = data.split('\n')
                , needWidth = 0
                , needHeight = dataRows.length
            ;

            for (var rowNum=0;rowNum<dataRows.length;rowNum++) {
                needWidth = Math.max(needWidth,dataRows[rowNum].split('#').length-1);
            }

            if (this.resizeDrawTable(needHeight,needWidth)) {
                this.undo.saveState(this.saveData());
            }

            for (var rowNum=0;rowNum<dataRows.length;rowNum++) {
                var row = dataRows[rowNum].split('#');
                row.shift(); // remove first empty string

                for (var colNum=0;colNum<row.length;colNum++){
                    var color = '#'+row[colNum]
                        , drawCell = _this.drawTable.find('tr:eq(' + rowNum + ') td:eq(' + colNum + ')')
                    ;
                    if (drawCell.length) {
                        _this.cellSet(drawCell,color);
                    } else {
                        throw new Error('Some dimensions are sh*t');
                    }                
                }
            }
        }

        , saveData : function() {
            var image = ''
                , nlChr = ''
            ;
            this.drawTable.find('tr').each(function(iRow, row) {
                image += nlChr;
                nlChr = '\n';
                $(row).find('td').each(function(iCell,cell) {
                    cell = $(cell);
                    image += (cell.attr('data-color')||'#000');
                });
            })
            return image;
        }

        , bindEvents : function() {
            var _this = this
                , buttonPressed = false
            ;

            $(document).bind('mousedown mouseup', function(ev) {

                if (ev.type === 'mousedown') buttonPressed = true;
                if (ev.type === 'mouseup') {
                    buttonPressed = false;

                    if (!ev.ctrlKey && $(ev.target).closest('table').hasClass('drawTable')) {
                        _this.undo.saveState(_this.saveData());
                    }
                }
            });

            this.drawTable.on('mousedown mousemove mouseenter mouseleave', 'td', function(ev) {

                var cell = $(ev.target);
                if (ev.type == 'mousemove' && !buttonPressed) return;
                ev.preventDefault();
                
                if (ev.type == 'mousedown' || ev.type == 'mousemove') {
                    if (ev.ctrlKey) {
                        _this.cellGet(cell);
                    } else {
                        _this.cellSet(cell);
                    }
                }
            });
            
            this.charTable.on('mousedown', 'td', function(ev) {
                _this.charTable.find('.active').removeClass('active');
                $(ev.target).addClass('active');
                _this.drawColor = $(ev.target).attr('data-color')||'#000';
            });
        }

        , cellSet : function(cell, color) {
            color = color || this.drawColor; 
            cell.css({'background-color':color}).attr({'data-color':color});
        }

        , cellGet : function(cell) {
            var paletteCell = this.charTable.find('td[data-color='+(cell.attr('data-color')||'#000')+']');
            if (!paletteCell.length) {
                paletteCell=this.charTable.find('td:first');
            }
            paletteCell.trigger('mousedown');
        }



        , layer : function(content) {
            if (!content) {
                $('.layer').remove();
                return;
            }
            var _this = this
                , layer = $('<div></div>').addClass('layer')
            ;
            layer.append(content);
            layer.bind('click',function(ev){
                if ($(ev.target).hasClass('layer')) _this.layer();
            });
            $('body').append(layer);

        }

        , lemons : function() {
            this.writeData("#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#666#666#666#333#cf9#cf9#666#666#cf9#cf9#cf9#666#333#cf9#cf9#cf9#666#666#666#666#cf9#cf9#cf9#666#666#cf9#cf9#666#333#cf9#cf9#cf9#666#666#666#333#cf9#cf9#cf9\n#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#333#333#333#333#cf9#cf9#666#666#666#cf9#666#666#333#cf9#cf9#666#666#333#333#666#333#cf9#cf9#666#666#666#cf9#666#333#cf9#cf9#666#666#333#333#333#cf9#cf9#cf9\n#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#333#666#666#666#666#333#cf9#cf9#666#333#cf9#cf9#666#333#cf9#cf9#666#666#666#666#666#333#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#666#333#cf9#cf9#cf9#cf9#666#333#333#666#333#666#333#cf9#cf9#666#333#cf9#cf9#666#333#cf9#cf9#666#333#666#666#666#333#cf9#cf9#cf9#666#666#666#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#333#cf9#cf9#cf9#cf9#cf9#666#333#cf9#333#cf9#666#333#cf9#cf9#666#333#cf9#cf9#666#333#cf9#cf9#666#333#333#666#666#333#cf9#cf9#cf9#cf9#cf9#666#333#cf9#cf9#cf9\n#cf9#cf9#cf9#666#666#666#666#333#cf9#cf9#666#666#666#666#333#cf9#cf9#666#333#cf9#cf9#cf9#666#333#cf9#cf9#666#666#666#666#666#333#cf9#cf9#666#333#cf9#333#666#333#cf9#cf9#666#666#666#666#333#cf9#cf9#cf9\n#cf9#cf9#cf9#333#333#333#333#333#cf9#cf9#333#333#333#333#333#cf9#cf9#333#333#cf9#cf9#cf9#333#333#cf9#cf9#cf9#333#333#333#333#cf9#cf9#cf9#333#333#cf9#cf9#333#333#cf9#cf9#333#333#333#333#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#030#c00#c00#c00#900#900#900#900#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#330#f30#c00#c00#900#900#900#600#900#600#600#600#600#600#600#600#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#330#f30#c00#c00#600#300#600#300#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#060#030#f30#c00#c00#600#900#900#600#900#900#900#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#900#900#900#c00#c00#c00#c00#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#330#330#030#f30#c00#c00#c00#600#300#900#900#900#900#900#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#600#900#900#900#600#900#900#600#600#c00#c00#f30#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#330#030#060#f30#c00#c00#c00#c00#c00#c00#900#600#900#600#900#900#600#900#600#900#600#600#600#600#600#900#600#600#600#600#900#900#300#600#900#c00#300#c00#c00#f30#030#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#030#330#060#f30#c00#c00#600#300#c00#600#300#900#900#900#900#900#600#900#900#600#900#900#600#900#600#600#600#900#900#900#900#900#900#600#c00#c00#c00#c00#f30#060#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#030#330#060#060#f30#c00#c00#600#c00#c00#c00#900#900#300#600#900#900#900#600#900#900#900#900#900#600#900#600#900#900#300#600#900#900#300#600#c00#c00#f30#030#330#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#060#030#060#060#f30#c00#c00#c00#c00#300#300#c00#900#600#c00#900#300#900#900#900#900#c00#900#900#900#900#300#600#900#600#900#c00#c00#c00#c00#c00#c00#f30#060#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#060#330#060#060#f30#c00#c00#c00#c00#600#900#c00#c00#c00#600#600#900#300#600#900#600#900#900#600#900#600#900#900#c00#c00#300#600#c00#c00#c00#f30#330#330#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#060#030#330#330#060#f30#c00#c00#c00#c00#c00#300#600#c00#c00#c00#c00#600#c00#c00#300#600#c00#300#600#c00#c00#c00#c00#c00#600#c00#c00#c00#f30#330#030#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#060#030#030#060#030#f30#c00#c00#c00#c00#c00#600#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#600#300#c00#c00#c00#c00#c00#f30#030#060#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#030#060#060#030#030#030#f30#f30#c00#c00#c00#c00#c00#600#600#c00#300#300#c00#300#600#c00#c00#300#c00#c00#300#c00#c00#c00#c00#f30#060#030#030#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#330#060#060#330#330#060#060#f30#f30#c00#c00#c00#c00#300#c00#600#c00#c00#600#c00#c00#600#300#c00#c00#c00#c00#c00#c00#f30#030#060#330#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#330#030#330#330#060#060#060#030#f30#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#f30#f30#030#030#030#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#060#060#060#330#330#030#030#030#f30#f30#f30#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#c00#f30#f30#f30#030#330#330#060#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#030#030#030#060#060#060#030#030#030#030#f30#f30#c00#c00#c00#c00#c00#c00#c00#c00#f30#030#060#060#030#030#030#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#996#996#996#996#996#996#cf9#cf9#cf9#030#030#060#060#060#030#030#030#330#030#030#f30#f30#f30#f30#f30#f30#f30#f30#030#030#330#330#060#030#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#996#996#996#996#996#996#996#996#996#996#030#060#030#030#330#330#060#030#030#030#030#030#030#030#060#060#060#060#330#030#030#333#333#996#996#996#996#996#996#996#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#996#996#996#996#996#996#996#333#333#333#030#030#330#060#060#030#330#330#060#060#330#330#060#060#030#030#030#030#333#333#333#333#996#996#996#996#996#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#996#996#996#996#996#996#333#333#333#333#333#030#060#330#030#030#060#030#330#330#030#030#333#333#333#333#333#996#996#996#996#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#996#996#996#996#996#333#333#333#333#333#333#333#333#333#333#333#333#333#333#333#996#996#996#996#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#996#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9\n#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9#cf9");
            this.undo.clearAll();
            this.undo.saveState(this.saveData());
        }

    };

    window.ColorDraw = ColorDraw;


})(jQuery)