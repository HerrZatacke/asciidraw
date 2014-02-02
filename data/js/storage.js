;(function($){

    var ListStorage = function(listId) {
        this.listId = listId;
        
        if (localStorage.getItem(this.listId)===null) {
            localStorage.setItem(this.listId,JSON.stringify([]));
        }

        try {
            this.list = JSON.parse(localStorage.getItem(this.listId));
        } catch(err) {
            localStorage.setItem(this.listId,JSON.stringify(this.list = []));
        }

        this.validateList();

    }

    ListStorage.prototype = {
        
        getList : function() {
            this.list=JSON.parse(localStorage.getItem(this.listId));
            return this.list;
        }

        , saveItem : function(id, data) {
            if (!this.isInList(id)) { this.list.push(id) }
            localStorage.setItem(this.listId, JSON.stringify(this.list));
            localStorage.setItem(this.listId + '_' + id, JSON.stringify({'d':data}));
        }

        , loadItem : function(id) {
            if (!this.isInList(id)) return false;
            try {
                return JSON.parse(localStorage.getItem(this.listId + '_' + id))['d'];
            } catch(err) {
                return false;
            }
        }

        , isInList : function(id) {
            for(var i=0;i<this.list.length;i++) {
                if (this.list[i]==id) return true;
            }
            return false;
        }

        , validateList : function() {
            var validList = [];
            for(var i=0;i<this.list.length;i++) {
                if (localStorage.getItem(this.listId + '_' + this.list[i]) !== null) validList.push(this.list[i]);
            }
            localStorage.setItem(this.listId,JSON.stringify(this.list = validList));
        }

    }

    window.ListStorage = ListStorage;


})(jQuery)