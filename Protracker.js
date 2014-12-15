!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Protracker=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(Protracker){
  Protracker.prototype.parseIT = function()
  {
    console.log('Parse IMPULSE TRACKER file');
    console.log('unfinished');
    var i,j,d;

    if (!this.buffer) return false;

    var data = {
       id:            {start:0,length:4,decode:true}
      ,name:          {start:4,length:27,decode:true}
      ,nbOrder:       {start:32,length:1}
      ,nbInstruments: {start:34,length:1}
      ,nbSamples:     {start:36,length:1}
      ,nbPatterns:    {start:38,length:1}
      ,Cwt:           {start:40,length:1}
      ,Cmwt:          {start:42,length:1}
      ,Flags:         {start:44,length:1}
      ,Special:       {start:46,length:1}
      ,GlobalVolume:  {start:48,length:1}
      ,MixVolume:     {start:49,length:1}
      ,speed:         {start:50,length:1}
      ,tempo:         {start:51,length:1}
      ,sep:           {start:52,length:1}
      ,MsgLgth:       {start:54,length:1}
      ,MessageOffset: {start:56,length:4}
      ,ChnlPan:       {start:61,lengthData:64}
      ,ChnlVol:       {start:61,lengthData:64}
      ,patternOrder:  {start:192,lengthData:'nbOrder'}
    };

    for(d in data)
    {
      var s   = data[d];
      var r   = '';
      var a   = [];
      var len = s.lengthData ? parseInt(data[s.lengthData]) : s.length;

      for(i=0;i<len;i++)
      {
        var offset = s.start+i;
        var val = this.buffer[offset];
        if(s.decode){
          r+=String.fromCharCode(val);
        }else if(s.lengthData)
        {
          a.push(hb(val));
          r = a;
        }else{
          r+=parseInt(val);
        }
      }
      data[d]=r;
    }

    console.debug('== working in progress ==');
    console.debug('== debug ==');
    console.debug(data);
    this.stop();
    return false;

    this.channels   = data.channels;
    this.songlen    = data.patternOrder.length;
    this.title      = data.name;
    this.samples    = data.nbInstruments;
    this.vu         = new Array();

    for(i=0;i<this.channels;i++) this.vu[i]=0.0;

    for(i=0;i<this.samples;i++) {
      var st=20+i*30;
      j=0;
      while(this.buffer[st+j] && j<22) {
        this.sample[i].name+=
          ((this.buffer[st+j]>0x1f) && (this.buffer[st+j]<0x7f)) ?
            (String.fromCharCode(this.buffer[st+j])) :
            (" ");
        j++;
      }

      console.log(i,this.sample[i].name);

      this.sample[i].length=2*(this.buffer[st+22]*256 + this.buffer[st+23]);
      this.sample[i].finetune=this.buffer[st+24];
      if (this.sample[i].finetune > 7) this.sample[i].finetune=this.sample[i].finetune-16;
      this.sample[i].volume=this.buffer[st+25];
      this.sample[i].loopstart=2*(this.buffer[st+26]*256 + this.buffer[st+27]);
      this.sample[i].looplength=2*(this.buffer[st+28]*256 + this.buffer[st+29]);
      if (this.sample[i].looplength==2) this.sample[i].looplength=0;
      if (this.sample[i].loopstart>this.sample[i].length) {
        this.sample[i].loopstart=0;
        this.sample[i].looplength=0;
      }
    }

    return true;


    if (this.buffer[951] != 127) this.repeatpos=this.buffer[951];
    for(i=0;i<128;i++) {
      this.patterntable[i]=this.buffer[952+i];
      if (this.patterntable[i] > this.patterns) this.patterns=this.patterntable[i];
    }
    this.patterns+=1;
    var patlen=4*64*this.channels;

    this.pattern=new Array();
    this.note=new Array();
    this.patterns=parseInt(this.buffer[72]+this.buffer[72]);
    for(i=0;i<this.patterns;i++) {
      this.pattern[i]=new Uint8Array(patlen);
      this.note[i]=new Uint8Array(this.channels*64);
      for(j=0;j<patlen;j++) this.pattern[i][j]=this.buffer[1084+i*patlen+j];
      for(j=0;j<64;j++) for(c=0;c<this.channels;c++) {
        this.note[i][j*this.channels+c]=0;
        var n=(this.pattern[i][j*4*this.channels+c*4]&0x0f)<<8 | this.pattern[i][j*4*this.channels+c*4+1];
        for(var np=0; np<this.baseperiodtable.length; np++)
          if (n==this.baseperiodtable[np]) this.note[i][j*this.channels+c]=np;
      }
    }

    console.debug(this)

    return true;
    var sst=1084+this.patterns*patlen;
    for(i=0;i<this.samples;i++) {
      this.sample[i].data=new Float32Array(this.sample[i].length);
      for(j=0;j<this.sample[i].length;j++) {
        var q=this.buffer[sst+j];
        if (q<128) {
          q=q/128.0;
        } else {
          q=((q-128)/128.0)-1.0;
        }

        this.sample[i].data[j]=q;
      }
      sst+=this.sample[i].length;
    }

    this.ready=true;
    this.loading=false;
    this.buffer=0;

    if (this.context) this.lowpassNode.frequency.value=28867;

    this.onReady();
    return true;
  };

};
},{}],2:[function(require,module,exports){
module.exports = function(Protracker){
  Protracker.prototype.parseMOD = function()
  {
    var i,j;
    this.vu=[];
    for(i=0;i<this.channels;i++) this.vu[i]=0.0;

    i=0;
    while(this.buffer[i] && i<20)
      this.title=this.title+String.fromCharCode(this.buffer[i++]);

    for(i=0;i<this.samples;i++) {
      var st=20+i*30;
      j=0;
      while(this.buffer[st+j] && j<22) {
        this.sample[i].name+=
          ((this.buffer[st+j]>0x1f) && (this.buffer[st+j]<0x7f)) ?
            (String.fromCharCode(this.buffer[st+j])) :
            (" ");
        j++;
      }
      this.sample[i].length=2*(this.buffer[st+22]*256 + this.buffer[st+23]);
      this.sample[i].finetune=this.buffer[st+24];
      if (this.sample[i].finetune > 7) this.sample[i].finetune=this.sample[i].finetune-16;
      this.sample[i].volume=this.buffer[st+25];
      this.sample[i].loopstart=2*(this.buffer[st+26]*256 + this.buffer[st+27]);
      this.sample[i].looplength=2*(this.buffer[st+28]*256 + this.buffer[st+29]);
      if (this.sample[i].looplength==2) this.sample[i].looplength=0;
      if (this.sample[i].loopstart>this.sample[i].length) {
        this.sample[i].loopstart=0;
        this.sample[i].looplength=0;
      }
    }

    this.songlen=this.buffer[950];
    if (this.buffer[951] != 127) this.repeatpos=this.buffer[951];
    for(i=0;i<128;i++) {
      this.patterntable[i]=this.buffer[952+i];
      if (this.patterntable[i] > this.patterns) this.patterns=this.patterntable[i];
    }
    this.patterns+=1;
    var patlen=4*64*this.channels;

    this.pattern=[];
    this.note=[];
    for(i=0;i<this.patterns;i++) {
      this.pattern[i]=new Uint8Array(patlen);
      this.note[i]=new Uint8Array(this.channels*64);
      for(j=0;j<patlen;j++) this.pattern[i][j]=this.buffer[1084+i*patlen+j];
      for(j=0;j<64;j++) for(c=0;c<this.channels;c++) {
        this.note[i][j*this.channels+c]=0;
        var n=(this.pattern[i][j*4*this.channels+c*4]&0x0f)<<8 | this.pattern[i][j*4*this.channels+c*4+1];
        for(var np=0; np<this.baseperiodtable.length; np++)
          if (n==this.baseperiodtable[np]) this.note[i][j*this.channels+c]=np;
      }
    }

    var sst=1084+this.patterns*patlen;
    for(i=0;i<this.samples;i++) {
      this.sample[i].data=new Float32Array(this.sample[i].length);
      for(j=0;j<this.sample[i].length;j++) {
        var q=this.buffer[sst+j];
        if (q<128) {
          q=q/128.0;
        } else {
          q=((q-128)/128.0)-1.0;
        }

        this.sample[i].data[j]=q;
      }
      sst+=this.sample[i].length;
    }

    this.ready=true;
    this.loading=false;
    this.buffer=0;

    if (this.context) this.lowpassNode.frequency.value=28867;

    this.onReady();
    return true;
  };
}
},{}],3:[function(require,module,exports){
module.exports = function(Protracker){
  Protracker.prototype.parseXM = function()
  {
    console.log('Parse FT2 file');
    console.log('unfinished');
    this.stop();
    var i,j,d;

    if (!this.buffer) return false;
    //this.buffer=new Uint8Array(this.response);
    //console.debug(this.buffer);

    /*
     0 17 char ID text 'Extended module: '
     17 20 char Module name 'Bellissima 99 (mix) '
     37 1 byte 0x1A 1A
     38 20 char Tracker name 'FastTracker v2.00 '
     58 2 word Version number 04 01
     60 4 dword Header size 14 01 00 00
     64 2 word Song length 3E 00 (1..256)
     66 2 word Restart position 00 00
     68 2 word Number of channels 20 00 (0..32/64)
     70 2 word Number of patterns 37 00 (1..256)
     72 2 word Number of instruments 12 00 (0..128)
     74 2 word Flags 01 00
     76 2 word Default tempo 05 00
     78 2 word Default BPM 98 00
     80 ? byte Pattern order table 00 01 02 03 ...
     */
    var data = {
      id:            {start:0,length:16,decode:true}
      ,name:          {start:17,length:20,decode:true}
      //,'0x1A':        {start:37,length:1,decode:true}
      ,tracker:       {start:38,length:17,decode:true}
      ,version:       {start:58,length:1}
      ,songlen:       {start:64,length:1}
      ,channels:      {start:68,length:1}
      ,nbInstruments: {start:70,length:1}
      ,nbPatterns:    {start:72,length:1}
      ,tempo:         {start:76,length:1}
      ,bpm:           {start:78,length:1}
      ,patternOrder:  {start:80,lengthData:'songlen'}
    };

    for(d in data)
    {
      var s   = data[d];
      var r   = '';
      var a   = new Array();
      var len = s.lengthData ? parseInt(data[s.lengthData]) : s.length;

      for(i=0;i<len;i++)
      {
        var val = this.buffer[s.start+i];
        if(s.decode){
          r+=String.fromCharCode(val);
        }else if(s.lengthData)
        {
          a.push(val);
          r = a;
        }else{
          r+=parseInt(val);
        }
      }
      data[d]=r;
    }
    var o = 80+parseInt(data.songlen);
    data.restart = this.buffer[o];

    console.debug(data);
    this.stop();
    return true;

    this.channels   = data.channels;
    this.songlen    = data.patternOrder.length;
    this.title      = data.name;
    this.samples    = data.nbInstruments;
    this.vu         = new Array();

    for(i=0;i<this.channels;i++) this.vu[i]=0.0;

    for(i=0;i<this.samples;i++) {
      var st=20+i*30;
      j=0;
      while(this.buffer[st+j] && j<22) {
        this.sample[i].name+=
          ((this.buffer[st+j]>0x1f) && (this.buffer[st+j]<0x7f)) ?
            (String.fromCharCode(this.buffer[st+j])) :
            (" ");
        j++;
      }


      console.log(i,this.sample[i].name);

      this.sample[i].length=2*(this.buffer[st+22]*256 + this.buffer[st+23]);
      this.sample[i].finetune=this.buffer[st+24];
      if (this.sample[i].finetune > 7) this.sample[i].finetune=this.sample[i].finetune-16;
      this.sample[i].volume=this.buffer[st+25];
      this.sample[i].loopstart=2*(this.buffer[st+26]*256 + this.buffer[st+27]);
      this.sample[i].looplength=2*(this.buffer[st+28]*256 + this.buffer[st+29]);
      if (this.sample[i].looplength==2) this.sample[i].looplength=0;
      if (this.sample[i].loopstart>this.sample[i].length) {
        this.sample[i].loopstart=0;
        this.sample[i].looplength=0;
      }
    }

    return true;


    if (this.buffer[951] != 127) this.repeatpos=this.buffer[951];
    for(i=0;i<128;i++) {
      this.patterntable[i]=this.buffer[952+i];
      if (this.patterntable[i] > this.patterns) this.patterns=this.patterntable[i];
    }
    this.patterns+=1;
    var patlen=4*64*this.channels;

    this.pattern=new Array();
    this.note=new Array();
    this.patterns=parseInt(this.buffer[72]+this.buffer[72]);
    for(i=0;i<this.patterns;i++) {
      this.pattern[i]=new Uint8Array(patlen);
      this.note[i]=new Uint8Array(this.channels*64);
      for(j=0;j<patlen;j++) this.pattern[i][j]=this.buffer[1084+i*patlen+j];
      for(j=0;j<64;j++) for(c=0;c<this.channels;c++) {
        this.note[i][j*this.channels+c]=0;
        var n=(this.pattern[i][j*4*this.channels+c*4]&0x0f)<<8 | this.pattern[i][j*4*this.channels+c*4+1];
        for(var np=0; np<this.baseperiodtable.length; np++)
          if (n==this.baseperiodtable[np]) this.note[i][j*this.channels+c]=np;
      }
    }

    console.debug(this)

    return true;
    var sst=1084+this.patterns*patlen;
    for(i=0;i<this.samples;i++) {
      this.sample[i].data=new Float32Array(this.sample[i].length);
      for(j=0;j<this.sample[i].length;j++) {
        var q=this.buffer[sst+j];
        if (q<128) {
          q=q/128.0;
        } else {
          q=((q-128)/128.0)-1.0;
        }

        this.sample[i].data[j]=q;
      }
      sst+=this.sample[i].length;
    }

    this.ready=true;
    this.loading=false;
    this.buffer=0;

    if (this.context) this.lowpassNode.frequency.value=28867;

    this.onReady();
    return true;
  };
};
},{}],4:[function(require,module,exports){
/*
  amiga protracker module player for web audio api
  (c) 2012-2014 firehawk/tda  (firehawk@haxor.fi)
  
  originally hacked together in a weekend, so please excuse
  me for the spaghetti code. :)
  feel free to use this player in your website/demo/whatever
  if you find it useful. drop me an email if you do.
  AMIGAAAAAAAAH!!
  all code licensed under MIT license:
  http://opensource.org/licenses/MIT
  kinda sorta changelog:
  (sep 2014)
  - fixed bug with E8x sync and added 80x to also function for sync
    events due to problems with some protracker versions (thanks spot)
  (aug 2014)
  - added sync event queue for E8x commands
  - changed the amiga fixed filter model to allow changes at runtime
  - three stereo separation modes now, 0=amiga, 1=65/35, 2=mono
  - a few bugfixes, thanks spot^uprough and esau^traktor for reporting
    * fixed bug in slide-to-note when 300 with no preceeding 3xy
    * fixed vibrato depth on ticks 1+ to match tick 0
    * added boolean variable for disabling A500 fixed lowpass filter
    * added a delay on module start, number of buffers selectable
    * fixed sample loop discarding pointer overflow
  (may 2014)
  - added boolean variable for the amiga led filter for ui stuff
  (jan 2014)
  - disabled ee0 filter command for tracks with over 4 channels to
    make mod.dope play correctly
  (oct 2013)
  - added support for firefox 24
  (apr 2013)
  - changed the logic for pattern break/jump. mod.pattern_skank now
    plays correctly.
  (feb 2013)
  - fixed NaN samples with mod.fractured and mod.multicolour (thanks Aegis!)
  (jan 2013)
  - fixed vibrato amplitude (was half of what it should be, apparently)
  - fixed to work on safari again (thanks Matt Diamond @ stackoverflow.com)
  (dec 2012)
  - replaced effect switch-statement with jumptables
  - fixed clicks (bad loops, empty samples)
  - fixed playback bug with sample-only rows
  - added amiga 500 lowpass filters (not 100% authentic, though)
  - added compressor to output
  - latest safari has broken web audio so chrome-only for now
  (aug 2012)
  - first version written from scratch
  todo:
  - pattern looping is way broken in mod.black_queen
  - properly test EEx delay pattern
  - implement the rest of the effects
  - optimize for more speed!! SPEEEED!!
    * switch to fixed point sample pointers, Math.floor() is _slow_ on iOS
*/

// constructor for protracker player object
function Protracker()
{
  var i, t;

  this.initialize();
  this.clearsong();

  this.url="";
  this.loading=false;
  this.ready=false;
  this.playing=false;
  this.buffer=0;
  this.mixerNode=0;
  this.paused=false;
  this.repeat=false;
  this.filter=false;

  this.separation=1;
  this.palclock=true;
  this.amiga500=true;
  
  this.autostart=false;
  this.bufferstodelay=4; // adjust this if you get stutter after loading new song
  this.delayfirst=0;
  this.delayload=0;

  this.syncqueue=[];

  this.onReady=function(){};
  this.onPlay=function(){};
  this.onStop=function(){};

  this.context = null;
  this.samplerate=44100;
  this.bufferlen=2048;

  // paula period values
  this.baseperiodtable=new Array(
    856,808,762,720,678,640,604,570,538,508,480,453,
    428,404,381,360,339,320,302,285,269,254,240,226,
    214,202,190,180,170,160,151,143,135,127,120,113);

  // finetune multipliers
  this.finetunetable=new Array();
  for(t=0;t<16;t++) this.finetunetable[t]=Math.pow(2, (t-8)/12/8);
  
  // calc tables for vibrato waveforms
  this.vibratotable=new Array();
  for(t=0;t<4;t++) {
    this.vibratotable[t]=new Array();
    for(var i=0;i<64;i++) {
      switch(t) {
        case 0:
          this.vibratotable[t][i]=127*Math.sin(Math.PI*2*(i/64));
          break;
        case 1:
          this.vibratotable[t][i]=127-4*i;
          break;
        case 2:
          this.vibratotable[t][i]=(i<32)?127:-127;
          break;
        case 3:
          this.vibratotable[t][i]=(1-2*Math.random())*127;
          break;
      }
    }
  }

  // effect jumptables
  this.effects_t0 = new Array(
    this.effect_t0_0, this.effect_t0_1, this.effect_t0_2, this.effect_t0_3, this.effect_t0_4, this.effect_t0_5, this.effect_t0_6, this.effect_t0_7,
    this.effect_t0_8, this.effect_t0_9, this.effect_t0_a, this.effect_t0_b, this.effect_t0_c, this.effect_t0_d, this.effect_t0_e, this.effect_t0_f);
  this.effects_t0_e = new Array(
    this.effect_t0_e0, this.effect_t0_e1, this.effect_t0_e2, this.effect_t0_e3, this.effect_t0_e4, this.effect_t0_e5, this.effect_t0_e6, this.effect_t0_e7,
    this.effect_t0_e8, this.effect_t0_e9, this.effect_t0_ea, this.effect_t0_eb, this.effect_t0_ec, this.effect_t0_ed, this.effect_t0_ee, this.effect_t0_ef);
  this.effects_t1 = new Array(
    this.effect_t1_0, this.effect_t1_1, this.effect_t1_2, this.effect_t1_3, this.effect_t1_4, this.effect_t1_5, this.effect_t1_6, this.effect_t1_7,
    this.effect_t1_8, this.effect_t1_9, this.effect_t1_a, this.effect_t1_b, this.effect_t1_c, this.effect_t1_d, this.effect_t1_e, this.effect_t1_f);
  this.effects_t1_e = new Array(
    this.effect_t1_e0, this.effect_t1_e1, this.effect_t1_e2, this.effect_t1_e3, this.effect_t1_e4, this.effect_t1_e5, this.effect_t1_e6, this.effect_t1_e7,
    this.effect_t1_e8, this.effect_t1_e9, this.effect_t1_ea, this.effect_t1_eb, this.effect_t1_ec, this.effect_t1_ed, this.effect_t1_ee, this.effect_t1_ef);


}



// create the web audio context
Protracker.prototype.createContext = function()
{
  if ( typeof AudioContext !== 'undefined') {
    this.context = new AudioContext();
  } else {
    this.context = new webkitAudioContext();
  }
  this.samplerate=this.context.sampleRate;
  this.bufferlen=(this.samplerate > 44100) ? 4096 : 2048; 

  // Amiga 500 fixed filter at 6kHz. WebAudio lowpass is 12dB/oct, whereas
  // older Amigas had a 6dB/oct filter at 4900Hz. 
  this.filterNode=this.context.createBiquadFilter();
  if (this.amiga500) {
    this.filterNode.frequency.value=6000;
  } else {
    this.filterNode.frequency.value=28867;
  }

  // "LED filter" at 3275kHz - off by default
  this.lowpassNode=this.context.createBiquadFilter();
  this.lowpassNode.frequency.value=28867;
  this.filter=false;

  // mixer
  if ( typeof this.context.createJavaScriptNode === 'function') {
    this.mixerNode=this.context.createJavaScriptNode(this.bufferlen, 1, 2);
  } else {
    this.mixerNode=this.context.createScriptProcessor(this.bufferlen, 1, 2);
  }
  this.mixerNode.module=this;
  this.mixerNode.onaudioprocess=Protracker.prototype.mix;

  // compressor for a bit of volume boost, helps with multich tunes
  this.compressorNode=this.context.createDynamicsCompressor();

  // patch up some cables :)  
  this.mixerNode.connect(this.filterNode);
  this.filterNode.connect(this.lowpassNode);
  this.lowpassNode.connect(this.compressorNode);
  this.compressorNode.connect(this.context.destination);
}



// play loaded and parsed module with webaudio context
Protracker.prototype.play = function()
{
  if (this.context==null) this.createContext();
  
  if (!this.ready) return false;
  if (this.paused) {
    this.paused=false;
    return true;
  }
  this.endofsong=false;
  this.paused=false;
  this.initialize();
  this.flags=1+2;
  this.playing=true;
  this.onPlay();
  this.delayfirst=this.bufferstodelay;
  return true;
}



// pause playback
Protracker.prototype.pause = function()
{
  if (!this.paused) {
    this.paused=true;
  } else {
    this.paused=false;
  }
}



// stop playback
Protracker.prototype.stop = function()
{
  this.playing=false;
  this.onStop();
  this.delayload=1;
}



// stop playing but don't call callbacks
Protracker.prototype.stopaudio = function(st)
{
  this.playing=st;
}



// jump positions forward/back
Protracker.prototype.jump = function(step)
{
  this.tick=0;
  this.row=0;
  this.position+=step;
  this.flags=1+2;  
  if (this.position<0) this.position=0;
  if (this.position >= this.songlen) this.stop();
}



// set whether module repeats after songlen
Protracker.prototype.setrepeat = function(rep)
{
  this.repeat=rep;
}



// set stereo separation mode (0=paula, 1=betterpaula (60/40), 2=mono)
Protracker.prototype.setseparation = function(sep)
{
  this.separation=sep;
}



// set amiga video standard (false=NTSC, true=PAL)
Protracker.prototype.setamigatype = function(clock)
{
  this.palclock=clock;
}



// set autostart to play immediately after loading
Protracker.prototype.setautostart = function(st)
{
  this.autostart=st;
}





// set amiga model - changes fixed filter state
Protracker.prototype.setamigamodel = function(amiga)
{
  if (amiga=="600" || amiga=="1200" || amiga=="4000") {
    this.amiga500=false;
    if (this.filterNode) this.filterNode.frequency.value=28867;
  } else {
    this.amiga500=true;
    if (this.filterNode) this.filterNode.frequency.value=6000;
  }
}



// are there E8x sync events queued?
Protracker.prototype.hassyncevents = function()
{
  return (this.syncqueue.length != 0);
}



// pop oldest sync event nybble from the FIFO queue
Protracker.prototype.popsyncevent = function()
{
  return this.syncqueue.pop();
}



// clear song data
Protracker.prototype.clearsong = function()
{  
  this.title="";
  this.signature="";
  this.songlen=1;
  this.repeatpos=0;
  this.patterntable=new ArrayBuffer(128);
  for(var i=0;i<128;i++) this.patterntable[i]=0;

  this.channels=4;

  this.sample=new Array();
  this.samples=31;
  for(var i=0;i<31;i++) {
    this.sample[i]=new Object();
    this.sample[i].name="";
    this.sample[i].length=0;
    this.sample[i].finetune=0;
    this.sample[i].volume=64;
    this.sample[i].loopstart=0;
    this.sample[i].looplength=0;
    this.sample[i].data=0;
  }

  this.patterns=0;
  this.pattern=new Array();
  this.note=new Array();
  
  this.looprow=0;
  this.loopstart=0;
  this.loopcount=0;
  
  this.patterndelay=0;
  this.patternwait=0;
  
  this.syncqueue=[];
}


// initialize all player variables
Protracker.prototype.initialize = function()
{
  this.syncqueue=[];

  this.tick=0;
  this.position=0;
  this.row=0;
  this.offset=0;
  this.flags=0;

  this.speed=6;
  this.bpm=125;
  this.breakrow=0;
  this.patternjump=0;
  this.patterndelay=0;
  this.patternwait=0;
  this.endofsong=false;
  
  this.channel=new Array();
  for(var i=0;i<this.channels;i++) {
    this.channel[i]=new Object();
    this.channel[i].sample=0;
    this.channel[i].period=214;
    this.channel[i].voiceperiod=214;
    this.channel[i].note=24;    
    this.channel[i].volume=64;
    this.channel[i].command=0;
    this.channel[i].data=0;
    this.channel[i].samplepos=0;
    this.channel[i].samplespeed=0;
    this.channel[i].flags=0;
    this.channel[i].noteon=0;
    this.channel[i].slidespeed=0;
    this.channel[i].slideto=214;
    this.channel[i].slidetospeed=0;
    this.channel[i].arpeggio=0;

    this.channel[i].semitone=12;
    this.channel[i].vibratospeed=0
    this.channel[i].vibratodepth=0
    this.channel[i].vibratopos=0;
    this.channel[i].vibratowave=0;
  }
  this.vu=new Array();
}



// load module from url into local buffer
Protracker.prototype.load = function(url)
{
    this.playing=false; // a precaution

    this.url=url;
    this.clearsong();
    
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.responseType = "arraybuffer";
    this.request = request;
    this.loading=true;
    var asset = this;
    request.onload = function() {
        asset.buffer=new Uint8Array(request.response);
        asset.parse();
        if (asset.autostart) asset.play();
    }
    request.send();  
}



// parse the module from local buffer
Protracker.prototype.parse = function()
{
  var i,j,c;
  
  if (!this.buffer) return false;
  
  for(var i=0;i<4;i++) this.signature+=String.fromCharCode(this.buffer[1080+i]);
  switch (this.signature) {
    case "M.K.":
    case "M!K!":
    case "4CHN":
    case "FLT4":
      break;

    case "6CHN":
      this.channels=6;
      break;
      
    case "8CHN":
    case "FLT8":
      this.channels=8;
      break;

    case "28CH":
      this.channels=28;
      break;
    
    default:
      return false;
  }
  this.vu=new Array();
  for(var i=0;i<this.channels;i++) this.vu[i]=0.0;
  
  i=0;
  while(this.buffer[i] && i<20)
    this.title=this.title+String.fromCharCode(this.buffer[i++]);

  for(var i=0;i<this.samples;i++) {
    var st=20+i*30;
    j=0;
    while(this.buffer[st+j] && j<22) { 
      this.sample[i].name+=
        ((this.buffer[st+j]>0x1f) && (this.buffer[st+j]<0x7f)) ? 
        (String.fromCharCode(this.buffer[st+j])) :
        (" ");
      j++;
    }
    this.sample[i].length=2*(this.buffer[st+22]*256 + this.buffer[st+23]);
    this.sample[i].finetune=this.buffer[st+24];
    if (this.sample[i].finetune > 7) this.sample[i].finetune=this.sample[i].finetune-16;
    this.sample[i].volume=this.buffer[st+25];
    this.sample[i].loopstart=2*(this.buffer[st+26]*256 + this.buffer[st+27]);
    this.sample[i].looplength=2*(this.buffer[st+28]*256 + this.buffer[st+29]);
    if (this.sample[i].looplength==2) this.sample[i].looplength=0;
    if (this.sample[i].loopstart>this.sample[i].length) {
      this.sample[i].loopstart=0;
      this.sample[i].looplength=0;
    }
  }

  this.songlen=this.buffer[950];
  if (this.buffer[951] != 127) this.repeatpos=this.buffer[951];
  for(var i=0;i<128;i++) {
    this.patterntable[i]=this.buffer[952+i];
    if (this.patterntable[i] > this.patterns) this.patterns=this.patterntable[i];
  }
  this.patterns+=1;
  var patlen=4*64*this.channels;

  this.pattern=new Array();
  this.note=new Array();
  for(var i=0;i<this.patterns;i++) {
    this.pattern[i]=new Uint8Array(patlen);
    this.note[i]=new Uint8Array(this.channels*64);
    for(j=0;j<patlen;j++) this.pattern[i][j]=this.buffer[1084+i*patlen+j];
    for(j=0;j<64;j++) for(c=0;c<this.channels;c++) {
      this.note[i][j*this.channels+c]=0;
      var n=(this.pattern[i][j*4*this.channels+c*4]&0x0f)<<8 | this.pattern[i][j*4*this.channels+c*4+1];
      for(var np=0; np<this.baseperiodtable.length; np++)
        if (n==this.baseperiodtable[np]) this.note[i][j*this.channels+c]=np;
    }        
  }
  
  var sst=1084+this.patterns*patlen;
  for(var i=0;i<this.samples;i++) {
    this.sample[i].data=new Float32Array(this.sample[i].length);
    for(j=0;j<this.sample[i].length;j++) {
      var q=this.buffer[sst+j];
      if (q<128) {
        q=q/128.0;
      } else {
        q=((q-128)/128.0)-1.0;
      }
      
      this.sample[i].data[j]=q;
    }
    sst+=this.sample[i].length;
  }

  if (this.context) {
    this.lowpassNode.frequency.value=28867;
    this.filter=false;
  }

  this.ready=true;
  this.loading=false;
  this.buffer=0;

  this.onReady();
  return true;
}



// advance player
Protracker.prototype.advance=function(mod) {
  var spd=(((mod.samplerate*60)/mod.bpm)/4)/6;

  // advance player
  if (mod.offset>spd) { mod.tick++; mod.offset=0; mod.flags|=1; }
  if (mod.tick>=mod.speed) {

    if (mod.patterndelay) { // delay pattern
      if (mod.tick < ((mod.patternwait+1)*mod.speed)) {
        mod.patternwait++;
      } else {
        mod.row++; mod.tick=0; mod.flags|=2; mod.patterndelay=0;
      }
    }
    else {

      if (mod.flags&(16+32+64)) {
        if (mod.flags&64) { // loop pattern?
          mod.row=mod.looprow;
          mod.flags&=0xa1;
          mod.flags|=2;
        }
        else {
          if (mod.flags&16) { // pattern jump/break?
            //console.log("break to pattern " + mod.patternjump + " row "+mod.breakrow);
            mod.position=mod.patternjump;
            mod.row=mod.breakrow;
            mod.patternjump=0;
            mod.breakrow=0;
            mod.flags&=0xe1;
            mod.flags|=2;
          }
        }
        mod.tick=0;
      } else {
        mod.row++; mod.tick=0; mod.flags|=2;
      }
    }
  }
  if (mod.row>=64) { mod.position++; mod.row=0; mod.flags|=4; }
  if (mod.position>=mod.songlen) {
    if (mod.repeat) {
      mod.position=0;
    } else {
      this.endofsong=true;
      mod.stop();
    }
    return;
  }
}



// mix an audio buffer with data
Protracker.prototype.mix = function(ape) {
  var f;
  var p, pp, n, nn;
  var mod;
  if (ape.srcElement) {
    mod=ape.srcElement.module;
  } else {
    mod=this.module;
  }
  outp=new Array();

  var bufs=new Array(ape.outputBuffer.getChannelData(0), ape.outputBuffer.getChannelData(1));
  var buflen=ape.outputBuffer.length;
  for(var s=0;s<buflen;s++)
  {
    outp[0]=0.0;
    outp[1]=0.0;

    if (!mod.paused && mod.playing && mod.delayfirst==0)
    {
      mod.advance(mod);

      var och=0;
      for(var ch=0;ch<mod.channels;ch++)
      {
        // calculate playback position
        p=mod.patterntable[mod.position];
        pp=mod.row*4*mod.channels + ch*4;
        if (mod.flags&2) { // new row
          mod.channel[ch].command=mod.pattern[p][pp+2]&0x0f;
          mod.channel[ch].data=mod.pattern[p][pp+3];

          if (!(mod.channel[ch].command==0x0e && (mod.channel[ch].data&0xf0)==0xd0)) {
            n=(mod.pattern[p][pp]&0x0f)<<8 | mod.pattern[p][pp+1];
            if (n) {
              // noteon, except if command=3 (porta to note)
              if ((mod.channel[ch].command != 0x03) && (mod.channel[ch].command != 0x05)) {
                mod.channel[ch].period=n;
                mod.channel[ch].samplepos=0;
                if (mod.channel[ch].vibratowave>3) mod.channel[ch].vibratopos=0;
                mod.channel[ch].flags|=3; // recalc speed
                mod.channel[ch].noteon=1;
              }
              // in either case, set the slide to note target
              mod.channel[ch].slideto=n;
            }
            nn=mod.pattern[p][pp+0]&0xf0 | mod.pattern[p][pp+2]>>4;
            if (nn) {
              mod.channel[ch].sample=nn-1;
              mod.channel[ch].volume=mod.sample[nn-1].volume;
              if (!n && (mod.channel[ch].samplepos > mod.sample[nn-1].length)) mod.channel[ch].samplepos=0;
            }
          }
        }
        mod.channel[ch].voiceperiod=mod.channel[ch].period;
        
        // kill empty samples
        if (!mod.sample[mod.channel[ch].sample].length) mod.channel[ch].noteon=0;

        // effects        
        if (mod.flags&1) {
          if (!mod.tick) {
            // process only on tick 0
            mod.effects_t0[mod.channel[ch].command](mod, ch);
          } else {
            mod.effects_t1[mod.channel[ch].command](mod, ch);    
          }
        }

        // recalc note number from period
        if (mod.channel[ch].flags&2) {
          for(var np=0; np<mod.baseperiodtable.length; np++)
            if (mod.baseperiodtable[np]>=mod.channel[ch].period) mod.channel[ch].note=np;
          mod.channel[ch].semitone=7;
          if (mod.channel[ch].period>=120)
            mod.channel[ch].semitone=mod.baseperiodtable[mod.channel[ch].note]-mod.baseperiodtable[mod.channel[ch].note+1];
        }

        // recalc sample speed and apply finetune
        if ((mod.channel[ch].flags&1 || mod.flags&2) && mod.channel[ch].voiceperiod)
          mod.channel[ch].samplespeed=
            (mod.palclock ? 7093789.2 : 7159090.5)/(mod.channel[ch].voiceperiod*2) * mod.finetunetable[mod.sample[mod.channel[ch].sample].finetune+8] / mod.samplerate;
        
        // advance vibrato on each new tick
        if (mod.flags&1) {
          mod.channel[ch].vibratopos+=mod.channel[ch].vibratospeed;
          mod.channel[ch].vibratopos&=0x3f;
        }

        // mix channel to output        
        och=och^(ch&1);
        f=0.0;
        if (mod.channel[ch].noteon) {
          if (mod.sample[mod.channel[ch].sample].length > mod.channel[ch].samplepos)
            f=(1.0/mod.channels) *
              (mod.sample[mod.channel[ch].sample].data[Math.floor(mod.channel[ch].samplepos)]*mod.channel[ch].volume)/64.0;
          outp[och]+=f;
          mod.channel[ch].samplepos+=mod.channel[ch].samplespeed;
        }
        if (s==0) mod.vu[ch]=Math.abs(f);

        // loop or end samples
        if (mod.channel[ch].noteon) {
          if (mod.sample[mod.channel[ch].sample].loopstart || mod.sample[mod.channel[ch].sample].looplength) {
            if (mod.channel[ch].samplepos >= (mod.sample[mod.channel[ch].sample].loopstart+mod.sample[mod.channel[ch].sample].looplength)) {
              mod.channel[ch].samplepos-=mod.sample[mod.channel[ch].sample].looplength;
            }
          } else {
            if (mod.channel[ch].samplepos >= mod.sample[mod.channel[ch].sample].length) {
              mod.channel[ch].noteon=0;
            }
          }
        }

        // clear channel flags
        mod.channel[ch].flags=0;
      } 
      mod.offset++;
      mod.flags&=0x70;      
    }
    
    // a more headphone-friendly stereo separation (aka. betterpaula)
    if (mod.separation) {
      t=outp[0];
      if (mod.separation==2) {
        outp[0]=outp[0]*0.5 + outp[1]*0.5;
        outp[1]=outp[1]*0.5 + t*0.5;
      } else {
        outp[0]=outp[0]*0.65 + outp[1]*0.35;
        outp[1]=outp[1]*0.65 + t*0.35;
      }
    }
    bufs[0][s]=outp[0];
    bufs[1][s]=outp[1];
  }
  if (mod.delayfirst>0) mod.delayfirst--; //=false;
  mod.delayload=0;
}



//
// tick 0 effect functions
//
Protracker.prototype.effect_t0_0=function(mod, ch) { // 0 arpeggio
  mod.channel[ch].arpeggio=mod.channel[ch].data;
}
Protracker.prototype.effect_t0_1=function(mod, ch) { // 1 slide up
  if (mod.channel[ch].data) mod.channel[ch].slidespeed=mod.channel[ch].data;
}
Protracker.prototype.effect_t0_2=function(mod, ch) { // 2 slide down
  if (mod.channel[ch].data) mod.channel[ch].slidespeed=mod.channel[ch].data;
}
Protracker.prototype.effect_t0_3=function(mod, ch) { // 3 slide to note
  if (mod.channel[ch].data) mod.channel[ch].slidetospeed=mod.channel[ch].data;
}
Protracker.prototype.effect_t0_4=function(mod, ch) { // 4 vibrato
  if (mod.channel[ch].data&0x0f && mod.channel[ch].data&0xf0) {
    mod.channel[ch].vibratodepth=(mod.channel[ch].data&0x0f);
    mod.channel[ch].vibratospeed=(mod.channel[ch].data&0xf0)>>4;
  }
  mod.channel[ch].voiceperiod+=
    (mod.channel[ch].vibratodepth/32)*mod.channel[ch].semitone*(mod.vibratotable[mod.channel[ch].vibratowave&3][mod.channel[ch].vibratopos]/127);        
  mod.channel[ch].flags|=1;
}
Protracker.prototype.effect_t0_5=function(mod, ch) { // 5
}
Protracker.prototype.effect_t0_6=function(mod, ch) { // 6
}
Protracker.prototype.effect_t0_7=function(mod, ch) { // 7
}
Protracker.prototype.effect_t0_8=function(mod, ch) { // 8 unused, used for syncing
  mod.syncqueue.unshift(mod.channel[ch].data&0x0f);
}
Protracker.prototype.effect_t0_9=function(mod, ch) { // 9 set sample offset
  mod.channel[ch].samplepos=mod.channel[ch].data*256;
}
Protracker.prototype.effect_t0_a=function(mod, ch) { // a
}
Protracker.prototype.effect_t0_b=function(mod, ch) { // b pattern jump
  mod.breakrow=0;
  mod.patternjump=mod.channel[ch].data;
  mod.flags|=16;
}
Protracker.prototype.effect_t0_c=function(mod, ch) { // c set volume
  mod.channel[ch].volume=mod.channel[ch].data;
}
Protracker.prototype.effect_t0_d=function(mod, ch) { // d pattern break
  mod.breakrow=((mod.channel[ch].data&0xf0)>>4)*10 + (mod.channel[ch].data&0x0f);
  if (!(mod.flags&16)) mod.patternjump=mod.position+1;
  mod.flags|=16;  
}
Protracker.prototype.effect_t0_e=function(mod, ch) { // e
  var i=(mod.channel[ch].data&0xf0)>>4;
  mod.effects_t0_e[i](mod, ch);
}
Protracker.prototype.effect_t0_f=function(mod, ch) { // f set speed
  if (mod.channel[ch].data > 32) {
    mod.bpm=mod.channel[ch].data;
  } else {
    if (mod.channel[ch].data) mod.speed=mod.channel[ch].data;
  }
}



//
// tick 0 effect e functions
//
Protracker.prototype.effect_t0_e0=function(mod, ch) { // e0 filter on/off
  if (mod.channels > 4) return; // use only for 4ch amiga tunes
  if (mod.channel[ch].data&0x0f) {
    mod.lowpassNode.frequency.value=3275;
    mod.filter=true;
  } else {
    mod.lowpassNode.frequency.value=28867;
    mod.filter=false;
  }
}
Protracker.prototype.effect_t0_e1=function(mod, ch) { // e1 fine slide up
  mod.channel[ch].period-=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].period < 113) mod.channel[ch].period=113;
}
Protracker.prototype.effect_t0_e2=function(mod, ch) { // e2 fine slide down
  mod.channel[ch].period+=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].period > 856) mod.channel[ch].period=856;
  mod.channel[ch].flags|=1;
}
Protracker.prototype.effect_t0_e3=function(mod, ch) { // e3 set glissando
}
Protracker.prototype.effect_t0_e4=function(mod, ch) { // e4 set vibrato waveform
  mod.channel[ch].vibratowave=mod.channel[ch].data&0x07;
}
Protracker.prototype.effect_t0_e5=function(mod, ch) { // e5 set finetune
}
Protracker.prototype.effect_t0_e6=function(mod, ch) { // e6 loop pattern
  if (mod.channel[ch].data&0x0f) {
    if (mod.loopcount) {
      mod.loopcount--;
    } else {
      mod.loopcount=mod.channel[ch].data&0x0f;
    }
    if (mod.loopcount) mod.flags|=64;
  } else {
    mod.looprow=mod.row;
  }
}
Protracker.prototype.effect_t0_e7=function(mod, ch) { // e7
}
Protracker.prototype.effect_t0_e8=function(mod, ch) { // e8, use for syncing
  mod.syncqueue.unshift(mod.channel[ch].data&0x0f);
}
Protracker.prototype.effect_t0_e9=function(mod, ch) { // e9
}
Protracker.prototype.effect_t0_ea=function(mod, ch) { // ea fine volslide up
  mod.channel[ch].volume+=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].volume > 64) mod.channel[ch].volume=64;
}
Protracker.prototype.effect_t0_eb=function(mod, ch) { // eb fine volslide down
  mod.channel[ch].volume-=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].volume < 0) mod.channel[ch].volume=0;
}
Protracker.prototype.effect_t0_ec=function(mod, ch) { // ec
}
Protracker.prototype.effect_t0_ed=function(mod, ch) { // ed delay sample
  if (mod.tick==(mod.channel[ch].data&0x0f)) {
    // start note
    var p=mod.patterntable[mod.position];
    var pp=mod.row*4*mod.channels + ch*4;            
    n=(mod.pattern[p][pp]&0x0f)<<8 | mod.pattern[p][pp+1];
    if (n) {
      mod.channel[ch].period=n;
      mod.channel[ch].voiceperiod=mod.channel[ch].period;      
      mod.channel[ch].samplepos=0;
      if (mod.channel[ch].vibratowave>3) mod.channel[ch].vibratopos=0;
      mod.channel[ch].flags|=3; // recalc speed
      mod.channel[ch].noteon=1;
    }
    n=mod.pattern[p][pp+0]&0xf0 | mod.pattern[p][pp+2]>>4;
    if (n) {
      mod.channel[ch].sample=n-1;
      mod.channel[ch].volume=mod.sample[n-1].volume;
    }
  }
}
Protracker.prototype.effect_t0_ee=function(mod, ch) { // ee delay pattern
  mod.patterndelay=mod.channel[ch].data&0x0f;
  mod.patternwait=0;
}
Protracker.prototype.effect_t0_ef=function(mod, ch) { // ef
}



