var sw = require('standingwavejs');
var EventEmitter = require('events').EventEmitter;

function SimpleModPlay(path, swfPath){
  EventEmitter.call(this);
  this.swfPath = swfPath || 'standingwavejs.swf';
  if (path) this.load(path);
  
}
SimpleModPlay.prototype = new EventEmitter;


SimpleModPlay.prototype.play = function(){
  this.emit('play');
}

SimpleModPlay.prototype.pause = function(){
  this.emit('pause');
}

SimpleModPlay.prototype.stop = function(){
  this.emit('stop');
}

SimpleModPlay.prototype.load = function(path){
  this.emit('load', path);
}

module.exports = SimpleModPlay;