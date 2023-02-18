global = {
    parsedData: [],
    dsNum: 0,
    fileNames: []
}


$(document).ready(function () {

    loadData().then(function () {
        loadFileList(global.dsNum);
    });

    window.onload = function () {
        var queriesChart1 = ['count(//*[local-name()="article"])', 'string(//*[local-name()="publication"]/@date)'];
        var tagChart1 = 'tag1';

        loadQueries(queriesChart1, tagChart1).then(function () {
            var yearCount = {};

            global.parsedData[global.dsNum].forEach(item => {
                item.fileQueries.forEach((query) => {
                    if (query.tag == tagChart1) {
                        var queryResChart1 = query.queriesResult;
                        const queryArt = queryResChart1[0].queryRes;
                        const queryDate = queryResChart1[1].queryRes;
                        const queryYear = new Date(queryDate).getFullYear();

                        if (yearCount.hasOwnProperty(queryYear)) {
                            yearCount[queryYear] = yearCount[queryYear] + queryArt;
                        }
                        else {
                            yearCount[queryYear] = queryArt;
                        }
                    }
                })


            })

            createChart(yearCount, "Number of articles per year", 1);
        });
    };

})

function loadData() {
    return $.ajax({
        url: 'pull-parse',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.fileNames = data.fileNames;
            global.parsedData = data.parsedData;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function loadFileList(dsNum) {
    var fileList = $('#fileList');
    fileList.html("");

    if (global.fileNames[dsNum].length == 0) {
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("noItems").style.display = "block";
    }
    else {
        global.fileNames[dsNum].forEach((file) => {
            fileList.append(`
                <div class="item" tag="${file}">
                    <div class="content">
                        <div class="description">${file}</div>
                    </div>
                </div>`);
        });

        document.getElementById("noItems").style.display = "none";
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("fileList").style.display = "block";
    }
}

function getQueriesDataLength(fileName, dsNum) {
    var res = null;

    global.parsedData[dsNum].forEach((item) => {
        if (item.fileName == fileName) {
            res = item.fileQueries.length;
            return res;
        }
    });

    return res;
}

function loadQueries(queries, tag) {
    return queriesFiles(queries, 'xpath', tag, global.dsNum);
}

function queriesFiles(queries, queryLang, tag, dsNum) {
    return $.ajax({
        url: 'queries',
        type: 'POST',
        data: {
            queries: queries,
            queryLang: queryLang,
            queriesTag: tag
        },

        success: function (data) {

            global.parsedData[dsNum].forEach((item) => {
                var queriesItem = []; // array of queries

                // for each doc we take the query res for it
                data.queriesResult.forEach((queriesResTag) => {

                    if (item.fileName == queriesResTag.queriesResult[0].queryFile) {
                        queriesItem = queriesResTag;
                    }

                });


                item.fileQueries.push(queriesItem);
            })
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