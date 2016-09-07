import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

import './main.html';

Template.documents.onCreated(function bodyOnCreated() {

});

Template.registerHelper('arrayify', function(obj){
	let ret = [];
	for (let key in obj){
		ret.push({key: key, obj: obj[key]});
	}
	console.log(ret[0]);
	return ret;
});

Template.documents.helpers({
	documents(){
		let ready = Meteor.subscribe('documents').ready();
		let cursor = Collections['documents'].find();
		let ret = [];
		cursor.forEach(document => {
			ret.push(document.documentRefFirstPage());
		});
		return ret;
	},
});