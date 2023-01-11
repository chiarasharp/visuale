var path = require('path');
const fs = require('fs');
const rdflib = require('rdflib');
const csvparser = require('csv-parser');
const { JSDOM } = require('jsdom');

function findUriRDFXML(rdfText) {
  const match = rdfText.match(/xmlns:(\w+)="(.*?)"/);
  if(match) {
      return match[2];
  }
  return null;
}

  // Define a function to import XML data
const importXML = fileContent => {
    const dom = new JSDOM(fileContent);
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
  };

// Define a function to import RDF data
const importRDFXML = fileContent => {
    const store = rdflib.graph();
    const data = {
      namespaces: {},
      statements: []
    };

    try {
      // Attempt to find the original namespace URI in the file
      const uri = findUriRDFXML(fileContent);
      
      rdflib.parse(fileContent, store, uri, 'application/rdf+xml', (err, stat) => {
        data.statements = stat.statements;
        data.namespaces = stat.namespaces;
      });
  
    } catch (e) {
      console.error(`Error finding original namespace URI: ${e}`)
    }

    return data;
  };

  // Define a function to import CSV data
  /*const importCSV = fileContent => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => data.push(row))
      .on('end', () => {
        return data;
      });
  };*/

// Define an ODM class to represent the file
class DataFile {
  constructor(filePath, fileContent, fileFormat) {
    this.filePath = filePath;
    this.fileContent = fileContent;
    this.fileFormat = fileFormat;
  }

  // Define a method to import and parse the data
  async parseFile() {
    switch (this.fileFormat) {
      case '.xml':
        this.parsedData = importXML(this.fileContent);
        break;
      case '.rdf':
        this.parsedData = importRDFXML(this.fileContent);
        break;
      /*case '.csv':
        this.parsedData = importCSV(this.fileContent);
        break;*/
    }
  }
}


/*
  function getXMLelementByTagName(tagName) {

  }

  function getXMLattributesByTagName(tagName) {

  }

  function getXMLtextContentByTagName(tagName) {

  }

  function countXMLelementsByTagName(tagName) {

  }
*/

module.exports = DataFile