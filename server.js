// require includes the packages that were installed with npm
var path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const _ = require('lodash');

/* =========== */
/* GLOBAL VARS */
/* =========== */
global.root_dir = __dirname;
global.collections_dir = global.root_dir + '/data/collections-data/';
global.vizualizations_dir = global.root_dir + '/data/viz-data';
global.json_dir = global.root_dir + '/data/collections-json/';

global.supported_ext = ['.rdf', '.xml'];
global.start_date = null;
global.port = 8000;

const { DataFile, FileCollection } = require(global.root_dir + '/scripts/parsing.js');

/* ============== */
/* EXPRESS CONFIG */
/* ============== */
var app = express();
app.use('/', express.static(global.root_dir + '/public'));
// OTHER MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.enable('trust proxy');

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render('pages/index');
});

app.get('/pull-parse-data', function (req, res) {
    console.log(`Pulling files from all the collections and parsing them...`);

    try {
        // parse the directory of collections of files
        let collections_dir = fs.readdirSync(global.collections_dir);

        //let collectionsFiles = [];
        let collections_filesnames = [];

        var count_dir = 0;

        // cycle ds directory
        collections_dir.forEach(path_dir => {

            // get current sub directory
            const full_path = path.join(global.collections_dir, path_dir);

            // check if it's a directory
            if (!(fs.statSync(full_path).isFile())) {

                // parse the directory to get files
                const collection = fs.readdirSync(full_path);
                // creating file collection object
                const file_collection = new FileCollection(count_dir);

                // parsing the collection of files
                collection.forEach(function (file) {
                    file_path = path.join(full_path, file);
                    file_content = fs.readFileSync(file_path, 'utf-8');
                    file_format = path.extname(file_path);

                    const data_file = new DataFile(file, file_content, file_format);
                    data_file.parse_file();
                    file_collection.push_DataFile(data_file);
                });

                // saving all the data about the collection in a json file
                const json_string = JSON.stringify(file_collection, null, "\t");
                fs.writeFile(global.json_dir + path_dir + ".json", json_string, (err) => {
                    if (err) {
                        console.error('Error writing ' + path_dir + ".json" + ' file:', err);
                    } else {
                        console.log('File ' + path_dir + ".json" + ' of objects created.');
                    }
                });

                //collectionsFiles.push(fileCollection.collFiles); //TODO: rivedere meglio cosa ha senso avere nel client
                collections_filesnames.push(collection);

                count_dir++;
            }
        });

        res.send({
            status: true,
            file_names: collections_filesnames
        })
    }
    catch (e) {
        res.status(500).send(e);
    }
});

app.get('/pull-viz', function (req, res) {
    console.log(`Pulling visualization data...`);

    try {

        let vizualizations = JSON.parse(fs.readFileSync(global.vizualizations_dir + "/viz.json"));

        res.send({
            status: true,
            vizualizations: vizualizations
        })
    }
    catch (e) {
        res.send({
            status: false,
            error: e.message
        });
    }
});

app.post('/save-chart-data', function (req, res) {
    console.log('Saving chart data to viz.json...');

    const chart_data = req.body.chart_data;

    try {
        let json_viz = fs.readFileSync(global.vizualizations_dir + "/viz.json");
        let vizualizations = JSON.parse(json_viz);
        vizualizations[req.body.viz_tag].chart_data = chart_data;

        fs.writeFile(global.vizualizations_dir + "/viz.json", JSON.stringify(vizualizations, null, "\t"), err => {
            if (err) {
                console.error(err);
                console.log('Error saving chart data.');
            } else {
                console.log('Chart data saved to viz.json.');
            }
        });
    }
    catch (e) {
        console.error(e);
        console.log('Error saving chart data.');
    }

});

app.get('/viz/:id', (req, res) => {
    const viz_tag = req.params.id;
    let vizualizations = JSON.parse(fs.readFileSync(global.vizualizations_dir + "/viz.json"));
    var viz_data = vizualizations[viz_tag];

    res.render('pages/viz', { viz: viz_data });
});

app.post('/queries', function (req, res) {
    console.log(`Executing queries on some of the collections of files...`);

    try {
        let vizualizations = JSON.parse(fs.readFileSync(global.vizualizations_dir + "/viz.json"));
        const queries_by_ds = req.body.queries_by_datasets;
        var results_colls = [];

        queries_by_ds.forEach(async (queries_ds) => {
            var results_ds = {
                ds: queries_ds.ds,
                queries: []
            }

            let ds_dir = fs.readdirSync(global.json_dir)[queries_ds.ds];
            let ds_json = JSON.parse(fs.readFileSync(global.json_dir + ds_dir));
            let ds_filecoll = new FileCollection(queries_ds.ds);

            ds_filecoll.constructFromJson(ds_json);

            await new Promise(function (resolve) {
                // parsing the collection of files
                ds_filecoll.coll_files.forEach(async function (file) {
                    parsedFile = await file.parse_file_Saxon();

                    // Resolve the Promise once the loop is done
                    if (ds_filecoll.coll_files.indexOf(file) === ds_filecoll.coll_files.length - 1) {
                        resolve();
                    }
                });
            });

            ds_filecoll.coll_files.forEach((file) => {
                var results_file = [];

                file.queries_file(queries_ds.queries_text, queries_ds.query_language);
                results_file = file.file_queries.at(-1);

                results_file.forEach(result => {
                    if (result == null) {
                        res.send({
                            status: false,
                            error: "Invalid query or an error occurred during execution of it."
                        })
                    }
                });

                results_ds.queries.push(results_file);

                vizualizations[req.body.viz_tag].queries_by_ds[queries_ds.ds].queries = results_ds.queries;
            })

            ds_filecoll.collFiles.forEach((file) => {
                file.fileParsedSaxon = {};
            })

            /* const jsonString = JSON.stringify(ds_filecoll, null, "\t");
            fs.writeFile(global.jsonDir + ds_dir, jsonString, (err) => {
                if (err) {
                    console.error('Error writing ' + ds_dir + ' file:', err);
                } else {
                    console.log('File ' + ds_dir + ' of objects updated.');
                }
            }); */

            const jsonViz = JSON.stringify(vizualizations, null, "\t");
            fs.writeFile(global.vizualizations_dir + "/viz.json", jsonViz, (err) => {
                if (err) {
                    console.error('Error writing viz.json file:', err);
                } else {
                    console.log('File viz.json updated.');
                }
            });

            results_colls.push(results_ds);
        })

        res.send({
            status: true,
            results_queries: results_colls
        })
    }
    catch (e) {
        res.send({
            status: false,
            error: e.message
        });
    }
});

/* ==================== */
/* ACTIVATE NODE SERVER */
/* ==================== */
app.listen(global.port, function () {
    global.start_date = new Date();
    console.log(`App is listening on port ${global.port} started ${global.start_date.toLocaleString()}.`);
});