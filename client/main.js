import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Collections } from '../api/collections.js';
import { Meteor } from 'meteor/meteor';

import { tokenfield } from 'bootstrap-tokenfield'

import './main.html';

import '../node_modules/bootstrap-tokenfield/dist/css/bootstrap-tokenfield.css';
import '../node_modules/bootstrap-tokenfield/dist/css/tokenfield-typeahead.css';

function FilterDefinition(name, okoperators, transform_func, convert_func){
	return  {
		name: name,
		okoperators: okoperators,
		operator: '',
		value: '',
		transform_func: transform_func,
		convert_func: convert_func
	};
}

function FilterMatchImpl(filt, document){
	let filter_val = filt.convert_func(filt.value);
	let target_val = filt.transform_func(document);

	if (filt.operator === '==' || filt.operator === '='){
		return filter_val === target_val;
	}
	else if (filt.operator === '!='){
		return filter_val != target_val;
	} 
	else if (filt.operator === '>='){
		return target_val >= filter_val;
	}
	else if (filt.operator === '<='){
		return target_val <= filter_val;
	}
	else if (filt.operator === '<'){
		return target_val < filter_val;
	}
	else if (filt.operator === '>'){
		return target_val > filter_val;
	}
	else if (filt.operator === '?='){
		return target_val.indexOf(filter_val) != -1;
	}
	else if (filt.operator === '!?='){
		return target_val.indexOf(filter_val) === -1;
	}

	return true;
}

function FilterDefs(){
	return {
		'dname': FilterDefinition('dname', ['==', '=', '!='], function(document){
			return document.document_name;
		}, function(value){
			return value;
		}),
		'num_pages': FilterDefinition('num_pages', ['==', '=', '!='], function(document){
			return document.num_pages;
		}, function(value){
			return parseInt(value);
		}),
		'avg_diff': FilterDefinition('avg_diff', ['==', '=', '!=', '>', '<', '<=', '>='], function(document){
			return document.avg_diff_pct;
		}, function(value){
			return parseFloat(value);
		}),
		'tags': FilterDefinition('tags', ['==', '=', '!=', '?=', '!?='], function(document){
			return document.tags;
		}, function(value){
			return String(value);
		})
	}
}

if (Meteor.isClient){
	typeahead = require("typeahead.js/dist/typeahead.jquery.min.js");
	Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
	Session.set('sort_document_name', true);
	Session.set('sort_num_pages', false);
	Session.set('sort_avg_diff', false);
	Session.set('sort_asc', true);
	Session.set('filters', {});
	Session.set('filtered_doc_count', 0);
	Session.set('ref_versions', []);
	Session.set('tar_versions', []);
}

Template.documents.onCreated(function bodyOnCreated() {

});

