global = {
    vizByTag: [],
    fileNames: []
}


$(document).ready(function () {

    loadData();

    global.vizByTag.push({
        tag: 0,
        title: 'Number of articles per year, one ds version.',
        queriesByDs: [{
            ds: 0,
            queries: []
        }]
    }, {
        tag: 1,
        title: 'Number of articles per year, two ds version',
        queriesByDs: [{
            ds: 0,
            queries: []
        },
        {
            ds: 1,
            queries: []
        }]
    });
    

    $('#showViz0').click(function(event){
        document.getElementById("showViz0").style.display = "none";
		var dsQueries0 = [{
            ds: 0,
            queryLanguage: 'xpath',
            queries: ['count(//*[local-name()="article"])', 'string(//*[local-name()="publication"]/@date)']
        }]
        loadVisualization(0, dsQueries0);
	})

    $('#showViz1').click(function(event){
        document.getElementById("showViz1").style.display = "none";
        var dsQueries1 = [{
            ds: 0,
            queryLanguage: 'xpath',
            queries: ['count(//*[local-name()="article"])']
        },
        {
            ds: 1,
            queryLanguage: 'xpath',
            queries: ['string(//*[local-name()="publication"]/@date)']
        }]
        
        loadVisualization(1, dsQueries1);
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

function loadVisualization(tag, dsQueries) {

    switch (tag) {
        case 0: /* NUMBER OF ARTICLES BY YEAR, ONE DATASET, TWO XPATH QUERIES */
            var yearCount = {};
            loadQueriesByDs(dsQueries, tag).then(function () {
        
                global.vizByTag[tag].queriesByDs[dsQueries[0].ds].queries.forEach(queryFile => {
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
                const tagResultQueriesDs0 = global.vizByTag[tag].queriesByDs[dsQueries[0].ds];
                const tagResultQueriesDs1 = global.vizByTag[tag].queriesByDs[dsQueries[1].ds];

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

function loadViz() {
    var vizGrid = $('#chartsGrid');
    vizGrid.html("");

    if (global.vizByTag.length == 0) {
        //document.getElementById("loadingItems").style.display = "none";
        //document.getElementById("noItems").style.display = "block";
    }
    else {

        global.vizByTag.forEach((viz) => {
            vizGrid.append(`<div class="column">
                            <div class="ui link card">
                            <button class="ui button" id="showViz${viz.tag}">Make Chart</button>
                            
                            <div class="content">
                                <div class="header"${viz.title}</div>
                            </div>
                            <div class="chart-container">
                                <canvas id="canvas${viz.tag}"></canvas>
                            </div>
                            <div class="extra content">
                                            <span>Queries from collection`);
            viz.queriesByDs.forEach((ds) => {
                vizGrid.append(`
                <i><b>${ds.ds}</b></i> `);
            })
            vizGrid.append(`</span></div></div></div>`);
        })

        //document.getElementById("noItems").style.display = "none";
        //document.getElementById("loadingItems").style.display = "none";
        //document.getElementById("fileList").style.display = "block";
    }
}

/* function loadFileList() {
    var fileList = $('#fileList');
    fileList.html("");

    if (global.fileNames.length == 0) {
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("noItems").style.display = "block";
    }
    else {
        count = 0;
        global.fileNames.forEach((dir) => {
            fileList.append(`
            <h4>Directory ${count}</h4>`);
            dir.forEach((file) => {
                fileList.append(`
                <div class="item" tag="${file}">
                    <div class="content">
                        <div class="description">${file}</div>
                    </div>
                </div>`);
            })
            count++;
        })

        document.getElementById("noItems").style.display = "none";
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("fileList").style.display = "block";
    }
}
 */

function loadQueries(queries, tag, dsNum) {
    return queriesFiles(queries, 'xpath', tag, dsNum);
}

function loadQueriesByDs(queriesByDs, tag) {
    return queriesFilesDs(queriesByDs, tag);
}

function queriesFiles(queries, queryLang, tag, dsNum) {
    return $.ajax({
        url: 'queries',
        type: 'POST',
        data: {
            queries: queries,
            queryLang: queryLang,
            queriesDs: dsNum
        },

        success: function (data) {

            global.queriesByTag[tag].queriesByDs[dsNum].queries = data.queriesResColl;

        },
        error: function (error) {
            alert(error);
        }
    });
}

function queriesFilesDs(queriesByDs, tag) {
    return $.ajax({
        url: 'queries-colls',
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

}