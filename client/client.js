$(document).ready(function(){

    $('form').submit(function(event) { // catch the form's submit event

        event.preventDefault();

        $.ajax({ // create an AJAX call...
            data: new FormData($('form')[0]), // get the form data
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
            contentType: false,
            processData: false,
            success: function(response) { // on success..
                alert(response.message);
            }
        });
        //return false; // cancel original event to prevent form submitting
    });

})