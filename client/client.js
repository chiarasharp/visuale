model = {
	parsedData : [],
	fileNames : [],
    grid : undefined,
    gridItems : []
}
  

$(document).ready(function(){

    loadData().then(function() {
        loadFileList();
    });

    loadGridItems();

    $('form').submit(function(event) { // catch the form's submit event

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
        
    });

    $('#addChart').click(function(event) {
        var chartName = 'Canvas'+ model.gridItems.length;
        addItem(chartName);
        var context = document.getElementById(chartName).getContext('2d');
		
        var chart = new Chart(context, {
            type: 'line',
            data: {
              labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
              datasets: [{
                label: 'My First dataset',
                //backgroundColor: #084cdf,
                //borderColor: window.chartColors.red,
                data: [
                  12,
                  5.5,
                ],
                fill: false,
              }, {
                label: 'My Second dataset',
                fill: false,
                //backgroundColor: window.chartColors.blue,
                //borderColor: window.chartColors.blue,
                data: [
                  12,
                  5.5,
                ],
              }]
            }
        });
        
       
	});

})

function loadData() {
	return $.ajax({
	    url: 'pull',
	    type: 'GET',
	    contentType: "application/json",

	    success: function(data) {
            model.fileNames = data.fileNames;
            model.parsedData = data.parsedData;
	    },
        error: function(error) {
            alert(error.message);
        }
	});
}

function loadFileList() {
    var fileList = $('#fileList');
	fileList.html("");

    if (model.fileNames.length == 0) {
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("noItems").style.display = "block";
    }
    else {
        model.fileNames.forEach((file) => {
            fileList.append(`
                <div class="inline item" href="">
                    <p>${file}</p>
                </div>`);
        });

        document.getElementById("noItems").style.display = "none";
        document.getElementById("loadingItems").style.display = "none";
        document.getElementById("fileList").style.display = "block";
    }
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
    model.grid.addWidget('<div><div class="grid-stack-item-content"><button class="ui button" id="dlt'+chartName+'"onClick="model.grid.removeWidget(this.parentNode.parentNode)">Delete Chart</button><br>' + (item.content ? item.content : ''), item);
}

function loadGridItems() {
    model.grid = GridStack.init({
        acceptWidgets: true,
        float: true
    });

    model.grid.load(model.gridItems);
  
    model.grid.on('added removed change', function(e, items) {
        let str = '';
        items.forEach(function(item) { str += ' (x,y)=' + item.x + ',' + item.y; });
        console.log(e.type + ' ' + items.length + ' items:' + str );
    });
}