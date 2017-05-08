'use strict';

const Glue = require('glue');

const options = {
    relativeTo: __dirname
};


const manifest = {
    'connections': [
        {
            'port': 3000,
            'labels': ['api'],
            'host': 'localhost'
        }
    ],
    'registrations': [
        {
            'plugin': {
                'register': '.'
            }
        }
    ]
};

Glue.compose(manifest, options, (err, server) => {

    if (err) {
        throw err;
    }


    server.start((err) => {

        if (err) {
            throw err;
        }
        console.log('Server running at: ' + server.info.uri);
    });
});
