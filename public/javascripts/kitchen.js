function updateTimes() {
    var now = new Date();
    now = now.getTime() - now.getTimezoneOffset()

    $('button.card').each(function() {
        const orderDateString = $(this).attr('data-orderdate');
        const orderDate = new Date(orderDateString);

        const correctedOrderDate = orderDate.getTime() - orderDate.getTimezoneOffset()
        console.log("OrderDate",orderDate);
        console.log("CorrectedOrderDate",correctedOrderDate);

        const diffInMinutes = Math.floor((now - correctedOrderDate) / 60000);

        $(this).find('.timer').text("'" + diffInMinutes);
    });
}

function getOrders() {
    $.ajax({
        url: '/api/orders',
        headers: { 'x-api-key': getCookie('api-key') },
        type: 'GET',
        success: function(data) {
            console.log(data);
        },
        error: function(err) {
            console.log(err);
        }
    });
}

function updateOrders() {

}

function manageTabs() {
    $('.nav-link').click(function() {
        $('.nav-link').removeClass('active');
        $(this).addClass('active');

        // Get the filter value from the clicked tab
        var filterValue = $(this).attr('data-filter');

        // Hide all cards
        $('.card').hide();

        // If the filter value is '*', show all cards
        if (filterValue === '*') {
            $('.card').show();
        } else {
            // Otherwise, show only the cards with the corresponding class
            $('.card.' + filterValue).show();
        }
    });
}

$(document).ready(function() {
    manageTabs();

    // Update every 10 seconds
    setInterval(function() {
        updateOrders();
        updateTimes();
    }, 1000);
});