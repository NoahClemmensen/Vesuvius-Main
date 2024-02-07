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

$(document).ready(function() {
    $deleteItems = $('.delete-item');
    $deleteCategories = $('.delete-category');
    $flagItems = $('.flag-item');

    $deleteItems.on('click', function(e) {
        e.preventDefault();
        var id = $(this).closest('h5').data('id');

        $.post('/api/admin/deleteMenuItem', {menuItemId: id})
            .then(function(data) {
                location.reload();
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    $deleteCategories.on('click', function(e) {
        e.preventDefault();
        var id = $(this).closest('h2').data('id');

        $.post('/api/admin/deleteCategory', {categoryId: id})
            .then(function(data) {
                location.reload();
            })
            .catch(function(err) {
                console.log(err);
            });
    });

    $flagItems.on('click', function(e) {
        e.preventDefault();
        var id = $(this).closest('h5').data('id');

        $.post('/api/admin/flagItem', {menuItemId: id})
            .then(function(data) {
                location.reload();
            })
            .catch(function(err) {
                console.log(err);
            });
    });
});