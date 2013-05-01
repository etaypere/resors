var extend = require('xtend');

/*
 A do-nothing middleware
 */
var middleware = function(req, res, next) {
    next();
};


/*
 Resors Class
 */
var Resors = module.exports = function(path, options) {
    this.path = path;
    this.options = extend(Resors.defaults, options);
};
Resors.fn = Resors.prototype;
Resors.fn.finish = function(req, res) {
    if (res.err)
        res.status(400).json(res.err);
    else
        res.json(res.result);
};
Resors.fn.middlewares = function(route) {
    var self = this;

    return [
        function(req, res, next) {
            req.resors = extend({}, self.options, {
                method: function() {
                    return ~([].slice.call(arguments)).indexOf(req.method.toLowerCase())
                },
                errors: []
            });
            next();
        },
        this.options.before,
        function(req, res, next) {
            var resors = req.resors;
            if (!~resors.allow.indexOf(req.method.toLowerCase()))
                return res.status(403).end('No permissions.');

            if (resors.errors.length)
                return res.status(400).json({
                    errors: resors.errors.reduce(function(seed, err) { seed[err[0]] = { message: err[1] }; return seed; }, {})
                });

            next();
        },
        this[route],
        (~[ 'index', 'show' ].indexOf(route) ? this.options.query : middleware),
        ('create' != route ? this.exec : middleware),
        this.options.after,
        this.finish
    ].map(function(m) { return m ? m.bind(self) : middleware });
};
Resors.fn.routes = function(app) {
    var path = this.path;

    app.get('/' + path,             this.middlewares('index'));
    app.get('/' + path + '/:id',    this.middlewares('show'));
    app.post('/' + path + '',       this.middlewares('create'));
    app.put('/' + path + '/:id',    this.middlewares('update'));
    app.delete('/' + path + '/:id', this.middlewares('destroy'));
};



/*
 Resors defaults
 */
//var resources = {};
//Resors.register = function(resource) {
//    resources[resource.path] = resource;
//};
Resors.defaults = {
    allow: [ 'get' ],
    before: middleware,
    query: middleware,
    after: middleware,
    limit: 20
};