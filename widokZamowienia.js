// ==UserScript==
// @name         Reorganizacja widoku zamowienia
// @namespace    demus.pl
// @version      0.31
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
        "highlight_red": {"border": "3px dashed red", "font-size": "1.2em", "background-color": "white"},
        "highlight_gradient": {"background-image": "linear-gradient(red , yellow)", "color": "white"},
        "table_table": {"margin-bottom": "0"},
        "toggle_expand": {"cursor": "pointer"},
        "auto_width": {"width": "auto"},
        "blurred_lines": {"filter": "blur(5px)", "-webkit-filter": "blur(5px)", "pointer-events": "none"}
    };
    var defaultAlertStyles = {"alert": styles.alert, "highlight": styles.highlight_red};

    function getOptions() {
        var select = '<select id="enable-tamper">' +
            '<option value="0">wyłącz tamper</option>' +
            '<option value="1">ściaśniaj</option>' +
            '<option value="8">pakowanie Czesław</option>' +
            '<option value="18">pakowanie Buła</option>' +
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
        var magazynId = $('#fg_processing_stock').val();
        var valueText = $('#fg_processing_stock option:selected').text();

        if (!magazynId) {
            var $td = $('#pageContent').find('td:contains("Realizacja z magazynu"):first');
            valueText = $td.next().text();
            magazynId = valueText.substr(0, valueText.indexOf(' '));
            magazynId = magazynId.substr(1);
        }


        $("<em>", {
            css: styles.important_val
        }).text(valueText).appendTo('#tamperMagazyn');

        if (magazynId == 18) {
            $('<img>', {
                src: 'https://cdn3.iconfinder.com/data/icons/object-emoji/50/Poop-512.png',
                css: styles.icon
            }).prependTo('#tamperMagazyn');
        }

        return magazynId;
    }

    function getStatus(){
        var statusId = $('.status-select').val();

        return statusId;
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

    function nieJestPakowaneTamper() {
        var tamperSetting = localStorage.getItem('tamperOn');
        //ustawienie tamper lub status - pakowane
        if (tamperSetting < 8 || window.tamperStatusId != 'b') {
            return true;
        } else {
            return false;
        }
    }

    function blurSection(section) {
        var tamperSetting = localStorage.getItem('tamperOn');
        if (nieJestPakowaneTamper()){
            return;
        }

        if (tamperSetting !== window.tamperMagazynId) {
            $(section).css(styles.blurred_lines);
        }

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

                blurSection('#products-list td:not(.yui-dt0-col-icon)');

                $('#products-list tbody.yui-dt-data').find('.yui-dt-col-name').each(function(k, v){
                    var _this = $(v);
                    var productName = _this.find('b:first').text();
                    var productAdnotacja = _this.find('i:first').text();
                    if (productAdnotacja.length > 0) {
                        if (productAdnotacja.toLowerCase().indexOf('#gratis') > -1) {
                            var customStyles = defaultAlertStyles;
                            customStyles.highlight = styles.highlight_gradient;
                            setAlert('', _this.find('>div'), customStyles);
                        }
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

        //statystyki (konto sprzedającego w serwisie zewn.)
        var $konto_zewn = $('.orderd-footer-content').find('li:contains("Konto sprzedającego w serwisie zewnętrznym")');
        if ($konto_zewn.length > 0 && window.tamperMagazynId > -1) {
            var blurProdukt;
            var $konto_zewn_text = $konto_zewn.text();
            $konto_zewn_text = $konto_zewn_text.substring($konto_zewn_text.indexOf(':')+2);
            if ($konto_zewn_text == 'demus-zegarki') {
                setAlert('realizacja zamówienia powinna iść z magazynu M12 lub M18');
                if (window.tamperMagazynId != '12' && window.tamperMagazynId != '18') {
                    blurProdukt = setInterval(function() {
                        if ($('#products-list tbody.yui-dt-data').find('.yui-dt-col-name:first').length > 0) {
                            clearInterval(blurProdukt);

                            blurSection('#products-list td:not(.yui-dt0-col-icon)');
                            alert('WYBRANY ZLY MAGAZYN, powinien być M12 lub M18');
                        }
                    }, 500);
                }
            } else if($konto_zewn_text == 'Zegary-Demus') {
                setAlert('realizacja zamówienia powinna iść z magazynu M8');
                if (window.tamperMagazynId != '8') {
                    blurProdukt = setInterval(function() {
                        if ($('#products-list tbody.yui-dt-data').find('.yui-dt-col-name:first').length > 0) {
                            clearInterval(blurProdukt);

                            blurSection('#products-list td:not(.yui-dt0-col-icon)');
                            alert('WYBRANY ZLY MAGAZYN, powinien być M8');
                        }
                    }, 500);
                }
            } else {
                alert('wystapil blad z rozpoznaniem konta w serwisie zewnętrznym, prosze o zgloszenie nr zamowienia do Emila');
            }
        }

        $('.tamper-toggle-section').on('click', function() {
            $(this).find('.fa').toggle();
            var sectionId = $(this).data('section');
            $('.' + sectionId + ':not(.tamper-important)').toggle();
            $('.' + sectionId).find('.tamper-toggle-child:not(.tamper-important)').toggle();
        });
    }

    function createToggleRow(sectionId, sectionTitle = 'Sekcja') {
        return $('<tr class="tamper-toggle-section tamper-important" data-section="section-' + sectionId + '"><td colspan="2" style="background-color: #ddd">' + sectionTitle +
                 '<i class="fa fa-long-arrow-down" style="display: none; margin-left: 10px;" aria-hidden="true"></i><i class="fa fa-long-arrow-left" style="margin-left: 10px;" aria-hidden="true"></i>' +
                 '</td></tr>').css(styles.toggle_expand);
    }

    function createRow(sectionId, sectionTitle = 'Sekcja', sectionStyle = '') {
        return $('<tr class="tamper-important" data-section="section-' + sectionId + '"><td colspan="2">' + sectionTitle + '</td></tr>').css(styles[sectionStyle]);
    }

    function setAlert(text, element = '', addStyles = defaultAlertStyles) {
        if (text.length > 0) {
            var alertSkeleton = '<div class="alert alert-danger" role="alert" style="font-weight: bold"></div>';
            $(alertSkeleton).css(addStyles.alert).text(text).appendTo('#tamperAlerts');
        }

        if (element.length > 0) {
            element.css(addStyles.highlight);
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
    window.tamperMagazynId = getMagazyn();
    window.tamperStatusId = getStatus();
    getNrZam();
    if (localStorage.getItem('tamperOn') > 0) {
        $('.tr:first').css('margin-top', '0');
        $('.tr').css(styles.override_tr);
        $('.msgWrapper:first').css(styles.msg_wrapper);
        var $breadcrumbs = $('.breadcrumbs');
        $breadcrumbs.find('.pull-right').css(styles.hide);
        $breadcrumbs.css({'min-height':'auto', 'line-height':'20px'});
        $breadcrumbs.find('.breadcrumb').css('margin-top', '0');
        var $navbar = $('.navbar:first');
        $navbar.css('min-height', 'auto');
        $navbar.find('>div.pull-left').css({'height':'20px', 'overflow': 'hidden'});
        $navbar.find('>div.pull-right').css({'height':'20px', 'overflow': 'hidden'});
        $navbar.find('.navbar-main').css('margin-top', 'auto');
        $('#pageContent').css('padding-top', '0');
        $('.alert').css(styles.alert);
        $('table table').css(styles.table_table);
        prepareSections();
        hideNonImportant(1);
    }
})(jQuery);