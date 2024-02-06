$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams.get('yearMonth'));

    const $monthlyChartContainer = $("#dailyChartContainer");
    const $exportButton = $("#exportButton");

    /* On export button press */
    $exportButton.on("click", function() {

        const yearMonth = {
            yearMonth: urlParams.get('yearMonth')
        };
        console.log(yearMonth)
        $.post("/api/admin/getDailySalesCSV", yearMonth).then(function(data) {
            console.log(data);
            // Download the CSV file
            const blob = new Blob([data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sales.csv'; // or any other filename you want
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    });

    // Get yearMonth from the URL query
    const yearMonth = {
        yearMonth: urlParams.get('yearMonth')
    };


    // Get monthly data and plotly chart
    $.post("/api/admin/getDailyChart", yearMonth).then(function(data) {
        const monthlyData = data;
        const monthlyDates = monthlyData.map(d => d.day);
        const monthlyPrices = monthlyData.map(d => d.profit);
        const monthlyChart = [{
            x: monthlyDates,
            y: monthlyPrices,
            type: "scatter",
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