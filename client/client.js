// model contains all variable needed for the interface sofia
model = {
	parsedData : [],
	fileNames : []
}

$(document).ready(function(){
    
    loadData().then(function() {
        loadDocList();
    })

    $('form').submit(function(event) { // catch the form's submit event

        event.preventDefault();
        $('#submitButton').addClass('loading');
        document.getElementById("docList").style.display = "none";
        document.getElementById("noitems").style.display = "none";
        document.getElementById("loadingitems").style.display = "block";

        $.ajax({ // create an AJAX call...
            data: new FormData($('form')[0]), // get the form data
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
            contentType: false,
            processData: false,
            success: function(response) {

                loadData().then(function() {
                    document.getElementById("fileinput").value = "";
                    $('#submitButton').removeClass('loading');
                    loadDocList();
                    alert(response.message);
                }
                );
                
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

function loadDocList() {
    var docList = $('#docList');
	docList.html("");
    tag = 0;
    
    if (model.fileNames.length == 0) {
        document.getElementById("loadingitems").style.display = "none";
        document.getElementById("noitems").style.display = "block";
    }
    else {
        model.fileNames.forEach((file) => {
            docList.append(`
                <div class="inline item" tag="${tag}" href="">
                <p>${file}</p>
                </div>`);
            tag++;
        });

        document.getElementById("noitems").style.display = "none";
        document.getElementById("loadingitems").style.display = "none";
        document.getElementById("docList").style.display = "block";
    }
}