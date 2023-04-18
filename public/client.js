global = {
    vizualizations: [],
    file_names: []
}

const is_object_empty = (object_name) => {
    return Object.keys(object_name).length === 0
  }


$(document).ready(function () {

    load_data();
    load_viz_data().then(function () {
        
        /*
        load_viz_grid();
        
        
        const buttonsMakeChart = document.querySelectorAll('.make-chart');
        buttonsMakeChart.forEach(button => {

            button.addEventListener('click', () => {
                const id = button.dataset.id;
                button.style.display = "none";


                var showMore = document.querySelectorAll('.show-more[data-id="' + id + '"]');
                for (var i = 0; i < showMore.length; i++) {
                    showMore[i].style.display = "block";
                }
                
                create_viz_chart_from_queries(parseInt(id), global.vizualizations[id].queries_by_ds);
                //loadVizQueriesResults(parseInt(id), global.vizualizations[id].queries_by_ds);
            });

        });
        */

        // loading chart data with viz.json
        load_viz_grid_chart_data();

        const buttons_showmore = document.querySelectorAll('button.show-more');
        buttons_showmore.forEach(button => {
            button.addEventListener('click', () => {
                const viz_tag = button.dataset.id;
                //save_chart_data(viz_tag, global.vizualizations[viz_tag].chart_data, global.vizualizations[viz_tag].chart_type);
                load_viz_page(viz_tag);
            });
        })

    });

})