//
// tick 1+ effect functions
//
Protracker.prototype.effect_t1_0=function(mod, ch) { // 0 arpeggio
  if (mod.channel[ch].data) {
    var apn=mod.channel[ch].note;
    if ((mod.tick%3)==1) apn+=mod.channel[ch].arpeggio>>4;
    if ((mod.tick%3)==2) apn+=mod.channel[ch].arpeggio&0x0f;
    if (apn>=0 && apn <= mod.baseperiodtable.length)
      mod.channel[ch].voiceperiod = mod.baseperiodtable[apn];
    mod.channel[ch].flags|=1;
  }
}
Protracker.prototype.effect_t1_1=function(mod, ch) { // 1 slide up
  mod.channel[ch].period-=mod.channel[ch].slidespeed;
  if (mod.channel[ch].period<113) mod.channel[ch].period=113;
  mod.channel[ch].flags|=3; // recalc speed
}
Protracker.prototype.effect_t1_2=function(mod, ch) { // 2 slide down
  mod.channel[ch].period+=mod.channel[ch].slidespeed;
  if (mod.channel[ch].period>856) mod.channel[ch].period=856;
  mod.channel[ch].flags|=3; // recalc speed                
}
Protracker.prototype.effect_t1_3=function(mod, ch) { // 3 slide to note
  if (mod.channel[ch].period < mod.channel[ch].slideto) {
    mod.channel[ch].period+=mod.channel[ch].slidetospeed;
    if (mod.channel[ch].period > mod.channel[ch].slideto)
      mod.channel[ch].period=mod.channel[ch].slideto;
  }
  if (mod.channel[ch].period > mod.channel[ch].slideto) {
    mod.channel[ch].period-=mod.channel[ch].slidetospeed;
    if (mod.channel[ch].period<mod.channel[ch].slideto)
      mod.channel[ch].period=mod.channel[ch].slideto;
  }
  mod.channel[ch].flags|=3; // recalc speed
}
Protracker.prototype.effect_t1_4=function(mod, ch) { // 4 vibrato
  mod.channel[ch].voiceperiod+=
    (mod.channel[ch].vibratodepth/32)*mod.channel[ch].semitone*(mod.vibratotable[mod.channel[ch].vibratowave&3][mod.channel[ch].vibratopos]/127);
  mod.channel[ch].flags|=1;
}
Protracker.prototype.effect_t1_5=function(mod, ch) { // 5 volslide + slide to note
  mod.effect_t1_3(mod, ch); // slide to note
  mod.effect_t1_a(mod, ch); // volslide
}
Protracker.prototype.effect_t1_6=function(mod, ch) { // 6 volslide + vibrato
  mod.effect_t1_4(mod, ch); // vibrato
  mod.effect_t1_a(mod, ch); // volslide
}
Protracker.prototype.effect_t1_7=function(mod, ch) { // 7
}
Protracker.prototype.effect_t1_8=function(mod, ch) { // 8 unused

}
Protracker.prototype.effect_t1_9=function(mod, ch) { // 9 set sample offset
}
Protracker.prototype.effect_t1_a=function(mod, ch) { // a volume slide
  if (!(mod.channel[ch].data&0x0f)) {
    // y is zero, slide up
    mod.channel[ch].volume+=(mod.channel[ch].data>>4);
    if (mod.channel[ch].volume>64) mod.channel[ch].volume=64;
  }
  if (!(mod.channel[ch].data&0xf0)) {
    // x is zero, slide down
    mod.channel[ch].volume-=(mod.channel[ch].data&0x0f);
    if (mod.channel[ch].volume<0) mod.channel[ch].volume=0;                  
  }
}
Protracker.prototype.effect_t1_b=function(mod, ch) { // b pattern jump
}
Protracker.prototype.effect_t1_c=function(mod, ch) { // c set volume
}
Protracker.prototype.effect_t1_d=function(mod, ch) { // d pattern break
}
Protracker.prototype.effect_t1_e=function(mod, ch) { // e
  var i=(mod.channel[ch].data&0xf0)>>4;
  mod.effects_t1_e[i](mod, ch);
}
Protracker.prototype.effect_t1_f=function(mod, ch) { // f
}



