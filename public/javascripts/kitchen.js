function updateTimes() {
    var now = new Date();
    now = now.getTime() - now.getTimezoneOffset()

    $('button.card').each(function() {
        const orderDate = new Date($(this).attr('data-orderdate'));
        const correctedOrderDate = orderDate.getTime() - orderDate.getTimezoneOffset()

        const diffInMinutes = Math.floor((now - correctedOrderDate) / 60000);

        $(this).find('.timer').text("'" + diffInMinutes);
    });
}

async function getOrders() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/getOrders',
            headers: { 'x-api-key': getCookie('api-key') },
            type: 'GET',
            success: function(data) {
                resolve(data);
            },
            error: function(err) {
                reject(err);
            }
        });
    });
}

const orderHtml = `
<button type="button" data-orderdate="<%= order.date %>" data-orderid="<%= order._id %>" data-bs-toggle="modal" data-bs-target="#editOrderModal" class="card mb-4 p-0 <%= order.status_name.toLowerCase().replace(/\\s/g, '') %>" style="width: 250px;">
    <div class="card-header d-flex align-items-center" style="gap: 4px;">
        <h5 class="card-title mb-0 me-auto">Table #<%= order.table_id %></h5>
        <p class="text-muted m-0 timer">
            <%
                const now = new Date();
                const orderDate = new Date(order.date);

                const nowInUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
                const orderDateInUTC = new Date(orderDate.getTime() + orderDate.getTimezoneOffset() * 60000);

                const diffInMinutes = Math.floor((nowInUTC - orderDateInUTC) / 60000);
            %>
            '<%= diffInMinutes %>
        </p>
        <p class="badge
         m-0"><%= order.status_name %></p>
    </div>
    <div class="card-body d-flex flex-column">
        <% order.items.forEach(item => { %>
            <p><%= item.amount %>x <%= item.name %></p>
        <% }) %>
    </div>
    <% if (order.notes) { %>
        <div class="card-footer text-muted">
            <p class="m-0"><%= order.notes %></p>
        </div>
    <% } %>
</button>
`

async function updateOrders() {
    const orders = await getOrders();

    // Clear current orders
    $('button.card').remove();

    // Add new orders
    orders.forEach(order => {
        const orderHtmlCompiled = ejs.render(orderHtml, { order: order });
        $('#orders').append(orderHtmlCompiled);
    });

    // Update times
    updateTimes();
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
        updateTimes()
    }, 30000);
});