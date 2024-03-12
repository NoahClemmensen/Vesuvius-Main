function redirectToMonth(month) {
    window.location.href = `/panel/admin/days?yearMonth=${month}`;
}

$(document).ready(function() {
    const $monthlyChartContainer = $("#monthlyChartContainer");
    // Get monthly data and plotly chart
    $.ajax({
        url: "/api/admin/getMonthlyChart",
        headers: { 'x-api-key': getCookie('api-key') },
        success: function(data) {
            const monthlyData = data;
            const monthlyDates = monthlyData.map(d => {
                const date = new Date(d.month);
                let string = date.toLocaleString('default', { month: 'long' });
                return string += "-" + date.getFullYear();
            });
            const monthlyPrices = monthlyData.map(d => d.profit);
            const monthlyChart = [{
                x: monthlyDates,
                y: monthlyPrices,
                type: "scatter"
            }];
            const monthlyLayout = {
                title: "Monthly Profit",
                width: 570,
                height: 400,
                xaxis: {
                    title: "Date",
                    autorange: 'reversed' // Reverse the date axis
                },
                yaxis: {
                    title: "Profit"
                },
            };
            Plotly.newPlot($monthlyChartContainer[0], monthlyChart, monthlyLayout);
        }
    });
});