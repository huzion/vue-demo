import '../../less/index.less';

var obj = {
    init: function() {
        var _self = this;
        _self.setLogo();
    },

    setLogo: function() {
        var _self = this;
        var _className = _self.randomClassName();
        var logo = document.getElementById('logo');
        logo.className = _className;
    },

    randomClassName: function() {
        var number = parseInt(Math.random() * 8 + 1)
        var _className = 'l' + number.toString();
        return _className;
    }

};
obj.init();
module.exports = obj;
