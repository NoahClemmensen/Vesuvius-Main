$(document).on('submit', 'form', function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    var form = $(this);
    var url = form.attr('action');

    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(), // Serialize the form data for the POST request
        success: function(data)
        {
            location.reload(); // Reload the page after the server responds
        }
    });
});