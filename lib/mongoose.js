var Resors = require('./resors'),
    extend = require('xtend');

/*
 Mongoose Resors Class
 */
var MongooseResors = module.exports = function(model, options) {
    this.model = model;
    this.path = model.modelName;
    this.options = extend(Resors.defaults, options);
    this.options.filtering || (this.options.filtering = Resors.helpers.paths(this.model));
};

MongooseResors.fn = MongooseResors.prototype = new Resors;
MongooseResors.fn.constructor = MongooseResors;
MongooseResors.fn.query = function(q) {
    var o = this.options;

    if (o.fields)
        q = q.select(o.fields.join(' '));

    return q;
};
MongooseResors.fn.index = function(req, res, next) {
    res.query = this.query(this.model.find());

    // filtering
    // ?path=value&path=value
    // if path is the same will compile or query
    this.options.filtering.forEach(function(path){
        if(path in req.query) {
            if(!~['limit', 'offset', 'sort', '_id'].indexOf(path)){
                var val = req.query[path];
                if ( Array.isArray(val) ) {
                    var or = [];

                    val.forEach(function(v){
                        var o = {};
                        o[path] = v;
                        or.push(o);
                    });

                    res.query.or(or);
                }else{
                    res.query.where(path, val);
                }
            }
        }
    });

    //offset
    if(req.query.offset) res.query.skip(req.query.offset);

    //limit
    if(this.options.limit) res.query.limit(this.options.limit);
    if(req.query.limit) res.query.limit(req.query.limit);

    //sorting
    if(this.options.sort) res.query.sort(this.options.sort);

    var sort = req.query.sort;
    if(sort){
        res.query.sort(Array.isArray(sort) ? sort.join(' '): sort);
    }

    next();
};
MongooseResors.fn.show = function(req, res, next) {
    res.query = this.query(this.model.findById(req.params.id));
    next();
};
MongooseResors.fn.create = function(req, res, next) {
    this.model.create(req.body, function(err, result) {
        res.err = err;
        res.result = result;
        next();
    });
};
MongooseResors.fn.update = function(req, res, next) {
    res.query = this.query(this.model.findByIdAndUpdate(req.params.id, req.body));
    next();
};
MongooseResors.fn.destroy = function(req, res, next) {
    res.query = this.model.findByIdAndRemove(req.params.id);
    next();
};
MongooseResors.fn.exec = function(req, res, next) {
    res.query.exec(function(err, result) {
        delete res.query;
        res.err = err;
        res.result = result;
        next();
    });
};
