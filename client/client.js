global = {
    vizByTag: [],
    fileNames: []
}


$(document).ready(function () {

    loadData();
    loadVizData();
    loadVizGrid();

    $('#showViz0').click(function(event){
        document.getElementById("showViz0").style.display = "none";
        document.getElementById("showMore0").style.display = "block";
		var vizQueries0 = [{
            ds: 0,
            queryLanguage: 'xpath',
            queriesText: ['count(//*[local-name()="article"])', 'string(//*[local-name()="publication"]/@date)']
        }]
        loadVizQueriesResults(0, vizQueries0);
	})

    $('#showViz1').click(function(event){
        document.getElementById("showViz1").style.display = "none";
        document.getElementById("showMore1").style.display = "block";
        var vizQueries1 = [{
            ds: 0,
            queryLanguage: 'xpath',
            queriesText: ['count(//*[local-name()="article"])']
        },
        {
            ds: 1,
            queryLanguage: 'xpath',
            queriesText: ['string(//*[local-name()="publication"]/@date)']
        }]
        
        loadVizQueriesResults(1, vizQueries1);
	})

})

function loadData() {
    return $.ajax({
        url: 'pull-parse',
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
    vizData.forEach(viz => {
        global.vizByTag.push(viz);
    })

}

function loadVizGrid() {
    var vizGrid = $('#chartsGrid');
    vizGrid.html("");

    global.vizByTag.forEach((viz) => {
        vizGrid.append(
            `<div class="column">
                <div class="ui link card">
                    <button class="ui button" id="showViz${viz.tag}">Make Chart</button>
                    <div class="content">
                        <div class="header">${viz.title}</div>
                    </div>
                    <div class="chart-container" >
                        <canvas id="canvas${viz.tag}"></canvas>
                    </div>
                    <div class="extra content">
                        <span>${viz.description}</span>
                    </div>
                    <div class="extra content">
                        <button class="ui button" id="showMore${viz.tag}" onclick="viz()" style="display: none;">Show more</button>
                    </div>
                </div>
            </div>`
        );
    })
}

function viz() {
    window.location.href = "viz.html";
}

function loadVizQueriesResults(tag, dsQueries) {

    switch (tag) {
        case 0: /* NUMBER OF ARTICLES BY YEAR, ONE DATASET, TWO XPATH QUERIES */
            var yearCount = {};
            loadQueriesByDs(dsQueries, tag).then(function () {
        
                global.vizByTag[tag].queriesByDs[0].queries.forEach(queryFile => {
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
                createChart(yearCount, "Number of articles per year", tag);
        
            });
        break;
        case 1: /* NUMBER OF ARTICLES BY YEAR, TWO DATASETS, ONE XPATH QUERY FOR DS */
            var yearCount = {};

             loadQueriesByDs(dsQueries, tag).then(function () {
                const tagResultQueriesDs0 = global.vizByTag[tag].queriesByDs[0];
                const tagResultQueriesDs1 = global.vizByTag[tag].queriesByDs[1];

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
                createChart(yearCount, "Number of articles per year", tag);
        
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
            queriesByDs: queriesByDs
        },

        success: function (data) {

            global.vizByTag[tag].queriesByDs = data.resultsQueries;

        },
        error: function (error) {
            alert(error);
        }
    });
}

function createChart(data, label, chartNum) {
    var chartName = 'canvas' + chartNum;
    var context = document.getElementById(chartName).getContext('2d');

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

    var chart = new Chart(context, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: label,
                data: Object.values(data),
                backgroundColor: 'rgba( 8, 61, 119, 1)',
                fill: false,
            }]
        },
        options: options
    });

    global.vizByTag.chart = chart;

}