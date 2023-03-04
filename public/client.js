global = {
    vizualizations: [],
    fileNames: []
}


$(document).ready(function () {

    loadData();
    loadVizData().then(function() {
            loadVizGrid();

            const buttonsMakeChart = document.querySelectorAll('.make-chart');
            const buttonsShowMore = document.querySelectorAll('button.show-more');

            buttonsMakeChart.forEach(button => {
                
                button.addEventListener('click', () => {
                    const id = button.dataset.id;
                    button.style.display = "none";

        
                    var showMore = document.querySelectorAll('.show-more[data-id="'+id+'"]');
                    for (var i = 0; i < showMore.length; i++ ) {
                        showMore[i].style.display = "block";
                    }
                
                    loadVizQueriesResults(parseInt(id), global.vizualizations[id].queriesByDs);
                });
                
            });

            buttonsShowMore.forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.dataset.id;
                    loadVizPage(id);
                });
            })


    });

})

function loadData() {
    return $.ajax({
        url: 'pull-parse-data',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.fileNames = data.fileNames;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function loadVizData() {
    return $.ajax({
        url: 'pull-viz',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.vizualizations = data.vizualizations;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function loadVizGrid() {
    var vizGrid = $('#chartsGrid');
    vizGrid.html("");

    global.vizualizations.forEach((viz) => {
        vizGrid.append(
            `
            <div class="column">
                <div class="ui link card">
                    <button class="ui button make-chart" data-id="${viz.tag}">Make Chart</button>
                    <div class="content">
                        <div class="header show-more" data-id="${viz.tag}" style="display: none;">${viz.title}</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="canvas${viz.tag}"></canvas>
                    </div>
                    <div class="extra content">
                        <span class="show-more" data-id="${viz.tag}" style="display: none;">${viz.description}</span>
                    </div>
                    <div class="extra content">
                        <button class="ui button show-more" data-id="${viz.tag}" style="display: none;">Show more</button>
                    </div>
                </div>
            </div>`
        );
    })
}

function loadVizPage(id) {
    return $.ajax({
        url: '/viz/' + id,
        type: 'GET',
        success: function(data) {
          // handle successful response
          window.location.href = '/viz/' + id;
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // handle error
          console.log("Error:", textStatus, errorThrown);
        }
    });
}

function loadVizQueriesResults(tag, dsQueries) {

    switch (tag) {
        case 0: /* NUMBER OF ARTICLES BY YEAR, ONE DATASET, TWO XPATH QUERIES */
            var yearCount = {};
            loadQueriesByDs(dsQueries, tag).then(function () {
        
                global.vizualizations[tag].queriesByDs[0].queries.forEach(queryFile => {
                    const queryArt = queryFile[0].queryRes;
                    const queryDate = queryFile[1].queryRes;
                    const queryYear = new Date(queryDate).getFullYear();
        
                    if (yearCount.hasOwnProperty(queryYear)) {
                        yearCount[queryYear] = yearCount[queryYear] + queryArt;
                    }
                    else {
                        yearCount[queryYear] = queryArt;
                    }
                })
                createBarChart(yearCount, global.vizualizations[tag].title, tag);
        
            });
        break;
        case 1: /* NUMBER OF ARTICLES BY YEAR, TWO DATASETS, ONE XPATH QUERY FOR DS */
            var yearCount = {};

             loadQueriesByDs(dsQueries, tag).then(function () {
                const tagResultQueriesDs0 = global.vizualizations[tag].queriesByDs[0];
                const tagResultQueriesDs1 = global.vizualizations[tag].queriesByDs[1];

                tagResultQueriesDs0.queries.forEach((queryFile, index) => {
                    const queryArt = queryFile[0].queryRes;
                    const queryDate = tagResultQueriesDs1.queries[index][0].queryRes;
                    const queryYear = new Date(queryDate).getFullYear();
        
                    if (yearCount.hasOwnProperty(queryYear)) {
                        yearCount[queryYear] = yearCount[queryYear] + queryArt;
                    }
                    else {
                        yearCount[queryYear] = queryArt;
                    }
                })
                createBarChart(yearCount, global.vizualizations[tag].title, tag);
        
            }); 

        break;
    }


}

function loadQueriesByDs(queriesByDs, tag) {
    return queriesFilesDs(queriesByDs, tag);
}

function queriesFilesDs(queriesByDs, tag) {
    return $.ajax({
        url: 'queries',
        type: 'POST',
        data: {
            queriesByDs: queriesByDs,
            tag: tag
        },

        success: function (data) {
            data.resultsQueries.forEach(dsQueries => {
                global.vizualizations[tag].queriesByDs[dsQueries.ds].queries = dsQueries.queries;
            })
        },
        error: function (error) {
            alert(error);
        }
    });
}

function createBarChart(dataChart, label, tag) {
    var chartName = 'canvas' + tag;
    var context = document.getElementById(chartName).getContext('2d');
    const keys = Object.keys(dataChart);
    const values = Object.values(dataChart);

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }

    const chartObj = {
        type: 'bar',
        data: {
            labels: keys,
            datasets: [{
                label: label,
                data: values,
                backgroundColor: 'rgba( 8, 61, 119, 1)',
                fill: false,
            }]
        },
        options: options
    };
    

    var chart = new Chart(context, chartObj);

    global.vizualizations.chartData = dataChart;
    
    $.ajax({
        url: '/save-chart-data',
        type: 'POST',
        data: {
            tag: tag,
            chartData: dataChart
        },

        success: function (data) {
           
        },
        error: function (error) {

        }
    });

}