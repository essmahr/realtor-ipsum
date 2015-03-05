//= require fetch/fetch
//= require es6-promise/promise
//= require fastclick/lib/fastclick

var dataURL = '/data/content.json';

var Ipsum = function(){}

Ipsum.prototype.init = function(){
  fetch(dataURL)
    .then(function(response) {
      return response.json()
    }).then(function(json) {
      this.storedData = json
      this._setupData(json);
      // console.log('parsed json', json)
    }.bind(this)).catch(function(ex) {
      console.log('parsing failed', ex)
    });

  this.switch = 0

};

Ipsum.prototype._setupData = function() {
  this.sentences = JSON.parse(JSON.stringify(this.storedData));
};

Ipsum.prototype._resetArray = function(category){
  // console.log('resetting '+category+' array.');
  return JSON.parse(JSON.stringify(this.storedData[category]));
};

Ipsum.prototype._resetFeature = function(index){
  // console.log('resetting feature array.');
  return JSON.parse(JSON.stringify(this.storedData.features[index]));
};

Ipsum.prototype._pluckFeatures = function(){

  var features = [], list = '';
  features.push(this.getFeature(0));
  features.push(this.getFeature(1));
  for (var i = 0; i < randVal(1, 4); i++) {
    features.push(this.getFeature(2));
  }

  features = shuffle(features);

  var andString = this.switch % 3 == 0 ? '&' : 'and';
  this.switch++;

  for (var x = 0; x < features.length; x++) {
    list += features[x]
    if (x == features.length - 2) {
      list += ' '+ andString +' ';
    } else if (x != features.length - 1) {
      list += ', ';
    }
  }

  return list;

};

Ipsum.prototype.getFeature = function(index) {
  this.sentences.features[index] = (this.sentences.features[index].length == 0) ? this._resetFeature(index) : this.sentences.features[index];
  return randValFromArr(this.sentences.features[index]);
};

Ipsum.prototype.getSentence = function(category, shouldReset) {
  // console.log('getting sentence from '+category);
  if (typeof shouldReset === "undefined" || shouldReset) {
    this.sentences[category] = (this.sentences[category].length == 0) ? this._resetArray(category) : this.sentences[category];
  }
  return randValFromArr(this.sentences[category], shouldReset);
};

Ipsum.prototype.buildDblClause = function() {
  return this.getSentence('preclauses') + ' ' + this.getSentence('statements');
};

Ipsum.prototype.buildFeatureList = function(){
  return this.getSentence('featureList').replace('#_FEATLIST', this._pluckFeatures());
};

Ipsum.prototype.runBedBath = function(string, bedNum, bathNum) {
  var bed, bath;
  // var bedplur = (bedNum>1) ? 's' : '';
  // var bathplur = (bathNum>1) ? 's' : '';
  if (this.switch % 4 == 0) {
    bed = bedNum+' #_ADJ bedroom';
    bath = bathNum+' bathroom';
  } else if (this.switch % 3 == 0) {
    bed = bedNum+'BR';
    bath = bathNum+' bath';
  } else {
    bed = bedNum+' bed';
    bath = bathNum+' bathroom';
  }

  string = string.replace(/#_BED/g, bed);
  string = string.replace(/#_BATH/g, bath);

  return string;

};

Ipsum.prototype.runLocation = function(string){
  return string.replace(/#_LOC/g, function(match){
    return this.getSentence('locations');
  }.bind(this));
};

Ipsum.prototype.runYear = function(string){
  return string.replace(/#_YEAR/g, function(match){
    return randVal(1922, 2012);
  });
};

Ipsum.prototype.runAdjectives = function(string){
  return string.replace(/#_ADJ/g, function(match){
    return this.getSentence('adjectives');
  }.bind(this));
};

Ipsum.prototype.buildParagraph = function(beds, baths, size){
  arr = [];

  arr.push(this.getSentence('introductory'));

  switch (size) {
    case 'small':
      // arr.push(this.buildDblClause());
      // arr.push(this.getSentence('home'));
      // arr.push(this.getSentence('location'));
      break;
    case 'medium':
      arr.push(this.getSentence('bedbath'));
      arr.push(this.buildDblClause());
      arr.push(this.getSentence('location'));
      break;
    case 'large':
      arr.push(this.buildDblClause());
      arr.push(this.getSentence('bedbath'));
      arr.push(this.getSentence('home'));
      arr.push(this.getSentence('home'));
      arr.push(this.getSentence('location'));
      arr.push(this.getSentence('grounds'));
      break;
    case 'xlarge':
      arr.push(this.buildDblClause());
      arr.push(this.getSentence('bedbath'));
      arr.push(this.getSentence('home'));
      arr.push(this.getSentence('grounds'));
      arr.push(this.getSentence('home'));
      arr.push(this.getSentence('home'));
      arr.push(this.buildDblClause());
      arr.push(this.getSentence('home'));
      arr.push(this.getSentence('location'));
      arr.push(this.getSentence('location'));
      arr.push(this.getSentence('grounds'));
      break;
  }

  arr.push(this.buildFeatureList());
  arr.push(this.getSentence('conclusions'));

  var para = arr.join(' ');

  para = this.runBedBath(para, beds, baths);
  para = this.runLocation(para);
  para = this.runYear(para);

  para = this.runAdjectives(para);

  return para;

};

function randVal(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

function randValFromArr(arr, shouldReset) {
  var index = randVal(0, arr.length);
  var string = arr[index];
  if (typeof shouldReset === "undefined" || shouldReset)
    arr.splice(index, 1)
  return string;
}

function shuffle(arr){ //v1.0
  for (var j, x, i = arr.length; i; j = Math.floor(Math.random() * i), x = arr[--i], arr[i] = arr[j], arr[j] = x);
  return arr;
};

function generateBlurb(evt) {

  var container = document.getElementById('blurb');

  var beds = evt.target.elements['beds'].value;
  var baths = evt.target.elements['baths'].value;
  var size = evt.target.elements['size'].value;

  var blurb = ipsum.buildParagraph(beds, baths, size);

  if (container.className == 'active') {
    container.children[0].className = '';
    window.setTimeout(function(){
      container.children[0].innerHTML = blurb;
      container.children[0].className = 'active';
    }, 600);
  } else {
    container.children[0].innerHTML = blurb;
    container.className = container.children[0].className = 'active';
  }
  evt.target.elements.submit.value = 'generate again'
  return false;
}

document.generator.onsubmit = function(evt){
  evt.preventDefault();
  return generateBlurb(evt);
}

FastClick.attach(document.body);

var ipsum = new Ipsum();
ipsum.init();

