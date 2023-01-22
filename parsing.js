const rdflib = require('rdflib');
const DOMParser = require('xmldom').DOMParser;

function findUriRDFXML(rdfText) {
  const match = rdfText.match(/xmlns:(\w+)="(.*?)"/);
  if(match) {
      return match[2];
  }
  return null;
}

/*const queryXML = (query, fileContent) => {
  const resQuery = "";
  try {
    const baseXSession = basex.Session();
    const dom = new JSDOM(fileContent);
    //const document = dom.window.document;
    const docString = dom.serialize();
    //const resQuery = xpath.select(query, document);
  

    baseXSession.execute("xquery", query, { input : docString }, (error, result) => {
      if(error){
        resQuery = null;
        console.log("Invalid query or an error occurred during execution", error);
      }
      else{
        resQuery = result.result;
        console.log(result.result)
      }
      baseXSession.close();
    });
  } catch (e) {
    console.log(e);
  }

  return resQuery;
}*/

// Define a function to import XML data
const importXML = fileContent => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fileContent, 'application/xml');
  const root = doc.documentElement;

  const data = {
    namespaces: "",
    namespacePrefixes: "",
    elements: [],
    queryData: [],
  };

  const elements = root.getElementsByTagName('*');
  const elementsArray = Array.from(elements);

  if (elements[0].namespaceURI) {
    data.namespaces = elements[0].namespaceURI;
  }

  if (elements[0].prefix) {
    data.namespacePrefixes = elements[0].prefix;
  }

  for (const element of elementsArray) {
      
    const elementData = {
      tagName: element.tagName,
      attributes: {},
      textContent: ""
    };

    const attributes = element.attributes;
    const attributesArray = Array.from(attributes);

    for (const attribute of attributesArray) {
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

// Define an ODM class to represent the file
class DataFile {
  
  constructor(fileName, fileContent, fileFormat) {
    this.fileName = fileName;
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
    }
    
  }

  async queryFile(query) {
    switch (this.fileFormat) {
      case '.xml':
        return queryXML(query, this.fileContent);
    }
  }
}

module.exports = DataFile