function load_data() {
    return $.ajax({
        url: 'pull-parse-data',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.file_names = data.file_names;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function load_viz_data() {
    return $.ajax({
        url: 'pull-viz',
        type: 'GET',
        contentType: "application/json",

        success: function (data) {
            global.vizualizations = data.vizualizations;
        },
        error: function (error) {
            alert(error);
        }
    });
}

function load_viz_grid() {
    var viz_grid = $('#chartsGrid');
    viz_grid.html("");

    global.vizualizations.forEach((viz) => {

        viz_grid.append(
            `
            <div class="column">
                <div class="ui link card">
                    <button class="ui button make-chart" data-id="${viz.tag}">Make Chart</button>
                    <div class="content">
                        <div class="header show-more" data-id="${viz.tag}" style="display: none;">${viz.title}</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="canvas${viz.tag}"></canvas>
                    </div>
                    <div class="extra content">
                        <span class="show-more" data-id="${viz.tag}" style="display: none;">${viz.description}</span>
                    </div>
                    <div class="extra content">
                        <button class="ui button show-more" data-id="${viz.tag}" style="display: none;">Show more</button>
                    </div>
                </div>
            </div>`
        );

    });
}

function load_viz_grid_chart_data() {
    var viz_grid = $('#chartsGrid');
    viz_grid.html("");

    global.vizualizations.forEach((viz) => {
        viz_grid.append(
            `
            <div class="column">
                <div class="ui link card">
                    <div class="content">
                        <div class="header show-more" data-id="${viz.tag}">${viz.title}</div>
                    </div>
                    <div class="chart-container">
                        <canvas id="canvas${viz.tag}"></canvas>
                    </div>
                    <div class="extra content">
                        <span class="show-more" data-id="${viz.tag}">${viz.description}</span>
                    </div>
                    <div class="extra content">
                        <button class="ui button show-more" data-id="${viz.tag}">Show more</button>
                    </div>
                </div>
            </div>`
        );
        create_chart(viz.tag, viz.title, viz.chart_data, viz.chart_type);
    });
   
}

function load_viz_page(viz_tag) {
    return $.ajax({
        url: '/viz/' + viz_tag,
        type: 'GET',
        success: function (data) {
            // handle successful response
            window.location.href = '/viz/' + viz_tag;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // handle error
            console.log("Error:", textStatus, errorThrown);
        }
    });
}

function create_viz_chart_from_queries(viz_tag, viz_queries_by_ds) {

    if(!is_object_empty(global.vizualizations[viz_tag].chart_data)) {
        create_bar_chart(viz_tag, global.vizualizations[viz_tag].title, global.vizualizations[viz_tag].chart_data, global.vizualizations[viz_tag].chart_type);
    }
    else {
        switch (viz_tag) {
            case 0: /* NUMBER OF ARTICLES BY YEAR, ONE DATASET, TWO XPATH QUERIES */
                var count_art_by_year = {};

                load_queries_by_ds(viz_tag, viz_queries_by_ds).then(function () {
    
                    global.vizualizations[viz_tag].queries_by_ds[0].queries.forEach(query_file => {
                        const query_art = query_file[0].query_res;
                        const query_date = query_file[1].query_res;
                        const query_year = new Date(query_date).getFullYear();
    
                        if (count_art_by_year.hasOwnProperty(query_year)) {
                            count_art_by_year[query_year] = count_art_by_year[query_year] + query_art;
                        }
                        else {
                            count_art_by_year[query_year] = query_art;
                        }
                    })

                    global.vizualizations[tag].chart_data = count_art_by_year;
                    global.vizualizations[tag].chart_type = "bar";
                    create_chart(viz_tag, global.vizualizations[viz_tag].title, count_art_by_year, "bar");
                });

                break;
            case 1: /* NUMBER OF REFERENCES BY YEAR, TWO DATASETS, ONE XPATH QUERY FOR DS */
                var count_ref_by_year = {};
    
                load_queries_by_ds(viz_tag, viz_queries_by_ds).then(function () {
                    const tagResultQueriesDs0 = global.vizualizations[viz_tag].queries_by_ds[0];
                    const tagResultQueriesDs1 = global.vizualizations[viz_tag].queries_by_ds[1];
    
                    tagResultQueriesDs0.queries.forEach((query_file, index) => {
                        const query_ref = query_file[0].query_res;
                        const query_date = tagResultQueriesDs1.queries[index][0].query_res;
                        const query_year = new Date(query_date).getFullYear();
    
                        if (count_ref_by_year.hasOwnProperty(query_year)) {
                            count_ref_by_year[query_year] = count_ref_by_year[query_year] + query_ref;
                        }
                        else {
                            count_ref_by_year[query_year] = query_ref;
                        }
                    })

                    global.vizualizations[tag].chart_data = count_ref_by_year;
                    global.vizualizations[tag].chart_type = "bar";
                    create_chart(viz_tag, global.vizualizations[viz_tag].title, count_ref_by_year, "bar");
                });
                break;
            case 2: /* NUMBER OF REFERENCES BY YEAR, ONE DATASET, TWO XQUERY QUERIES */
                var count_ref_by_year = {};

                load_queries_by_ds(viz_tag, viz_queries_by_ds).then(function () {
                    
                    // GROUPING THE RESULTS OF THE REFERENCES BY THE RESULTS OF THE YEARS
                    global.vizualizations[viz_tag].queries_by_ds[0].queries.forEach(query_file => {
                        const query_ref = query_file[0].query_res;
                        const query_date = query_file[1].query_res;
                        const query_year = new Date(query_date).getFullYear();
    
                        if (count_ref_by_year.hasOwnProperty(query_year)) {
                            count_ref_by_year[query_year] = count_ref_by_year[query_year] + query_ref;
                        }
                        else {
                            count_ref_by_year[query_year] = query_ref;
                        }
                    })
                    global.vizualizations[tag].chart_data = count_ref_by_year;
                    global.vizualizations[tag].chart_type = "bar";
                    create_chart(viz_tag, global.vizualizations[viz_tag].title, count_ref_by_year, "bar");
                });
                break;
        }
        
    }

}

function load_queries_by_ds(viz_tag, queries_by_datasets) {
    return query_by_ds(viz_tag, queries_by_datasets);
}

function query_by_ds(viz_tag, queries_by_datasets) {
    return $.ajax({
        url: 'queries',
        type: 'POST',
        data: {
            queries_by_datasets: queries_by_datasets,
            viz_tag: viz_tag
        },

        success: function (data) {
            data.results_queries.forEach(ds_queries => {
                global.vizualizations[viz_tag].queries_by_ds[ds_queries.ds].queries = ds_queries.queries;
            })
        },
        error: function (error) {
            alert(error);
        }
    });
}

function create_chart(viz_tag, viz_label, viz_chart_data, viz_type) {
    var chart_name = 'canvas' + viz_tag;
    var context = document.getElementById(chart_name).getContext('2d');
    const keys = Object.keys(viz_chart_data);
    const values = Object.values(viz_chart_data);

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
        type: viz_type,
        data: {
            labels: keys,
            datasets: [{
                label: viz_label,
                data: values,
                backgroundColor: 'rgba( 8, 61, 119, 1)',
                fill: false,
            }]
        },
        options: options
    };


    var chart = new Chart(context, chart_obj);
}

function save_chart_data(viz_tag, chart_type, chart_data) {
    return $.ajax({
        url: '/save-chart-data',
        type: 'POST',
        data: {
            viz_tag: viz_tag,
            chart_type: chart_type,
            chart_data: chart_data
        },

        success: function (data) {
            console.log("Chart data saved.");
        },
        error: function (error) {
            console.log("Error saving chart data.");
        }
    });
}