//
// tick 1+ effect e functions
//
Protracker.prototype.effect_t1_e0=function(mod, ch) { // e0
}
Protracker.prototype.effect_t1_e1=function(mod, ch) { // e1
}
Protracker.prototype.effect_t1_e2=function(mod, ch) { // e2
}
Protracker.prototype.effect_t1_e3=function(mod, ch) { // e3
}
Protracker.prototype.effect_t1_e4=function(mod, ch) { // e4
}
Protracker.prototype.effect_t1_e5=function(mod, ch) { // e5
}
Protracker.prototype.effect_t1_e6=function(mod, ch) { // e6
}
Protracker.prototype.effect_t1_e7=function(mod, ch) { // e7
}
Protracker.prototype.effect_t1_e8=function(mod, ch) { // e8
}
Protracker.prototype.effect_t1_e9=function(mod, ch) { // e9 retrig sample
  if (mod.tick%(mod.channel[ch].data&0x0f)==0)
    mod.channel[ch].samplepos=0;
}
Protracker.prototype.effect_t1_ea=function(mod, ch) { // ea
}
Protracker.prototype.effect_t1_eb=function(mod, ch) { // eb
}
Protracker.prototype.effect_t1_ec=function(mod, ch) { // ec cut sample
  if (mod.tick==(mod.channel[ch].data&0x0f))
    mod.channel[ch].volume=0;
}
Protracker.prototype.effect_t1_ed=function(mod, ch) { // ed delay sample
  mod.effect_t0_ed(mod, ch);
}
Protracker.prototype.effect_t1_ee=function(mod, ch) { // ee
}
Protracker.prototype.effect_t1_ef=function(mod, ch) { // ef
}

// feel free to disable the formats
require('./formats/it')(Protracker);
require('./formats/mod')(Protracker);
require('./formats/xm')(Protracker);

