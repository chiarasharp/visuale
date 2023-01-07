var path = require('path');
const fs = require('fs');
const rdflib = require('rdflib');
const csvparser = require('csv-parser');
const { JSDOM } = require('jsdom');

// Define a function to import XML data
const importXML = filePath => {
  const xmlString = fs.readFileSync(filePath, 'utf-8');
  const dom = new JSDOM(xmlString);
  const document = dom.window.document;
  const data = {
    namespaces: "",
    namespacePrefixes: "",
    elements: []
  };

  const elements = document.querySelectorAll('*');

  if (elements[0].namespaceURI) {
    data.namespaces = elements[0].namespaceURI;
  }

  if (elements[0].prefix) {
    data.namespacePrefixes = elements[0].prefix;
  }

  for (const element of elements) {
    
    const elementData = {
      tagName: element.tagName,
      attributes: {},
      textContent: ""
    };

    for (const attribute of element.attributes) {
      elementData.attributes[attribute.name] = attribute.value;
    }

    if (element.textContent) {
      elementData.textContent = element.textContent.trim();
    }

    data.elements.push(elementData);
  }

  return data;

  //return jsdom.parseFromString(xmlString, 'application/xml');
};

// Define a function to import RDF data
const importRDF = filePath => {
  const rdfString = fs.readFileSync(filePath, 'utf-8');
  const store = rdflib.graph();
  rdflib.parse(rdfString, store, 'http://example.com/data.rdf', 'text/rdf+xml');
  return store;
};

// Define a function to import CSV data
const importCSV = filePath => {
  const data = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', row => data.push(row))
    .on('end', () => {
      return data;
    });
};

// Define an ODM class to represent a data file
class DataFile {
  constructor(filePath) {
    this.filePath = filePath;
    this.extension = path.extname(filePath);
  }

  // Define a method to import and parse the data
  async import() {
    switch (this.extension) {
      case '.xml':
        this.data = importXML(this.filePath);
        break;
      case '.rdf':
        this.data = importRDF(this.filePath);
        break;
      case '.csv':
        this.data = importCSV(this.filePath);
        break;
    }
  }
}


module.exports = DataFile