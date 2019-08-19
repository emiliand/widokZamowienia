// ==UserScript==
// @name         Reorganizacja widoku zamowienia
// @namespace    demus.pl
// @version      0.1
// @description  Reorganizacja widoku zamowienia
// @author       You
// @match        https://www.demus-zegarki.pl/panel/orderd.php?idt=*
// @grant        none
// ==/UserScript==

var styles = {
    "important_val": {"font-size": "2em"},
    "icon": {"height": "45px"}
};

function getMagazyn() {

    var value = $('#fg_processing_stock').val();
    var valueText = $('#fg_processing_stock option:selected').text();


    $("<em>", {
        css: styles.important_val
    }).text(valueText).appendTo('#tamperMagazyn');

    if (value == 18) {
        $('<img>', {
            src: 'https://cdn3.iconfinder.com/data/icons/object-emoji/50/Poop-512.png',
            css: styles.icon
        }).prependTo('#tamperMagazyn');
    }
}

var content = '<tr><td colspan="2">' +
    '<div id="tamperMagazyn"></div>' +


//     '<div id="tamperMagazyn2">Magazyn</div>' +
//     '<div id="tamperMagazyn3">Magazyn</div>' +
//     '<div id="tamperMagazyn4">Magazyn</div>' +
//     '<div id="tamperMagazyn5">Magazyn</div>' +
//     '<div id="tamperMagazyn6">Magazyn</div>' +
//     '<div id="tamperMagazyn7">Magazyn</div>' +
//     '<div id="tamperMagazyn8">Magazyn</div>' +
    '</td></tr>';

var orderTable = $('#pageContent').find('table').first();

$(content).prependTo(orderTable);
getMagazyn();