module.exports = Protracker;
},{"./formats/it":1,"./formats/mod":2,"./formats/xm":3}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJmb3JtYXRzL2l0LmpzIiwiZm9ybWF0cy9tb2QuanMiLCJmb3JtYXRzL3htLmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm90cmFja2VyKXtcbiAgUHJvdHJhY2tlci5wcm90b3R5cGUucGFyc2VJVCA9IGZ1bmN0aW9uKClcbiAge1xuICAgIGNvbnNvbGUubG9nKCdQYXJzZSBJTVBVTFNFIFRSQUNLRVIgZmlsZScpO1xuICAgIGNvbnNvbGUubG9nKCd1bmZpbmlzaGVkJyk7XG4gICAgdmFyIGksaixkO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICAgaWQ6ICAgICAgICAgICAge3N0YXJ0OjAsbGVuZ3RoOjQsZGVjb2RlOnRydWV9XG4gICAgICAsbmFtZTogICAgICAgICAge3N0YXJ0OjQsbGVuZ3RoOjI3LGRlY29kZTp0cnVlfVxuICAgICAgLG5iT3JkZXI6ICAgICAgIHtzdGFydDozMixsZW5ndGg6MX1cbiAgICAgICxuYkluc3RydW1lbnRzOiB7c3RhcnQ6MzQsbGVuZ3RoOjF9XG4gICAgICAsbmJTYW1wbGVzOiAgICAge3N0YXJ0OjM2LGxlbmd0aDoxfVxuICAgICAgLG5iUGF0dGVybnM6ICAgIHtzdGFydDozOCxsZW5ndGg6MX1cbiAgICAgICxDd3Q6ICAgICAgICAgICB7c3RhcnQ6NDAsbGVuZ3RoOjF9XG4gICAgICAsQ213dDogICAgICAgICAge3N0YXJ0OjQyLGxlbmd0aDoxfVxuICAgICAgLEZsYWdzOiAgICAgICAgIHtzdGFydDo0NCxsZW5ndGg6MX1cbiAgICAgICxTcGVjaWFsOiAgICAgICB7c3RhcnQ6NDYsbGVuZ3RoOjF9XG4gICAgICAsR2xvYmFsVm9sdW1lOiAge3N0YXJ0OjQ4LGxlbmd0aDoxfVxuICAgICAgLE1peFZvbHVtZTogICAgIHtzdGFydDo0OSxsZW5ndGg6MX1cbiAgICAgICxzcGVlZDogICAgICAgICB7c3RhcnQ6NTAsbGVuZ3RoOjF9XG4gICAgICAsdGVtcG86ICAgICAgICAge3N0YXJ0OjUxLGxlbmd0aDoxfVxuICAgICAgLHNlcDogICAgICAgICAgIHtzdGFydDo1MixsZW5ndGg6MX1cbiAgICAgICxNc2dMZ3RoOiAgICAgICB7c3RhcnQ6NTQsbGVuZ3RoOjF9XG4gICAgICAsTWVzc2FnZU9mZnNldDoge3N0YXJ0OjU2LGxlbmd0aDo0fVxuICAgICAgLENobmxQYW46ICAgICAgIHtzdGFydDo2MSxsZW5ndGhEYXRhOjY0fVxuICAgICAgLENobmxWb2w6ICAgICAgIHtzdGFydDo2MSxsZW5ndGhEYXRhOjY0fVxuICAgICAgLHBhdHRlcm5PcmRlcjogIHtzdGFydDoxOTIsbGVuZ3RoRGF0YTonbmJPcmRlcid9XG4gICAgfTtcblxuICAgIGZvcihkIGluIGRhdGEpXG4gICAge1xuICAgICAgdmFyIHMgICA9IGRhdGFbZF07XG4gICAgICB2YXIgciAgID0gJyc7XG4gICAgICB2YXIgYSAgID0gW107XG4gICAgICB2YXIgbGVuID0gcy5sZW5ndGhEYXRhID8gcGFyc2VJbnQoZGF0YVtzLmxlbmd0aERhdGFdKSA6IHMubGVuZ3RoO1xuXG4gICAgICBmb3IoaT0wO2k8bGVuO2krKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHMuc3RhcnQraTtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmZmVyW29mZnNldF07XG4gICAgICAgIGlmKHMuZGVjb2RlKXtcbiAgICAgICAgICByKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHZhbCk7XG4gICAgICAgIH1lbHNlIGlmKHMubGVuZ3RoRGF0YSlcbiAgICAgICAge1xuICAgICAgICAgIGEucHVzaChoYih2YWwpKTtcbiAgICAgICAgICByID0gYTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcis9cGFyc2VJbnQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGF0YVtkXT1yO1xuICAgIH1cblxuICAgIGNvbnNvbGUuZGVidWcoJz09IHdvcmtpbmcgaW4gcHJvZ3Jlc3MgPT0nKTtcbiAgICBjb25zb2xlLmRlYnVnKCc9PSBkZWJ1ZyA9PScpO1xuICAgIGNvbnNvbGUuZGVidWcoZGF0YSk7XG4gICAgdGhpcy5zdG9wKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgdGhpcy5jaGFubmVscyAgID0gZGF0YS5jaGFubmVscztcbiAgICB0aGlzLnNvbmdsZW4gICAgPSBkYXRhLnBhdHRlcm5PcmRlci5sZW5ndGg7XG4gICAgdGhpcy50aXRsZSAgICAgID0gZGF0YS5uYW1lO1xuICAgIHRoaXMuc2FtcGxlcyAgICA9IGRhdGEubmJJbnN0cnVtZW50cztcbiAgICB0aGlzLnZ1ICAgICAgICAgPSBuZXcgQXJyYXkoKTtcblxuICAgIGZvcihpPTA7aTx0aGlzLmNoYW5uZWxzO2krKykgdGhpcy52dVtpXT0wLjA7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coaSx0aGlzLnNhbXBsZVtpXS5uYW1lKTtcblxuICAgICAgdGhpcy5zYW1wbGVbaV0ubGVuZ3RoPTIqKHRoaXMuYnVmZmVyW3N0KzIyXSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyM10pO1xuICAgICAgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5idWZmZXJbc3QrMjRdO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lID4gNykgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5zYW1wbGVbaV0uZmluZXR1bmUtMTY7XG4gICAgICB0aGlzLnNhbXBsZVtpXS52b2x1bWU9dGhpcy5idWZmZXJbc3QrMjVdO1xuICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PTIqKHRoaXMuYnVmZmVyW3N0KzI2XSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyN10pO1xuICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyOF0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjldKTtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPT0yKSB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTA7XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PnRoaXMuc2FtcGxlW2ldLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MDtcbiAgICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG5cbiAgICBpZiAodGhpcy5idWZmZXJbOTUxXSAhPSAxMjcpIHRoaXMucmVwZWF0cG9zPXRoaXMuYnVmZmVyWzk1MV07XG4gICAgZm9yKGk9MDtpPDEyODtpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybnRhYmxlW2ldPXRoaXMuYnVmZmVyWzk1MitpXTtcbiAgICAgIGlmICh0aGlzLnBhdHRlcm50YWJsZVtpXSA+IHRoaXMucGF0dGVybnMpIHRoaXMucGF0dGVybnM9dGhpcy5wYXR0ZXJudGFibGVbaV07XG4gICAgfVxuICAgIHRoaXMucGF0dGVybnMrPTE7XG4gICAgdmFyIHBhdGxlbj00KjY0KnRoaXMuY2hhbm5lbHM7XG5cbiAgICB0aGlzLnBhdHRlcm49bmV3IEFycmF5KCk7XG4gICAgdGhpcy5ub3RlPW5ldyBBcnJheSgpO1xuICAgIHRoaXMucGF0dGVybnM9cGFyc2VJbnQodGhpcy5idWZmZXJbNzJdK3RoaXMuYnVmZmVyWzcyXSk7XG4gICAgZm9yKGk9MDtpPHRoaXMucGF0dGVybnM7aSsrKSB7XG4gICAgICB0aGlzLnBhdHRlcm5baV09bmV3IFVpbnQ4QXJyYXkocGF0bGVuKTtcbiAgICAgIHRoaXMubm90ZVtpXT1uZXcgVWludDhBcnJheSh0aGlzLmNoYW5uZWxzKjY0KTtcbiAgICAgIGZvcihqPTA7ajxwYXRsZW47aisrKSB0aGlzLnBhdHRlcm5baV1bal09dGhpcy5idWZmZXJbMTA4NCtpKnBhdGxlbitqXTtcbiAgICAgIGZvcihqPTA7ajw2NDtqKyspIGZvcihjPTA7Yzx0aGlzLmNoYW5uZWxzO2MrKykge1xuICAgICAgICB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPTA7XG4gICAgICAgIHZhciBuPSh0aGlzLnBhdHRlcm5baV1baio0KnRoaXMuY2hhbm5lbHMrYyo0XSYweDBmKTw8OCB8IHRoaXMucGF0dGVybltpXVtqKjQqdGhpcy5jaGFubmVscytjKjQrMV07XG4gICAgICAgIGZvcih2YXIgbnA9MDsgbnA8dGhpcy5iYXNlcGVyaW9kdGFibGUubGVuZ3RoOyBucCsrKVxuICAgICAgICAgIGlmIChuPT10aGlzLmJhc2VwZXJpb2R0YWJsZVtucF0pIHRoaXMubm90ZVtpXVtqKnRoaXMuY2hhbm5lbHMrY109bnA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5kZWJ1Zyh0aGlzKVxuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgdmFyIHNzdD0xMDg0K3RoaXMucGF0dGVybnMqcGF0bGVuO1xuICAgIGZvcihpPTA7aTx0aGlzLnNhbXBsZXM7aSsrKSB7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5kYXRhPW5ldyBGbG9hdDMyQXJyYXkodGhpcy5zYW1wbGVbaV0ubGVuZ3RoKTtcbiAgICAgIGZvcihqPTA7ajx0aGlzLnNhbXBsZVtpXS5sZW5ndGg7aisrKSB7XG4gICAgICAgIHZhciBxPXRoaXMuYnVmZmVyW3NzdCtqXTtcbiAgICAgICAgaWYgKHE8MTI4KSB7XG4gICAgICAgICAgcT1xLzEyOC4wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHE9KChxLTEyOCkvMTI4LjApLTEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGFbal09cTtcbiAgICAgIH1cbiAgICAgIHNzdCs9dGhpcy5zYW1wbGVbaV0ubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMucmVhZHk9dHJ1ZTtcbiAgICB0aGlzLmxvYWRpbmc9ZmFsc2U7XG4gICAgdGhpcy5idWZmZXI9MDtcblxuICAgIGlmICh0aGlzLmNvbnRleHQpIHRoaXMubG93cGFzc05vZGUuZnJlcXVlbmN5LnZhbHVlPTI4ODY3O1xuXG4gICAgdGhpcy5vblJlYWR5KCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm90cmFja2VyKXtcbiAgUHJvdHJhY2tlci5wcm90b3R5cGUucGFyc2VNT0QgPSBmdW5jdGlvbigpXG4gIHtcbiAgICB2YXIgaSxqO1xuICAgIHRoaXMudnU9W107XG4gICAgZm9yKGk9MDtpPHRoaXMuY2hhbm5lbHM7aSsrKSB0aGlzLnZ1W2ldPTAuMDtcblxuICAgIGk9MDtcbiAgICB3aGlsZSh0aGlzLmJ1ZmZlcltpXSAmJiBpPDIwKVxuICAgICAgdGhpcy50aXRsZT10aGlzLnRpdGxlK1N0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5idWZmZXJbaSsrXSk7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyMl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjNdKTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPXRoaXMuYnVmZmVyW3N0KzI0XTtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5maW5ldHVuZSA+IDcpIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPXRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lLTE2O1xuICAgICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPXRoaXMuYnVmZmVyW3N0KzI1XTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0yKih0aGlzLmJ1ZmZlcltzdCsyNl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjddKTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MioodGhpcy5idWZmZXJbc3QrMjhdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI5XSk7XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD09MikgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD50aGlzLnNhbXBsZVtpXS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PTA7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNvbmdsZW49dGhpcy5idWZmZXJbOTUwXTtcbiAgICBpZiAodGhpcy5idWZmZXJbOTUxXSAhPSAxMjcpIHRoaXMucmVwZWF0cG9zPXRoaXMuYnVmZmVyWzk1MV07XG4gICAgZm9yKGk9MDtpPDEyODtpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybnRhYmxlW2ldPXRoaXMuYnVmZmVyWzk1MitpXTtcbiAgICAgIGlmICh0aGlzLnBhdHRlcm50YWJsZVtpXSA+IHRoaXMucGF0dGVybnMpIHRoaXMucGF0dGVybnM9dGhpcy5wYXR0ZXJudGFibGVbaV07XG4gICAgfVxuICAgIHRoaXMucGF0dGVybnMrPTE7XG4gICAgdmFyIHBhdGxlbj00KjY0KnRoaXMuY2hhbm5lbHM7XG5cbiAgICB0aGlzLnBhdHRlcm49W107XG4gICAgdGhpcy5ub3RlPVtdO1xuICAgIGZvcihpPTA7aTx0aGlzLnBhdHRlcm5zO2krKykge1xuICAgICAgdGhpcy5wYXR0ZXJuW2ldPW5ldyBVaW50OEFycmF5KHBhdGxlbik7XG4gICAgICB0aGlzLm5vdGVbaV09bmV3IFVpbnQ4QXJyYXkodGhpcy5jaGFubmVscyo2NCk7XG4gICAgICBmb3Ioaj0wO2o8cGF0bGVuO2orKykgdGhpcy5wYXR0ZXJuW2ldW2pdPXRoaXMuYnVmZmVyWzEwODQraSpwYXRsZW4ral07XG4gICAgICBmb3Ioaj0wO2o8NjQ7aisrKSBmb3IoYz0wO2M8dGhpcy5jaGFubmVscztjKyspIHtcbiAgICAgICAgdGhpcy5ub3RlW2ldW2oqdGhpcy5jaGFubmVscytjXT0wO1xuICAgICAgICB2YXIgbj0odGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNF0mMHgwZik8PDggfCB0aGlzLnBhdHRlcm5baV1baio0KnRoaXMuY2hhbm5lbHMrYyo0KzFdO1xuICAgICAgICBmb3IodmFyIG5wPTA7IG5wPHRoaXMuYmFzZXBlcmlvZHRhYmxlLmxlbmd0aDsgbnArKylcbiAgICAgICAgICBpZiAobj09dGhpcy5iYXNlcGVyaW9kdGFibGVbbnBdKSB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPW5wO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzc3Q9MTA4NCt0aGlzLnBhdHRlcm5zKnBhdGxlbjtcbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdGhpcy5zYW1wbGVbaV0uZGF0YT1uZXcgRmxvYXQzMkFycmF5KHRoaXMuc2FtcGxlW2ldLmxlbmd0aCk7XG4gICAgICBmb3Ioaj0wO2o8dGhpcy5zYW1wbGVbaV0ubGVuZ3RoO2orKykge1xuICAgICAgICB2YXIgcT10aGlzLmJ1ZmZlcltzc3Qral07XG4gICAgICAgIGlmIChxPDEyOCkge1xuICAgICAgICAgIHE9cS8xMjguMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxPSgocS0xMjgpLzEyOC4wKS0xLjA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNhbXBsZVtpXS5kYXRhW2pdPXE7XG4gICAgICB9XG4gICAgICBzc3QrPXRoaXMuc2FtcGxlW2ldLmxlbmd0aDtcbiAgICB9XG5cbiAgICB0aGlzLnJlYWR5PXRydWU7XG4gICAgdGhpcy5sb2FkaW5nPWZhbHNlO1xuICAgIHRoaXMuYnVmZmVyPTA7XG5cbiAgICBpZiAodGhpcy5jb250ZXh0KSB0aGlzLmxvd3Bhc3NOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcblxuICAgIHRoaXMub25SZWFkeSgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvdHJhY2tlcil7XG4gIFByb3RyYWNrZXIucHJvdG90eXBlLnBhcnNlWE0gPSBmdW5jdGlvbigpXG4gIHtcbiAgICBjb25zb2xlLmxvZygnUGFyc2UgRlQyIGZpbGUnKTtcbiAgICBjb25zb2xlLmxvZygndW5maW5pc2hlZCcpO1xuICAgIHRoaXMuc3RvcCgpO1xuICAgIHZhciBpLGosZDtcblxuICAgIGlmICghdGhpcy5idWZmZXIpIHJldHVybiBmYWxzZTtcbiAgICAvL3RoaXMuYnVmZmVyPW5ldyBVaW50OEFycmF5KHRoaXMucmVzcG9uc2UpO1xuICAgIC8vY29uc29sZS5kZWJ1Zyh0aGlzLmJ1ZmZlcik7XG5cbiAgICAvKlxuICAgICAwIDE3IGNoYXIgSUQgdGV4dCAnRXh0ZW5kZWQgbW9kdWxlOiAnXG4gICAgIDE3IDIwIGNoYXIgTW9kdWxlIG5hbWUgJ0JlbGxpc3NpbWEgOTkgKG1peCkgJ1xuICAgICAzNyAxIGJ5dGUgMHgxQSAxQVxuICAgICAzOCAyMCBjaGFyIFRyYWNrZXIgbmFtZSAnRmFzdFRyYWNrZXIgdjIuMDAgJ1xuICAgICA1OCAyIHdvcmQgVmVyc2lvbiBudW1iZXIgMDQgMDFcbiAgICAgNjAgNCBkd29yZCBIZWFkZXIgc2l6ZSAxNCAwMSAwMCAwMFxuICAgICA2NCAyIHdvcmQgU29uZyBsZW5ndGggM0UgMDAgKDEuLjI1NilcbiAgICAgNjYgMiB3b3JkIFJlc3RhcnQgcG9zaXRpb24gMDAgMDBcbiAgICAgNjggMiB3b3JkIE51bWJlciBvZiBjaGFubmVscyAyMCAwMCAoMC4uMzIvNjQpXG4gICAgIDcwIDIgd29yZCBOdW1iZXIgb2YgcGF0dGVybnMgMzcgMDAgKDEuLjI1NilcbiAgICAgNzIgMiB3b3JkIE51bWJlciBvZiBpbnN0cnVtZW50cyAxMiAwMCAoMC4uMTI4KVxuICAgICA3NCAyIHdvcmQgRmxhZ3MgMDEgMDBcbiAgICAgNzYgMiB3b3JkIERlZmF1bHQgdGVtcG8gMDUgMDBcbiAgICAgNzggMiB3b3JkIERlZmF1bHQgQlBNIDk4IDAwXG4gICAgIDgwID8gYnl0ZSBQYXR0ZXJuIG9yZGVyIHRhYmxlIDAwIDAxIDAyIDAzIC4uLlxuICAgICAqL1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAge3N0YXJ0OjAsbGVuZ3RoOjE2LGRlY29kZTp0cnVlfVxuICAgICAgLG5hbWU6ICAgICAgICAgIHtzdGFydDoxNyxsZW5ndGg6MjAsZGVjb2RlOnRydWV9XG4gICAgICAvLywnMHgxQSc6ICAgICAgICB7c3RhcnQ6MzcsbGVuZ3RoOjEsZGVjb2RlOnRydWV9XG4gICAgICAsdHJhY2tlcjogICAgICAge3N0YXJ0OjM4LGxlbmd0aDoxNyxkZWNvZGU6dHJ1ZX1cbiAgICAgICx2ZXJzaW9uOiAgICAgICB7c3RhcnQ6NTgsbGVuZ3RoOjF9XG4gICAgICAsc29uZ2xlbjogICAgICAge3N0YXJ0OjY0LGxlbmd0aDoxfVxuICAgICAgLGNoYW5uZWxzOiAgICAgIHtzdGFydDo2OCxsZW5ndGg6MX1cbiAgICAgICxuYkluc3RydW1lbnRzOiB7c3RhcnQ6NzAsbGVuZ3RoOjF9XG4gICAgICAsbmJQYXR0ZXJuczogICAge3N0YXJ0OjcyLGxlbmd0aDoxfVxuICAgICAgLHRlbXBvOiAgICAgICAgIHtzdGFydDo3NixsZW5ndGg6MX1cbiAgICAgICxicG06ICAgICAgICAgICB7c3RhcnQ6NzgsbGVuZ3RoOjF9XG4gICAgICAscGF0dGVybk9yZGVyOiAge3N0YXJ0OjgwLGxlbmd0aERhdGE6J3NvbmdsZW4nfVxuICAgIH07XG5cbiAgICBmb3IoZCBpbiBkYXRhKVxuICAgIHtcbiAgICAgIHZhciBzICAgPSBkYXRhW2RdO1xuICAgICAgdmFyIHIgICA9ICcnO1xuICAgICAgdmFyIGEgICA9IG5ldyBBcnJheSgpO1xuICAgICAgdmFyIGxlbiA9IHMubGVuZ3RoRGF0YSA/IHBhcnNlSW50KGRhdGFbcy5sZW5ndGhEYXRhXSkgOiBzLmxlbmd0aDtcblxuICAgICAgZm9yKGk9MDtpPGxlbjtpKyspXG4gICAgICB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1ZmZlcltzLnN0YXJ0K2ldO1xuICAgICAgICBpZihzLmRlY29kZSl7XG4gICAgICAgICAgcis9U3RyaW5nLmZyb21DaGFyQ29kZSh2YWwpO1xuICAgICAgICB9ZWxzZSBpZihzLmxlbmd0aERhdGEpXG4gICAgICAgIHtcbiAgICAgICAgICBhLnB1c2godmFsKTtcbiAgICAgICAgICByID0gYTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcis9cGFyc2VJbnQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGF0YVtkXT1yO1xuICAgIH1cbiAgICB2YXIgbyA9IDgwK3BhcnNlSW50KGRhdGEuc29uZ2xlbik7XG4gICAgZGF0YS5yZXN0YXJ0ID0gdGhpcy5idWZmZXJbb107XG5cbiAgICBjb25zb2xlLmRlYnVnKGRhdGEpO1xuICAgIHRoaXMuc3RvcCgpO1xuICAgIHJldHVybiB0cnVlO1xuXG4gICAgdGhpcy5jaGFubmVscyAgID0gZGF0YS5jaGFubmVscztcbiAgICB0aGlzLnNvbmdsZW4gICAgPSBkYXRhLnBhdHRlcm5PcmRlci5sZW5ndGg7XG4gICAgdGhpcy50aXRsZSAgICAgID0gZGF0YS5uYW1lO1xuICAgIHRoaXMuc2FtcGxlcyAgICA9IGRhdGEubmJJbnN0cnVtZW50cztcbiAgICB0aGlzLnZ1ICAgICAgICAgPSBuZXcgQXJyYXkoKTtcblxuICAgIGZvcihpPTA7aTx0aGlzLmNoYW5uZWxzO2krKykgdGhpcy52dVtpXT0wLjA7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cblxuXG4gICAgICBjb25zb2xlLmxvZyhpLHRoaXMuc2FtcGxlW2ldLm5hbWUpO1xuXG4gICAgICB0aGlzLnNhbXBsZVtpXS5sZW5ndGg9MioodGhpcy5idWZmZXJbc3QrMjJdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzIzXSk7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLmJ1ZmZlcltzdCsyNF07XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0uZmluZXR1bmUgPiA3KSB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLnNhbXBsZVtpXS5maW5ldHVuZS0xNjtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLnZvbHVtZT10aGlzLmJ1ZmZlcltzdCsyNV07XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MioodGhpcy5idWZmZXJbc3QrMjZdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI3XSk7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTIqKHRoaXMuYnVmZmVyW3N0KzI4XSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyOV0pO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9PTIpIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ+dGhpcy5zYW1wbGVbaV0ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0wO1xuICAgICAgICB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cblxuICAgIGlmICh0aGlzLmJ1ZmZlcls5NTFdICE9IDEyNykgdGhpcy5yZXBlYXRwb3M9dGhpcy5idWZmZXJbOTUxXTtcbiAgICBmb3IoaT0wO2k8MTI4O2krKykge1xuICAgICAgdGhpcy5wYXR0ZXJudGFibGVbaV09dGhpcy5idWZmZXJbOTUyK2ldO1xuICAgICAgaWYgKHRoaXMucGF0dGVybnRhYmxlW2ldID4gdGhpcy5wYXR0ZXJucykgdGhpcy5wYXR0ZXJucz10aGlzLnBhdHRlcm50YWJsZVtpXTtcbiAgICB9XG4gICAgdGhpcy5wYXR0ZXJucys9MTtcbiAgICB2YXIgcGF0bGVuPTQqNjQqdGhpcy5jaGFubmVscztcblxuICAgIHRoaXMucGF0dGVybj1uZXcgQXJyYXkoKTtcbiAgICB0aGlzLm5vdGU9bmV3IEFycmF5KCk7XG4gICAgdGhpcy5wYXR0ZXJucz1wYXJzZUludCh0aGlzLmJ1ZmZlcls3Ml0rdGhpcy5idWZmZXJbNzJdKTtcbiAgICBmb3IoaT0wO2k8dGhpcy5wYXR0ZXJucztpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybltpXT1uZXcgVWludDhBcnJheShwYXRsZW4pO1xuICAgICAgdGhpcy5ub3RlW2ldPW5ldyBVaW50OEFycmF5KHRoaXMuY2hhbm5lbHMqNjQpO1xuICAgICAgZm9yKGo9MDtqPHBhdGxlbjtqKyspIHRoaXMucGF0dGVybltpXVtqXT10aGlzLmJ1ZmZlclsxMDg0K2kqcGF0bGVuK2pdO1xuICAgICAgZm9yKGo9MDtqPDY0O2orKykgZm9yKGM9MDtjPHRoaXMuY2hhbm5lbHM7YysrKSB7XG4gICAgICAgIHRoaXMubm90ZVtpXVtqKnRoaXMuY2hhbm5lbHMrY109MDtcbiAgICAgICAgdmFyIG49KHRoaXMucGF0dGVybltpXVtqKjQqdGhpcy5jaGFubmVscytjKjRdJjB4MGYpPDw4IHwgdGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNCsxXTtcbiAgICAgICAgZm9yKHZhciBucD0wOyBucDx0aGlzLmJhc2VwZXJpb2R0YWJsZS5sZW5ndGg7IG5wKyspXG4gICAgICAgICAgaWYgKG49PXRoaXMuYmFzZXBlcmlvZHRhYmxlW25wXSkgdGhpcy5ub3RlW2ldW2oqdGhpcy5jaGFubmVscytjXT1ucDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmRlYnVnKHRoaXMpXG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgc3N0PTEwODQrdGhpcy5wYXR0ZXJucypwYXRsZW47XG4gICAgZm9yKGk9MDtpPHRoaXMuc2FtcGxlcztpKyspIHtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGE9bmV3IEZsb2F0MzJBcnJheSh0aGlzLnNhbXBsZVtpXS5sZW5ndGgpO1xuICAgICAgZm9yKGo9MDtqPHRoaXMuc2FtcGxlW2ldLmxlbmd0aDtqKyspIHtcbiAgICAgICAgdmFyIHE9dGhpcy5idWZmZXJbc3N0K2pdO1xuICAgICAgICBpZiAocTwxMjgpIHtcbiAgICAgICAgICBxPXEvMTI4LjA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcT0oKHEtMTI4KS8xMjguMCktMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zYW1wbGVbaV0uZGF0YVtqXT1xO1xuICAgICAgfVxuICAgICAgc3N0Kz10aGlzLnNhbXBsZVtpXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5yZWFkeT10cnVlO1xuICAgIHRoaXMubG9hZGluZz1mYWxzZTtcbiAgICB0aGlzLmJ1ZmZlcj0wO1xuXG4gICAgaWYgKHRoaXMuY29udGV4dCkgdGhpcy5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG5cbiAgICB0aGlzLm9uUmVhZHkoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn07IiwiLypcbiAgYW1pZ2EgcHJvdHJhY2tlciBtb2R1bGUgcGxheWVyIGZvciB3ZWIgYXVkaW8gYXBpXG4gIChjKSAyMDEyLTIwMTQgZmlyZWhhd2svdGRhICAoZmlyZWhhd2tAaGF4b3IuZmkpXG4gIFxuICBvcmlnaW5hbGx5IGhhY2tlZCB0b2dldGhlciBpbiBhIHdlZWtlbmQsIHNvIHBsZWFzZSBleGN1c2VcbiAgbWUgZm9yIHRoZSBzcGFnaGV0dGkgY29kZS4gOilcbiAgZmVlbCBmcmVlIHRvIHVzZSB0aGlzIHBsYXllciBpbiB5b3VyIHdlYnNpdGUvZGVtby93aGF0ZXZlclxuICBpZiB5b3UgZmluZCBpdCB1c2VmdWwuIGRyb3AgbWUgYW4gZW1haWwgaWYgeW91IGRvLlxuICBBTUlHQUFBQUFBQUFIISFcbiAgYWxsIGNvZGUgbGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2U6XG4gIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAga2luZGEgc29ydGEgY2hhbmdlbG9nOlxuICAoc2VwIDIwMTQpXG4gIC0gZml4ZWQgYnVnIHdpdGggRTh4IHN5bmMgYW5kIGFkZGVkIDgweCB0byBhbHNvIGZ1bmN0aW9uIGZvciBzeW5jXG4gICAgZXZlbnRzIGR1ZSB0byBwcm9ibGVtcyB3aXRoIHNvbWUgcHJvdHJhY2tlciB2ZXJzaW9ucyAodGhhbmtzIHNwb3QpXG4gIChhdWcgMjAxNClcbiAgLSBhZGRlZCBzeW5jIGV2ZW50IHF1ZXVlIGZvciBFOHggY29tbWFuZHNcbiAgLSBjaGFuZ2VkIHRoZSBhbWlnYSBmaXhlZCBmaWx0ZXIgbW9kZWwgdG8gYWxsb3cgY2hhbmdlcyBhdCBydW50aW1lXG4gIC0gdGhyZWUgc3RlcmVvIHNlcGFyYXRpb24gbW9kZXMgbm93LCAwPWFtaWdhLCAxPTY1LzM1LCAyPW1vbm9cbiAgLSBhIGZldyBidWdmaXhlcywgdGhhbmtzIHNwb3RedXByb3VnaCBhbmQgZXNhdV50cmFrdG9yIGZvciByZXBvcnRpbmdcbiAgICAqIGZpeGVkIGJ1ZyBpbiBzbGlkZS10by1ub3RlIHdoZW4gMzAwIHdpdGggbm8gcHJlY2VlZGluZyAzeHlcbiAgICAqIGZpeGVkIHZpYnJhdG8gZGVwdGggb24gdGlja3MgMSsgdG8gbWF0Y2ggdGljayAwXG4gICAgKiBhZGRlZCBib29sZWFuIHZhcmlhYmxlIGZvciBkaXNhYmxpbmcgQTUwMCBmaXhlZCBsb3dwYXNzIGZpbHRlclxuICAgICogYWRkZWQgYSBkZWxheSBvbiBtb2R1bGUgc3RhcnQsIG51bWJlciBvZiBidWZmZXJzIHNlbGVjdGFibGVcbiAgICAqIGZpeGVkIHNhbXBsZSBsb29wIGRpc2NhcmRpbmcgcG9pbnRlciBvdmVyZmxvd1xuICAobWF5IDIwMTQpXG4gIC0gYWRkZWQgYm9vbGVhbiB2YXJpYWJsZSBmb3IgdGhlIGFtaWdhIGxlZCBmaWx0ZXIgZm9yIHVpIHN0dWZmXG4gIChqYW4gMjAxNClcbiAgLSBkaXNhYmxlZCBlZTAgZmlsdGVyIGNvbW1hbmQgZm9yIHRyYWNrcyB3aXRoIG92ZXIgNCBjaGFubmVscyB0b1xuICAgIG1ha2UgbW9kLmRvcGUgcGxheSBjb3JyZWN0bHlcbiAgKG9jdCAyMDEzKVxuICAtIGFkZGVkIHN1cHBvcnQgZm9yIGZpcmVmb3ggMjRcbiAgKGFwciAyMDEzKVxuICAtIGNoYW5nZWQgdGhlIGxvZ2ljIGZvciBwYXR0ZXJuIGJyZWFrL2p1bXAuIG1vZC5wYXR0ZXJuX3NrYW5rIG5vd1xuICAgIHBsYXlzIGNvcnJlY3RseS5cbiAgKGZlYiAyMDEzKVxuICAtIGZpeGVkIE5hTiBzYW1wbGVzIHdpdGggbW9kLmZyYWN0dXJlZCBhbmQgbW9kLm11bHRpY29sb3VyICh0aGFua3MgQWVnaXMhKVxuICAoamFuIDIwMTMpXG4gIC0gZml4ZWQgdmlicmF0byBhbXBsaXR1ZGUgKHdhcyBoYWxmIG9mIHdoYXQgaXQgc2hvdWxkIGJlLCBhcHBhcmVudGx5KVxuICAtIGZpeGVkIHRvIHdvcmsgb24gc2FmYXJpIGFnYWluICh0aGFua3MgTWF0dCBEaWFtb25kIEAgc3RhY2tvdmVyZmxvdy5jb20pXG4gIChkZWMgMjAxMilcbiAgLSByZXBsYWNlZCBlZmZlY3Qgc3dpdGNoLXN0YXRlbWVudCB3aXRoIGp1bXB0YWJsZXNcbiAgLSBmaXhlZCBjbGlja3MgKGJhZCBsb29wcywgZW1wdHkgc2FtcGxlcylcbiAgLSBmaXhlZCBwbGF5YmFjayBidWcgd2l0aCBzYW1wbGUtb25seSByb3dzXG4gIC0gYWRkZWQgYW1pZ2EgNTAwIGxvd3Bhc3MgZmlsdGVycyAobm90IDEwMCUgYXV0aGVudGljLCB0aG91Z2gpXG4gIC0gYWRkZWQgY29tcHJlc3NvciB0byBvdXRwdXRcbiAgLSBsYXRlc3Qgc2FmYXJpIGhhcyBicm9rZW4gd2ViIGF1ZGlvIHNvIGNocm9tZS1vbmx5IGZvciBub3dcbiAgKGF1ZyAyMDEyKVxuICAtIGZpcnN0IHZlcnNpb24gd3JpdHRlbiBmcm9tIHNjcmF0Y2hcbiAgdG9kbzpcbiAgLSBwYXR0ZXJuIGxvb3BpbmcgaXMgd2F5IGJyb2tlbiBpbiBtb2QuYmxhY2tfcXVlZW5cbiAgLSBwcm9wZXJseSB0ZXN0IEVFeCBkZWxheSBwYXR0ZXJuXG4gIC0gaW1wbGVtZW50IHRoZSByZXN0IG9mIHRoZSBlZmZlY3RzXG4gIC0gb3B0aW1pemUgZm9yIG1vcmUgc3BlZWQhISBTUEVFRUVEISFcbiAgICAqIHN3aXRjaCB0byBmaXhlZCBwb2ludCBzYW1wbGUgcG9pbnRlcnMsIE1hdGguZmxvb3IoKSBpcyBfc2xvd18gb24gaU9TXG4qL1xuXG4vLyBjb25zdHJ1Y3RvciBmb3IgcHJvdHJhY2tlciBwbGF5ZXIgb2JqZWN0XG5mdW5jdGlvbiBQcm90cmFja2VyKClcbntcbiAgdmFyIGksIHQ7XG5cbiAgdGhpcy5pbml0aWFsaXplKCk7XG4gIHRoaXMuY2xlYXJzb25nKCk7XG5cbiAgdGhpcy51cmw9XCJcIjtcbiAgdGhpcy5sb2FkaW5nPWZhbHNlO1xuICB0aGlzLnJlYWR5PWZhbHNlO1xuICB0aGlzLnBsYXlpbmc9ZmFsc2U7XG4gIHRoaXMuYnVmZmVyPTA7XG4gIHRoaXMubWl4ZXJOb2RlPTA7XG4gIHRoaXMucGF1c2VkPWZhbHNlO1xuICB0aGlzLnJlcGVhdD1mYWxzZTtcbiAgdGhpcy5maWx0ZXI9ZmFsc2U7XG5cbiAgdGhpcy5zZXBhcmF0aW9uPTE7XG4gIHRoaXMucGFsY2xvY2s9dHJ1ZTtcbiAgdGhpcy5hbWlnYTUwMD10cnVlO1xuICBcbiAgdGhpcy5hdXRvc3RhcnQ9ZmFsc2U7XG4gIHRoaXMuYnVmZmVyc3RvZGVsYXk9NDsgLy8gYWRqdXN0IHRoaXMgaWYgeW91IGdldCBzdHV0dGVyIGFmdGVyIGxvYWRpbmcgbmV3IHNvbmdcbiAgdGhpcy5kZWxheWZpcnN0PTA7XG4gIHRoaXMuZGVsYXlsb2FkPTA7XG5cbiAgdGhpcy5zeW5jcXVldWU9W107XG5cbiAgdGhpcy5vblJlYWR5PWZ1bmN0aW9uKCl7fTtcbiAgdGhpcy5vblBsYXk9ZnVuY3Rpb24oKXt9O1xuICB0aGlzLm9uU3RvcD1mdW5jdGlvbigpe307XG5cbiAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgdGhpcy5zYW1wbGVyYXRlPTQ0MTAwO1xuICB0aGlzLmJ1ZmZlcmxlbj0yMDQ4O1xuXG4gIC8vIHBhdWxhIHBlcmlvZCB2YWx1ZXNcbiAgdGhpcy5iYXNlcGVyaW9kdGFibGU9bmV3IEFycmF5KFxuICAgIDg1Niw4MDgsNzYyLDcyMCw2NzgsNjQwLDYwNCw1NzAsNTM4LDUwOCw0ODAsNDUzLFxuICAgIDQyOCw0MDQsMzgxLDM2MCwzMzksMzIwLDMwMiwyODUsMjY5LDI1NCwyNDAsMjI2LFxuICAgIDIxNCwyMDIsMTkwLDE4MCwxNzAsMTYwLDE1MSwxNDMsMTM1LDEyNywxMjAsMTEzKTtcblxuICAvLyBmaW5ldHVuZSBtdWx0aXBsaWVyc1xuICB0aGlzLmZpbmV0dW5ldGFibGU9bmV3IEFycmF5KCk7XG4gIGZvcih0PTA7dDwxNjt0KyspIHRoaXMuZmluZXR1bmV0YWJsZVt0XT1NYXRoLnBvdygyLCAodC04KS8xMi84KTtcbiAgXG4gIC8vIGNhbGMgdGFibGVzIGZvciB2aWJyYXRvIHdhdmVmb3Jtc1xuICB0aGlzLnZpYnJhdG90YWJsZT1uZXcgQXJyYXkoKTtcbiAgZm9yKHQ9MDt0PDQ7dCsrKSB7XG4gICAgdGhpcy52aWJyYXRvdGFibGVbdF09bmV3IEFycmF5KCk7XG4gICAgZm9yKHZhciBpPTA7aTw2NDtpKyspIHtcbiAgICAgIHN3aXRjaCh0KSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICB0aGlzLnZpYnJhdG90YWJsZVt0XVtpXT0xMjcqTWF0aC5zaW4oTWF0aC5QSSoyKihpLzY0KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICB0aGlzLnZpYnJhdG90YWJsZVt0XVtpXT0xMjctNCppO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgdGhpcy52aWJyYXRvdGFibGVbdF1baV09KGk8MzIpPzEyNzotMTI3O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgdGhpcy52aWJyYXRvdGFibGVbdF1baV09KDEtMipNYXRoLnJhbmRvbSgpKSoxMjc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gZWZmZWN0IGp1bXB0YWJsZXNcbiAgdGhpcy5lZmZlY3RzX3QwID0gbmV3IEFycmF5KFxuICAgIHRoaXMuZWZmZWN0X3QwXzAsIHRoaXMuZWZmZWN0X3QwXzEsIHRoaXMuZWZmZWN0X3QwXzIsIHRoaXMuZWZmZWN0X3QwXzMsIHRoaXMuZWZmZWN0X3QwXzQsIHRoaXMuZWZmZWN0X3QwXzUsIHRoaXMuZWZmZWN0X3QwXzYsIHRoaXMuZWZmZWN0X3QwXzcsXG4gICAgdGhpcy5lZmZlY3RfdDBfOCwgdGhpcy5lZmZlY3RfdDBfOSwgdGhpcy5lZmZlY3RfdDBfYSwgdGhpcy5lZmZlY3RfdDBfYiwgdGhpcy5lZmZlY3RfdDBfYywgdGhpcy5lZmZlY3RfdDBfZCwgdGhpcy5lZmZlY3RfdDBfZSwgdGhpcy5lZmZlY3RfdDBfZik7XG4gIHRoaXMuZWZmZWN0c190MF9lID0gbmV3IEFycmF5KFxuICAgIHRoaXMuZWZmZWN0X3QwX2UwLCB0aGlzLmVmZmVjdF90MF9lMSwgdGhpcy5lZmZlY3RfdDBfZTIsIHRoaXMuZWZmZWN0X3QwX2UzLCB0aGlzLmVmZmVjdF90MF9lNCwgdGhpcy5lZmZlY3RfdDBfZTUsIHRoaXMuZWZmZWN0X3QwX2U2LCB0aGlzLmVmZmVjdF90MF9lNyxcbiAgICB0aGlzLmVmZmVjdF90MF9lOCwgdGhpcy5lZmZlY3RfdDBfZTksIHRoaXMuZWZmZWN0X3QwX2VhLCB0aGlzLmVmZmVjdF90MF9lYiwgdGhpcy5lZmZlY3RfdDBfZWMsIHRoaXMuZWZmZWN0X3QwX2VkLCB0aGlzLmVmZmVjdF90MF9lZSwgdGhpcy5lZmZlY3RfdDBfZWYpO1xuICB0aGlzLmVmZmVjdHNfdDEgPSBuZXcgQXJyYXkoXG4gICAgdGhpcy5lZmZlY3RfdDFfMCwgdGhpcy5lZmZlY3RfdDFfMSwgdGhpcy5lZmZlY3RfdDFfMiwgdGhpcy5lZmZlY3RfdDFfMywgdGhpcy5lZmZlY3RfdDFfNCwgdGhpcy5lZmZlY3RfdDFfNSwgdGhpcy5lZmZlY3RfdDFfNiwgdGhpcy5lZmZlY3RfdDFfNyxcbiAgICB0aGlzLmVmZmVjdF90MV84LCB0aGlzLmVmZmVjdF90MV85LCB0aGlzLmVmZmVjdF90MV9hLCB0aGlzLmVmZmVjdF90MV9iLCB0aGlzLmVmZmVjdF90MV9jLCB0aGlzLmVmZmVjdF90MV9kLCB0aGlzLmVmZmVjdF90MV9lLCB0aGlzLmVmZmVjdF90MV9mKTtcbiAgdGhpcy5lZmZlY3RzX3QxX2UgPSBuZXcgQXJyYXkoXG4gICAgdGhpcy5lZmZlY3RfdDFfZTAsIHRoaXMuZWZmZWN0X3QxX2UxLCB0aGlzLmVmZmVjdF90MV9lMiwgdGhpcy5lZmZlY3RfdDFfZTMsIHRoaXMuZWZmZWN0X3QxX2U0LCB0aGlzLmVmZmVjdF90MV9lNSwgdGhpcy5lZmZlY3RfdDFfZTYsIHRoaXMuZWZmZWN0X3QxX2U3LFxuICAgIHRoaXMuZWZmZWN0X3QxX2U4LCB0aGlzLmVmZmVjdF90MV9lOSwgdGhpcy5lZmZlY3RfdDFfZWEsIHRoaXMuZWZmZWN0X3QxX2ViLCB0aGlzLmVmZmVjdF90MV9lYywgdGhpcy5lZmZlY3RfdDFfZWQsIHRoaXMuZWZmZWN0X3QxX2VlLCB0aGlzLmVmZmVjdF90MV9lZik7XG5cblxufVxuXG5cblxuLy8gY3JlYXRlIHRoZSB3ZWIgYXVkaW8gY29udGV4dFxuUHJvdHJhY2tlci5wcm90b3R5cGUuY3JlYXRlQ29udGV4dCA9IGZ1bmN0aW9uKClcbntcbiAgaWYgKCB0eXBlb2YgQXVkaW9Db250ZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHRoaXMuY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmNvbnRleHQgPSBuZXcgd2Via2l0QXVkaW9Db250ZXh0KCk7XG4gIH1cbiAgdGhpcy5zYW1wbGVyYXRlPXRoaXMuY29udGV4dC5zYW1wbGVSYXRlO1xuICB0aGlzLmJ1ZmZlcmxlbj0odGhpcy5zYW1wbGVyYXRlID4gNDQxMDApID8gNDA5NiA6IDIwNDg7IFxuXG4gIC8vIEFtaWdhIDUwMCBmaXhlZCBmaWx0ZXIgYXQgNmtIei4gV2ViQXVkaW8gbG93cGFzcyBpcyAxMmRCL29jdCwgd2hlcmVhc1xuICAvLyBvbGRlciBBbWlnYXMgaGFkIGEgNmRCL29jdCBmaWx0ZXIgYXQgNDkwMEh6LiBcbiAgdGhpcy5maWx0ZXJOb2RlPXRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgaWYgKHRoaXMuYW1pZ2E1MDApIHtcbiAgICB0aGlzLmZpbHRlck5vZGUuZnJlcXVlbmN5LnZhbHVlPTYwMDA7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5maWx0ZXJOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcbiAgfVxuXG4gIC8vIFwiTEVEIGZpbHRlclwiIGF0IDMyNzVrSHogLSBvZmYgYnkgZGVmYXVsdFxuICB0aGlzLmxvd3Bhc3NOb2RlPXRoaXMuY29udGV4dC5jcmVhdGVCaXF1YWRGaWx0ZXIoKTtcbiAgdGhpcy5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG4gIHRoaXMuZmlsdGVyPWZhbHNlO1xuXG4gIC8vIG1peGVyXG4gIGlmICggdHlwZW9mIHRoaXMuY29udGV4dC5jcmVhdGVKYXZhU2NyaXB0Tm9kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMubWl4ZXJOb2RlPXRoaXMuY29udGV4dC5jcmVhdGVKYXZhU2NyaXB0Tm9kZSh0aGlzLmJ1ZmZlcmxlbiwgMSwgMik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5taXhlck5vZGU9dGhpcy5jb250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3Nvcih0aGlzLmJ1ZmZlcmxlbiwgMSwgMik7XG4gIH1cbiAgdGhpcy5taXhlck5vZGUubW9kdWxlPXRoaXM7XG4gIHRoaXMubWl4ZXJOb2RlLm9uYXVkaW9wcm9jZXNzPVByb3RyYWNrZXIucHJvdG90eXBlLm1peDtcblxuICAvLyBjb21wcmVzc29yIGZvciBhIGJpdCBvZiB2b2x1bWUgYm9vc3QsIGhlbHBzIHdpdGggbXVsdGljaCB0dW5lc1xuICB0aGlzLmNvbXByZXNzb3JOb2RlPXRoaXMuY29udGV4dC5jcmVhdGVEeW5hbWljc0NvbXByZXNzb3IoKTtcblxuICAvLyBwYXRjaCB1cCBzb21lIGNhYmxlcyA6KSAgXG4gIHRoaXMubWl4ZXJOb2RlLmNvbm5lY3QodGhpcy5maWx0ZXJOb2RlKTtcbiAgdGhpcy5maWx0ZXJOb2RlLmNvbm5lY3QodGhpcy5sb3dwYXNzTm9kZSk7XG4gIHRoaXMubG93cGFzc05vZGUuY29ubmVjdCh0aGlzLmNvbXByZXNzb3JOb2RlKTtcbiAgdGhpcy5jb21wcmVzc29yTm9kZS5jb25uZWN0KHRoaXMuY29udGV4dC5kZXN0aW5hdGlvbik7XG59XG5cblxuXG4vLyBwbGF5IGxvYWRlZCBhbmQgcGFyc2VkIG1vZHVsZSB3aXRoIHdlYmF1ZGlvIGNvbnRleHRcblByb3RyYWNrZXIucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbigpXG57XG4gIGlmICh0aGlzLmNvbnRleHQ9PW51bGwpIHRoaXMuY3JlYXRlQ29udGV4dCgpO1xuICBcbiAgaWYgKCF0aGlzLnJlYWR5KSByZXR1cm4gZmFsc2U7XG4gIGlmICh0aGlzLnBhdXNlZCkge1xuICAgIHRoaXMucGF1c2VkPWZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHRoaXMuZW5kb2Zzb25nPWZhbHNlO1xuICB0aGlzLnBhdXNlZD1mYWxzZTtcbiAgdGhpcy5pbml0aWFsaXplKCk7XG4gIHRoaXMuZmxhZ3M9MSsyO1xuICB0aGlzLnBsYXlpbmc9dHJ1ZTtcbiAgdGhpcy5vblBsYXkoKTtcbiAgdGhpcy5kZWxheWZpcnN0PXRoaXMuYnVmZmVyc3RvZGVsYXk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5cblxuLy8gcGF1c2UgcGxheWJhY2tcblByb3RyYWNrZXIucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKVxue1xuICBpZiAoIXRoaXMucGF1c2VkKSB7XG4gICAgdGhpcy5wYXVzZWQ9dHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBhdXNlZD1mYWxzZTtcbiAgfVxufVxuXG5cblxuLy8gc3RvcCBwbGF5YmFja1xuUHJvdHJhY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKClcbntcbiAgdGhpcy5wbGF5aW5nPWZhbHNlO1xuICB0aGlzLm9uU3RvcCgpO1xuICB0aGlzLmRlbGF5bG9hZD0xO1xufVxuXG5cblxuLy8gc3RvcCBwbGF5aW5nIGJ1dCBkb24ndCBjYWxsIGNhbGxiYWNrc1xuUHJvdHJhY2tlci5wcm90b3R5cGUuc3RvcGF1ZGlvID0gZnVuY3Rpb24oc3QpXG57XG4gIHRoaXMucGxheWluZz1zdDtcbn1cblxuXG5cbi8vIGp1bXAgcG9zaXRpb25zIGZvcndhcmQvYmFja1xuUHJvdHJhY2tlci5wcm90b3R5cGUuanVtcCA9IGZ1bmN0aW9uKHN0ZXApXG57XG4gIHRoaXMudGljaz0wO1xuICB0aGlzLnJvdz0wO1xuICB0aGlzLnBvc2l0aW9uKz1zdGVwO1xuICB0aGlzLmZsYWdzPTErMjsgIFxuICBpZiAodGhpcy5wb3NpdGlvbjwwKSB0aGlzLnBvc2l0aW9uPTA7XG4gIGlmICh0aGlzLnBvc2l0aW9uID49IHRoaXMuc29uZ2xlbikgdGhpcy5zdG9wKCk7XG59XG5cblxuXG4vLyBzZXQgd2hldGhlciBtb2R1bGUgcmVwZWF0cyBhZnRlciBzb25nbGVuXG5Qcm90cmFja2VyLnByb3RvdHlwZS5zZXRyZXBlYXQgPSBmdW5jdGlvbihyZXApXG57XG4gIHRoaXMucmVwZWF0PXJlcDtcbn1cblxuXG5cbi8vIHNldCBzdGVyZW8gc2VwYXJhdGlvbiBtb2RlICgwPXBhdWxhLCAxPWJldHRlcnBhdWxhICg2MC80MCksIDI9bW9ubylcblByb3RyYWNrZXIucHJvdG90eXBlLnNldHNlcGFyYXRpb24gPSBmdW5jdGlvbihzZXApXG57XG4gIHRoaXMuc2VwYXJhdGlvbj1zZXA7XG59XG5cblxuXG4vLyBzZXQgYW1pZ2EgdmlkZW8gc3RhbmRhcmQgKGZhbHNlPU5UU0MsIHRydWU9UEFMKVxuUHJvdHJhY2tlci5wcm90b3R5cGUuc2V0YW1pZ2F0eXBlID0gZnVuY3Rpb24oY2xvY2spXG57XG4gIHRoaXMucGFsY2xvY2s9Y2xvY2s7XG59XG5cblxuXG4vLyBzZXQgYXV0b3N0YXJ0IHRvIHBsYXkgaW1tZWRpYXRlbHkgYWZ0ZXIgbG9hZGluZ1xuUHJvdHJhY2tlci5wcm90b3R5cGUuc2V0YXV0b3N0YXJ0ID0gZnVuY3Rpb24oc3QpXG57XG4gIHRoaXMuYXV0b3N0YXJ0PXN0O1xufVxuXG5cblxuXG5cbi8vIHNldCBhbWlnYSBtb2RlbCAtIGNoYW5nZXMgZml4ZWQgZmlsdGVyIHN0YXRlXG5Qcm90cmFja2VyLnByb3RvdHlwZS5zZXRhbWlnYW1vZGVsID0gZnVuY3Rpb24oYW1pZ2EpXG57XG4gIGlmIChhbWlnYT09XCI2MDBcIiB8fCBhbWlnYT09XCIxMjAwXCIgfHwgYW1pZ2E9PVwiNDAwMFwiKSB7XG4gICAgdGhpcy5hbWlnYTUwMD1mYWxzZTtcbiAgICBpZiAodGhpcy5maWx0ZXJOb2RlKSB0aGlzLmZpbHRlck5vZGUuZnJlcXVlbmN5LnZhbHVlPTI4ODY3O1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYW1pZ2E1MDA9dHJ1ZTtcbiAgICBpZiAodGhpcy5maWx0ZXJOb2RlKSB0aGlzLmZpbHRlck5vZGUuZnJlcXVlbmN5LnZhbHVlPTYwMDA7XG4gIH1cbn1cblxuXG5cbi8vIGFyZSB0aGVyZSBFOHggc3luYyBldmVudHMgcXVldWVkP1xuUHJvdHJhY2tlci5wcm90b3R5cGUuaGFzc3luY2V2ZW50cyA9IGZ1bmN0aW9uKClcbntcbiAgcmV0dXJuICh0aGlzLnN5bmNxdWV1ZS5sZW5ndGggIT0gMCk7XG59XG5cblxuXG4vLyBwb3Agb2xkZXN0IHN5bmMgZXZlbnQgbnliYmxlIGZyb20gdGhlIEZJRk8gcXVldWVcblByb3RyYWNrZXIucHJvdG90eXBlLnBvcHN5bmNldmVudCA9IGZ1bmN0aW9uKClcbntcbiAgcmV0dXJuIHRoaXMuc3luY3F1ZXVlLnBvcCgpO1xufVxuXG5cblxuLy8gY2xlYXIgc29uZyBkYXRhXG5Qcm90cmFja2VyLnByb3RvdHlwZS5jbGVhcnNvbmcgPSBmdW5jdGlvbigpXG57ICBcbiAgdGhpcy50aXRsZT1cIlwiO1xuICB0aGlzLnNpZ25hdHVyZT1cIlwiO1xuICB0aGlzLnNvbmdsZW49MTtcbiAgdGhpcy5yZXBlYXRwb3M9MDtcbiAgdGhpcy5wYXR0ZXJudGFibGU9bmV3IEFycmF5QnVmZmVyKDEyOCk7XG4gIGZvcih2YXIgaT0wO2k8MTI4O2krKykgdGhpcy5wYXR0ZXJudGFibGVbaV09MDtcblxuICB0aGlzLmNoYW5uZWxzPTQ7XG5cbiAgdGhpcy5zYW1wbGU9bmV3IEFycmF5KCk7XG4gIHRoaXMuc2FtcGxlcz0zMTtcbiAgZm9yKHZhciBpPTA7aTwzMTtpKyspIHtcbiAgICB0aGlzLnNhbXBsZVtpXT1uZXcgT2JqZWN0KCk7XG4gICAgdGhpcy5zYW1wbGVbaV0ubmFtZT1cIlwiO1xuICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0wO1xuICAgIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPTA7XG4gICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPTY0O1xuICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0wO1xuICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICB0aGlzLnNhbXBsZVtpXS5kYXRhPTA7XG4gIH1cblxuICB0aGlzLnBhdHRlcm5zPTA7XG4gIHRoaXMucGF0dGVybj1uZXcgQXJyYXkoKTtcbiAgdGhpcy5ub3RlPW5ldyBBcnJheSgpO1xuICBcbiAgdGhpcy5sb29wcm93PTA7XG4gIHRoaXMubG9vcHN0YXJ0PTA7XG4gIHRoaXMubG9vcGNvdW50PTA7XG4gIFxuICB0aGlzLnBhdHRlcm5kZWxheT0wO1xuICB0aGlzLnBhdHRlcm53YWl0PTA7XG4gIFxuICB0aGlzLnN5bmNxdWV1ZT1bXTtcbn1cblxuXG4vLyBpbml0aWFsaXplIGFsbCBwbGF5ZXIgdmFyaWFibGVzXG5Qcm90cmFja2VyLnByb3RvdHlwZS5pbml0aWFsaXplID0gZnVuY3Rpb24oKVxue1xuICB0aGlzLnN5bmNxdWV1ZT1bXTtcblxuICB0aGlzLnRpY2s9MDtcbiAgdGhpcy5wb3NpdGlvbj0wO1xuICB0aGlzLnJvdz0wO1xuICB0aGlzLm9mZnNldD0wO1xuICB0aGlzLmZsYWdzPTA7XG5cbiAgdGhpcy5zcGVlZD02O1xuICB0aGlzLmJwbT0xMjU7XG4gIHRoaXMuYnJlYWtyb3c9MDtcbiAgdGhpcy5wYXR0ZXJuanVtcD0wO1xuICB0aGlzLnBhdHRlcm5kZWxheT0wO1xuICB0aGlzLnBhdHRlcm53YWl0PTA7XG4gIHRoaXMuZW5kb2Zzb25nPWZhbHNlO1xuICBcbiAgdGhpcy5jaGFubmVsPW5ldyBBcnJheSgpO1xuICBmb3IodmFyIGk9MDtpPHRoaXMuY2hhbm5lbHM7aSsrKSB7XG4gICAgdGhpcy5jaGFubmVsW2ldPW5ldyBPYmplY3QoKTtcbiAgICB0aGlzLmNoYW5uZWxbaV0uc2FtcGxlPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnBlcmlvZD0yMTQ7XG4gICAgdGhpcy5jaGFubmVsW2ldLnZvaWNlcGVyaW9kPTIxNDtcbiAgICB0aGlzLmNoYW5uZWxbaV0ubm90ZT0yNDsgICAgXG4gICAgdGhpcy5jaGFubmVsW2ldLnZvbHVtZT02NDtcbiAgICB0aGlzLmNoYW5uZWxbaV0uY29tbWFuZD0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5kYXRhPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnNhbXBsZXBvcz0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5zYW1wbGVzcGVlZD0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5mbGFncz0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5ub3Rlb249MDtcbiAgICB0aGlzLmNoYW5uZWxbaV0uc2xpZGVzcGVlZD0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5zbGlkZXRvPTIxNDtcbiAgICB0aGlzLmNoYW5uZWxbaV0uc2xpZGV0b3NwZWVkPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLmFycGVnZ2lvPTA7XG5cbiAgICB0aGlzLmNoYW5uZWxbaV0uc2VtaXRvbmU9MTI7XG4gICAgdGhpcy5jaGFubmVsW2ldLnZpYnJhdG9zcGVlZD0wXG4gICAgdGhpcy5jaGFubmVsW2ldLnZpYnJhdG9kZXB0aD0wXG4gICAgdGhpcy5jaGFubmVsW2ldLnZpYnJhdG9wb3M9MDtcbiAgICB0aGlzLmNoYW5uZWxbaV0udmlicmF0b3dhdmU9MDtcbiAgfVxuICB0aGlzLnZ1PW5ldyBBcnJheSgpO1xufVxuXG5cblxuLy8gbG9hZCBtb2R1bGUgZnJvbSB1cmwgaW50byBsb2NhbCBidWZmZXJcblByb3RyYWNrZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbih1cmwpXG57XG4gICAgdGhpcy5wbGF5aW5nPWZhbHNlOyAvLyBhIHByZWNhdXRpb25cblxuICAgIHRoaXMudXJsPXVybDtcbiAgICB0aGlzLmNsZWFyc29uZygpO1xuICAgIFxuICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgcmVxdWVzdC5vcGVuKFwiR0VUXCIsIHRoaXMudXJsLCB0cnVlKTtcbiAgICByZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICB0aGlzLnJlcXVlc3QgPSByZXF1ZXN0O1xuICAgIHRoaXMubG9hZGluZz10cnVlO1xuICAgIHZhciBhc3NldCA9IHRoaXM7XG4gICAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgYXNzZXQuYnVmZmVyPW5ldyBVaW50OEFycmF5KHJlcXVlc3QucmVzcG9uc2UpO1xuICAgICAgICBhc3NldC5wYXJzZSgpO1xuICAgICAgICBpZiAoYXNzZXQuYXV0b3N0YXJ0KSBhc3NldC5wbGF5KCk7XG4gICAgfVxuICAgIHJlcXVlc3Quc2VuZCgpOyAgXG59XG5cblxuXG4vLyBwYXJzZSB0aGUgbW9kdWxlIGZyb20gbG9jYWwgYnVmZmVyXG5Qcm90cmFja2VyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKClcbntcbiAgdmFyIGksaixjO1xuICBcbiAgaWYgKCF0aGlzLmJ1ZmZlcikgcmV0dXJuIGZhbHNlO1xuICBcbiAgZm9yKHZhciBpPTA7aTw0O2krKykgdGhpcy5zaWduYXR1cmUrPVN0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5idWZmZXJbMTA4MCtpXSk7XG4gIHN3aXRjaCAodGhpcy5zaWduYXR1cmUpIHtcbiAgICBjYXNlIFwiTS5LLlwiOlxuICAgIGNhc2UgXCJNIUshXCI6XG4gICAgY2FzZSBcIjRDSE5cIjpcbiAgICBjYXNlIFwiRkxUNFwiOlxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwiNkNITlwiOlxuICAgICAgdGhpcy5jaGFubmVscz02O1xuICAgICAgYnJlYWs7XG4gICAgICBcbiAgICBjYXNlIFwiOENITlwiOlxuICAgIGNhc2UgXCJGTFQ4XCI6XG4gICAgICB0aGlzLmNoYW5uZWxzPTg7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCIyOENIXCI6XG4gICAgICB0aGlzLmNoYW5uZWxzPTI4O1xuICAgICAgYnJlYWs7XG4gICAgXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB0aGlzLnZ1PW5ldyBBcnJheSgpO1xuICBmb3IodmFyIGk9MDtpPHRoaXMuY2hhbm5lbHM7aSsrKSB0aGlzLnZ1W2ldPTAuMDtcbiAgXG4gIGk9MDtcbiAgd2hpbGUodGhpcy5idWZmZXJbaV0gJiYgaTwyMClcbiAgICB0aGlzLnRpdGxlPXRoaXMudGl0bGUrU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltpKytdKTtcblxuICBmb3IodmFyIGk9MDtpPHRoaXMuc2FtcGxlcztpKyspIHtcbiAgICB2YXIgc3Q9MjAraSozMDtcbiAgICBqPTA7XG4gICAgd2hpbGUodGhpcy5idWZmZXJbc3Qral0gJiYgajwyMikgeyBcbiAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAoKHRoaXMuYnVmZmVyW3N0K2pdPjB4MWYpICYmICh0aGlzLmJ1ZmZlcltzdCtqXTwweDdmKSkgPyBcbiAgICAgICAgKFN0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5idWZmZXJbc3Qral0pKSA6XG4gICAgICAgIChcIiBcIik7XG4gICAgICBqKys7XG4gICAgfVxuICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyMl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjNdKTtcbiAgICB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLmJ1ZmZlcltzdCsyNF07XG4gICAgaWYgKHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lID4gNykgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5zYW1wbGVbaV0uZmluZXR1bmUtMTY7XG4gICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPXRoaXMuYnVmZmVyW3N0KzI1XTtcbiAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MioodGhpcy5idWZmZXJbc3QrMjZdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI3XSk7XG4gICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyOF0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjldKTtcbiAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD09MikgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ+dGhpcy5zYW1wbGVbaV0ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MDtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICB9XG4gIH1cblxuICB0aGlzLnNvbmdsZW49dGhpcy5idWZmZXJbOTUwXTtcbiAgaWYgKHRoaXMuYnVmZmVyWzk1MV0gIT0gMTI3KSB0aGlzLnJlcGVhdHBvcz10aGlzLmJ1ZmZlcls5NTFdO1xuICBmb3IodmFyIGk9MDtpPDEyODtpKyspIHtcbiAgICB0aGlzLnBhdHRlcm50YWJsZVtpXT10aGlzLmJ1ZmZlcls5NTIraV07XG4gICAgaWYgKHRoaXMucGF0dGVybnRhYmxlW2ldID4gdGhpcy5wYXR0ZXJucykgdGhpcy5wYXR0ZXJucz10aGlzLnBhdHRlcm50YWJsZVtpXTtcbiAgfVxuICB0aGlzLnBhdHRlcm5zKz0xO1xuICB2YXIgcGF0bGVuPTQqNjQqdGhpcy5jaGFubmVscztcblxuICB0aGlzLnBhdHRlcm49bmV3IEFycmF5KCk7XG4gIHRoaXMubm90ZT1uZXcgQXJyYXkoKTtcbiAgZm9yKHZhciBpPTA7aTx0aGlzLnBhdHRlcm5zO2krKykge1xuICAgIHRoaXMucGF0dGVybltpXT1uZXcgVWludDhBcnJheShwYXRsZW4pO1xuICAgIHRoaXMubm90ZVtpXT1uZXcgVWludDhBcnJheSh0aGlzLmNoYW5uZWxzKjY0KTtcbiAgICBmb3Ioaj0wO2o8cGF0bGVuO2orKykgdGhpcy5wYXR0ZXJuW2ldW2pdPXRoaXMuYnVmZmVyWzEwODQraSpwYXRsZW4ral07XG4gICAgZm9yKGo9MDtqPDY0O2orKykgZm9yKGM9MDtjPHRoaXMuY2hhbm5lbHM7YysrKSB7XG4gICAgICB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPTA7XG4gICAgICB2YXIgbj0odGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNF0mMHgwZik8PDggfCB0aGlzLnBhdHRlcm5baV1baio0KnRoaXMuY2hhbm5lbHMrYyo0KzFdO1xuICAgICAgZm9yKHZhciBucD0wOyBucDx0aGlzLmJhc2VwZXJpb2R0YWJsZS5sZW5ndGg7IG5wKyspXG4gICAgICAgIGlmIChuPT10aGlzLmJhc2VwZXJpb2R0YWJsZVtucF0pIHRoaXMubm90ZVtpXVtqKnRoaXMuY2hhbm5lbHMrY109bnA7XG4gICAgfSAgICAgICAgXG4gIH1cbiAgXG4gIHZhciBzc3Q9MTA4NCt0aGlzLnBhdHRlcm5zKnBhdGxlbjtcbiAgZm9yKHZhciBpPTA7aTx0aGlzLnNhbXBsZXM7aSsrKSB7XG4gICAgdGhpcy5zYW1wbGVbaV0uZGF0YT1uZXcgRmxvYXQzMkFycmF5KHRoaXMuc2FtcGxlW2ldLmxlbmd0aCk7XG4gICAgZm9yKGo9MDtqPHRoaXMuc2FtcGxlW2ldLmxlbmd0aDtqKyspIHtcbiAgICAgIHZhciBxPXRoaXMuYnVmZmVyW3NzdCtqXTtcbiAgICAgIGlmIChxPDEyOCkge1xuICAgICAgICBxPXEvMTI4LjA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxPSgocS0xMjgpLzEyOC4wKS0xLjA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGFbal09cTtcbiAgICB9XG4gICAgc3N0Kz10aGlzLnNhbXBsZVtpXS5sZW5ndGg7XG4gIH1cblxuICBpZiAodGhpcy5jb250ZXh0KSB7XG4gICAgdGhpcy5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG4gICAgdGhpcy5maWx0ZXI9ZmFsc2U7XG4gIH1cblxuICB0aGlzLnJlYWR5PXRydWU7XG4gIHRoaXMubG9hZGluZz1mYWxzZTtcbiAgdGhpcy5idWZmZXI9MDtcblxuICB0aGlzLm9uUmVhZHkoKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cblxuXG4vLyBhZHZhbmNlIHBsYXllclxuUHJvdHJhY2tlci5wcm90b3R5cGUuYWR2YW5jZT1mdW5jdGlvbihtb2QpIHtcbiAgdmFyIHNwZD0oKChtb2Quc2FtcGxlcmF0ZSo2MCkvbW9kLmJwbSkvNCkvNjtcblxuICAvLyBhZHZhbmNlIHBsYXllclxuICBpZiAobW9kLm9mZnNldD5zcGQpIHsgbW9kLnRpY2srKzsgbW9kLm9mZnNldD0wOyBtb2QuZmxhZ3N8PTE7IH1cbiAgaWYgKG1vZC50aWNrPj1tb2Quc3BlZWQpIHtcblxuICAgIGlmIChtb2QucGF0dGVybmRlbGF5KSB7IC8vIGRlbGF5IHBhdHRlcm5cbiAgICAgIGlmIChtb2QudGljayA8ICgobW9kLnBhdHRlcm53YWl0KzEpKm1vZC5zcGVlZCkpIHtcbiAgICAgICAgbW9kLnBhdHRlcm53YWl0Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtb2Qucm93Kys7IG1vZC50aWNrPTA7IG1vZC5mbGFnc3w9MjsgbW9kLnBhdHRlcm5kZWxheT0wO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcblxuICAgICAgaWYgKG1vZC5mbGFncyYoMTYrMzIrNjQpKSB7XG4gICAgICAgIGlmIChtb2QuZmxhZ3MmNjQpIHsgLy8gbG9vcCBwYXR0ZXJuP1xuICAgICAgICAgIG1vZC5yb3c9bW9kLmxvb3Byb3c7XG4gICAgICAgICAgbW9kLmZsYWdzJj0weGExO1xuICAgICAgICAgIG1vZC5mbGFnc3w9MjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAobW9kLmZsYWdzJjE2KSB7IC8vIHBhdHRlcm4ganVtcC9icmVhaz9cbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJicmVhayB0byBwYXR0ZXJuIFwiICsgbW9kLnBhdHRlcm5qdW1wICsgXCIgcm93IFwiK21vZC5icmVha3Jvdyk7XG4gICAgICAgICAgICBtb2QucG9zaXRpb249bW9kLnBhdHRlcm5qdW1wO1xuICAgICAgICAgICAgbW9kLnJvdz1tb2QuYnJlYWtyb3c7XG4gICAgICAgICAgICBtb2QucGF0dGVybmp1bXA9MDtcbiAgICAgICAgICAgIG1vZC5icmVha3Jvdz0wO1xuICAgICAgICAgICAgbW9kLmZsYWdzJj0weGUxO1xuICAgICAgICAgICAgbW9kLmZsYWdzfD0yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBtb2QudGljaz0wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kLnJvdysrOyBtb2QudGljaz0wOyBtb2QuZmxhZ3N8PTI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChtb2Qucm93Pj02NCkgeyBtb2QucG9zaXRpb24rKzsgbW9kLnJvdz0wOyBtb2QuZmxhZ3N8PTQ7IH1cbiAgaWYgKG1vZC5wb3NpdGlvbj49bW9kLnNvbmdsZW4pIHtcbiAgICBpZiAobW9kLnJlcGVhdCkge1xuICAgICAgbW9kLnBvc2l0aW9uPTA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5kb2Zzb25nPXRydWU7XG4gICAgICBtb2Quc3RvcCgpO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbn1cblxuXG5cbi8vIG1peCBhbiBhdWRpbyBidWZmZXIgd2l0aCBkYXRhXG5Qcm90cmFja2VyLnByb3RvdHlwZS5taXggPSBmdW5jdGlvbihhcGUpIHtcbiAgdmFyIGY7XG4gIHZhciBwLCBwcCwgbiwgbm47XG4gIHZhciBtb2Q7XG4gIGlmIChhcGUuc3JjRWxlbWVudCkge1xuICAgIG1vZD1hcGUuc3JjRWxlbWVudC5tb2R1bGU7XG4gIH0gZWxzZSB7XG4gICAgbW9kPXRoaXMubW9kdWxlO1xuICB9XG4gIG91dHA9bmV3IEFycmF5KCk7XG5cbiAgdmFyIGJ1ZnM9bmV3IEFycmF5KGFwZS5vdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCksIGFwZS5vdXRwdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMSkpO1xuICB2YXIgYnVmbGVuPWFwZS5vdXRwdXRCdWZmZXIubGVuZ3RoO1xuICBmb3IodmFyIHM9MDtzPGJ1ZmxlbjtzKyspXG4gIHtcbiAgICBvdXRwWzBdPTAuMDtcbiAgICBvdXRwWzFdPTAuMDtcblxuICAgIGlmICghbW9kLnBhdXNlZCAmJiBtb2QucGxheWluZyAmJiBtb2QuZGVsYXlmaXJzdD09MClcbiAgICB7XG4gICAgICBtb2QuYWR2YW5jZShtb2QpO1xuXG4gICAgICB2YXIgb2NoPTA7XG4gICAgICBmb3IodmFyIGNoPTA7Y2g8bW9kLmNoYW5uZWxzO2NoKyspXG4gICAgICB7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSBwbGF5YmFjayBwb3NpdGlvblxuICAgICAgICBwPW1vZC5wYXR0ZXJudGFibGVbbW9kLnBvc2l0aW9uXTtcbiAgICAgICAgcHA9bW9kLnJvdyo0Km1vZC5jaGFubmVscyArIGNoKjQ7XG4gICAgICAgIGlmIChtb2QuZmxhZ3MmMikgeyAvLyBuZXcgcm93XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLmNvbW1hbmQ9bW9kLnBhdHRlcm5bcF1bcHArMl0mMHgwZjtcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uZGF0YT1tb2QucGF0dGVybltwXVtwcCszXTtcblxuICAgICAgICAgIGlmICghKG1vZC5jaGFubmVsW2NoXS5jb21tYW5kPT0weDBlICYmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSYweGYwKT09MHhkMCkpIHtcbiAgICAgICAgICAgIG49KG1vZC5wYXR0ZXJuW3BdW3BwXSYweDBmKTw8OCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzFdO1xuICAgICAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgICAgLy8gbm90ZW9uLCBleGNlcHQgaWYgY29tbWFuZD0zIChwb3J0YSB0byBub3RlKVxuICAgICAgICAgICAgICBpZiAoKG1vZC5jaGFubmVsW2NoXS5jb21tYW5kICE9IDB4MDMpICYmIChtb2QuY2hhbm5lbFtjaF0uY29tbWFuZCAhPSAweDA1KSkge1xuICAgICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5wZXJpb2Q9bjtcbiAgICAgICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zPTA7XG4gICAgICAgICAgICAgICAgaWYgKG1vZC5jaGFubmVsW2NoXS52aWJyYXRvd2F2ZT4zKSBtb2QuY2hhbm5lbFtjaF0udmlicmF0b3Bvcz0wO1xuICAgICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkXG4gICAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0xO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGluIGVpdGhlciBjYXNlLCBzZXQgdGhlIHNsaWRlIHRvIG5vdGUgdGFyZ2V0XG4gICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zbGlkZXRvPW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBubj1tb2QucGF0dGVybltwXVtwcCswXSYweGYwIHwgbW9kLnBhdHRlcm5bcF1bcHArMl0+PjQ7XG4gICAgICAgICAgICBpZiAobm4pIHtcbiAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnNhbXBsZT1ubi0xO1xuICAgICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPW1vZC5zYW1wbGVbbm4tMV0udm9sdW1lO1xuICAgICAgICAgICAgICBpZiAoIW4gJiYgKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MgPiBtb2Quc2FtcGxlW25uLTFdLmxlbmd0aCkpIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3M9MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZvaWNlcGVyaW9kPW1vZC5jaGFubmVsW2NoXS5wZXJpb2Q7XG4gICAgICAgIFxuICAgICAgICAvLyBraWxsIGVtcHR5IHNhbXBsZXNcbiAgICAgICAgaWYgKCFtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxlbmd0aCkgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0wO1xuXG4gICAgICAgIC8vIGVmZmVjdHMgICAgICAgIFxuICAgICAgICBpZiAobW9kLmZsYWdzJjEpIHtcbiAgICAgICAgICBpZiAoIW1vZC50aWNrKSB7XG4gICAgICAgICAgICAvLyBwcm9jZXNzIG9ubHkgb24gdGljayAwXG4gICAgICAgICAgICBtb2QuZWZmZWN0c190MFttb2QuY2hhbm5lbFtjaF0uY29tbWFuZF0obW9kLCBjaCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZC5lZmZlY3RzX3QxW21vZC5jaGFubmVsW2NoXS5jb21tYW5kXShtb2QsIGNoKTsgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVjYWxjIG5vdGUgbnVtYmVyIGZyb20gcGVyaW9kXG4gICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0uZmxhZ3MmMikge1xuICAgICAgICAgIGZvcih2YXIgbnA9MDsgbnA8bW9kLmJhc2VwZXJpb2R0YWJsZS5sZW5ndGg7IG5wKyspXG4gICAgICAgICAgICBpZiAobW9kLmJhc2VwZXJpb2R0YWJsZVtucF0+PW1vZC5jaGFubmVsW2NoXS5wZXJpb2QpIG1vZC5jaGFubmVsW2NoXS5ub3RlPW5wO1xuICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zZW1pdG9uZT03O1xuICAgICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPj0xMjApXG4gICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2VtaXRvbmU9bW9kLmJhc2VwZXJpb2R0YWJsZVttb2QuY2hhbm5lbFtjaF0ubm90ZV0tbW9kLmJhc2VwZXJpb2R0YWJsZVttb2QuY2hhbm5lbFtjaF0ubm90ZSsxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlY2FsYyBzYW1wbGUgc3BlZWQgYW5kIGFwcGx5IGZpbmV0dW5lXG4gICAgICAgIGlmICgobW9kLmNoYW5uZWxbY2hdLmZsYWdzJjEgfHwgbW9kLmZsYWdzJjIpICYmIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZClcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlc3BlZWQ9XG4gICAgICAgICAgICAobW9kLnBhbGNsb2NrID8gNzA5Mzc4OS4yIDogNzE1OTA5MC41KS8obW9kLmNoYW5uZWxbY2hdLnZvaWNlcGVyaW9kKjIpICogbW9kLmZpbmV0dW5ldGFibGVbbW9kLnNhbXBsZVttb2QuY2hhbm5lbFtjaF0uc2FtcGxlXS5maW5ldHVuZSs4XSAvIG1vZC5zYW1wbGVyYXRlO1xuICAgICAgICBcbiAgICAgICAgLy8gYWR2YW5jZSB2aWJyYXRvIG9uIGVhY2ggbmV3IHRpY2tcbiAgICAgICAgaWYgKG1vZC5mbGFncyYxKSB7XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3MrPW1vZC5jaGFubmVsW2NoXS52aWJyYXRvc3BlZWQ7XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3MmPTB4M2Y7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtaXggY2hhbm5lbCB0byBvdXRwdXQgICAgICAgIFxuICAgICAgICBvY2g9b2NoXihjaCYxKTtcbiAgICAgICAgZj0wLjA7XG4gICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ubm90ZW9uKSB7XG4gICAgICAgICAgaWYgKG1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0ubGVuZ3RoID4gbW9kLmNoYW5uZWxbY2hdLnNhbXBsZXBvcylcbiAgICAgICAgICAgIGY9KDEuMC9tb2QuY2hhbm5lbHMpICpcbiAgICAgICAgICAgICAgKG1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0uZGF0YVtNYXRoLmZsb29yKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MpXSptb2QuY2hhbm5lbFtjaF0udm9sdW1lKS82NC4wO1xuICAgICAgICAgIG91dHBbb2NoXSs9ZjtcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zKz1tb2QuY2hhbm5lbFtjaF0uc2FtcGxlc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM9PTApIG1vZC52dVtjaF09TWF0aC5hYnMoZik7XG5cbiAgICAgICAgLy8gbG9vcCBvciBlbmQgc2FtcGxlc1xuICAgICAgICBpZiAobW9kLmNoYW5uZWxbY2hdLm5vdGVvbikge1xuICAgICAgICAgIGlmIChtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BzdGFydCB8fCBtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zID49IChtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BzdGFydCttb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BsZW5ndGgpKSB7XG4gICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MtPW1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0ubG9vcGxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MgPj0gbW9kLnNhbXBsZVttb2QuY2hhbm5lbFtjaF0uc2FtcGxlXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFyIGNoYW5uZWwgZmxhZ3NcbiAgICAgICAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzPTA7XG4gICAgICB9IFxuICAgICAgbW9kLm9mZnNldCsrO1xuICAgICAgbW9kLmZsYWdzJj0weDcwOyAgICAgIFxuICAgIH1cbiAgICBcbiAgICAvLyBhIG1vcmUgaGVhZHBob25lLWZyaWVuZGx5IHN0ZXJlbyBzZXBhcmF0aW9uIChha2EuIGJldHRlcnBhdWxhKVxuICAgIGlmIChtb2Quc2VwYXJhdGlvbikge1xuICAgICAgdD1vdXRwWzBdO1xuICAgICAgaWYgKG1vZC5zZXBhcmF0aW9uPT0yKSB7XG4gICAgICAgIG91dHBbMF09b3V0cFswXSowLjUgKyBvdXRwWzFdKjAuNTtcbiAgICAgICAgb3V0cFsxXT1vdXRwWzFdKjAuNSArIHQqMC41O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cFswXT1vdXRwWzBdKjAuNjUgKyBvdXRwWzFdKjAuMzU7XG4gICAgICAgIG91dHBbMV09b3V0cFsxXSowLjY1ICsgdCowLjM1O1xuICAgICAgfVxuICAgIH1cbiAgICBidWZzWzBdW3NdPW91dHBbMF07XG4gICAgYnVmc1sxXVtzXT1vdXRwWzFdO1xuICB9XG4gIGlmIChtb2QuZGVsYXlmaXJzdD4wKSBtb2QuZGVsYXlmaXJzdC0tOyAvLz1mYWxzZTtcbiAgbW9kLmRlbGF5bG9hZD0wO1xufVxuXG5cblxuLy9cbi8vIHRpY2sgMCBlZmZlY3QgZnVuY3Rpb25zXG4vL1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzA9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAwIGFycGVnZ2lvXG4gIG1vZC5jaGFubmVsW2NoXS5hcnBlZ2dpbz1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF8xPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMSBzbGlkZSB1cFxuICBpZiAobW9kLmNoYW5uZWxbY2hdLmRhdGEpIG1vZC5jaGFubmVsW2NoXS5zbGlkZXNwZWVkPW1vZC5jaGFubmVsW2NoXS5kYXRhO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzI9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAyIHNsaWRlIGRvd25cbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhKSBtb2QuY2hhbm5lbFtjaF0uc2xpZGVzcGVlZD1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF8zPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMyBzbGlkZSB0byBub3RlXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSkgbW9kLmNoYW5uZWxbY2hdLnNsaWRldG9zcGVlZD1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF80PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gNCB2aWJyYXRvXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmICYmIG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4ZjApIHtcbiAgICBtb2QuY2hhbm5lbFtjaF0udmlicmF0b2RlcHRoPShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKTtcbiAgICBtb2QuY2hhbm5lbFtjaF0udmlicmF0b3NwZWVkPShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweGYwKT4+NDtcbiAgfVxuICBtb2QuY2hhbm5lbFtjaF0udm9pY2VwZXJpb2QrPVxuICAgIChtb2QuY2hhbm5lbFtjaF0udmlicmF0b2RlcHRoLzMyKSptb2QuY2hhbm5lbFtjaF0uc2VtaXRvbmUqKG1vZC52aWJyYXRvdGFibGVbbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG93YXZlJjNdW21vZC5jaGFubmVsW2NoXS52aWJyYXRvcG9zXS8xMjcpOyAgICAgICAgXG4gIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MTtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF81PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gNVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzY9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA2XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfNz1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIDdcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF84PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOCB1bnVzZWQsIHVzZWQgZm9yIHN5bmNpbmdcbiAgbW9kLnN5bmNxdWV1ZS51bnNoaWZ0KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzk9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA5IHNldCBzYW1wbGUgb2Zmc2V0XG4gIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3M9bW9kLmNoYW5uZWxbY2hdLmRhdGEqMjU2O1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2E9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBhXG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfYj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGIgcGF0dGVybiBqdW1wXG4gIG1vZC5icmVha3Jvdz0wO1xuICBtb2QucGF0dGVybmp1bXA9bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG4gIG1vZC5mbGFnc3w9MTY7XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfYz1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGMgc2V0IHZvbHVtZVxuICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPW1vZC5jaGFubmVsW2NoXS5kYXRhO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2Q9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBkIHBhdHRlcm4gYnJlYWtcbiAgbW9kLmJyZWFrcm93PSgobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHhmMCk+PjQpKjEwICsgKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xuICBpZiAoIShtb2QuZmxhZ3MmMTYpKSBtb2QucGF0dGVybmp1bXA9bW9kLnBvc2l0aW9uKzE7XG4gIG1vZC5mbGFnc3w9MTY7ICBcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZVxuICB2YXIgaT0obW9kLmNoYW5uZWxbY2hdLmRhdGEmMHhmMCk+PjQ7XG4gIG1vZC5lZmZlY3RzX3QwX2VbaV0obW9kLCBjaCk7XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGYgc2V0IHNwZWVkXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSA+IDMyKSB7XG4gICAgbW9kLmJwbT1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbiAgfSBlbHNlIHtcbiAgICBpZiAobW9kLmNoYW5uZWxbY2hdLmRhdGEpIG1vZC5zcGVlZD1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbiAgfVxufVxuXG5cblxuLy9cbi8vIHRpY2sgMCBlZmZlY3QgZSBmdW5jdGlvbnNcbi8vXG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTA9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlMCBmaWx0ZXIgb24vb2ZmXG4gIGlmIChtb2QuY2hhbm5lbHMgPiA0KSByZXR1cm47IC8vIHVzZSBvbmx5IGZvciA0Y2ggYW1pZ2EgdHVuZXNcbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpIHtcbiAgICBtb2QubG93cGFzc05vZGUuZnJlcXVlbmN5LnZhbHVlPTMyNzU7XG4gICAgbW9kLmZpbHRlcj10cnVlO1xuICB9IGVsc2Uge1xuICAgIG1vZC5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG4gICAgbW9kLmZpbHRlcj1mYWxzZTtcbiAgfVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2UxPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTEgZmluZSBzbGlkZSB1cFxuICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kLT1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnBlcmlvZCA8IDExMykgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD0xMTM7XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTI9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlMiBmaW5lIHNsaWRlIGRvd25cbiAgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZCs9bW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZjtcbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5wZXJpb2QgPiA4NTYpIG1vZC5jaGFubmVsW2NoXS5wZXJpb2Q9ODU2O1xuICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTE7XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTM9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlMyBzZXQgZ2xpc3NhbmRvXG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTQ9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNCBzZXQgdmlicmF0byB3YXZlZm9ybVxuICBtb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmU9bW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwNztcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lNT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU1IHNldCBmaW5ldHVuZVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2U2PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTYgbG9vcCBwYXR0ZXJuXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKSB7XG4gICAgaWYgKG1vZC5sb29wY291bnQpIHtcbiAgICAgIG1vZC5sb29wY291bnQtLTtcbiAgICB9IGVsc2Uge1xuICAgICAgbW9kLmxvb3Bjb3VudD1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICAgIH1cbiAgICBpZiAobW9kLmxvb3Bjb3VudCkgbW9kLmZsYWdzfD02NDtcbiAgfSBlbHNlIHtcbiAgICBtb2QubG9vcHJvdz1tb2Qucm93O1xuICB9XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTc9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlN1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2U4PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTgsIHVzZSBmb3Igc3luY2luZ1xuICBtb2Quc3luY3F1ZXVlLnVuc2hpZnQobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZik7XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTk9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlOVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2VhPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWEgZmluZSB2b2xzbGlkZSB1cFxuICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lKz1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnZvbHVtZSA+IDY0KSBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPTY0O1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2ViPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWIgZmluZSB2b2xzbGlkZSBkb3duXG4gIG1vZC5jaGFubmVsW2NoXS52b2x1bWUtPW1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGY7XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0udm9sdW1lIDwgMCkgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZT0wO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2VjPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWNcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVkIGRlbGF5IHNhbXBsZVxuICBpZiAobW9kLnRpY2s9PShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKSkge1xuICAgIC8vIHN0YXJ0IG5vdGVcbiAgICB2YXIgcD1tb2QucGF0dGVybnRhYmxlW21vZC5wb3NpdGlvbl07XG4gICAgdmFyIHBwPW1vZC5yb3cqNCptb2QuY2hhbm5lbHMgKyBjaCo0OyAgICAgICAgICAgIFxuICAgIG49KG1vZC5wYXR0ZXJuW3BdW3BwXSYweDBmKTw8OCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzFdO1xuICAgIGlmIChuKSB7XG4gICAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPW47XG4gICAgICBtb2QuY2hhbm5lbFtjaF0udm9pY2VwZXJpb2Q9bW9kLmNoYW5uZWxbY2hdLnBlcmlvZDsgICAgICBcbiAgICAgIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3M9MDtcbiAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmU+MykgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3M9MDtcbiAgICAgIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkXG4gICAgICBtb2QuY2hhbm5lbFtjaF0ubm90ZW9uPTE7XG4gICAgfVxuICAgIG49bW9kLnBhdHRlcm5bcF1bcHArMF0mMHhmMCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzJdPj40O1xuICAgIGlmIChuKSB7XG4gICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlPW4tMTtcbiAgICAgIG1vZC5jaGFubmVsW2NoXS52b2x1bWU9bW9kLnNhbXBsZVtuLTFdLnZvbHVtZTtcbiAgICB9XG4gIH1cbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lZT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVlIGRlbGF5IHBhdHRlcm5cbiAgbW9kLnBhdHRlcm5kZWxheT1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBtb2QucGF0dGVybndhaXQ9MDtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lZj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVmXG59XG5cblxuXG4vL1xuLy8gdGljayAxKyBlZmZlY3QgZnVuY3Rpb25zXG4vL1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzA9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAwIGFycGVnZ2lvXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSkge1xuICAgIHZhciBhcG49bW9kLmNoYW5uZWxbY2hdLm5vdGU7XG4gICAgaWYgKChtb2QudGljayUzKT09MSkgYXBuKz1tb2QuY2hhbm5lbFtjaF0uYXJwZWdnaW8+PjQ7XG4gICAgaWYgKChtb2QudGljayUzKT09MikgYXBuKz1tb2QuY2hhbm5lbFtjaF0uYXJwZWdnaW8mMHgwZjtcbiAgICBpZiAoYXBuPj0wICYmIGFwbiA8PSBtb2QuYmFzZXBlcmlvZHRhYmxlLmxlbmd0aClcbiAgICAgIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZCA9IG1vZC5iYXNlcGVyaW9kdGFibGVbYXBuXTtcbiAgICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTE7XG4gIH1cbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV8xPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMSBzbGlkZSB1cFxuICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kLT1tb2QuY2hhbm5lbFtjaF0uc2xpZGVzcGVlZDtcbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5wZXJpb2Q8MTEzKSBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPTExMztcbiAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzfD0zOyAvLyByZWNhbGMgc3BlZWRcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV8yPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMiBzbGlkZSBkb3duXG4gIG1vZC5jaGFubmVsW2NoXS5wZXJpb2QrPW1vZC5jaGFubmVsW2NoXS5zbGlkZXNwZWVkO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnBlcmlvZD44NTYpIG1vZC5jaGFubmVsW2NoXS5wZXJpb2Q9ODU2O1xuICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTM7IC8vIHJlY2FsYyBzcGVlZCAgICAgICAgICAgICAgICBcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV8zPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMyBzbGlkZSB0byBub3RlXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kIDwgbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pIHtcbiAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kKz1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0b3NwZWVkO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kID4gbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pXG4gICAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPW1vZC5jaGFubmVsW2NoXS5zbGlkZXRvO1xuICB9XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kID4gbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pIHtcbiAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kLT1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0b3NwZWVkO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPG1vZC5jaGFubmVsW2NoXS5zbGlkZXRvKVxuICAgICAgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0bztcbiAgfVxuICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTM7IC8vIHJlY2FsYyBzcGVlZFxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzQ9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA0IHZpYnJhdG9cbiAgbW9kLmNoYW5uZWxbY2hdLnZvaWNlcGVyaW9kKz1cbiAgICAobW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9kZXB0aC8zMikqbW9kLmNoYW5uZWxbY2hdLnNlbWl0b25lKihtb2QudmlicmF0b3RhYmxlW21vZC5jaGFubmVsW2NoXS52aWJyYXRvd2F2ZSYzXVttb2QuY2hhbm5lbFtjaF0udmlicmF0b3Bvc10vMTI3KTtcbiAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzfD0xO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzU9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA1IHZvbHNsaWRlICsgc2xpZGUgdG8gbm90ZVxuICBtb2QuZWZmZWN0X3QxXzMobW9kLCBjaCk7IC8vIHNsaWRlIHRvIG5vdGVcbiAgbW9kLmVmZmVjdF90MV9hKG1vZCwgY2gpOyAvLyB2b2xzbGlkZVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzY9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA2IHZvbHNsaWRlICsgdmlicmF0b1xuICBtb2QuZWZmZWN0X3QxXzQobW9kLCBjaCk7IC8vIHZpYnJhdG9cbiAgbW9kLmVmZmVjdF90MV9hKG1vZCwgY2gpOyAvLyB2b2xzbGlkZVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzc9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA3XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfOD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIDggdW51c2VkXG5cbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV85PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOSBzZXQgc2FtcGxlIG9mZnNldFxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2E9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBhIHZvbHVtZSBzbGlkZVxuICBpZiAoIShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKSkge1xuICAgIC8vIHkgaXMgemVybywgc2xpZGUgdXBcbiAgICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lKz0obW9kLmNoYW5uZWxbY2hdLmRhdGE+PjQpO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0udm9sdW1lPjY0KSBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPTY0O1xuICB9XG4gIGlmICghKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4ZjApKSB7XG4gICAgLy8geCBpcyB6ZXJvLCBzbGlkZSBkb3duXG4gICAgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZS09KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0udm9sdW1lPDApIG1vZC5jaGFubmVsW2NoXS52b2x1bWU9MDsgICAgICAgICAgICAgICAgICBcbiAgfVxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2I9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBiIHBhdHRlcm4ganVtcFxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2M9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBjIHNldCB2b2x1bWVcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9kPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZCBwYXR0ZXJuIGJyZWFrXG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVcbiAgdmFyIGk9KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4ZjApPj40O1xuICBtb2QuZWZmZWN0c190MV9lW2ldKG1vZCwgY2gpO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2Y9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBmXG59XG5cblxuXG4vL1xuLy8gdGljayAxKyBlZmZlY3QgZSBmdW5jdGlvbnNcbi8vXG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTA9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlMFxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2UxPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTFcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lMj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGUyXG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTM9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlM1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2U0PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTRcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lNT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU1XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTY9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNlxufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2U3PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTdcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lOD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU4XG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTk9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlOSByZXRyaWcgc2FtcGxlXG4gIGlmIChtb2QudGljayUobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZik9PTApXG4gICAgbW9kLmNoYW5uZWxbY2hdLnNhbXBsZXBvcz0wO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2VhPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWFcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lYj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGViXG59XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZWM9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlYyBjdXQgc2FtcGxlXG4gIGlmIChtb2QudGljaz09KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpKVxuICAgIG1vZC5jaGFubmVsW2NoXS52b2x1bWU9MDtcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVkIGRlbGF5IHNhbXBsZVxuICBtb2QuZWZmZWN0X3QwX2VkKG1vZCwgY2gpO1xufVxuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2VlPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWVcbn1cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lZj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVmXG59XG5cbi8vIGZlZWwgZnJlZSB0byBkaXNhYmxlIHRoZSBmb3JtYXRzXG5yZXF1aXJlKCcuL2Zvcm1hdHMvaXQnKShQcm90cmFja2VyKTtcbnJlcXVpcmUoJy4vZm9ybWF0cy9tb2QnKShQcm90cmFja2VyKTtcbnJlcXVpcmUoJy4vZm9ybWF0cy94bScpKFByb3RyYWNrZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3RyYWNrZXI7Il19
