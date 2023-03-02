var vizData = [{
    tag: 0,
    title: 'Number of articles per year',
    description: 'Queries from collection <i><b>data-one</b></i>.',
    chart: {},
    queriesByDs: [{
        ds: 0,
        queryLanguage: 'xpath',
        queriesText: ['count(//*[local-name()="article"])', 'string(//*[local-name()="publication"]/@date)'],
        queries: []
    }]
}, 
{
    tag: 1,
    title: 'Number of articles per year',
    description: 'Queries from collection <i><b>data-one</b></i> and <i><b>data-two</b></i>.',
    chart: {},
    queriesByDs: [{
        ds: 0,
        queryLanguage: 'xpath',
        queriesText: ['count(//*[local-name()="article"])'],
        queries: []
    },
    {
        ds: 1,
        queryLanguage: 'xpath',
        queriesText: ['string(//*[local-name()="publication"]/@date)'],
        queries: []
    }]
}]