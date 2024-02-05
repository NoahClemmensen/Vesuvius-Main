function redirectToMonth(month) {
    window.location.href = `/panel/admin/month?yeahMonth=${month}`;
}

$(document).ready(function() {
    const $monthlyChartContainer = $("#monthlyChartContainer");
    // Get monthly data and plotly chart
    $.get("/api/admin/getMonthlyChart", function(data) {
        const monthlyData = data;
        const monthlyDates = monthlyData.map(d => {
            const date = new Date(d.month);
            return date.toLocaleString('default', { month: 'long' });
        });
        const monthlyPrices = monthlyData.map(d => d.profit);
        const monthlyChart = [{
            x: monthlyDates,
            y: monthlyPrices,
            type: "bar"
        }];
        const monthlyLayout = {
            title: "Monthly Profit",
            xaxis: {
                title: "Date",
                autorange: 'reversed' // Reverse the date axis
            },
            yaxis: {
                title: "Profit"
            },
        };
        Plotly.newPlot($monthlyChartContainer[0], monthlyChart, monthlyLayout);
    });
});