Template.registerHelper('arrayify', (obj) => {
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


Template.registerHelper('totaldocs', () => {
	if (!Meteor.subscribe('documents').ready()){
		return 0;
	}
	else {
		return Collections['documents'].find().count();
	}
});

Template.registerHelper('filtereddocs', () => {
	return Session.get('filtered_doc_count');
});

Template.registerHelper('', (obj) => {
	return obj.length === 0;
});

Template.registerHelper('refversions', () => {
	return Session.get('ref_versions');
});

Template.registerHelper('tarversions', () => {
	return Session.get('tar_versions');
});

Template.registerHelper('refversion', () => {
	return Session.get('ref_versions')[0];
});

Template.registerHelper('tarversion', () => {
	return Session.get('tar_versions')[0];
});

function CreateFilter(filter){
	let new_filter = FilterDefs()[filter.fname];
	if (new_filter && _.intersection(filter.operator, new_filter.okoperators)) {
		new_filter.value = filter.value;
		new_filter.operator = filter.operator;
		return new_filter;
	}
	else {
		return undefined;
	}
}

function SetRefAndTarVersions(document){
	let ref_versions = Session.get('ref_versions');
	let tar_versions = Session.get('tar_versions');
	if (!document || !document.references){
		return;
	}

	ref_versions = _.union(ref_versions, Object.keys(document.references));

	for (key in document.references){
		tar_versions = _.union(tar_versions, Object.keys(document.references[key].diffs));
	}

	console.log(ref_versions);
	console.log(tar_versions);
	Session.set('ref_versions', ref_versions);
	Session.set('tar_versions', tar_versions);	
}

Template.documents.helpers({
	documents(){
		if (!Meteor.subscribe('documents').ready()){
			return;
		}
		let cursor = Collections['documents'].find();
		let ret = [];

		cursor.forEach(document => {
			if (Object.keys(Session.get('filters')).length){
				document = document.documentRefFirstPage();
				// has filter
				let obj = Session.get('filters');
				let filters = [];
				for (let key in obj){
					let filter = obj[key];
					filter = CreateFilter(filter);
					if (filter){
						filters.push(filter);
					}
				}

				let flag = true;
				filters.forEach(filter => {
					let tmp = FilterMatchImpl(filter, document);
					if (document.document_name == "3a.pdf"){
						console.log(tmp);
					}
					flag = flag && FilterMatchImpl(filter, document);
				});

				if (flag){
					SetRefAndTarVersions(document);
					ret.push(document);
				}
			}
			else{
				document = document.documentRefFirstPage();
				SetRefAndTarVersions(document);
				ret.push(document);
			}

			Session.set('filtered_doc_count', ret.length);
		});

		if (Session.get('sort_document_name')){
			ret.sort((a, b) => {
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
			ret.sort((a, b) => {
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
		return ret;
	},
});

Template.document.onRendered(function(){
	this.$(".thumb-doc").hide(0).delay(500).fadeIn(1500);
});

Template.navigation.onRendered(function(){
	$(".dropdown").hover(
		function() {
			$(this).find('.dropdown-menu').stop(true, true).delay(200).fadeIn();
		}, 
		function() {
			$(this).find('.dropdown-menu').stop(true, true).delay(200).fadeOut();
		});
});

Template.document.events({
	'click .js-thumb-click'(event){
		event.preventDefault();
		Session.set('focus_doc', this);
	}, 
	'click .js-set-tag-filter'(event){
		event.preventDefault();

		$('#tokenfield-typeahead').tokenfield('createToken', 'tags?=' + event.target.text);
		AddFilter('tags?=' + event.target.text);
	}
});

Template.side_panel.helpers({
	side_panel(){
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

Template.side_panel.events({
	'click .js-click-ref-version'(event){
		event.preventDefault();
		$('#ref-version-text').text(event.target.text);
	},
	'click .js-click-tar-version'(event){
		event.preventDefault();
		$('#tar-version-text').text(event.target.text);
	}
});

Template.side_panel.onRendered(function(){
	//this.$(".panel-wrapper").hide(0).delay(500).fadeIn(3000);
});

function parseToken(item){
	console.log('parse: ' + item);
	let regex = /(.*?)(==|=|<|>|<=|>=|!=|\?=|!\?=)(["']?)(.*)*\3/g
	let re = new RegExp(regex);
	return re.exec(item);
}

Template.navigation.rendered = function() {
	var engine = new Bloodhound({
		local: [],
		datumTokenizer: function(d) {
			return Bloodhound.tokenizers.whitespace(d.value);
		},
		queryTokenizer: Bloodhound.tokenizers.whitespace
	});

	engine.initialize();

	$('#tokenfield-typeahead')
	.on('tokenfield:removedtoken', (token) => {
		let ret = parseToken(token.attrs.value);
		if (ret && ret[0] in Session.get('filters')){
			console.log(ret[0] + ' removed');
			let filters = Session.get('filters');
			delete filters[ret[0]];
			Session.set('filters', filters);
		}
	})
	.tokenfield({
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

function AddFilter(token){
	token = parseToken(token);
	if (token){
		let key = token[0];
		let filters = Session.get('filters');
		if (!(key in filters)){
			filters[key] = {};
			filters[key].operator = token[2];
			filters[key].fname = token[1];
			filters[key].value = token[4]
			console.log(`Filter value: ${filters[key].value}`);
			Session.set('filters', filters);
		}
	}
}

Template.navigation.events({
	'submit #tokenfield-typeahead'(event){
		event.preventDefault();
	}, 
	'click .js-triger-search'(event){
		event.preventDefault();

		let ret = $('#tokenfield-typeahead').tokenfield('getTokens');
		ret.forEach((token) => {
			AddFilter(token.value);
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
