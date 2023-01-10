// require includes the packages that were installed with npm
var path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const fs = require('fs');

const DataFile = require('./parsing.js');
const supExt = ['.rdf', '.xml', '.csv']

PORT = 3000;

// path to where the files are stored on disk
var FILES_DIR = path.join(__dirname, 'files')

// create an express server
var app = express();

app.use('/', express.static(path.join(__dirname, '/client')));

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

// other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));

app.listen(PORT, () => console.log(`Example app is listening on port ${PORT}.`));


app.post('/upload', (req, res) => {
  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {
          let data = []; 
  
          // loop all files
          _.forEach(_.keysIn(req.files.files), (key) => {
              let unfile = req.files.files[key];
              let fileExt = path.extname(unfile.name);

              isSupported = false;
              // check that the file's format is supported by the program
              supExt.forEach((ext) => {
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

              // push file details
              data.push({
                  name: unfile.name,
                  mimetype: unfile.mimetype,
                  size: unfile.size
              });
          });
  
          // return response
          res.send({
              status: true,
              message: 'Files are uploaded',
              data: data
          });
      }
  } catch (err) {
      res.status(500).send(err);
  }
});

app.get('/pull', function(req, res) {
	console.log(`Pull uploaded files`);
	
	try {
		// Read the contents of the files' directory
        const dir = 'files';
        const files = fs.readdirSync(dir);

        if(files.size==0) {
            res.send({
                status: false,
                message: "No files to pull"
            });
        }

        // Iterate over the files in the directory and create an ODM instance for each file
        const dataFiles = files.map(file => {
            filePath = path.join(dir, file);
            fileContent = fs.readFileSync(filePath, 'utf-8');
            fileFormat = path.extname(filePath);
            new DataFile(filePath, fileContent, fileFormat);
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
		res.status(500).send(e.message);
	}
});

// Read the contents of a directory
const dir = 'files';
const files = fs.readdirSync(dir);
const dataFiles = [];

files.forEach(function(file) {
    filePath = path.join(dir, file);
    fileContent = fs.readFileSync(filePath, 'utf-8');
    fileFormat = path.extname(filePath);
    dataFile = new DataFile(filePath, fileContent, fileFormat);
    dataFiles.push(dataFile);
});

// Import and parse the data for each ODM instance
for (let i = 0; i < dataFiles.length; i++) {
    dataFiles[i].parseFile();
}

// Use the ODM instances to access and query the data
//console.log(dataFiles[0].data);
fs.writeFile("prova.json", JSON.stringify(dataFiles, null, 2),(err) => {
    if (err) throw err;
    console.log('Results written to file');
});

