// require includes the packages that were installed with npm
var path = require('path');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
//const morgan = require('morgan');
const _ = require('lodash');

/* =========== */
/* GLOBAL VARS */
/* =========== */
global.rootDir = __dirname;
global.collectionsDir = global.rootDir + '/data';
global.testCollDir = global.collectionsDir + '/data-test/';
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
app.use(fileUpload({
    createParentPath: true
})); */

// OTHER MIDDLEWARE
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(morgan('dev'));
app.enable('trust proxy');

app.get('/pull-parse', function (req, res) {
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
                const jsonString = JSON.stringify(fileCollection);
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
            //parsedData: collectionsFiles
        })
    }
    catch (e) {
        res.status(500).send(e);
    }
});

app.post('/query', function (req, res) {
    console.log(`Making n queries on all the documents...`);

    try {
        const queriesRes = [];
        const json = JSON.parse(fs.readFileSync(global.jsonDir + 'data-one-collection.json'));
        const fileCollection = new FileCollection('data-one');

        fileCollection.constructFromJson(json);

        fileCollection.collFiles.forEach(function (dataFile) {
            var results = [];

            req.body.queries.forEach((query) => {
                dataFile.queryFile(query, req.body.queryLang);
                const resQuery = dataFile.fileQueries.at(-1);

                if (resQuery == null) {
                    res.send({
                        status: false,
                        error: "Invalid query or an error occurred during execution of it."
                    })
                }

                results.push(resQuery);
            });

            results.forEach(function (res) {
                queriesRes.push(res);
            });

        })

        // updating the json
        const jsonString = JSON.stringify(fileCollection);
        fs.writeFile(global.jsonDir + 'data-test-collection.json', jsonString, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Objects saved to file.');
            }
        });

        res.send({
            status: true,
            queriesResult: queriesRes
        })
    }
    catch (e) {
        res.send({
            status: false,
            error: e.message
        });
    }
});

app.post('/queries', function (req, res) {
    console.log(`Making n queries on all the documents...`);

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
});

/* ==================== */
/* ACTIVATE NODE SERVER */
/* ==================== */
app.listen(global.port, function () {
    global.startDate = new Date();
    console.log(`App is listening on port ${global.port} started ${global.startDate.toLocaleString()}.`);
});