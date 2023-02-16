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

    loadGridItems();


    /*$('form').submit(function(event) { // catch the form's submit event

        event.preventDefault();

        $('#submitButton').addClass('loading');
        document.getElementById("fileList").style.display = "none";
        document.getElementById("noItems").style.display = "none";
        document.getElementById("loadingItems").style.display = "block";

        $.ajax({ // AJAX call
            data: new FormData($('form')[0]), // get the form data
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
            contentType: false,
            processData: false,

            success: function(response) {

                loadData().then(function() {
                    document.getElementById("fileInput").value = "";
                    $('#submitButton').removeClass('loading');
                    loadFileList();
                    
                    alert(response.message);
                }
                );
                
            },
            error: function(error) {
                document.getElementById("fileInput").value = "";
                $('#submitButton').removeClass('loading');
                loadFileList();
                alert(error.message);
            }
        });

       
    });*/

    $('#b1').click(function(event) {
        label = event.target.textContent;

        loadQueries().then(function() {
            var yearCount = {};

            global.parsedData.forEach(item => {
                queryArt = item.fileQueries[0].queryResult;
                queryDate = item.fileQueries[1].queryResult;
                queryYear = new Date(queryDate).getFullYear();
    
                if(yearCount.hasOwnProperty(queryYear)) {
                    yearCount[queryYear] = yearCount[queryYear] + queryArt;
                }
                else {
                    yearCount[queryYear] = queryArt;
                } 
            })

            createChart(yearCount, label);
        });  
    });

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
                const queriesItem = [];
                
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

function addItem(chartName) {
    let item = {
        x: 0, 
        y: 0, 
        width: 5, 
        height: 5,
        noResize: true, 
        content: '<div style="padding-top:0px;padding-right:20px;padding-bottom:20px;padding-left:10px;"><canvas id="'+chartName+'"></canvas></div>'
    }
    
    //items.push(item);
    global.gridItemsLength++;
    global.grid.addWidget('<div><div class="grid-stack-item-content"><button class="ui button" id="dlt'+chartName+'"onClick="global.grid.removeWidget(this.parentNode.parentNode)">Delete Chart</button><br>' + (item.content ? item.content : ''), item);
}

function loadGridItems() {
    global.grid = GridStack.init({
        acceptWidgets: true,
        float: true
    });

    global.grid.load(global.gridItems);
  
    global.grid.on('added change', function(e, items) {
        let str = '';
        items.forEach(function(item) { str += ' (x,y)=' + item.x + ',' + item.y; });

        console.log(e.type + ' ' + items.length + ' items:' + str );
    });

    global.grid.on('removed', function(e, items) {
        let str = '';
        items.forEach(function(item) { str += ' (x,y)=' + item.x + ',' + item.y; });
        global.gridItemsLength--;
        console.log(e.type + ' ' + items.length + ' items:' + str );
    });
}

/*function createChartArticlesInYears(articlesInYears) {
    var chartName = 'canvas'+ global.gridItemsLength;
    addItem(chartName);
    var context = document.getElementById(chartName).getContext('2d');
		
    var chart = new Chart(context, {
        type: 'bar',
        data: {
            labels: Object.keys(articlesInYears),
            datasets: [{
                label: 'Number of articles by year.',
                data: Object.values(articlesInYears),
                fill: false,
            }]
        }
    });
        
}*/

function createChart(data, label) {
    var chartName = 'canvas'+ global.gridItemsLength;
    addItem(chartName);
    var context = document.getElementById(chartName).getContext('2d');
		
    var chart = new Chart(context, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: label,
                data: Object.values(data),
                fill: false,
            }]
        }
    });
        
}