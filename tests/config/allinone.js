'use strict';

module.exports = {
    db: {
        servers: [
            { db: 'seta2', host: 'localhost', user: 'admin', password: '123456' }

        ],
        mongoServer: 'mongodb://135.76.210.150:27017/tmla',
        mongoPoolSizePerConnection: 10
    },
    services: {
        seta_consumer: {
            servers: [{
                host: '135.76.210.150',
                port: 8778
            }],
            path: {
                id_generator_alert: '/seta-consumer/id/alert',
                id_generator_case: '/seta-consumer/id/case'
            }


        },
        data_lake: {
            host: 'https://bltd244.bhdc.att.com:9201',
            auth: {
                user: 'es_tmla',
                password: 'tmla3last1c123'
            },
            isMock: false,
            bulkSize: 200,
            maxRecords: 10000,
            defaultSortInfo: { '@timestamp': { 'order': 'desc' } },
            defaultBulkNumber: 0
        }

    },
    reconfigure:
    {
        shards: 1,
        replicas: { 'default': 3 },
        primaryReplicaTag: 'default'
    },


    security: { level: 'csp' },


};
