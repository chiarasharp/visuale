// require includes the packages that were installed with npm
var path = require('path');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');

/* =========== */
/* GLOBAL VARS */
/* =========== */
global.rootDir = __dirname;
global.filesDir = global.rootDir + '/client/data'; // path to where the files are stored on disk
global.supExt = ['.rdf', '.xml'];
global.startDate = null;
global.port = 8000;

const DataFile = require(global.rootDir + '/scripts/parsing.js');

/* ============== */
/* EXPRESS CONFIG */
/* ============== */
var app = express();
app.use('/', express.static(global.rootDir + '/client'));

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

// other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.enable('trust proxy');


app.post('/upload', (req, res) => {
    console.log(`Uploading files...`);
    let data = []; 

    try {
        
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded.'
            });
        } else if (Object.keys(req.files).length < 2) {
            let unfile = req.files.files;
            let fileExt = path.extname(unfile.name);
              
            // check that the file's format is supported by the program
            isSupported = false;
            global.supExt.forEach((ext) => {
                if(fileExt == ext) {
                    isSupported = true;
                }
            });
            if (!isSupported) {
                res.send({
                    status: false,
                    message: 'Extension ' + fileExt + ' not supported.'
                });
            }
              
            // move uploaded files to files directory
            unfile.mv('./client/data/' + unfile.name);

            data.push({
                name: unfile.name,
                mimetype: unfile.mimetype,
                size: unfile.size
            });
            res.send({
                status: true,
                message: 'File is uploaded.',
                data: data
            });

        }
        else {   
            // loop all files
            _.forEach(_.keysIn(req.files.files), (key) => {
                let unfile = req.files.files[key];
                let fileExt = path.extname(unfile.name);
              
                // check that the file's format is supported by the program
                isSupported = false;
                global.supExt.forEach((ext) => {
                    if(fileExt == ext) {
                        isSupported = true;
                    }
                });
                if (!isSupported) {
                    res.send({
                        status: false,
                        message: 'Extension ' + fileExt + ' not supported.'
                    });
                }
              
                // move uploaded files to files directory
                unfile.mv('./client/data/' + unfile.name);

                data.push({
                    name: unfile.name,
                    mimetype: unfile.mimetype,
                    size: unfile.size
                });
            });
  
            res.send({
                status: true,
                message: 'Files are uploaded.',
                data: data
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/pull', function(req, res) {
	console.log(`Pulling uploaded files...`);
	
	try {
        const files = fs.readdirSync(global.filesDir);
        const dataFiles = [];

        if(files.size == 0) {
            res.send({
                status: false,
                message: "No files to pull."
            });
        }

        files.forEach(function(file) {
            filePath = path.join(global.filesDir, file);
            fileContent = fs.readFileSync(filePath, 'utf-8');
            fileFormat = path.extname(filePath);
            
            dataFile = new DataFile(file, fileContent, fileFormat);
            dataFiles.push(dataFile);
        });
        
        // Import and parse the data for each ODM instance
        for (let i = 0; i < dataFiles.length; i++) {
            dataFiles[i].parseFile();
        }

        res.send({
            status: true,
            fileNames: files,
            parsedData: dataFiles
        })
	}
	catch(e) {
		res.status(500).send(e);
	}
});

app.post('/query-and-parse', function(req, res) {
	console.log(`Making query and parsing the result...`);
	
	try {
        const filePath = path.join(global.filesDir, req.body.fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileFormat = path.extname(filePath);
        
        const dataFile = new DataFile(req.body.fileName, fileContent, fileFormat);
        
        // perform query on file
        dataFile.queryFile(req.body.query, req.body.queryLang);
        const resQuery = dataFile.queryResult;

        if (resQuery == null) {
            res.send({
                status: false,
                error: "Invalid query or an error occurred during execution of it."
            })
        }

        // parse result of query
        const parsedQuery = new DataFile(req.body.queryLang + "query" + req.body.numQuery, resQuery, fileFormat);
        parsedQuery.parseFile();

       /*// TODO delete later
        fs.writeFile("query.json", JSON.stringify(parsedQuery, null, 2),(err) => {
            if (err) throw err;
            console.log('Results of the query written to file.');
        });*/
        
        res.send({
            status: true,
            parsedQuery: parsedQuery
        })
	}
	catch(e) {
		res.send({
            status: false,
            error: e.message
        });
	}
});

app.post('/query', function(req, res) {
	console.log(`Making query...`);
	
	try {
        const filePath = path.join(global.filesDir, req.body.fileName);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const fileFormat = path.extname(filePath);
        
        const dataFile = new DataFile(req.body.fileName, fileContent, fileFormat);
        
        // perform query on file
        dataFile.queryFile(req.body.query, req.body.queryLang);
        const resQuery = dataFile.queryResult;

        if (resQuery == null) {
            res.send({
                status: false,
                error: "Invalid query or an error occurred during execution of it."
            })
        }

        const result = {
            queryName: req.body.queryLang + "query" + req.body.numQuery,
            queryFormat: fileFormat,
            queryResult: resQuery
        }
        
        res.send({
            status: true,
            queryResult: result
        })
	}
	catch(e) {
		res.send({
            status: false,
            error: e.message
        });
	}
});

app.post('/queries', function(req, res) {
	console.log(`Making query...`);
	
	try {
        const files = fs.readdirSync(global.filesDir);
        const dataFiles = [];
        const queriesRes = [];

        if(files.size == 0) {
            res.send({
                status: false,
                message: "No files to query."
            });
        }

        files.forEach(function(file) {
            filePath = path.join(global.filesDir, file);
            fileContent = fs.readFileSync(filePath, 'utf-8');
            fileFormat = path.extname(filePath);
            
            dataFile = new DataFile(file, fileContent, fileFormat);
            dataFiles.push(dataFile);
        });

        dataFiles.forEach(function(dataFile) {
            dataFile.queryFile(req.body.query0, req.body.queryLang);
            const resQuery0 = dataFile.queryResult;
            dataFile.queryFile(req.body.query1, req.body.queryLang);
            const resQuery1 = dataFile.queryResult;

            if (resQuery0 == null || resQuery1 == null) {
                res.send({
                    status: false,
                    error: "Invalid query or an error occurred during execution of it."
                })
            }

            const result = [
                {
                    fileName: dataFile.fileName,
                    queryNum: 0,
                    queryName: req.body.queryLang + "query" + req.body.numQuery,
                    queryFormat: fileFormat,
                    queryResult: resQuery0
                },
                {
                    fileName: dataFile.fileName,
                    queryNum: 1,
                    queryName: req.body.queryLang + "query" + req.body.numQuery+1,
                    queryFormat: fileFormat,
                    queryResult: resQuery1
                }
            ]
                
            result.forEach(function(res) {
                queriesRes.push(res);
            })

        })
        
        
        res.send({
            status: true,
            queriesResult: queriesRes
        })
	}
	catch(e) {
		res.send({
            status: false,
            error: e.message
        });
	}
});

/* TODO delete later 
const dir = global.rootDir + '/client/data';
const files = fs.readdirSync(dir);
const dataFiles = [];

files.forEach(function(file) {
    filePath = path.join(dir, file);
    fileContent = fs.readFileSync(filePath, 'utf-8');
    fileFormat = path.extname(filePath);

    dataFile = new DataFile(file, fileContent, fileFormat);
    dataFiles.push(dataFile);
});

// Import and parse the data for each ODM instance
for (let i = 0; i < dataFiles.length; i++) {
    dataFiles[i].parseFile();
}

// Use the ODM instances to access and query the data
fs.writeFile("prova.json", JSON.stringify(dataFiles, null, 2),(err) => {
    if (err) throw err;
    console.log('Results written to file');
});*/


/* ==================== */
/* ACTIVATE NODE SERVER */
/* ==================== */
app.listen(global.port, function() {
    global.startDate = new Date(); 
    console.log(`App is listening on port ${global.port} started ${global.startDate.toLocaleString()}.`);
});