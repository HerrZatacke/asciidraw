;(function($){

    var Menu = function(options) {
        var _this = this;
        this.context = $('<div class="menu"></div>');
        this.options = options;
        $.each(options, function(index, option) {
            _this.context.append(
                '<a ' +
                'data-index="' + index + '" ' +
                'href="' + (option.href||('#'+option.text)) + '" ' +
                'title="' + (option.title||option.text) + '" ' +
                (option.class?'class="'+option.class+'" ':'')+
                '>' + 
                option.text + 
                '</a>'
            );
        })
        this.context.on('click','a', function(ev) {
            var index = $(ev.target).closest('a').attr('data-index')||false
                , option
            ;
            if (index === false) return;
            option = _this.options[index];
            if (option.preventDefault) ev.preventDefault();
            if (typeof option.callback === 'function') {
                option.callback.call(ev.target,option);
            } 
        });
    }
    Menu.prototype.get = function() {
        return this.context;
    };

    window.Menu = Menu;

})(jQuery)