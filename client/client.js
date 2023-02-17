global = {
	parsedData : [],
	fileNames : [],
    grid : undefined,
    gridItems : [],
    gridItemsLength : 0
}
  

$(document).ready(function(){

    loadData().then(function() {
        loadFileList();
    });

    window.onload = function() {

        loadQueries().then(function() {
            var yearCount = {};

            global.parsedData.forEach(item => {
                const queryArt = item.fileQueries[0].queryRes;
                const queryDate = item.fileQueries[1].queryRes;
                const queryYear = new Date(queryDate).getFullYear();
    
                if(yearCount.hasOwnProperty(queryYear)) {
                    yearCount[queryYear] = yearCount[queryYear] + queryArt;
                }
                else {
                    yearCount[queryYear] = queryArt;
                } 
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

	    success: function(data) {
            global.fileNames = data.fileNames;
            global.parsedData = data.parsedData;
	    },
        error: function(error) {
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
        global.fileNames.forEach((file) => {
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

function getQueriesDataLength(fileName) {
    var res = null;

    global.parsedData.forEach((item) => {
        if (item.fileName == fileName) {
            res = item.fileQueries.length;
            return res;
        }
    });

    return res;
}

function loadQueries() {
    return queriesFiles(['count(//*[local-name()="article"])','string(//*[local-name()="publication"]/@date)'], 'xpath');
}

function queriesFiles(queries, queryLang) {
    return $.ajax({
	    url: 'queries',
	    type: 'POST',
        data: {
            queries: queries,
            queryLang: queryLang
        },

	    success: function(data) {

            global.parsedData.forEach((item) => {
                var queriesItem = [];
                
                // for each doc we take the query res for it
                data.queriesResult.forEach((queryRes) => {
                    if (item.fileName == queryRes.queryFile) {
                        queriesItem.push(queryRes);
                    }
                });
                
                // for each query we create a structure with diff metadata
                // and push it in the structure for the file
                queriesItem.forEach((query) => {
                    item.fileQueries.push(query);
                });
            })
	    },
        error: function(error) {
            alert(error);
        }
	});
}

function createChart(data, label, chartNum) {
    var chartName = 'canvas'+ chartNum;
    var context = document.getElementById(chartName).getContext('2d');
    const container = document.querySelector('.chart-container');

    // Get the computed style of the container element
    const containerStyle = window.getComputedStyle(container);

    // Extract the width and height of the container element
    const containerWidth = parseInt(containerStyle.width);
    const containerHeight = parseInt(containerStyle.height);

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

    chart.canvas.style.width = containerWidth + 'px';
    chart.canvas.style.height = containerHeight + 'px';
        
}