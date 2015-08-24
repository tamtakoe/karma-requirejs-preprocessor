var configParser = require('./requirejs-config');

var createRequirejsPreprocessor = function (logger, config, basePath) {
    config = config || {};

    var log = logger.create('preprocessor.requirejs');

    return function (content, file, done) {
        log.debug('Processing "%s".', file.originalPath);

        var projectConfig = configParser.parse(content);

        function mergeConfigs(projectConfig, config) {
            var testConfig = config.config;
            var testRegexp = config.testRegexp || /spec\.js$/;

            if (!testConfig || !window.__karma__) return projectConfig;

            var baseUrlRegexp = new RegExp('^' + testConfig.baseUrl);

            function isObject(obj) {
                return typeof obj === 'object' && !(obj instanceof Array);
            }

            function mergeObjects(obj1, obj2){
                for(var key in obj2){
                    if (obj2.hasOwnProperty(key)) {
                        if (isObject(obj1[key]) && isObject(obj2[key])) {
                            obj1[key] = mergeObjects(obj1[key], obj2[key]);

                        } else {
                            obj1[key] = obj2[key];
                        }
                    }
                }
                return obj1;
            }

            function pathToModule(path) {
                return path.replace(baseUrlRegexp, '').replace(/\.js$/, '');
            }

            testConfig.deps = testConfig.deps || [];
            testConfig.callback = window.__karma__.start;

            Object.keys(window.__karma__.files).forEach(function(file) {
                if (testRegexp.test(file)) {
                    // Normalize paths to RequireJS module names.
                    testConfig.deps.push(pathToModule(file));
                }
            });

            return mergeObjects(projectConfig, testConfig);
        }

        var requireConfig = '!function() {\n' +
            mergeConfigs.toString() + ';\n' +
            'var projectConfig = ' + JSON.stringify(projectConfig, null, 4) + ';\n' +
            'var config = ' + JSON.stringify(config, null, 4) + ';\n' +
            'require.config(mergeConfigs(projectConfig, config));\n' +
        '}();';

        done(null, requireConfig);
    }
};

createRequirejsPreprocessor.$inject = ['logger', 'config.requirejsPreprocessor', 'config.basePath'];

// PUBLISH DI MODULE
module.exports = {
    'preprocessor:requirejs': ['factory', createRequirejsPreprocessor]
};