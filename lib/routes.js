import { Router } from 'meteor/iron:router';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

Router.configure({
	layoutTemplate: 'layout'
})

Router.route('/', function(){
	Meteor.subscribe('documents');
	this.render('maincontent', {
		to: 'body',
		data: function(){
			console.log('num_docs: ' + Collections['documents'].find().count());
			return { num_docs: Collections['documents'].find().count()};
		}});
});

Router.route('/thumb', function () {
	//Meteor.subscribe('pages');
	let query = this.params.query;
	if (!query.version) {
		return;
	}
	//console.log(`${Collections['pages'].find().count()} records`);
	//console.log(query.version);
	//console.log(query.hash);
	let fs = Npm.require('fs');
	let img = undefined;
	let page = Collections['pages'].findOne({hash: query.hash, version: query.version, page_num: 1});
	console.log(`Looking for hash: ${query.hash}, version: ${query.version}`);
	if (page){
		console.log(`Found ${page.path}`);
		img = fs.readFileSync(page.path);
	}
	else {
		img = fs.readFileSync('/Users/Renchen/Documents/Work/GitHub/Meteor/simple-regression/public/missing.png');
	}

	this.response.writeHead(200, {'Content-Type': 'image/gif' });
  this.response.end(img, 'binary')
}, {where: 'server'});
