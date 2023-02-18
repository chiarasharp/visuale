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
        let datasetDir = fs.readdirSync(global.collectionsDir);
        let collectionsFiles = [];
        let collectionsFilesNames = [];

        datasetDir.forEach(pathDir => {

            const fullPath = path.join(global.collectionsDir, pathDir);
            if (!(fs.statSync(fullPath).isFile())) {
                const coll = fs.readdirSync(fullPath);
                const fileCollection = new FileCollection(pathDir);

                if (coll.size == 0) {
                    res.send({
                        status: false,
                        message: "No files to pull."
                    });
                }

                coll.forEach(function (file) {
                    filePath = path.join(fullPath, file);
                    fileContent = fs.readFileSync(filePath, 'utf-8');
                    fileFormat = path.extname(filePath);

                    const dataFile = new DataFile(file, fileContent, fileFormat);
                    dataFile.parseFile();
                    fileCollection.pushDataFile(dataFile);
                });

                // saving the parsed data of the collection in a json file
                const jsonString = JSON.stringify(fileCollection);
                fs.writeFile(global.jsonDir + pathDir + '-collection.json', jsonString, (err) => {
                    if (err) {
                        console.error('Error writing file:', err);
                    } else {
                        console.log('File of objects created.');
                    }
                });

                collectionsFiles.push(fileCollection.collFiles);
                collectionsFilesNames.push(coll);
            }
        });

        res.send({
            status: true,
            fileNames: collectionsFilesNames,
            parsedData: collectionsFiles
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
        const json = JSON.parse(fs.readFileSync(global.jsonDir + 'data-test-collection.json'));
        const fileCollection = new FileCollection('data-test');

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
        var queriesRes = [];
        var json;
        var fileCollection;

        switch (req.body.queriesTag) {
            case 'tag1':
                json = JSON.parse(fs.readFileSync(global.jsonDir + 'data-one-collection.json'));
                fileCollection = new FileCollection('data-one');
                break;
            case 'tag2':
                json = JSON.parse(fs.readFileSync(global.jsonDir + 'data-two-collection.json'));
                fileCollection = new FileCollection('data-two');
                break;
        }

        fileCollection.constructFromJson(json);

        fileCollection.collFiles.forEach(function (dataFile) {
            var queriesResTag = {
                tag: req.body.queriesTag,
                queriesResult: [] // array of queries
            };

            dataFile.queriesFile(req.body.queries, req.body.queryLang);
            const resQueries = dataFile.fileQueries.at(-1); // array of queries

            resQueries.forEach(resQuery => {
                if (resQuery == null) {
                    res.send({
                        status: false,
                        error: "Invalid query or an error occurred during execution of it."
                    })
                }
            });

            queriesResTag.queriesResult = resQueries;
            queriesRes.push(queriesResTag);
        })

        // updating the json
        const jsonString = JSON.stringify(fileCollection);
        fs.writeFile(global.jsonDir + 'data-test-collection.json', jsonString, (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('File of objects updated.');
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

/* ==================== */
/* ACTIVATE NODE SERVER */
/* ==================== */
app.listen(global.port, function () {
    global.startDate = new Date();
    console.log(`App is listening on port ${global.port} started ${global.startDate.toLocaleString()}.`);
});