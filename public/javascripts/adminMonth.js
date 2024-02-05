$(document).ready(function() {
    const $monthlyChartContainer = $("#dailyChartContainer");

    // Get yearMonth from the URL query
    const urlParams = new URLSearchParams(window.location.search);
    const yearMonth = {
        yearMonth: urlParams.get('yeahMonth')
    };


    // Get monthly data and plotly chart
    $.post("/api/admin/getDailyChart", yearMonth).then(function(data) {
        const monthlyData = data;
        const monthlyDates = monthlyData.map(d => d.day);
        const monthlyPrices = monthlyData.map(d => d.profit);
        const monthlyChart = [{
            x: monthlyDates,
            y: monthlyPrices,
            type: "bar",
        }];
        const monthlyLayout = {
            title: "Daily Profit",
            xaxis: {
                title: "Day"
            },
            yaxis: {
                title: "Profit"
            },
        };
        Plotly.newPlot($monthlyChartContainer[0], monthlyChart, monthlyLayout);
    });
});