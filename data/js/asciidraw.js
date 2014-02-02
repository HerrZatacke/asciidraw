;(function($){

    var AsciiDraw = function(selector) {
        this.context = $(selector);
        this.drawTable = this.createDrawTable(5,11);
    }

    AsciiDraw.prototype = {
        init : function() {

            this.storage = new ListStorage('asciidraw');

            this.drawChar = ' ';
            this.menu = this.createMenu();
            this.charTable = this.createCharTable(this.drawChar);
            this.context.append(this.menu.get(), this.drawTable, this.charTable);
            
            this.bindEvents();

            //this.robots();
        }

        , createCharTable : function(activeDrawChar) {
            activeDrawChar = activeDrawChar || '';
            var charTable = $('<table></table>').addClass('charTable');
            for (var charY=2; charY<8; charY++) {
                var charRow = $('<tr></tr>');
                charTable.append(charRow);
                for (var charX=0; charX<16; charX++) {
                    var charNum = charY*16+charX
                        , charCell = $('<td>'+String.fromCharCode(charNum)+'</td>').attr('data-charCode',(charNum))
                    ;
                    charRow.append(charCell);
                    if (activeDrawChar.charCodeAt(0)===charNum) charCell.addClass('active');
                    if (127===charNum) charCell.addClass('solidSpace');
                }
            }
            return charTable;
        }

        , createDrawTable : function(height,width) {
            var drawTable = $('<table></table>');
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

            // Crop Rows
            if (this.drawTable.find('tr').length>height) {
                this.drawTable.find('tr:gt('+(height-1)+')').remove();
            } else // Add Rows
            while (this.drawTable.find('tr').length<height) {
                this.drawTable.append('<tr></tr>');
            }
            this.drawTable.find('tr').each(function(i, tr) {
                var row = $(tr);
                if (row.find('td').length>width) {
                    row.find('td:gt('+(width-1)+')').remove();
                } else // Add Rows
                while (row.find('td').length<width) {
                    row.append('<td> </td>');
                }
            });
        }


        , createMenu : function() {
            var _this = this;
            return new Menu([
                {
                    text:'<pre>  _____    \n |  ___|__ \n | /     / \n |/_____/  \n           \n</pre>'
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
                                    _this.layer();
                                }
                            });
                        });
                        _this.layer(new Menu(menuItems).get());
                    }
                }, {
                    text:'<pre>   _____   \n  | [ ] \\  \n  |=====|  \n  |_____|  \n           \n</pre>'
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
                    text:'<pre>   _____   \n  |>_   |  \n  |     |  \n  |_____|  \n           \n</pre>'
                    , title : 'Get image'
                    , href : '#get'
                    , preventDefault : true
                    , callback: function() {
                        var textarea = $('<textarea>' + _this.saveData() + '</textarea>')
                            .css({
                                width : _this.drawTable.width() + 'px'
                                , height : _this.drawTable.height() + 'px'
                            })
                            .bind('change keyup', function(ev) {_this.layer();})
                        ;
                        _this.layer(textarea);
                        textarea.select();
                    }
                }, {
                    text:'<pre>   _____   \n  |     |  \n  |  X  |  \n  |_____|  \n           \n</pre>'
                    , title : 'Empty drawing area'
                    , href : '#empty'
                    , preventDefault : true
                    , callback: function() {
                        _this.drawTable.find('td').text(' ').removeClass('solidSpace');;
                    }
                }, {
                    text:'<pre>   _____   \n  |  ^  |  \n  |< + >|  \n  |__v__|  \n           \n</pre>'
                    , title : 'Resize drawing area'
                    , href : '#resize'
                    , preventDefault : true
                    , callback: function() {
                        var currentDimensions = _this.getCurrentDimensions()
                            , newDim = (window.prompt('Enter new dimensios for drawing area',currentDimensions.width+','+currentDimensions.height)||'').split(',')
                            , newWidth = newDim[0]||currentDimensions.width
                            , newHeight = newDim[1]||currentDimensions.height
                        ;

                        _this.resizeDrawTable(newHeight, newWidth);
                    }
                }
            ]);
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
                needWidth = Math.max(needWidth,dataRows[rowNum].length);
            }

            this.resizeDrawTable(needHeight,needWidth);

            for (var rowNum=0;rowNum<dataRows.length;rowNum++) {
                var row = dataRows[rowNum];
                for (var colNum=0;colNum<row.length;colNum++){
                    var chr = row[colNum]
                        , drawCell = _this.drawTable.find('tr:eq(' + rowNum + ') td:eq(' + colNum + ')')
                    ;
                    if (drawCell.length) {
                        drawCell.html(chr);
                        if (chr.charCodeAt(0)===127) {
                            drawCell.addClass('solidSpace');
                        } else {
                            drawCell.removeClass('solidSpace');
                        }                        
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
                    image += (cell.text()?cell.text().substr(0,1):' ');
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
                if (ev.type === 'mouseup') buttonPressed = false;
            });

            this.drawTable.on('mousedown mousemove mouseenter mouseleave', 'td', function(ev) {

                var cell = $(ev.target);
                if (ev.type == 'mousemove' && !buttonPressed) return;
                ev.preventDefault();
                
                if (ev.type == 'mousedown' || ev.type == 'mousemove') {
                    if (ev.shiftKey) {
                        _this.cellGet(cell);
                    } else {
                        _this.cellSet(cell);
                    }
                }
            });
            
            this.charTable.on('mousedown', 'td', function(ev) {
                _this.charTable.find('.active').removeClass('active');
                $(ev.target).addClass('active');
                _this.drawChar = $(ev.target).text().substr(0,1)||' ';
            });
        }

        , cellSet : function(cell) {
            cell.html(this.drawChar);
            if (this.drawChar.charCodeAt(0)===127) {
                cell.addClass('solidSpace');
            } else {
                cell.removeClass('solidSpace');
            }
        }

        , cellGet : function(cell) {
            this.charTable.find('td[data-charCode='+(cell.text()?cell.text().charCodeAt(0):32)+']').trigger('mousedown');
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

        , robots : function() {
            this.writeData('                                              __                   \n                                            (    )                 \n                                  \\\\\\\\     /      \\                \n                                  )_  )   ( (O)(O) )               \n                                 )__ /    (   ..   )               \n                                /   /      \\  __  /                \n                               /   /        (____)                 \n                              /   /__________(  )_______           \n                             (          |   \\    /    | \\          \n                              \\______   |    \\  /     |  \\         \n                                     \\_       ||      _   \\        \n                                       \\     ____    / \\   \\       \n                 B L E E E P            |   /    \\   |  \\   \\      \n                       B L O O O P      |  (  ()  )  |   \\  |      \n           __-------__                  |__ \\____/ __|   |  |      \n         /_/__|   |___\\\\_               |::\\______/::|   |  |      \n        /     -----    \\ \\              |__::::::::__|   |__|      \n       / __    ____    _\\_)             |  \\______/  |  )_  )      \n      / /  |  |    |  |_\\ \\             /            \\ /// )       \n     |  |__|  |____|  |_| --O          | \\          / | ///        \n     |_____________________|           |  \\   __   /  |            \n     |  |     _____    |   |           |   \\ /  \\ /   |            \n     |  |    /     \\   |   |           |     |  |     |            \n     |  |   |  (O)  |  |   |           |     |  |     |            \n     |  |   | _____ |  |__ |            \\    |  |    /             \n     |  |    \\     /   | | |            |    |  |    |             \n     |  |     \\| |/    | | |            |____|  |____|             \n     |  |     || ||    | | |            ( !! )  ( !! )             \n     |  |     || ||    | | |            (_!!_)  (_!!_)             \n     |__| ____|| ||____|_| |             |  |    |  |              \n      \\  |    || ||    |  /              |  |    |  |              \n       \\_|____|___|____|_/               |  |    |  |              \n            __(___)__                    |  |    |  |              \n           /   ___   \\                   |  |    |  |              \n          /   (   )   \\                 /    \\  /    \\             \n         /___(_____)___\\               (______)(______)            \n');
        }


    };

    window.AsciiDraw = AsciiDraw;


})(jQuery)