import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Collections = {
	'documents': new Mongo.Collection('documents'),
	'references': new Mongo.Collection('references'),
	'differences': new Mongo.Collection('differences'),
	'pages': new Mongo.Collection('pages'),
	'difference_metrics': new Mongo.Collection('difference_metrics')
};

Collections['documents'].helpers({
	documentResolver(){
		Meteor.subscribe('references');
		console.log(`Looking for document_id: ${this._id}`);

		let reference_ids = this.references;
		let reference_rets = {};
		this.references = reference_rets;

		for (let version in reference_ids){
			console.log(`num_records: ${Collections['references'].find().count()}, version: ${version}, ref_id: ${reference_ids[version]}`);
			let reference_id = reference_ids[version];

			let reference_ret = Collections['references'].findOne({_id: reference_id});
			if (reference_ret){
				reference_ret = reference_ret.referenceResolver();
				reference_rets[version] = reference_ret;
			}
		}
		return this;
	},
	documentRefFirstPage(){
		let ret = this.documentResolver();
		if (ret){
			for (key in ret.references){
				let ref = ret.references[key];
				this.thumb_version = key;

				if (1 in ref.pages){
					this.id= ref.pages[1]._id;
				}
				return this;
			}
		}
	}
});

Collections['references'].helpers({
	referenceResolver(){
		Meteor.subscribe('pages');
		Meteor.subscribe('differences');
		console.log(`Looking for reference_id: ${this._id}`);
		let diff_ids = this.diffs;
		let page_ids = this.pages;
		let diff_rets = {};
		let page_rets = {};

		this.diffs = diff_rets;
		this.pages = page_rets;
		
		for (let key in diff_ids){
			let diff_ret = Collections['differences'].findOne({_id: diff_ids[key]});
			if (diff_ret){
				diff_ret = diff_ret.differenceResolver();
				diff_rets[key] = diff_ret;
			}
		}

		for (let key in page_ids){
			let page_ret = Collections['pages'].findOne({_id: page_ids[key]});
			if (page_ret){
				page_ret = page_ret.pageResolver();
				page_rets[key] = page_ret;
			}
		}

		return this;
	}
});

Collections['differences'].helpers({
	differenceResolver(){
		console.log(`Looking for difference_id: ${this._id}`);
		Meteor.subscribe('difference_metrics');
		Meteor.subscribe('pages');
		let metric_ids = this.metrics;
		let page_ids = this.pages;
		let metric_rets = {};
		let page_rets = {};

		this.pages = page_rets;
		this.metrics = metric_rets;

		for (let key in metric_ids){
			let metric_ret = Collections['difference_metrics'].findOne({_id: metric_ids[key]});
			if (metric_ret){
				metric_ret = metric_ret.differenceMetricResolver();
				metric_rets[key] = metric_ret; 
			}
		}

		for (let key in page_ids){
			let page_ret = Collections['pages'].findOne({_id: page_ids[key]});
			if (page_ret){
				page_ret = page_ret.pageResolver();
				page_rets[key] = page_ret; 
			}
		}

		return this;
	}
});

Collections['difference_metrics'].helpers({
	differenceMetricResolver(){
		return this;
	}
});

Collections['pages'].helpers({
	pageResolver(){
		return this;
	}
});

if (Meteor.isServer){
	Meteor.publish('documents', function documentsPublication() {
		return Collections['documents'].find();
  });

	Meteor.publish('references', function referencesPublication() {
		return Collections['references'].find();
  });

  Meteor.publish('pages', function(){
  	return Collections['pages'].find();
  });

  Meteor.publish('differences', function(){
  	return Collections['differences'].find();
  });

  Meteor.publish('difference_metrics', function(){
  	return Collections['difference_metrics'].find();
  });
}