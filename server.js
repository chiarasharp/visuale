// require includes the packages that were installed with npm
var path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
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

app.listen(PORT, () => console.log(`Example app is listening on port ${PORT}.`));