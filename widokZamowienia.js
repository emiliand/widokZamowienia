// ==UserScript==
// @name         Reorganizacja widoku zamowienia
// @namespace    demus.pl
// @version      0.8
// @description  Reorganizacja widoku zamowienia
// @author       You
// @match        https://www.demus-zegarki.pl/panel/orderd.php*
// @grant        none
// ==/UserScript==

var styles = {
    "important_val": {"font-size": "2em"},
    "icon": {"height": "45px"},
    "override_tr": {"max-width": "95%"},
    "tamper_options": {"float": "right"},
    "h1": {"float": "left", "border": "0 none"},
    "msg_wrapper": {"max-width": "75%"},
    "hide": {"display": "none"},
    "alert": {"margin": "0", "padding": "0 15px"}
};

function getNrZam() {
    $('.page-header').css(styles.h1).appendTo('#tamperMagazyn');    
}

function getMagazyn() {

    var value = $('#fg_processing_stock').val();
    var valueText = $('#fg_processing_stock option:selected').text();

    if (!value) {
        var $td = $('#pageContent').find('td:contains("Realizacja z magazynu"):first');
        valueText = $td.next().text();
        value = valueText.substr(0, valueText.indexOf(' '));
        value = value.substr(1);
    }


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

function setAlert(text) {
    var alertSkeleton = '<div class="alert alert-danger" role="alert" style="font-weight: bold"></div>';
    $(alertSkeleton).css(styles.alert).text(text).appendTo('#tamperMagazyn');
}

function getStatusy() {
    var $td = $('#pageContent').find('td:contains("Nr zamówienia")');
    var $tr = $td.parents('form').parents('tr');
    var tr = [];
    tr.push($tr);

    for (var i = 1; i < 7; i++) {
        tr[i] = tr[i-1].next();
    }

    for (var j = 0; j < 7; j++) {
        // status zamowienia za duzo zajmuje
        if (j == 0) {
            tr[j].appendTo('#tamperMagazyn');
        } else {
            tr[j].appendTo('#tamperStatusy');
        }
    }
}

function getWartoscZam() {
    var $td = $('#pageContent').find('td:contains("Wpłaty"):first');
    var $tr = $td.parent();
    $td.appendTo('#tamperWartoscZam');
    $tr.next().appendTo('#tamperWartoscZam');
}

function getNotatkiZam() {
    // notatki i paczki
    var $td = $('#pageContent').find('td:contains("Notatka do zamówienia"):first');
    var $tr = $td.parent();
    var tr = [];
    tr.push($tr);

    for (var i = 1; i < 6; i++) {
        tr[i] = tr[i-1].next();
    }

    for (var j = 0; j < 6; j++) {
        tr[j].appendTo('#tamperNotatkiZam');
        if (tr[j].find(':contains("Klient poprosił o fakturę VAT")').length > 0) {
            setAlert('Możliwa FAKTURA VAT');
        }
    }
}

function getDaneKlienta() {
    var $td = $('#pageContent').find('td:contains("Dane klienta"):first');
    var $tr = $td.parent();
    $td.appendTo('#tamperDaneKlienta');
    var $trNext = $tr.next();
    $trNext.appendTo('#tamperDaneKlienta');
    if ($trNext.find(':contains("NIP:")').length > 0) {
        setAlert('PODANY NIP!');
    }
}

function getProductList() {
    var $tr = $('#pageContent').find('td:contains("Towary przypisane do zamówienia")').parent();
    var $next = $tr.next();
    var $productList = $next.next();

    $tr.appendTo('#tamperProductList');
    $next.appendTo('#tamperProductList');
    $productList.appendTo('#tamperProductList');
}

function getOptions() {
    var button = '<a href="#" id="enable-tamper">włącz tamper</a>';
    $(button).appendTo('#tamperOptions');
    $('#tamperOptions').css(styles.tamper_options);

    var option = localStorage.getItem('tamperOn');

    if (option == 0 || option === null) {
        $('#enable-tamper').click('click', function() {
            localStorage.setItem('tamperOn', 1);
            window.location.reload(false);
        });
    } else {
        $('#enable-tamper').text('wyłącz tamper');
        $('#enable-tamper').click('click', function() {
            localStorage.setItem('tamperOn', 0);
            window.location.reload(false);
        });
    }
}

var content = '<tr><td colspan="2">' +
    '<div id="tamperOptions"></div><div id="tamperMagazyn"></div>' +
    '<table style="width: 100%"><tr>' +
    '<td id="tamperWartoscZam"></td>' +
    '<td rowspan="2" style="min-width: 800px"><table id="tamperStatusy"></table><div id="tamperNotatkiZam"></div></td>' +
    '</tr><tr>' +
    '<td id="tamperDaneKlienta"></td>' +
    '</tr></table>' +
    '<table id="tamperProductList" style="width: 100%;"></table>' +
    '</td></tr>';

var orderTable = $('#pageContent').find('table').first();

$(content).prependTo(orderTable);
getOptions();
getMagazyn();
if (localStorage.getItem('tamperOn') == 1) {
    getNrZam();
    $('.tr').css(styles.override_tr);
    $('.msgWrapper:first').css(styles.msg_wrapper);
    $('.breadcrumbs').css(styles.hide);
    $('.navbar:first').css(styles.hide);
    $('.alert').css(styles.alert);
    getWartoscZam();
    getStatusy();
    getNotatkiZam();
    getDaneKlienta();
    getProductList();
}