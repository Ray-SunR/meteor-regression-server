import { Meteor } from 'meteor/meteor';
import { Collections } from '../api/collections.js'


Meteor.startup(() => {
  // code to run on server at startup
  console.log('There are ' + Collections['documents'].find().count() + ' documents');
  console.log(`There are + ${Collections['references'].find().count()} + references`);
});
