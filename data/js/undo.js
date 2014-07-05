;(function($){

    var Undo = function(undoCounter, redoCounter) {
        this.bindEvents();
        this.$undoCounter = undoCounter;
        this.$redoCounter = redoCounter;
    }

    Undo.prototype = {

        changeCallback : function(data){
            throw new Error('callback has not been defined');
        }

        , stateList : []
        , statePosition : 0

        , bindEvents : function() {
            var _this = this;
            $(document).bind('keydown', function(ev) {
                if (ev.keyCode==90 && ev.ctrlKey) {
                    _this.updateParent(-1);
                }
                if (ev.keyCode==89 && ev.ctrlKey) {
                    _this.updateParent(+1);
                }
            });
        }

        , callUpdate : function(change) {
            this.updateParent(change);
        }


        , updateCounters : function() {
            this.$undoCounter.text(this.statePosition);
            this.$redoCounter.text(this.stateList.length-this.statePosition-1);
        }

        , updateParent : function(change) {
            this.statePosition = Math.min(this.stateList.length-1, Math.max(0, this.statePosition+change));
            var updateData = this.stateList[this.statePosition]
            if (!updateData) return;
            this.changeCallback(updateData);
            this.updateCounters();
        }

        , saveState : function(data) {
            // Removing elements after current statePosition
            this.stateList.splice(this.statePosition+1, this.stateList.length-this.statePosition-1)
            this.stateList.push(data);
            this.statePosition = this.stateList.length-1;
            this.updateCounters();
        }

        , clearAll : function() {
            console.log('clearAll');
            this.stateList = [];
            this.statePosition = 0;
            this.updateCounters();
        }

        , setChangeCallback : function(callback) {
            if (typeof callback != 'function') throw new Error('callback is not a function');
            this.changeCallback = callback;
        }

    }


    window.Undo = Undo;

})(jQuery);
