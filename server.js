// require includes the packages that were installed with npm
var path = require('path');
const fs = require('fs');
const express = require('express');

const cors = require('cors');
const bodyParser = require('body-parser');
//const morgan = require('morgan');
const _ = require('lodash');

/* =========== */
/* GLOBAL VARS */
/* =========== */
global.rootDir = __dirname;
global.collectionsDir = global.rootDir + '/data/collections-data/';
global.vizualizationsDir = global.rootDir + '/data/viz-data';
global.jsonDir = global.rootDir + '/json/';

global.supExt = ['.rdf', '.xml'];
global.startDate = null;
global.port = 8000;

const { DataFile, FileCollection } = require(global.rootDir + '/scripts/parsing.js');

/* ============== */
/* EXPRESS CONFIG */
/* ============== */
var app = express();
app.use('/', express.static(global.rootDir + '/client'));

/* // ENABLE FILE UPLOAD
const fileUpload = require('express-fileupload');
app.use(fileUpload({
    createParentPath: true
})); 
//app.use(morgan('dev'));
*/

// OTHER MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.enable('trust proxy');

app.get('/pull-parse-data', function (req, res) {
    console.log(`Pulling files from all the collections and parsing them...`);

    try {
        // parse the directory of collections of files
        let datasetDir = fs.readdirSync(global.collectionsDir);

        //let collectionsFiles = [];
        let collectionsFilesNames = [];

        var countDir = 0;
        
        // cycle ds directory
        datasetDir.forEach(pathDir => {
            
            // get current sub directory
            const fullPath = path.join(global.collectionsDir, pathDir);
            
            // check if it's a directory
            if (!(fs.statSync(fullPath).isFile())) {

                // parse the directory to get files
                const coll = fs.readdirSync(fullPath);
                // creating file collection object
                const fileCollection = new FileCollection(countDir);
                
                // parsing the collection of files
                coll.forEach(function (file) {
                    filePath = path.join(fullPath, file);
                    fileContent = fs.readFileSync(filePath, 'utf-8');
                    fileFormat = path.extname(filePath);

                    const dataFile = new DataFile(file, fileContent, fileFormat);
                    dataFile.parseFile();
                    fileCollection.pushDataFile(dataFile);
                });

                // saving all the data about the collection in a json file
                const jsonString = JSON.stringify(fileCollection, null, "\t");
                fs.writeFile(global.jsonDir + pathDir + ".json", jsonString, (err) => {
                    if (err) {
                        console.error('Error writing ' + pathDir + ".json" + ' file:', err);
                    } else {
                        console.log('File ' + pathDir + ".json" + ' of objects created.');
                    }
                });

                //collectionsFiles.push(fileCollection.collFiles); //TODO: rivedere meglio cosa ha senso avere nel client
                collectionsFilesNames.push(coll);

                countDir++;
            }
        });

        res.send({
            status: true,
            fileNames: collectionsFilesNames
        })
    }
    catch (e) {
        res.status(500).send(e);
    }
});

app.get('/pull-viz', function (req, res) {
    console.log(`Pulling visualization data...`);

    try {
        
        let vizualizations = JSON.parse(fs.readFileSync(global.vizualizationsDir + "/viz.json"));

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

    const chartData = req.body.chartData;
    let vizualizations = JSON.parse(fs.readFileSync(global.vizualizationsDir + "/viz.json"));
    vizualizations[req.body.tag].chart = chartData;
  
    fs.writeFile(global.vizualizationsDir + "/viz.json", JSON.stringify(vizualizations, null, "\t"), err => {
      if (err) {
        console.error(err);
        console.log('Error saving chart data.');
      } else {
        console.log('Chart data saved to viz.json.');
      }
    });
});


/* app.post('/queries-single', function (req, res) {
    console.log(`Executing ${req.body.queries.length} queries on collection ${req.body.queriesDs}...`);

    try {
        var queriesResColl = []; // matrix of all the queries results for each file

        // getting the json of the directory to query and parsing it
        let dir = fs.readdirSync(global.jsonDir)[req.body.queriesDs];
        let json = JSON.parse(fs.readFileSync(global.jsonDir + dir));

        let fileCollection = new FileCollection(req.body.queriesDs);
        fileCollection.constructFromJson(json);

        // querying all the files of the collection
        fileCollection.collFiles.forEach(function (dataFile) {
            var queriesResFile = []; // array of all the queries results for the current dataFile

            // making the queries on the file
            dataFile.queriesFile(req.body.queries, req.body.queryLang);
            queriesResFile = dataFile.fileQueries.at(-1); // array of queries

            // checking that the queries went well
            queriesResFile.forEach(resQuery => {
                if (resQuery == null) {
                    res.send({
                        status: false,
                        error: "Invalid query or an error occurred during execution of it."
                    })
                }
            });

            // pushing the array of query res in the queries result matrix
            queriesResColl.push(queriesResFile);
        })

        // updating the json
        const jsonString = JSON.stringify(fileCollection);
        fs.writeFile(global.jsonDir + dir, jsonString, (err) => {
            if (err) {
                console.error('Error writing ' + dir + ' file:', err);
            } else {
                console.log('File ' + dir + ' of objects updated.');
            }
        });

        res.send({
            status: true,
            queriesResColl: queriesResColl
        })
    }
    catch (e) {
        res.send({
            status: false,
            error: e.message
        });
    }
}); */

app.post('/queries', function (req, res) {
    console.log(`Executing queries on some of the collections of files...`);

    try {
        let vizualizations = JSON.parse(fs.readFileSync(global.vizualizationsDir + "/viz.json"));
        const queries_by_ds = req.body.queriesByDs;
        var results_colls = [];
        
        queries_by_ds.forEach((queries_ds, index) => {
            var results_ds = {
                ds : queries_ds.ds,
                queries : []
            }

            let ds_dir = fs.readdirSync(global.jsonDir)[queries_ds.ds];
            let ds_json = JSON.parse(fs.readFileSync(global.jsonDir + ds_dir));
            let ds_filecoll = new FileCollection(queries_ds.ds);

            ds_filecoll.constructFromJson(ds_json);

            ds_filecoll.collFiles.forEach((file) => {
                var results_file = [];

                file.queriesFile(queries_ds.queriesText, queries_ds.queryLanguage);
                results_file = file.fileQueries.at(-1);

                results_file.forEach(result => {
                    if (result == null) {
                        res.send({
                            status: false,
                            error: "Invalid query or an error occurred during execution of it."
                        })
                    }
                });
    
                results_ds.queries.push(results_file);
                
                vizualizations[req.body.tag].queriesByDs[queries_ds.ds].queries = results_ds.queries; 
            })
            
            const jsonString = JSON.stringify(ds_filecoll, null, "\t");
            fs.writeFile(global.jsonDir + ds_dir, jsonString, (err) => {
                if (err) {
                    console.error('Error writing ' + ds_dir + ' file:', err);
                } else {
                    console.log('File ' + ds_dir + ' of objects updated.');
                }
            });

            const jsonViz = JSON.stringify(vizualizations, null, "\t");
            fs.writeFile(global.vizualizationsDir + "/viz.json", jsonViz, (err) => {
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
            resultsQueries: results_colls
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
    global.startDate = new Date();
    console.log(`App is listening on port ${global.port} started ${global.startDate.toLocaleString()}.`);
});