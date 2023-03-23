function build_chart_page(viz) {
    var chart_data = viz.chart_data;
    var chart_label = viz.title;
    var chart_type = viz.chart_type;
    var ctx = document.getElementById('canvas-viz').getContext('2d');
    const keys = Object.keys(chart_data);
    const values = Object.values(chart_data);
    
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

    const chart_obj = {
        type: chart_type,
        data: {
            labels: keys,
            datasets: [{
                label: chart_label,
                data: values,
                backgroundColor: 'rgba( 8, 61, 119, 1)',
                fill: false,
            }]
        },
        options: options
    };
  
    
    var my_chart = new Chart(ctx, chart_obj);
  
    $('.viz-title').text(chart_label);
    $("#viz-description").html(viz.description);

    var queries_list = $('#queries-list');
    var query_items = "";

    queries_list.html("");
    
    viz.queries_by_ds.forEach((queries_ds) => {
        query_items += `<div class="ui list">`;
        queries_ds.queries_text.forEach((query)=> {
            var query_item = `
            <div class="item">
                <div class="content">
                    <div class="ui raised segment">
                        <div class="ui top left attached label">${queries_ds.query_language}</div>
                        <p><i>${query}</i></p>
                    </div>
                </div>
            </div>`;
            query_items += query_item;
        });
        query_items += `</div>`;
        queries_list.append(`<div class="item">
                                <div class="content">
                                    <div class="ui segment">
                                        <p class="ui sub header"><i>Dataset ${queries_ds.ds}</i></p>`+
                                        query_items +
                                `   </div>
                                </div>
                            </div>`);
        query_items = "";
    });
}
  