// ==UserScript==
// @name         Reorganizacja widoku zamowienia
// @namespace    demus.pl
// @version      0.22
// @description  Reorganizacja widoku zamowienia
// @author       You
// @match        https://www.demus-zegarki.pl/panel/orderd.php*
// @grant        none
// ==/UserScript==

(function($){
    var styles = {
        "important_val": {"font-size": "2em"},
        "almost_important_val": {"font-size": "1.5em"},
        "icon": {"height": "45px"},
        "override_tr": {"max-width": "95%"},
        "tamper_options": {"float": "right"},
        "h1": {"float": "left", "border": "0 none"},
        "msg_wrapper": {"max-width": "75%"},
        "hide": {"display": "none"},
        "alert": {"margin": "0", "padding": "0 15px"},
        "highlight_red": {"border": "2px dashed red", "font-size": "1.2em", "background-color": "white"},
        "table_table": {"margin-bottom": "0"},
        "toggle_expand": {"cursor": "pointer"},
        "auto_width": {"width": "auto"}
    };

    function getOptions() {
        var select = '<select id="enable-tamper">' +
            '<option value="0">wyłącz tamper</option>' +
            '<option value="1">ściaśniaj</option>' +
            '</select>';
        $(select).appendTo('#tamperOptions');
        $('#tamperOptions').css(styles.tamper_options);

        var option = localStorage.getItem('tamperOn') || 0;
        $('#enable-tamper').val(option);

        $('#enable-tamper').on('change', function() {
            localStorage.setItem('tamperOn', $(this).val());
            window.location.reload(false);
        });
    }

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

    function markSections($el) {
        var sectionId = 0;
        var sectionMarkers = [
            'Wpłaty',
            'Notatka do zamówienia',
            'Przesyłka:',
            'Dane klienta',
            'Towary przypisane do zamówienia',
            'Dokumenty',
            'Statystyki',
            'Notatka o kliencie',
        ];

        $el.find('> tr').each(function() {
            var _this = $(this);
            sectionMarkers.each(function(v) {
                if (_this.find('> *:contains("' + v + '")').length > 0) {
                    sectionId += 1;
                }
            });

            _this.addClass('section-' + sectionId);
        });

        return sectionId;
    }

    function prepareSections() {
        // section 0
        $('.section-0:first').before(createToggleRow(0, 'Statusy'));
        $('.section-0').each(function() {
            if ($(this).find('*:contains("Nr zamówienia")').length > 0 || $(this).find('*:contains("Realizacja z magazynu")').length > 0) {
                $(this).addClass('tamper-important');
            }
        });

        // section 1
        var total = $('#iai-js-total_order_cost').text();
        var delivery = $('.shipping-costs:first').text();
        if (delivery == '0,00 zł') {
            setAlert('', $('.section-3').find('.shipping-costs').parents('td:first'));
        }
        $('.section-1:first').before(createToggleRow(1, "Wpłaty"));
//         $('.section-1:first').before(createRow(1, '<strong>Razem:</strong> ' + total + ', <strong>Koszt przesyłki:</strong> ' + delivery, 'almost_important_val'));
        $('.section-1:first').before(createRow(1, '<strong>Razem:</strong> ' + total, 'almost_important_val'));
        $('.section-1:eq(1)').addClass('tamper-important').find('.row2').addClass('tamper-toggle-child');
        $('.section-1:eq(1)').find('#tr_0').addClass('tamper-important');
        $('.section-1:eq(1)').find('#tr_0').find('> td').css(styles.auto_width);

        // section 2-4
        $('.section-2:first').before($('<tr><td id="tamperSideLeft"></td><td id="tamperSideRight"></td></tr>'));
        $('.section-2').appendTo('#tamperSideLeft');
        $('.section-3').appendTo('#tamperSideRight');
        $('.section-3').find('.shipping-costs').css(styles.important_val);
        $('.section-4').appendTo('#tamperSideLeft');

        // notatkta do zamowienia
        var $el_order_note = $('#div_order_note');
        if ($el_order_note.text() != 'brak') {
            setAlert('', $el_order_note.parent('td'));
        }

        // notatka z dokumentach
        var $el_faktura = $('#order-requested-documents');
        if ($el_faktura.find(':contains("Klient poprosił o fakturę VAT")').length > 0) {
            setAlert('Możliwa FAKTURA VAT', $el_faktura);
        }

        // notatka od klienta
        var $el_client_note = $('#div_client_note');
        if ($el_client_note.text() !== 'brak') {
            setAlert('', $el_client_note);
        }

        // notatka dla kuriera
        var $el_deliverer_note = $('#div_deliverer_note');
        if ($el_deliverer_note.text() != 'brak') {
            setAlert('', $el_deliverer_note.parent('td'));
        }

        // podany NIP
        if ($('.section-4').find(':contains("NIP:")').length > 0) {
            setAlert('PODANY NIP!');
        }

        // informacja o adnotacji przy produkcie
        var adnotacjeProductInterval;
        adnotacjeProductInterval = setInterval(function() {
            if ($('#products-list tbody.yui-dt-data').find('.yui-dt-col-name:first').length > 0) {
                clearInterval(adnotacjeProductInterval);

                $('#products-list tbody.yui-dt-data').find('.yui-dt-col-name').each(function(k, v){
                    var _this = $(v);
                    var productName = _this.find('b:first').text();
                    var productAdnotacja = _this.find('i:first').text();
                    if (productAdnotacja.length > 0) {
                        setAlert(productName + ' - ' + productAdnotacja, _this.find('>div'));
                    }
                });
            }
        }, 500);

        //section 6 move before 5
        $('.section-5:first').before($('.section-6'));
        // notatka o kliencie
        var $el_note_about_client = $('.section-5').find($("div[class^='client_note_']"));
        if ($el_note_about_client.text() !== 'brak') {
            setAlert('istnieje NOTATKA O KLIENCIE', $el_note_about_client.parent('td'));
        }

        $('.tamper-toggle-section').on('click', function() {
            $(this).find('.fa').toggle();
            var sectionId = $(this).data('section');
            $('.' + sectionId + ':not(.tamper-important)').toggle();
            $('.' + sectionId).find('.tamper-toggle-child:not(.tamper-important)').toggle();
        });
    }

    function createToggleRow(sectionId, sectionTitle = 'Sekcja') {
        return $('<tr class="tamper-toggle-section tamper-important" data-section="section-' + sectionId + '"><td colspan="2">' + sectionTitle +
                 '<i class="fa fa-long-arrow-down" style="display: none; margin-left: 10px;" aria-hidden="true"></i><i class="fa fa-long-arrow-left" style="margin-left: 10px;" aria-hidden="true"></i>' +
                 '</td></tr>').css(styles.toggle_expand);
    }

    function createRow(sectionId, sectionTitle = 'Sekcja', sectionStyle = '') {
        return $('<tr class="tamper-important" data-section="section-' + sectionId + '"><td colspan="2">' + sectionTitle + '</td></tr>').css(styles[sectionStyle]);
    }

    function setAlert(text, element = '') {
        if (text.length > 0) {
            var alertSkeleton = '<div class="alert alert-danger" role="alert" style="font-weight: bold"></div>';
            $(alertSkeleton).css(styles.alert).text(text).appendTo('#tamperAlerts');
        }

        if (element.length > 0) {
            element.css(styles.highlight_red);
        }
    }

    function hideNonImportant(numberOfSections) {
        for (var i = 0; i <= numberOfSections; i++) {
            $('.section-' + i + ':not(.tamper-important)').hide();
            $('.section-' + i).find('.tamper-toggle-child:not(.tamper-important)').hide();
        }
    }

    var content = '<tr><td colspan="2">' +
        '<div id="tamperOptions"></div><div id="tamperMagazyn"></div>' +
        '</tr></td><tr><td colspan="2">' +
        '<div id="tamperAlerts"></div>' +
        '</td></tr>';

    var $mainTable = $('#pageContent').find('table:first > tbody');

    var numberOfSections = markSections($mainTable);
    $(content).prependTo($mainTable);
    getOptions();
    getMagazyn();
    getNrZam();
    if (localStorage.getItem('tamperOn') == 1) {
        $('.tr').css(styles.override_tr);
        $('.msgWrapper:first').css(styles.msg_wrapper);
        $('.breadcrumbs .pull-right').css(styles.hide);
        $('.navbar:first').css(styles.hide);
        $('.alert').css(styles.alert);
        $('table table').css(styles.table_table);
        prepareSections();
        hideNonImportant(1);
    }
})(jQuery);