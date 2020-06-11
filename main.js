$(document).ready(function() {

    // imposto le traduzioni di moment in italiano
    moment.locale('it');

    var url_api = 'http://157.230.17.132:4000/sales';
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
            // disegno il grafico passandogli le etichette e i dati
            disegna_grafico_vendite_mensili(mesi, dati_mesi);

            /* grafico vendite venditore */
            // costruisco un oggetto che mappa i venditori con il totale delle vendite
            var dati_vendite_venditori = prepara_dati_vendite_venditori(vendite);
            // estraggo le chiavi, che saranno le etichette del grafico
            var nomi_venditori = Object.keys(dati_vendite_venditori);
            // estraggo i valori, che saranno i dati del grafico
            var dati_venditori = Object.values(dati_vendite_venditori);
            // disegno il grafico passandogli le etichette e i dati
            disegna_grafico_vendite_venditori(nomi_venditori, dati_venditori);
        },
        'error': function() {
            console.log('si è verificato un errore');
        }
    });

    function prepara_dati_vendite_mensili(dati) {
        var vendite_mensili = {
            'gennaio': 0,
            'febbraio': 0,
            'marzo': 0,
            'aprile': 0,
            'maggio': 0,
            'giugno': 0,
            'luglio': 0,
            'agosto': 0,
            'settembre': 0,
            'ottobre': 0,
            'novembre': 0,
            'dicembre': 0
        };

        for (var i = 0; i < dati.length; i++) {
            // recupero la vendita corrente
            var vendita_corrente = dati[i];
            // recupero l'importo della vendita corrente
            var importo_corrente = parseInt(vendita_corrente.amount);
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
            var importo_corrente = parseInt(vendita_corrente.amount);
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

        var myChart = new Chart($('#grafico-vendite-mensili')[0].getContext('2d'), {
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
        var myChart = new Chart($('#grafico-vendite-venditori')[0].getContext('2d'), {
            type: 'pie',
            data: {
                labels: etichette,
                datasets: [{
                    label: 'importi vendite',
                    data: dati,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            }
        });
    }

});
