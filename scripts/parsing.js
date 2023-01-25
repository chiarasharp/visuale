const rdflib = require('rdflib');
const DOMParser = require('xmldom').DOMParser;
const xpath = require('xpath');

/*
* Auxiliar function that finds the URI inside an RDF/XML file.
*/
function findUriRDFXML(rdfText) {
  const match = rdfText.match(/xmlns:(\w+)="(.*?)"/);
  if(match) {
      return match[2];
  }
  return null;
}

/*
* Querys an XML file with an XPath query.
*/
const queryXMLXPath = (query, fileContent) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fileContent, 'application/xml');
  const root = doc.documentElement; // avoiding xmldom security problem
  
  const res = xpath.select(query, root).toString();

  return res;
}

/*
* Querys an XML file with an XQuery query.
*/
/*const queryXMLXQuery = (query, fileContent) => {
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

/* 
* Parses an XML file.
*/
const parseXML = fileContent => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fileContent, 'application/xml');
  const root = doc.documentElement;

  const data = {
    namespaces: "",
    namespacePrefixes: "",
    elements: [],
    queriesData: [],
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

/* 
* Parses an RDF/XML file.
*/
const parseRDFXML = fileContent => {
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

/* 
* ODM class to represent a generic file. 
*/
class DataFile {
  
  constructor(fileName, fileContent, fileFormat) {
    this.fileName = fileName;
    this.fileContent = fileContent;
    this.fileFormat = fileFormat;
  }

  /*
  * Parsing of the file based on the format.
  */
  async parseFile() {

    switch (this.fileFormat) {
      case '.xml':
        this.parsedData = parseXML(this.fileContent);
        break;
      case '.rdf':
        this.parsedData = parseRDFXML(this.fileContent);
        break;
    }
    
  }

  /*
  * Querying of the file based on the format and the query language.
  */
  async queryFile(query, queryLang) {
    switch (this.fileFormat) {
      case '.xml':
        switch (queryLang) {
          case 'xpath':
            this.queryResult = queryXMLXPath(query, this.fileContent);
            break;
          case 'xquery':
            //return queryXML(query, this.fileContent);
            break;
          default:
            console.error(`Can't perform a ${queryLang} query on XML file.`);
            break;
        }
    }
  }
}

module.exports = DataFile