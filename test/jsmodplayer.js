var expect = require('chai').expect;
var jsmodplayer = require('../');

describe('jsmodplayer', function(){
  describe('exported API', function(){
    it('should have .load()', function(){
      expect(jsmodplayer).to.have.property('load');
    })
    it('should have .play()', function(){
      expect(jsmodplayer).to.have.property('play');
    })
    it('should have .pause()', function(){
      expect(jsmodplayer).to.have.property('pause');
    })
    it('should have .stop()', function(){
      expect(jsmodplayer).to.have.property('stop');
    })
    it('should have .playing', function(){
      expect(jsmodplayer).to.have.property('playing');
    })
    it('should have .swfPath', function(){
      expect(jsmodplayer).to.have.property('swfPath');
    })
  })
})
