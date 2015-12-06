
// Get params from the URL
var queryVals = (function(a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
        var p=a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
})(window.location.search.substr(1).split('&'));

// top bar notifications
var notify = function(ntype, text) {
    var timeout = 2000;
    var note = document.createElement('div');
    note.classList.add('note');
    note.innerHTML = text;
    switch (ntype) {
        case 'success':
            note.classList.add('success');
            break;
        case 'error':
            timeout = 3000;
            note.classList.add('danger');
            var tip = document.createElement('small');
            tip.classList.add('small');
            tip.innerHTML = ' Tip: check console for debug information.';
            note.appendChild(tip);
            break;
        default:
    }
    document.querySelector('body').appendChild(note);

    setTimeout(function() {
        note.remove();
    }, timeout);
};

// convert rgb(red, green, blue) to #hexa colors
function rgbToHex(color) {
    color = color.replace(/\s/g,"");
    var aRGB = color.match(/^rgb\((\d{1,3}[%]?),(\d{1,3}[%]?),(\d{1,3}[%]?)\)$/i);
    if(aRGB)
    {
        color = '';
        for (var i=1;  i<=3; i++) color += Math.round((aRGB[i][aRGB[i].length-1]=="%"?2.55:1)*parseInt(aRGB[i])).toString(16).replace(/^(.)$/,'0$1');
    }
    else color = color.replace(/^#?([\da-f])([\da-f])([\da-f])$/i, '$1$1$2$2$3$3');
    return '#'+color;
};
