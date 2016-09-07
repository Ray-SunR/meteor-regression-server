import { Router } from 'meteor/iron:router';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

Router.configure({
	layoutTemplate: 'layout'
})

Router.route('/', function(){
	this.render('maincontent', {to: 'body'})
});

Router.route('/thumb', function () {
	Meteor.subscribe('pages');
	let query = this.params.query;
	console.log(query.id);
	let fs = Npm.require('fs');
	let page = Collections['pages'].findOne({_id: query.id});
	console.log(page.path);
	let img = fs.readFileSync(page.path);
	this.response.writeHead(200, {'Content-Type': 'image/gif' });
  this.response.end(img, 'binary')
}, {where: 'server'});
