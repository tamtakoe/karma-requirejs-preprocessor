module.exports.parse = function(requireConfigFile) {
    return Function(
        "var output," +
        "requirejs = require = function() {}," +
        "define = function () {};" +
        "require.config = function (options) { output = options; };" +
        "" + requireConfigFile + "\n;" +
        "return output;"
    )();
};

module.exports.save = function(requireConfig) {
    return 'require.config(' + JSON.stringify(requireConfig) + ');';
};
