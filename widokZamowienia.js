// ==UserScript==
// @name         TEMP Reorganizacja FINAL
// @namespace    demus.pl
// @version      0.11
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
        "alert": {"margin": "0", "padding": "0 15px"}
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
            'Przesyłka',
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
            setAlert('Koszty wysyłki 0 zł');
        }
        $('.section-1:first').before(createToggleRow(1, "Wpłaty"));
        $('.section-1:first').before(createRow(1, '<strong>Razem:</strong> ' + total + ', <strong>Koszt przesyłki:</strong> ' + delivery, 'important_val'));
        $('.section-1:eq(1)').addClass('tamper-important').find('.row2').addClass('tamper-toggle-child');
        $('.section-1:eq(1)').find('#tr_0').addClass('tamper-important');

        // section 2-4
        $('.section-2:first').before($('<tr><td id="tamperDaneKlienta"></td><td id="tamperNotatki"></td></tr>'));
        $('.section-2').appendTo('#tamperNotatki');
        $('.section-3').appendTo('#tamperNotatki');
        $('.section-4').appendTo('#tamperDaneKlienta');

        //section 6 move before 5
        $('.section-5:first').before($('.section-6'));

        $('.tamper-toggle-section').on('click', function() {
            var sectionId = $(this).data('section');
            $('.' + sectionId + ':not(.tamper-important)').toggle();
            $('.' + sectionId).find('.tamper-toggle-child:not(.tamper-important)').toggle();
        });
    }

    function createToggleRow(sectionId, sectionTitle = 'Sekcja') {
        return $('<tr class="tamper-toggle-section tamper-important" data-section="section-' + sectionId + '"><td colspan="2">' + sectionTitle + '</td></tr>');
    }

    function createRow(sectionId, sectionTitle = 'Sekcja', sectionStyle = '') {
        return $('<tr class="tamper-important" data-section="section-' + sectionId + '"><td colspan="2">' + sectionTitle + '</td></tr>').css(styles.almost_important_val);
    }

    function setAlert(text) {
        var alertSkeleton = '<div class="alert alert-danger" role="alert" style="font-weight: bold"></div>';
        $(alertSkeleton).css(styles.alert).text(text).appendTo('#tamperAlerts');
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
        prepareSections();
        hideNonImportant(1);
    }
})(jQuery);