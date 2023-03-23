const rdflib = require('rdflib');
const DOMParser = require('xmldom').DOMParser;
const xpath = require('xpath');
const SaxonJS = require('saxon-js');
//const fs = require('fs');

/*
* Auxiliar function that finds the URI inside an RDF/XML file.
*/
function find_uri_RDFXML(rdf_text) {
  const match = rdf_text.match(/xmlns:(\w+)="(.*?)"/);
  if (match) {
    return match[2];
  }
  return null;
}

/*
* Querys an XML file with an XPath query.
*/
const query_XML_XPath = (query, file_content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(file_content, 'application/xml');
  const root = doc.documentElement; // avoiding xmldom security problem
  var res = "";

  var result_evaluate = xpath.evaluate(
    query,                      // xpathExpression
    root,                       // contextNode
    null,                       // namespaceResolver
    xpath.XPathResult.ANY_TYPE, // resultType
    null                        // result
  )

  switch (result_evaluate.resultType) {
    case 1:                              // NUMBER_TYPE
      res = result_evaluate.numberValue;
      break;
    case 2:                              // STRING_TYPE
      res = result_evaluate.stringValue;
      break;
    case 3:                              // BOOLEAN_TYPE
      res = result_evaluate.booleanValue;
      break;
    case 4:                              // UNORDERED_NODE_ITERATOR_TYPE
    case 5:                              // ORDERED_NODE_ITERATOR_TYPE
      node = result_evaluate.iterateNext();
      while (node) {
        res = res + "\n" + node.toString();
        node = result_evaluate.iterateNext();
      }
      break;
    default:
      res = null;
      break;
  }

  return res;
}

/*
* Querys an XML file with an XQuery query.
*/
const query_XML_XQuery = (query, file_content) => {
  const res = SaxonJS.XPath.evaluate(query, file_content);
  return res;
}


/* 
* Parses an XML file.
*/
const parse_XML = file_content => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(file_content, 'application/xml');
  //const root = doc.documentElement;

  const data = {
    namespaces: "",
    namespace_prefixes: "",
    elements: []
  };

  const elements = doc.getElementsByTagName('*');
  const elements_array = Array.from(elements);

  if (elements_array[0].namespaceURI) {
    data.namespaces = elements_array[0].namespaceURI;
  }

  if (elements_array[0].prefix) {
    data.namespace_prefixes = elements_array[0].prefix;
  }

  for (const element of elements_array) {

    const element_data = {
      tag_name: element.tagName,
      attributes: {},
      text_content: ""
    };

    const attributes = element.attributes;
    const attributes_array = Array.from(attributes);

    for (const attribute of attributes_array) {
      element_data.attributes[attribute.name] = attribute.value;
    }

    if (element.text_content) {
      element_data.text_content = element.text_content.trim();
    }

    data.elements.push(element_data);
  }

  return data;
};

function parse_XML_Saxon(file_content) {
  const doc = SaxonJS.getResource({
    type: 'xml',
    text: file_content
  }).then(function (doc) {
    return doc;
  });

  return doc;
}

/* 
* Parses an RDF/XML file.
*/
const parse_RDFXML = file_content => {
  const store = rdflib.graph();
  const data = {
    namespaces: {},
    statements: []
  };

  try {
    // Attempt to find the original namespace URI in the file
    const uri = find_uri_RDFXML(file_content);

    rdflib.parse(file_content, store, uri, 'application/rdf+xml', (err, stat) => {
      data.statements = stat.statements;
      data.namespaces = stat.namespaces;
    });

  } catch (e) {
    console.error(`Error finding original namespace URI: ${e}`)
  }

  return data;
};

/* 
* ODM class to represent a generic query. 
*/
class Query {

  /* 
  * Constructor for a query.
  */
  constructor(query_file, query_text, query_lang, query_res) {
    this.query_file = query_file
    this.query_text = query_text;
    this.query_lang = query_lang;
    this.query_res = query_res;
  }

}

/* 
* ODM class to represent a generic file. 
*/
class DataFile {

  /**
   * @property {string} file_name - the file's name.
   * */
  constructor(file_name, file_content, file_format) {
    this.file_name = file_name;
    this.file_content = file_content;
    this.file_format = file_format;
    this.file_parsed = {};
  }

  /**
  * Parsing of the file based on the format.
  */
  async parse_file() {

    switch (this.file_format) {
      case '.xml':
        this.file_parsed = parse_XML(this.file_content);
        break;
      case '.rdf':
        this.file_parsed = parse_RDFXML(this.file_content);
        break;
    }

  }

  async parse_file_Saxon() {
    this.file_parsed_Saxon = await parse_XML_Saxon(this.file_content);
    return this;
  }

  async queries_file(queries, query_lang) {
    switch (this.file_format) {
      case '.xml':
        switch (query_lang) {

          case 'xpath':
            var queries_obj_res = [];

            queries.forEach((query) => {
              let query_res = query_XML_XPath(query, this.file_content);
              queries_obj_res.push(new Query(this.file_name, query, query_lang, query_res));
            })

            this.file_queries.push(queries_obj_res);
            break;
          
          case 'xquery':
            var xqueries_res = [];

            queries.forEach((query) => {
              var query_res = query_XML_XQuery(query, this.file_parsed_Saxon);
              xqueries_res.push(new Query(this.file_name, query, query_lang, query_res))
            })

            this.file_queries.push(xqueries_res);
            break;

          default:
            console.error(`Can't perform a ${query_lang} query on XML file.`);
            break;
        }
    }
  }
}

/* 
* ODM class to represent a collection of files. 
*/
class FileCollection {
  constructor(coll_id) {
    this.coll_id = coll_id;
    this.coll_files = [];
  }

  async push_DataFile(data_file) {
    this.coll_files.push(data_file);
  }

  async construct_from_json(json) {
    json.coll_files.forEach(file => {
      var data_file = new DataFile(file.file_name, file.file_content, file.file_format);

      data_file.file_parsed = file.file_parsed;

      file.file_queries.forEach(queries => {
        var queriesI = []
        queries.forEach(query => {
          queriesI.push(query);
        })
        data_file.file_queries.push(queriesI);
      })

      this.coll_files.push(data_file);
    });
  }
}

module.exports = { DataFile, FileCollection }
