'use strict';

module.exports = {
    db: {
        servers: [
            { db: 'seta2', host: 'tmla.aio.6.uccentral.att.com', user: 'admin', password: '123456' }

        ],
        mongoServer: 'mongodb://135.76.210.150:27017/tmla',
        mongoPoolSizePerConnection: 10
    },
    //security: { level: 'local', whitelist: ['127.0.0.1', '::ffff:127.0.0.1', '::1'], attid: 'rb136m' },

    security: { level: 'csp' },
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

};
