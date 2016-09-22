import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

import { tokenfield } from 'bootstrap-tokenfield'
import { typeahead } from 'typeahead'

import './main.html';

import '../node_modules/bootstrap-tokenfield/dist/css/bootstrap-tokenfield.css';
import '../node_modules/bootstrap-tokenfield/dist/css/tokenfield-typeahead.css';
import '../node_modules/typeahead/style.css';

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

Tokens = new Mongo.Collection(null);

['name=', 'ref_version=', 'tags='].forEach(function(token){
	Tokens.insert({token: token});
});

Template.navigation.rendered = function() {
  //Meteor.typeahead.inject();

  //$('#tokenfield').tokenfield();
  //$('#tokenfield').tokenfield('setTokens', ['blue','red','white']);

  $('#tokenfield')
	  
  .on('tokenfield:createtoken', function (e) {
    var data = e.attrs.value.split('|')
    e.attrs.value = data[1] || data[0]
    e.attrs.label = data[1] ? data[0] + ' (' + data[1] + ')' : data[0]
  })

  .on('tokenfield:createdtoken', function (e) {
    // Über-simplistic e-mail validation
    var re = /\S+@\S+\.\S+/
    var valid = re.test(e.attrs.value)
    if (!valid) {
      $(e.relatedTarget).addClass('invalid')
    }
  })

  .on('tokenfield:edittoken', function (e) {
    if (e.attrs.label !== e.attrs.value) {
      var label = e.attrs.label.split(' (')
      e.attrs.value = label[0] + '|' + e.attrs.value
    }
  })

  .on('tokenfield:removedtoken', function (e) {
    alert('Token removed! Token value was: ' + e.attrs.value)
  })

  .tokenfield();
  $('#tokenfield').tokenfield('setTokens', ['blue','red','white']);
};

Template.navigation.helpers({
	controls(){
		return Tokens.find().fetch();
	}
});

Template.navigation.events({
	'submit .search-form'(event){
		console.log('here');
			event.preventDefault();
	}, 
	'click .js-triger-search'(event){
		event.preventDefault();
		let ret = $('#tokenfield').tokenfield('getTokens');
		ret.forEach(function(item){
			console.log(item);
		});
	}
});
