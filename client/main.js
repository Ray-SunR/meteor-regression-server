import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

import { tokenfield } from 'bootstrap-tokenfield'

import './main.html';

import '../node_modules/bootstrap-tokenfield/dist/css/bootstrap-tokenfield.css';
import '../node_modules/bootstrap-tokenfield/dist/css/tokenfield-typeahead.css';

if (Meteor.isClient){
	typeahead = require("typeahead.js/dist/typeahead.jquery.min.js");
	Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
	Session.set('sort_document_name', true);
	Session.set('sort_num_pages', false);
	Session.set('sort_avg_diff', false);
	Session.set('sort_asc', true);
	Session.set('filters', {});
}

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
		if (!Meteor.subscribe('documents').ready()){
			return;
		}
		let cursor = Collections['documents'].find();
		let ret = [];
		cursor.forEach(document => {
			if (Object.keys(Session.get('filters'))){
				// has filter
				obj = Session.get('filters');

				if (obj.dname == document.document_name){
					ret.push(document.documentRefFirstPage());
				}
			}
			else{
				ret.push(document.documentRefFirstPage());
			}
		});

		if (Session.get('sort_document_name')){
			ret.sort(function(a, b){
				if (a.document_name > b.document_name){
					if (Session.get('sort_asc')){
						return 1;
					}
					else {
						return -1;
					}
				}

				if (a.document_name < b.document_name){
					if (Session.get('sort_asc')){
						return -1;
					}
					else {
						return 1;
					}
				}
			});
		}
		else if (Session.get('sort_num_pages')){
			ret.sort(function(a, b){
				if (a.num_pages > b.num_pages){
					if (Session.get('sort_asc')){
						return 1;
					}
					else{
						return -1;
					}
				}

				if (a.num_pages < b.num_pages){
					if (Session.get('sort_asc')){
						return -1;
					}
					else {
						return 1;
					}
				}
			});
		}
		console.log(ret[0]);
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

Template.navigation.rendered = function() {
	var engine = new Bloodhound({
		local: [],
		datumTokenizer: function(d) {
			return Bloodhound.tokenizers.whitespace(d.value);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	engine.initialize();

	$('#tokenfield-typeahead').tokenfield({
		typeahead: [null,
		{
			name: 'tags',
			display: 'value',
			source: engine.ttAdapter()
		}]
	});
};

Template.navigation.helpers({
});

Template.navigation.events({
	'submit #tokenfield-typeahead'(event){
		console.log('here');
		event.preventDefault();
	}, 
	'click .js-triger-search'(event){
		event.preventDefault();
		let ret = $('#tokenfield-typeahead').tokenfield('getTokens');
		ret.forEach(function(item){
			let field = item.value;
			let regex = /(dname|num_pages|tags)(==|<|>|<=|>=|!=|\?=|!\?=)(\d+|".*")/g
			let re = new RegExp(regex);
			let ret = re.exec(field);
			if (ret){
				console.log(ret[1]);
				console.log(ret[2]);
				console.log(ret[3]);

				if (ret[1] === "dname"){
					if (ret[2] == "=="){
						Session
					}
					else if (ret[2] == "!="){

					}
				}
				else if (ret[1] == "num_pages"){

				}
				else if (ret[1] == "tags"){

				}
			}
		});
	},
	'click .js-sort-dname'(event){
		event.preventDefault();
		console.log('js-sort-dname clicked');
		Session.set('sort_document_name', true);
		Session.set('sort_avg_diff', false);
		Session.set('sort_num_pages', false);
	},
	'click .js-sort-numpages'(event){
		event.preventDefault();
		Session.set('sort_document_name', false);
		Session.set('sort_avg_diff', false);
		Session.set('sort_num_pages', true);
	},
	'click .js-sort-asc'(event){
		event.preventDefault();
		Session.set('sort_asc', true);
	},
	'click .js-sort-desc'(event){
		event.preventDefault();
		Session.set('sort_asc', false);
	}
});
