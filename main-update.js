$(document).ready(function() {

    var url_api = 'http://157.230.17.132:4000/sales';
    // imposto le traduzioni di moment in italiano
    moment.locale('it');

    // variabili globali dei grafici per poter gestire gli aggiornamenti
    var grafico_mesi;
    var grafico_venditori;

    disegna_grafici(false);


    $('#aggiungi-vendita').click(function() {
        var venditore_scelto = $('#scelta-venditore').val();
        var mese_scelto = $('#scelta-mese').val();
        var importo_inserito = $('#importo-vendita').val();

        // controllo che i dati inseriti dall'utente siano tutti corretti
        if(venditore_scelto != '' && mese_scelto != '' && importo_inserito > 0) {
            $('#scelta-venditore').val('');
            $('#scelta-mese').val('');
            $('#importo-vendita').val('');

            var data_vendita = '01/' + mese_scelto + '/2017';

            $.ajax({
                'url': url_api,
                'method': 'POST',
                'data': {
                    salesman: venditore_scelto,
                    date: data_vendita,
                    amount: importo_inserito
                },
                'success': function(data) {
                    disegna_grafici(true);
                },
                'error': function() {
                    console.log('si è verificato un errore');
                }
            });
        } else if(venditore_scelto == '') {
            alert('seleziona il venditore');
        } else if(mese_scelto == '') {
            alert('seleziona il mese');
        } else {
            alert('inserisci un importo valido');
        }

    });

    // funzione per recuperare i dati e disegnare i grafici
    // riceve come parametro una variabile booleana:
    // se aggiorna == true, significa che i grafici sono già stati disegnati e bisogna solo aggiornarli
    // se aggiorna == false, significa che i grafici non sono ancora stati disegnati
    function disegna_grafici(aggiorna) {

        $.ajax({
            'url': url_api,
            'method': 'GET',
            'success': function(vendite) {
                console.log(vendite);
                /* grafico vendite mensili */
                // costruisco un oggetto che mappa i mesi con il totale delle vendite
                var dati_vendite_mensili = prepara_dati_vendite_mensili(vendite);
                // estraggo le chiavi, che saranno le etichette del grafico
                var mesi = Object.keys(dati_vendite_mensili);
                // estraggo i valori, che saranno i dati del grafico
                var dati_mesi = Object.values(dati_vendite_mensili);
                // inserisco le option nella select dei mesi
                popola_select_mese(mesi);

                if(!aggiorna) {
                    // disegno per la prima volta il grafico
                    // disegno il grafico passandogli le etichette e i dati
                    disegna_grafico_vendite_mensili(mesi, dati_mesi);
                } else {
                    // aggiorno il grafico
                    // modifico i dati del grafico impostando l'array con i dati aggiornati
                    grafico_mesi.config.data.datasets[0].data = dati_mesi;
                    grafico_mesi.update();
                }

                /* grafico vendite venditore */
                // costruisco un oggetto che mappa i venditori con il totale delle vendite
                var dati_vendite_venditori = prepara_dati_vendite_venditori(vendite);
                // estraggo le chiavi, che saranno le etichette del grafico
                var nomi_venditori = Object.keys(dati_vendite_venditori);
                // estraggo i valori, che saranno i dati del grafico
                var dati_venditori = Object.values(dati_vendite_venditori);
                // inserisco le option nella select dei venditori
                popola_select_venditori(nomi_venditori);

                if(!aggiorna) {
                    // disegno per la prima volta il grafico
                    // disegno il grafico passandogli le etichette e i dati
                    disegna_grafico_vendite_venditori(nomi_venditori, dati_venditori);
                } else {
                    // aggiorno il grafico
                    // modifico i dati del grafico impostando l'array con i dati aggiornati
                    grafico_venditori.config.data.datasets[0].data = dati_venditori;
                    grafico_venditori.update();
                }

            },
            'error': function() {
                console.log('si è verificato un errore');
            }
        });

    }

    function prepara_dati_vendite_mensili(dati) {
        // preparo l'oggetto con i mesi tramite un ciclo for, usando moment
        var vendite_mensili = { };
        for (var i = 1; i <= 12; i++) {
            var nome_mese = moment(i, 'M').format('MMMM');
            vendite_mensili[nome_mese] = 0;
        }

        for (var i = 0; i < dati.length; i++) {
            // recupero la vendita corrente
            var vendita_corrente = dati[i];
            // recupero l'importo della vendita corrente
            var importo_corrente = parseFloat(vendita_corrente.amount);
            // recupero la data della vendita corrente
            var data_corrente = vendita_corrente.date;
            // costruisco l'oggetto moment a partire dalla data della vendita corrente
            var data_corrente_moment = moment(data_corrente, 'DD/MM/YYYY');
            // estraggo il mese in formato testuale esteso
            var mese_corrente = data_corrente_moment.format('MMMM');
            // tramite il mese, incremento il totale delle vendite di questo mese
            vendite_mensili[mese_corrente] += importo_corrente;
        }

        return vendite_mensili;
    }

    function prepara_dati_vendite_venditori(dati) {
        var vendite_venditori = {};

        var totale_vendite = 0;
        for (var i = 0; i < dati.length; i++) {
            // recupero la vendita corrente
            var vendita_corrente = dati[i];
            // recupero l'importo della vendita corrente
            var importo_corrente = parseFloat(vendita_corrente.amount);
            // recupero il nome del venditore della vendita corrente
            var nome_corrente = vendita_corrente.salesman;
            // verifico se ho già trovato questo venditore nelle iterazioni precedenti
            if(vendite_venditori.hasOwnProperty(nome_corrente)) {
                // la chiave per questo venditore è già definita
                // incremento il suo totale con l'importo della vendita corrente
                vendite_venditori[nome_corrente] += importo_corrente;
            } else {
                // la chiave con il nome di questo venditore non esiste
                // non ho ancora incontrato questo venditore in nessuna iterazione precedente
                // definisco la chiave per questo venditore
                // e assegno il valore della vendita corrente
                vendite_venditori[nome_corrente] = importo_corrente;
            }
            // incremento il totale delle vendite con l'importo corrente
            totale_vendite += importo_corrente;
        }

        // ciclo l'oggetto con tutti i venditori e i relativi importi totali
        for (var nome_venditore in vendite_venditori) {
            // recupero l'importo totale di questo venditore
            var importo_venditore = vendite_venditori[nome_venditore];
            // calcolo la percentuale delle sue vendite sul totale
            var percentuale_venditore = (importo_venditore * 100 / totale_vendite).toFixed(1);
            // imposto la sua percetuale come valore
            vendite_venditori[nome_venditore] = percentuale_venditore;
        }

        return vendite_venditori;
    }

    function disegna_grafico_vendite_mensili(etichette, dati) {

        grafico_mesi = new Chart($('#grafico-vendite-mensili')[0].getContext('2d'), {
            type: 'line',
            data: {
                labels: etichette,
                datasets: [{
                    label: 'importi vendite',
                    data: dati,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: 'rgba(255, 99, 132, 1)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 3,
                    fill: false
                }]
            },
            options: {
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label + ': ';
                            label += tooltipItem.yLabel;
                            label += ' €';
                            return label;
                        }
                    }
                }
            }
        });
    }

    function disegna_grafico_vendite_venditori(etichette, dati) {

        // genero i colori di sfondo e bordo dinamicamente
        // in base a quanti dati ci sono da rappresentare
        var colori_sfondo = [];
        var colori_bordo = [];
        var numero_colori = etichette.length;
        for (var i = 0; i < numero_colori; i++) {
            var rosso = genera_random(0, 255);
            var verde = genera_random(0, 255);
            var blu = genera_random(0, 255);
            colori_sfondo.push('rgba(' + rosso + ', ' + verde + ', '+ blu + ', 0.2)');
            colori_bordo.push('rgba(' + rosso + ', ' + verde + ', '+ blu + ', 1)');
        }

        grafico_venditori = new Chart($('#grafico-vendite-venditori')[0].getContext('2d'), {
            type: 'pie',
            data: {
                labels: etichette,
                datasets: [{
                    label: 'importi vendite',
                    data: dati,
                    backgroundColor: colori_sfondo,
                    borderColor: colori_bordo,
                    borderWidth: 1
                }]
            },
            options: {
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var nome_venditore = data.labels[tooltipItem.index];
                            var percentuale_vendite = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return nome_venditore + ': ' + percentuale_vendite + '%';
                        }
                    }
                }
            }
        });

    }

    function popola_select_mese(mesi) {
        var template = Handlebars.compile($('#mese-template').html());
        // svuoto la select e inserisco la prima option con value=""
        $('#scelta-mese').empty();
        $('#scelta-mese').append(template({'nome': '-- scegli mese --'}));
        // per ogni mese, genero una option
        for (var i = 0; i < mesi.length; i++) {
            var numero_mese = i + 1;
            if(numero_mese < 10) {
                numero_mese = '0' + numero_mese;
            }
            $('#scelta-mese').append(template({
                'numero': numero_mese,
                'nome': mesi[i]
            }));
        }
    }

    function popola_select_venditori(venditori) {
        var template = Handlebars.compile($('#venditore-template').html());
        // svuoto la select e inserisco la prima option con value=""
        $('#scelta-venditore').empty();
        $('#scelta-venditore').append(template({'nome': '-- scegli venditore --'}));
        // per ogni venditore, genero una option
        for (var i = 0; i < venditori.length; i++) {
            $('#scelta-venditore').append(template({
                'nome': venditori[i],
                'valore': venditori[i]
            }));
        }
    }

    function genera_random(min, max) {
        return Math.floor(Math.random() * (max - min + 1) ) + min;
    }

});
