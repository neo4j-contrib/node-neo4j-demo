
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { neo4j: (process.env.NEO4J_URL || 'http://localhost:7474') });
};
