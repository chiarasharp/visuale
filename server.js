// require includes the packages that were installed with npm
var path = require('path');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');

global.rootDir = __dirname;
global.filesDir = global.rootDir + '/files'; // path to where the files are stored on disk
global.supExt = ['.rdf', '.xml'];
global.startDate = null;

const DataFile = require(global.rootDir + '/scripts/parsing.js');

PORT = 8000;

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
            unfile.mv('./files/' + unfile.name);

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
                unfile.mv('./files/' + unfile.name);
                
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

        // parse result of query
        const parsedQuery = new DataFile(req.body.queryLang + "query" + req.body.numQuery, resQuery, fileFormat);
        parsedQuery.parseFile();

        /* TODO delete later
        fs.writeFile("query.json", JSON.stringify(parsedQuery, null, 2),(err) => {
            if (err) throw err;
            console.log('Results of the query written to file.');
        });*/
        
        res.send({
            status: true,
            resQuery: resQuery,
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

/* TODO delete later 
const dir = global.rootDir + '/files';
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
app.listen(PORT, function() {
    global.startDate = new Date(); 
    console.log(`App is listening on port ${PORT} started ${global.startDate.toLocaleString()}.`);
});