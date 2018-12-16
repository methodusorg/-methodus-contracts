'use strict';

module.exports = {
    port: 2065,
    amqp:
    {
        uri: "tmla.aio.9.uccentral.att.com:5672",
        userName: "tmla",
        password: "1234"
    },
    tiles:
    {
        '@tmla-tiles/alert': {
            server: 'express',
            transport: 'Local', //'Local,Http,MQ'
            page_size: 50,
            upgrade: true
        },
        '@tmla-tiles/case': {
            resolver: 'http://127.0.0.1:2067',
            server: 'express',
            transport: 'Http', //'Local,Http,MQ'
            page_size: 50,
            upgrade: true
        }

    },
    security: { level: 'csp' },
    // registry: {
    //     ip: '127.0.0.1',
    //     serviceResolution: 'minor',
    //     protocol: 'http://',
    //     route: '',
    //     heartbeatInterval: 60 * 1000,
    //     ports: {
    //         min: 2065,
    //         max: 2065,
    //     },
    //     retry: {
    //         times: 5,
    //         interval: 1000 * 5
    //     },
    //     transport: 'rest', // excepted values are rest or q (q based on rethink changes, rest based on express), default is rest
    //     transportHandler: '/server/handler'
    // },
    mongoToggle: {
        alert: true,
        user: true,
        case: true,
        company: true,
        cache: true,
        socket: true,
        storage: true,
        thinky: true,
        rule: true
    },
    services: {
        seta_consumer: {
            servers: [{
                host: '127.0.0.1',
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
        },
        security_portal: {
            host: 'https://www.e-access.att.com/iprotent-qa'
        }
    },
    app: {
        title: 'TMLA',
        description: 'AT&T Threat Manager: Log Analysis',
        keywords: 'AT&T Threat Manager: Log Analysis',
        clientAppName: 'setaApp'
    },

    templateEngine: 'ejs',
    sessionSecret: 'RETHINKDB',
    rethinkDB: {
        arrayLimit: 500000
    },
    case_status: {
        new: 'new',
        investigation: 'investigation',
        closed_resolved: 'closed resolved',
        closed_unresolved: 'closed unresolved'
    },
    reconfigure: {
        shards: 1,
        replicas: {
            'default': 3
        },
        primaryReplicaTag: 'default'
    },
    logs: [{
        name: 'general',
        directory: 'logs',
        level: 'debug', // { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
        handleExceptions: true,
        json: false,
        fileName: 'frontend_logfile.log',
        maxsize: 5242880,
        maxFiles: 5,
        colorize: true
    }],
    downloads:
    {
        path: './csv-downloads/',
        filenameprefix: 'data'
    }
};
