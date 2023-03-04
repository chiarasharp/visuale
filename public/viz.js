
function buildChart(viz) {
    var chartData = viz.chartData;
    var chartLabel = viz.title;
    var ctx = document.getElementById('chart-container').getContext('2d');
    const keys = Object.keys(chartData);
    const values = Object.values(chartData);
    
    const options = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        }
    }

    const chartObj = {
        type: 'bar',
        data: {
            labels: keys,
            datasets: [{
                label: chartLabel,
                data: values,
                backgroundColor: 'rgba( 8, 61, 119, 1)',
                fill: false,
            }]
        },
        options: options
    };
  
    
    var myChart = new Chart(ctx, chartObj);
  
    $('#viz-title').text(chartLabel);
}
  