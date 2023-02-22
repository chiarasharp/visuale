global = {
    //parsedData: [],
    queriesByTag: [],
    fileNames: []
}


$(document).ready(function () {

    loadData();

    window.onload = function () {
        var queriesChart0 = ['count(//*[local-name()="article"])', 'string(//*[local-name()="publication"]/@date)'];
        var tagChart0 = 0;
        var dsNum = 0;
        var yearCount = {};

        global.queriesByTag.push(
            {
                tag: tagChart0,
                queriesByDs: []
            }
        );

        global.queriesByTag[tagChart0].queriesByDs.push(
            {
                ds: dsNum,
                queries: []
            }
        );

        loadQueries(queriesChart0, tagChart0, dsNum).then(function () {

            /* THIS WILL BE DONE ON AN USER INTERFACE IN THE FUTURE */
            
            global.queriesByTag[tagChart0].queriesByDs[dsNum].queries.forEach(queryFile => {
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
            createChart(yearCount, "Number of articles per year", tagChart0);

        });

        console.log(yearCount);
    };

})

function loadData() {
    return $.ajax({
        url: 'pull-parse',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.fileNames = data.fileNames;
            //global.parsedData = data.parsedData;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function loadFileList() {
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

function loadQueries(queries, tag, dsNum) {
    return queriesFiles(queries, 'xpath', tag, dsNum);
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