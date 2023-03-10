
function buildChartPage(viz) {
    var chartData = viz.chartData;
    var chartLabel = viz.title;
    var ctx = document.getElementById('canvas-viz').getContext('2d');
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
  
    $('.viz-title').text(chartLabel);
    $("#viz-description").html(viz.description);

    var queriesList = $('#queries-list');
    var queryItems = "";

    queriesList.html("");
    
    viz.queriesByDs.forEach((queriesDs) => {
        queryItems += `<div class="ui list">`;
        queriesDs.queriesText.forEach((query)=> {
            var queryItem = `
            <div class="item">
                <div class="content">
                    <div class="ui raised segment">
                        <div class="ui top left attached label">${queriesDs.queryLanguage}</div>
                        <p>${query}</p>
                    </div>
                </div>
            </div>`;
            queryItems += queryItem;
        });
        queryItems += `</div>`;
        queriesList.append(`<div class="item">
                                <div class="content">
                                    <div class="ui segment">
                                        <p class="ui sub header"><i>Dataset ${queriesDs.ds}</i></p>`+
                                        queryItems +
                                `   </div>
                                </div>
                            </div>`);
    });
}
  