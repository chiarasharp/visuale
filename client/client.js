// model contains all variable needed for the interface sofia
model = {
	dataset : {
		type : undefined,
		path : ""
	},

	docList : [],
	analysis : {},
	//activeFilter : 'all',
	selectedDocs : [],
	openedDoc : undefined,
	actualAKN : undefined,
	dateLoaded:false,
	bodyTextLoaded:false,
	chart : undefined
}

$(document).ready(function(){

    $('form').submit(function(event) { // catch the form's submit event

        event.preventDefault();

        $.ajax({ // create an AJAX call...
            data: new FormData($('form')[0]), // get the form data
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
            contentType: false,
            processData: false,
            success: function(response) {
                alert(response.message);
            }
        });
        
    });

})