model = {
	parsedData : [],
	fileNames : []
}

$(document).ready(function(){
    
    loadData().then(function() {
        loadFileList();
    })

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

    $('#dwnParsed').click(function(event) {
		downloadParsedData();
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

function downloadParsedData() {
    
}