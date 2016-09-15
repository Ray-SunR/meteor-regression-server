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
	//console.log(ret[0]);
	return ret;
});

Template.registerHelper('num_refs', (refs) => {
	return Object.keys(refs).length;
});

Template.registerHelper('num_tags', (tags) => {
	return tags.length;
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

Template.document.onRendered(function(){
	this.$(".thumb-doc").hide(0).delay(500).fadeIn(3000);
});

Template.document.events({
	'click .js-thumb-click'(event){
		event.preventDefault();
		Session.set('focus_doc', this);
	}
});

Template.focus_document.helpers({
	focus_document(){
		let doc = Session.get('focus_doc');
		if (doc){
			return doc;
		}
		else{
			let fdoc = Collections['documents'].findOne();
			if (fdoc){
				Session.set('focus_doc', fdoc.documentRefFirstPage());
			}
			return fdoc;
		}
	},
});

Template.focus_document.onRendered(function(){
	this.$(".panel-wrapper").hide(0).delay(500).fadeIn(3000);
});

Template.navigation.helpers({
  settings: function() {
  	Meteor.subscribe('documents');
    return {
      limit: 10,
      rules: [
        {
          token: 'name=',
          collection: Collections['documents'],
          field: 'document_name',
          matchAll: true,
          template: Template.document_pill
        },
      ]
    };
  }
});