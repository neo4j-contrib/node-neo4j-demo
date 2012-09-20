
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes'),
  httpProxy = require ('http-proxy')
;


var regex = /http\:\/\/([^:\/]*):(\d+)/;
var neo4jMatch = (process.env.NEO4J_URL || 'http://localhost:7474').match(regex);

console.log(neo4jMatch);


var app = module.exports = express.createServer();
var proxy = new httpProxy.HttpProxy({ 
  target: {
    host: neo4jMatch[1], 
    port: neo4jMatch[2] || 7474,
    https: false
  }
});

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.helpers({
    title: 'Node-Neo4j Template'    // default title
});

// Routes

app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.post('/users/:id', routes.users.edit);
app.del('/users/:id', routes.users.del);

app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);

// proxy Neo4j's web interface
app.all('/webadmin/*', function(req, res) {
  proxy.proxyRequest(req, res);
});
app.all('/js/*', function(req, res) {
  proxy.proxyRequest(req, res);
});
app.all('/css/*', function(req, res) {
  proxy.proxyRequest(req, res);
});

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
