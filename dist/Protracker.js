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
  this.finetunetable = [];
  for(t=0;t<16;t++) this.finetunetable[t]=Math.pow(2, (t-8)/12/8);
  
  // calc tables for vibrato waveforms
  this.vibratotable = [];
  for(t=0;t<4;t++) {
    this.vibratotable[t] = [];
    for(i=0;i<64;i++) {
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
};



// play loaded and parsed module with webaudio context
Protracker.prototype.play = function()
{
  if (this.context===null) {
    this.createContext();
  }
  
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
};



// pause playback
Protracker.prototype.pause = function()
{
  if (!this.paused) {
    this.paused=true;
  } else {
    this.paused=false;
  }
};



// stop playback
Protracker.prototype.stop = function()
{
  this.playing=false;
  this.onStop();
  this.delayload=1;
};



// stop playing but don't call callbacks
Protracker.prototype.stopaudio = function(st)
{
  this.playing=st;
};



// jump positions forward/back
Protracker.prototype.jump = function(step)
{
  this.tick=0;
  this.row=0;
  this.position+=step;
  this.flags=1+2;  
  if (this.position<0) this.position=0;
  if (this.position >= this.songlen) this.stop();
};



// set whether module repeats after songlen
Protracker.prototype.setrepeat = function(rep)
{
  this.repeat=rep;
};



// set stereo separation mode (0=paula, 1=betterpaula (60/40), 2=mono)
Protracker.prototype.setseparation = function(sep)
{
  this.separation=sep;
};



// set amiga video standard (false=NTSC, true=PAL)
Protracker.prototype.setamigatype = function(clock)
{
  this.palclock=clock;
};



// set autostart to play immediately after loading
Protracker.prototype.setautostart = function(st)
{
  this.autostart=st;
};





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
};



// are there E8x sync events queued?
Protracker.prototype.hassyncevents = function()
{
  return (this.syncqueue.length !== 0);
};



// pop oldest sync event nybble from the FIFO queue
Protracker.prototype.popsyncevent = function()
{
  return this.syncqueue.pop();
};



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

  this.sample=[];
  this.samples=31;
  for(i=0;i<31;i++) {
    this.sample[i]={};
    this.sample[i].name="";
    this.sample[i].length=0;
    this.sample[i].finetune=0;
    this.sample[i].volume=64;
    this.sample[i].loopstart=0;
    this.sample[i].looplength=0;
    this.sample[i].data=0;
  }

  this.patterns=0;
  this.pattern=[];
  this.note=[];
  
  this.looprow=0;
  this.loopstart=0;
  this.loopcount=0;
  
  this.patterndelay=0;
  this.patternwait=0;
  
  this.syncqueue=[];
};


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
  
  this.channel=[];
  for(i=0;i<this.channels;i++) {
    this.channel[i]={};
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
    this.channel[i].vibratospeed=0;
    this.channel[i].vibratodepth=0;
    this.channel[i].vibratopos=0;
    this.channel[i].vibratowave=0;
  }
  this.vu=[];
};



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
    };
    request.send();  
};



// parse the module from local buffer
Protracker.prototype.parse = function()
{
  var i,j,c;
  
  if (!this.buffer){
    return false;
  }
  
  for(i=0;i<4;i++){
    this.signature+=String.fromCharCode(this.buffer[1080+i]);
  }

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
  this.vu=[];
  for(i=0;i<this.channels;i++){
    this.vu[i]=0.0;
  }
  
  i=0;
  while(this.buffer[i] && i<20){
    this.title=this.title+String.fromCharCode(this.buffer[i++]);
  }

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

  if (this.context) {
    this.lowpassNode.frequency.value=28867;
    this.filter=false;
  }

  this.ready=true;
  this.loading=false;
  this.buffer=0;

  this.onReady();
  return true;
};



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
};



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
  outp=[];

  var bufs=new Array(ape.outputBuffer.getChannelData(0), ape.outputBuffer.getChannelData(1));
  var buflen=ape.outputBuffer.length;
  for(var s=0;s<buflen;s++)
  {
    outp[0]=0.0;
    outp[1]=0.0;

    if (!mod.paused && mod.playing && mod.delayfirst===0)
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
        if (s===0){
          mod.vu[ch]=Math.abs(f);
        }

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
};



//
// tick 0 effect functions
//
Protracker.prototype.effect_t0_0=function(mod, ch) { // 0 arpeggio
  mod.channel[ch].arpeggio=mod.channel[ch].data;
};
Protracker.prototype.effect_t0_1=function(mod, ch) { // 1 slide up
  if (mod.channel[ch].data) mod.channel[ch].slidespeed=mod.channel[ch].data;
};
Protracker.prototype.effect_t0_2=function(mod, ch) { // 2 slide down
  if (mod.channel[ch].data) mod.channel[ch].slidespeed=mod.channel[ch].data;
};
Protracker.prototype.effect_t0_3=function(mod, ch) { // 3 slide to note
  if (mod.channel[ch].data) mod.channel[ch].slidetospeed=mod.channel[ch].data;
};
Protracker.prototype.effect_t0_4=function(mod, ch) { // 4 vibrato
  if (mod.channel[ch].data&0x0f && mod.channel[ch].data&0xf0) {
    mod.channel[ch].vibratodepth=(mod.channel[ch].data&0x0f);
    mod.channel[ch].vibratospeed=(mod.channel[ch].data&0xf0)>>4;
  }
  mod.channel[ch].voiceperiod+=
    (mod.channel[ch].vibratodepth/32)*mod.channel[ch].semitone*(mod.vibratotable[mod.channel[ch].vibratowave&3][mod.channel[ch].vibratopos]/127);        
  mod.channel[ch].flags|=1;
};
Protracker.prototype.effect_t0_5=function(mod, ch) { // 5
};
Protracker.prototype.effect_t0_6=function(mod, ch) { // 6
};
Protracker.prototype.effect_t0_7=function(mod, ch) { // 7
};
Protracker.prototype.effect_t0_8=function(mod, ch) { // 8 unused, used for syncing
  mod.syncqueue.unshift(mod.channel[ch].data&0x0f);
};
Protracker.prototype.effect_t0_9=function(mod, ch) { // 9 set sample offset
  mod.channel[ch].samplepos=mod.channel[ch].data*256;
};
Protracker.prototype.effect_t0_a=function(mod, ch) { // a
};
Protracker.prototype.effect_t0_b=function(mod, ch) { // b pattern jump
  mod.breakrow=0;
  mod.patternjump=mod.channel[ch].data;
  mod.flags|=16;
};
Protracker.prototype.effect_t0_c=function(mod, ch) { // c set volume
  mod.channel[ch].volume=mod.channel[ch].data;
};
Protracker.prototype.effect_t0_d=function(mod, ch) { // d pattern break
  mod.breakrow=((mod.channel[ch].data&0xf0)>>4)*10 + (mod.channel[ch].data&0x0f);
  if (!(mod.flags&16)) mod.patternjump=mod.position+1;
  mod.flags|=16;  
};
Protracker.prototype.effect_t0_e=function(mod, ch) { // e
  var i=(mod.channel[ch].data&0xf0)>>4;
  mod.effects_t0_e[i](mod, ch);
};
Protracker.prototype.effect_t0_f=function(mod, ch) { // f set speed
  if (mod.channel[ch].data > 32) {
    mod.bpm=mod.channel[ch].data;
  } else {
    if (mod.channel[ch].data) mod.speed=mod.channel[ch].data;
  }
};



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
};
Protracker.prototype.effect_t0_e1=function(mod, ch) { // e1 fine slide up
  mod.channel[ch].period-=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].period < 113) mod.channel[ch].period=113;
};
Protracker.prototype.effect_t0_e2=function(mod, ch) { // e2 fine slide down
  mod.channel[ch].period+=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].period > 856) mod.channel[ch].period=856;
  mod.channel[ch].flags|=1;
};
Protracker.prototype.effect_t0_e3=function(mod, ch) { // e3 set glissando
};
Protracker.prototype.effect_t0_e4=function(mod, ch) { // e4 set vibrato waveform
  mod.channel[ch].vibratowave=mod.channel[ch].data&0x07;
};
Protracker.prototype.effect_t0_e5=function(mod, ch) { // e5 set finetune
};
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
};
Protracker.prototype.effect_t0_e7=function(mod, ch) { // e7
};
Protracker.prototype.effect_t0_e8=function(mod, ch) { // e8, use for syncing
  mod.syncqueue.unshift(mod.channel[ch].data&0x0f);
};
Protracker.prototype.effect_t0_e9=function(mod, ch) { // e9
};
Protracker.prototype.effect_t0_ea=function(mod, ch) { // ea fine volslide up
  mod.channel[ch].volume+=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].volume > 64) mod.channel[ch].volume=64;
};
Protracker.prototype.effect_t0_eb=function(mod, ch) { // eb fine volslide down
  mod.channel[ch].volume-=mod.channel[ch].data&0x0f;
  if (mod.channel[ch].volume < 0) mod.channel[ch].volume=0;
};
Protracker.prototype.effect_t0_ec=function(mod, ch) { // ec
};
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
};
Protracker.prototype.effect_t0_ee=function(mod, ch) { // ee delay pattern
  mod.patterndelay=mod.channel[ch].data&0x0f;
  mod.patternwait=0;
};
Protracker.prototype.effect_t0_ef=function(mod, ch) { // ef
};



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
};
Protracker.prototype.effect_t1_1=function(mod, ch) { // 1 slide up
  mod.channel[ch].period-=mod.channel[ch].slidespeed;
  if (mod.channel[ch].period<113) mod.channel[ch].period=113;
  mod.channel[ch].flags|=3; // recalc speed
};
Protracker.prototype.effect_t1_2=function(mod, ch) { // 2 slide down
  mod.channel[ch].period+=mod.channel[ch].slidespeed;
  if (mod.channel[ch].period>856) mod.channel[ch].period=856;
  mod.channel[ch].flags|=3; // recalc speed                
};
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
};
Protracker.prototype.effect_t1_4=function(mod, ch) { // 4 vibrato
  mod.channel[ch].voiceperiod+=
    (mod.channel[ch].vibratodepth/32)*mod.channel[ch].semitone*(mod.vibratotable[mod.channel[ch].vibratowave&3][mod.channel[ch].vibratopos]/127);
  mod.channel[ch].flags|=1;
};
Protracker.prototype.effect_t1_5=function(mod, ch) { // 5 volslide + slide to note
  mod.effect_t1_3(mod, ch); // slide to note
  mod.effect_t1_a(mod, ch); // volslide
};
Protracker.prototype.effect_t1_6=function(mod, ch) { // 6 volslide + vibrato
  mod.effect_t1_4(mod, ch); // vibrato
  mod.effect_t1_a(mod, ch); // volslide
};
Protracker.prototype.effect_t1_7=function(mod, ch) { // 7
};
Protracker.prototype.effect_t1_8=function(mod, ch) { // 8 unused

};
Protracker.prototype.effect_t1_9=function(mod, ch) { // 9 set sample offset
};
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
};
Protracker.prototype.effect_t1_b=function(mod, ch) { // b pattern jump
};
Protracker.prototype.effect_t1_c=function(mod, ch) { // c set volume
};
Protracker.prototype.effect_t1_d=function(mod, ch) { // d pattern break
};
Protracker.prototype.effect_t1_e=function(mod, ch) { // e
  var i=(mod.channel[ch].data&0xf0)>>4;
  mod.effects_t1_e[i](mod, ch);
};
Protracker.prototype.effect_t1_f=function(mod, ch) { // f
};



//
// tick 1+ effect e functions
//
Protracker.prototype.effect_t1_e0=function(mod, ch) { // e0
};
Protracker.prototype.effect_t1_e1=function(mod, ch) { // e1
};
Protracker.prototype.effect_t1_e2=function(mod, ch) { // e2
};
Protracker.prototype.effect_t1_e3=function(mod, ch) { // e3
};
Protracker.prototype.effect_t1_e4=function(mod, ch) { // e4
};
Protracker.prototype.effect_t1_e5=function(mod, ch) { // e5
};
Protracker.prototype.effect_t1_e6=function(mod, ch) { // e6
};
Protracker.prototype.effect_t1_e7=function(mod, ch) { // e7
};
Protracker.prototype.effect_t1_e8=function(mod, ch) { // e8
};
Protracker.prototype.effect_t1_e9=function(mod, ch) { // e9 retrig sample
  if (mod.tick%(mod.channel[ch].data&0x0f)===0)
    mod.channel[ch].samplepos=0;
};
Protracker.prototype.effect_t1_ea=function(mod, ch) { // ea
};
Protracker.prototype.effect_t1_eb=function(mod, ch) { // eb
};
Protracker.prototype.effect_t1_ec=function(mod, ch) { // ec cut sample
  if (mod.tick==(mod.channel[ch].data&0x0f))
    mod.channel[ch].volume=0;
};
Protracker.prototype.effect_t1_ed=function(mod, ch) { // ed delay sample
  mod.effect_t0_ed(mod, ch);
};
Protracker.prototype.effect_t1_ee=function(mod, ch) { // ee
};
Protracker.prototype.effect_t1_ef=function(mod, ch) { // ef
};

// feel free to disable the formats
require('./formats/it')(Protracker);
require('./formats/mod')(Protracker);
require('./formats/xm')(Protracker);

module.exports = Protracker;
},{"./formats/it":1,"./formats/mod":2,"./formats/xm":3}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJmb3JtYXRzL2l0LmpzIiwiZm9ybWF0cy9tb2QuanMiLCJmb3JtYXRzL3htLmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm90cmFja2VyKXtcbiAgUHJvdHJhY2tlci5wcm90b3R5cGUucGFyc2VJVCA9IGZ1bmN0aW9uKClcbiAge1xuICAgIGNvbnNvbGUubG9nKCdQYXJzZSBJTVBVTFNFIFRSQUNLRVIgZmlsZScpO1xuICAgIGNvbnNvbGUubG9nKCd1bmZpbmlzaGVkJyk7XG4gICAgdmFyIGksaixkO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcikgcmV0dXJuIGZhbHNlO1xuXG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICAgaWQ6ICAgICAgICAgICAge3N0YXJ0OjAsbGVuZ3RoOjQsZGVjb2RlOnRydWV9XG4gICAgICAsbmFtZTogICAgICAgICAge3N0YXJ0OjQsbGVuZ3RoOjI3LGRlY29kZTp0cnVlfVxuICAgICAgLG5iT3JkZXI6ICAgICAgIHtzdGFydDozMixsZW5ndGg6MX1cbiAgICAgICxuYkluc3RydW1lbnRzOiB7c3RhcnQ6MzQsbGVuZ3RoOjF9XG4gICAgICAsbmJTYW1wbGVzOiAgICAge3N0YXJ0OjM2LGxlbmd0aDoxfVxuICAgICAgLG5iUGF0dGVybnM6ICAgIHtzdGFydDozOCxsZW5ndGg6MX1cbiAgICAgICxDd3Q6ICAgICAgICAgICB7c3RhcnQ6NDAsbGVuZ3RoOjF9XG4gICAgICAsQ213dDogICAgICAgICAge3N0YXJ0OjQyLGxlbmd0aDoxfVxuICAgICAgLEZsYWdzOiAgICAgICAgIHtzdGFydDo0NCxsZW5ndGg6MX1cbiAgICAgICxTcGVjaWFsOiAgICAgICB7c3RhcnQ6NDYsbGVuZ3RoOjF9XG4gICAgICAsR2xvYmFsVm9sdW1lOiAge3N0YXJ0OjQ4LGxlbmd0aDoxfVxuICAgICAgLE1peFZvbHVtZTogICAgIHtzdGFydDo0OSxsZW5ndGg6MX1cbiAgICAgICxzcGVlZDogICAgICAgICB7c3RhcnQ6NTAsbGVuZ3RoOjF9XG4gICAgICAsdGVtcG86ICAgICAgICAge3N0YXJ0OjUxLGxlbmd0aDoxfVxuICAgICAgLHNlcDogICAgICAgICAgIHtzdGFydDo1MixsZW5ndGg6MX1cbiAgICAgICxNc2dMZ3RoOiAgICAgICB7c3RhcnQ6NTQsbGVuZ3RoOjF9XG4gICAgICAsTWVzc2FnZU9mZnNldDoge3N0YXJ0OjU2LGxlbmd0aDo0fVxuICAgICAgLENobmxQYW46ICAgICAgIHtzdGFydDo2MSxsZW5ndGhEYXRhOjY0fVxuICAgICAgLENobmxWb2w6ICAgICAgIHtzdGFydDo2MSxsZW5ndGhEYXRhOjY0fVxuICAgICAgLHBhdHRlcm5PcmRlcjogIHtzdGFydDoxOTIsbGVuZ3RoRGF0YTonbmJPcmRlcid9XG4gICAgfTtcblxuICAgIGZvcihkIGluIGRhdGEpXG4gICAge1xuICAgICAgdmFyIHMgICA9IGRhdGFbZF07XG4gICAgICB2YXIgciAgID0gJyc7XG4gICAgICB2YXIgYSAgID0gW107XG4gICAgICB2YXIgbGVuID0gcy5sZW5ndGhEYXRhID8gcGFyc2VJbnQoZGF0YVtzLmxlbmd0aERhdGFdKSA6IHMubGVuZ3RoO1xuXG4gICAgICBmb3IoaT0wO2k8bGVuO2krKylcbiAgICAgIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHMuc3RhcnQraTtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMuYnVmZmVyW29mZnNldF07XG4gICAgICAgIGlmKHMuZGVjb2RlKXtcbiAgICAgICAgICByKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHZhbCk7XG4gICAgICAgIH1lbHNlIGlmKHMubGVuZ3RoRGF0YSlcbiAgICAgICAge1xuICAgICAgICAgIGEucHVzaChoYih2YWwpKTtcbiAgICAgICAgICByID0gYTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcis9cGFyc2VJbnQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGF0YVtkXT1yO1xuICAgIH1cblxuICAgIGNvbnNvbGUuZGVidWcoJz09IHdvcmtpbmcgaW4gcHJvZ3Jlc3MgPT0nKTtcbiAgICBjb25zb2xlLmRlYnVnKCc9PSBkZWJ1ZyA9PScpO1xuICAgIGNvbnNvbGUuZGVidWcoZGF0YSk7XG4gICAgdGhpcy5zdG9wKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgdGhpcy5jaGFubmVscyAgID0gZGF0YS5jaGFubmVscztcbiAgICB0aGlzLnNvbmdsZW4gICAgPSBkYXRhLnBhdHRlcm5PcmRlci5sZW5ndGg7XG4gICAgdGhpcy50aXRsZSAgICAgID0gZGF0YS5uYW1lO1xuICAgIHRoaXMuc2FtcGxlcyAgICA9IGRhdGEubmJJbnN0cnVtZW50cztcbiAgICB0aGlzLnZ1ICAgICAgICAgPSBuZXcgQXJyYXkoKTtcblxuICAgIGZvcihpPTA7aTx0aGlzLmNoYW5uZWxzO2krKykgdGhpcy52dVtpXT0wLjA7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coaSx0aGlzLnNhbXBsZVtpXS5uYW1lKTtcblxuICAgICAgdGhpcy5zYW1wbGVbaV0ubGVuZ3RoPTIqKHRoaXMuYnVmZmVyW3N0KzIyXSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyM10pO1xuICAgICAgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5idWZmZXJbc3QrMjRdO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lID4gNykgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5zYW1wbGVbaV0uZmluZXR1bmUtMTY7XG4gICAgICB0aGlzLnNhbXBsZVtpXS52b2x1bWU9dGhpcy5idWZmZXJbc3QrMjVdO1xuICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PTIqKHRoaXMuYnVmZmVyW3N0KzI2XSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyN10pO1xuICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyOF0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjldKTtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPT0yKSB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTA7XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PnRoaXMuc2FtcGxlW2ldLmxlbmd0aCkge1xuICAgICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MDtcbiAgICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG5cbiAgICBpZiAodGhpcy5idWZmZXJbOTUxXSAhPSAxMjcpIHRoaXMucmVwZWF0cG9zPXRoaXMuYnVmZmVyWzk1MV07XG4gICAgZm9yKGk9MDtpPDEyODtpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybnRhYmxlW2ldPXRoaXMuYnVmZmVyWzk1MitpXTtcbiAgICAgIGlmICh0aGlzLnBhdHRlcm50YWJsZVtpXSA+IHRoaXMucGF0dGVybnMpIHRoaXMucGF0dGVybnM9dGhpcy5wYXR0ZXJudGFibGVbaV07XG4gICAgfVxuICAgIHRoaXMucGF0dGVybnMrPTE7XG4gICAgdmFyIHBhdGxlbj00KjY0KnRoaXMuY2hhbm5lbHM7XG5cbiAgICB0aGlzLnBhdHRlcm49bmV3IEFycmF5KCk7XG4gICAgdGhpcy5ub3RlPW5ldyBBcnJheSgpO1xuICAgIHRoaXMucGF0dGVybnM9cGFyc2VJbnQodGhpcy5idWZmZXJbNzJdK3RoaXMuYnVmZmVyWzcyXSk7XG4gICAgZm9yKGk9MDtpPHRoaXMucGF0dGVybnM7aSsrKSB7XG4gICAgICB0aGlzLnBhdHRlcm5baV09bmV3IFVpbnQ4QXJyYXkocGF0bGVuKTtcbiAgICAgIHRoaXMubm90ZVtpXT1uZXcgVWludDhBcnJheSh0aGlzLmNoYW5uZWxzKjY0KTtcbiAgICAgIGZvcihqPTA7ajxwYXRsZW47aisrKSB0aGlzLnBhdHRlcm5baV1bal09dGhpcy5idWZmZXJbMTA4NCtpKnBhdGxlbitqXTtcbiAgICAgIGZvcihqPTA7ajw2NDtqKyspIGZvcihjPTA7Yzx0aGlzLmNoYW5uZWxzO2MrKykge1xuICAgICAgICB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPTA7XG4gICAgICAgIHZhciBuPSh0aGlzLnBhdHRlcm5baV1baio0KnRoaXMuY2hhbm5lbHMrYyo0XSYweDBmKTw8OCB8IHRoaXMucGF0dGVybltpXVtqKjQqdGhpcy5jaGFubmVscytjKjQrMV07XG4gICAgICAgIGZvcih2YXIgbnA9MDsgbnA8dGhpcy5iYXNlcGVyaW9kdGFibGUubGVuZ3RoOyBucCsrKVxuICAgICAgICAgIGlmIChuPT10aGlzLmJhc2VwZXJpb2R0YWJsZVtucF0pIHRoaXMubm90ZVtpXVtqKnRoaXMuY2hhbm5lbHMrY109bnA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5kZWJ1Zyh0aGlzKVxuXG4gICAgcmV0dXJuIHRydWU7XG4gICAgdmFyIHNzdD0xMDg0K3RoaXMucGF0dGVybnMqcGF0bGVuO1xuICAgIGZvcihpPTA7aTx0aGlzLnNhbXBsZXM7aSsrKSB7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5kYXRhPW5ldyBGbG9hdDMyQXJyYXkodGhpcy5zYW1wbGVbaV0ubGVuZ3RoKTtcbiAgICAgIGZvcihqPTA7ajx0aGlzLnNhbXBsZVtpXS5sZW5ndGg7aisrKSB7XG4gICAgICAgIHZhciBxPXRoaXMuYnVmZmVyW3NzdCtqXTtcbiAgICAgICAgaWYgKHE8MTI4KSB7XG4gICAgICAgICAgcT1xLzEyOC4wO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHE9KChxLTEyOCkvMTI4LjApLTEuMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGFbal09cTtcbiAgICAgIH1cbiAgICAgIHNzdCs9dGhpcy5zYW1wbGVbaV0ubGVuZ3RoO1xuICAgIH1cblxuICAgIHRoaXMucmVhZHk9dHJ1ZTtcbiAgICB0aGlzLmxvYWRpbmc9ZmFsc2U7XG4gICAgdGhpcy5idWZmZXI9MDtcblxuICAgIGlmICh0aGlzLmNvbnRleHQpIHRoaXMubG93cGFzc05vZGUuZnJlcXVlbmN5LnZhbHVlPTI4ODY3O1xuXG4gICAgdGhpcy5vblJlYWR5KCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbn07IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihQcm90cmFja2VyKXtcbiAgUHJvdHJhY2tlci5wcm90b3R5cGUucGFyc2VNT0QgPSBmdW5jdGlvbigpXG4gIHtcbiAgICB2YXIgaSxqO1xuICAgIHRoaXMudnU9W107XG4gICAgZm9yKGk9MDtpPHRoaXMuY2hhbm5lbHM7aSsrKSB0aGlzLnZ1W2ldPTAuMDtcblxuICAgIGk9MDtcbiAgICB3aGlsZSh0aGlzLmJ1ZmZlcltpXSAmJiBpPDIwKVxuICAgICAgdGhpcy50aXRsZT10aGlzLnRpdGxlK1N0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5idWZmZXJbaSsrXSk7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyMl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjNdKTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPXRoaXMuYnVmZmVyW3N0KzI0XTtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5maW5ldHVuZSA+IDcpIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPXRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lLTE2O1xuICAgICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPXRoaXMuYnVmZmVyW3N0KzI1XTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0yKih0aGlzLmJ1ZmZlcltzdCsyNl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjddKTtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MioodGhpcy5idWZmZXJbc3QrMjhdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI5XSk7XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD09MikgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD50aGlzLnNhbXBsZVtpXS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5zYW1wbGVbaV0ubG9vcHN0YXJ0PTA7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNvbmdsZW49dGhpcy5idWZmZXJbOTUwXTtcbiAgICBpZiAodGhpcy5idWZmZXJbOTUxXSAhPSAxMjcpIHRoaXMucmVwZWF0cG9zPXRoaXMuYnVmZmVyWzk1MV07XG4gICAgZm9yKGk9MDtpPDEyODtpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybnRhYmxlW2ldPXRoaXMuYnVmZmVyWzk1MitpXTtcbiAgICAgIGlmICh0aGlzLnBhdHRlcm50YWJsZVtpXSA+IHRoaXMucGF0dGVybnMpIHRoaXMucGF0dGVybnM9dGhpcy5wYXR0ZXJudGFibGVbaV07XG4gICAgfVxuICAgIHRoaXMucGF0dGVybnMrPTE7XG4gICAgdmFyIHBhdGxlbj00KjY0KnRoaXMuY2hhbm5lbHM7XG5cbiAgICB0aGlzLnBhdHRlcm49W107XG4gICAgdGhpcy5ub3RlPVtdO1xuICAgIGZvcihpPTA7aTx0aGlzLnBhdHRlcm5zO2krKykge1xuICAgICAgdGhpcy5wYXR0ZXJuW2ldPW5ldyBVaW50OEFycmF5KHBhdGxlbik7XG4gICAgICB0aGlzLm5vdGVbaV09bmV3IFVpbnQ4QXJyYXkodGhpcy5jaGFubmVscyo2NCk7XG4gICAgICBmb3Ioaj0wO2o8cGF0bGVuO2orKykgdGhpcy5wYXR0ZXJuW2ldW2pdPXRoaXMuYnVmZmVyWzEwODQraSpwYXRsZW4ral07XG4gICAgICBmb3Ioaj0wO2o8NjQ7aisrKSBmb3IoYz0wO2M8dGhpcy5jaGFubmVscztjKyspIHtcbiAgICAgICAgdGhpcy5ub3RlW2ldW2oqdGhpcy5jaGFubmVscytjXT0wO1xuICAgICAgICB2YXIgbj0odGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNF0mMHgwZik8PDggfCB0aGlzLnBhdHRlcm5baV1baio0KnRoaXMuY2hhbm5lbHMrYyo0KzFdO1xuICAgICAgICBmb3IodmFyIG5wPTA7IG5wPHRoaXMuYmFzZXBlcmlvZHRhYmxlLmxlbmd0aDsgbnArKylcbiAgICAgICAgICBpZiAobj09dGhpcy5iYXNlcGVyaW9kdGFibGVbbnBdKSB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPW5wO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzc3Q9MTA4NCt0aGlzLnBhdHRlcm5zKnBhdGxlbjtcbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdGhpcy5zYW1wbGVbaV0uZGF0YT1uZXcgRmxvYXQzMkFycmF5KHRoaXMuc2FtcGxlW2ldLmxlbmd0aCk7XG4gICAgICBmb3Ioaj0wO2o8dGhpcy5zYW1wbGVbaV0ubGVuZ3RoO2orKykge1xuICAgICAgICB2YXIgcT10aGlzLmJ1ZmZlcltzc3Qral07XG4gICAgICAgIGlmIChxPDEyOCkge1xuICAgICAgICAgIHE9cS8xMjguMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBxPSgocS0xMjgpLzEyOC4wKS0xLjA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNhbXBsZVtpXS5kYXRhW2pdPXE7XG4gICAgICB9XG4gICAgICBzc3QrPXRoaXMuc2FtcGxlW2ldLmxlbmd0aDtcbiAgICB9XG5cbiAgICB0aGlzLnJlYWR5PXRydWU7XG4gICAgdGhpcy5sb2FkaW5nPWZhbHNlO1xuICAgIHRoaXMuYnVmZmVyPTA7XG5cbiAgICBpZiAodGhpcy5jb250ZXh0KSB0aGlzLmxvd3Bhc3NOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcblxuICAgIHRoaXMub25SZWFkeSgpO1xuICAgIHJldHVybiB0cnVlO1xuICB9O1xufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oUHJvdHJhY2tlcil7XG4gIFByb3RyYWNrZXIucHJvdG90eXBlLnBhcnNlWE0gPSBmdW5jdGlvbigpXG4gIHtcbiAgICBjb25zb2xlLmxvZygnUGFyc2UgRlQyIGZpbGUnKTtcbiAgICBjb25zb2xlLmxvZygndW5maW5pc2hlZCcpO1xuICAgIHRoaXMuc3RvcCgpO1xuICAgIHZhciBpLGosZDtcblxuICAgIGlmICghdGhpcy5idWZmZXIpIHJldHVybiBmYWxzZTtcbiAgICAvL3RoaXMuYnVmZmVyPW5ldyBVaW50OEFycmF5KHRoaXMucmVzcG9uc2UpO1xuICAgIC8vY29uc29sZS5kZWJ1Zyh0aGlzLmJ1ZmZlcik7XG5cbiAgICAvKlxuICAgICAwIDE3IGNoYXIgSUQgdGV4dCAnRXh0ZW5kZWQgbW9kdWxlOiAnXG4gICAgIDE3IDIwIGNoYXIgTW9kdWxlIG5hbWUgJ0JlbGxpc3NpbWEgOTkgKG1peCkgJ1xuICAgICAzNyAxIGJ5dGUgMHgxQSAxQVxuICAgICAzOCAyMCBjaGFyIFRyYWNrZXIgbmFtZSAnRmFzdFRyYWNrZXIgdjIuMDAgJ1xuICAgICA1OCAyIHdvcmQgVmVyc2lvbiBudW1iZXIgMDQgMDFcbiAgICAgNjAgNCBkd29yZCBIZWFkZXIgc2l6ZSAxNCAwMSAwMCAwMFxuICAgICA2NCAyIHdvcmQgU29uZyBsZW5ndGggM0UgMDAgKDEuLjI1NilcbiAgICAgNjYgMiB3b3JkIFJlc3RhcnQgcG9zaXRpb24gMDAgMDBcbiAgICAgNjggMiB3b3JkIE51bWJlciBvZiBjaGFubmVscyAyMCAwMCAoMC4uMzIvNjQpXG4gICAgIDcwIDIgd29yZCBOdW1iZXIgb2YgcGF0dGVybnMgMzcgMDAgKDEuLjI1NilcbiAgICAgNzIgMiB3b3JkIE51bWJlciBvZiBpbnN0cnVtZW50cyAxMiAwMCAoMC4uMTI4KVxuICAgICA3NCAyIHdvcmQgRmxhZ3MgMDEgMDBcbiAgICAgNzYgMiB3b3JkIERlZmF1bHQgdGVtcG8gMDUgMDBcbiAgICAgNzggMiB3b3JkIERlZmF1bHQgQlBNIDk4IDAwXG4gICAgIDgwID8gYnl0ZSBQYXR0ZXJuIG9yZGVyIHRhYmxlIDAwIDAxIDAyIDAzIC4uLlxuICAgICAqL1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgaWQ6ICAgICAgICAgICAge3N0YXJ0OjAsbGVuZ3RoOjE2LGRlY29kZTp0cnVlfVxuICAgICAgLG5hbWU6ICAgICAgICAgIHtzdGFydDoxNyxsZW5ndGg6MjAsZGVjb2RlOnRydWV9XG4gICAgICAvLywnMHgxQSc6ICAgICAgICB7c3RhcnQ6MzcsbGVuZ3RoOjEsZGVjb2RlOnRydWV9XG4gICAgICAsdHJhY2tlcjogICAgICAge3N0YXJ0OjM4LGxlbmd0aDoxNyxkZWNvZGU6dHJ1ZX1cbiAgICAgICx2ZXJzaW9uOiAgICAgICB7c3RhcnQ6NTgsbGVuZ3RoOjF9XG4gICAgICAsc29uZ2xlbjogICAgICAge3N0YXJ0OjY0LGxlbmd0aDoxfVxuICAgICAgLGNoYW5uZWxzOiAgICAgIHtzdGFydDo2OCxsZW5ndGg6MX1cbiAgICAgICxuYkluc3RydW1lbnRzOiB7c3RhcnQ6NzAsbGVuZ3RoOjF9XG4gICAgICAsbmJQYXR0ZXJuczogICAge3N0YXJ0OjcyLGxlbmd0aDoxfVxuICAgICAgLHRlbXBvOiAgICAgICAgIHtzdGFydDo3NixsZW5ndGg6MX1cbiAgICAgICxicG06ICAgICAgICAgICB7c3RhcnQ6NzgsbGVuZ3RoOjF9XG4gICAgICAscGF0dGVybk9yZGVyOiAge3N0YXJ0OjgwLGxlbmd0aERhdGE6J3NvbmdsZW4nfVxuICAgIH07XG5cbiAgICBmb3IoZCBpbiBkYXRhKVxuICAgIHtcbiAgICAgIHZhciBzICAgPSBkYXRhW2RdO1xuICAgICAgdmFyIHIgICA9ICcnO1xuICAgICAgdmFyIGEgICA9IG5ldyBBcnJheSgpO1xuICAgICAgdmFyIGxlbiA9IHMubGVuZ3RoRGF0YSA/IHBhcnNlSW50KGRhdGFbcy5sZW5ndGhEYXRhXSkgOiBzLmxlbmd0aDtcblxuICAgICAgZm9yKGk9MDtpPGxlbjtpKyspXG4gICAgICB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLmJ1ZmZlcltzLnN0YXJ0K2ldO1xuICAgICAgICBpZihzLmRlY29kZSl7XG4gICAgICAgICAgcis9U3RyaW5nLmZyb21DaGFyQ29kZSh2YWwpO1xuICAgICAgICB9ZWxzZSBpZihzLmxlbmd0aERhdGEpXG4gICAgICAgIHtcbiAgICAgICAgICBhLnB1c2godmFsKTtcbiAgICAgICAgICByID0gYTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgcis9cGFyc2VJbnQodmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGF0YVtkXT1yO1xuICAgIH1cbiAgICB2YXIgbyA9IDgwK3BhcnNlSW50KGRhdGEuc29uZ2xlbik7XG4gICAgZGF0YS5yZXN0YXJ0ID0gdGhpcy5idWZmZXJbb107XG5cbiAgICBjb25zb2xlLmRlYnVnKGRhdGEpO1xuICAgIHRoaXMuc3RvcCgpO1xuICAgIHJldHVybiB0cnVlO1xuXG4gICAgdGhpcy5jaGFubmVscyAgID0gZGF0YS5jaGFubmVscztcbiAgICB0aGlzLnNvbmdsZW4gICAgPSBkYXRhLnBhdHRlcm5PcmRlci5sZW5ndGg7XG4gICAgdGhpcy50aXRsZSAgICAgID0gZGF0YS5uYW1lO1xuICAgIHRoaXMuc2FtcGxlcyAgICA9IGRhdGEubmJJbnN0cnVtZW50cztcbiAgICB0aGlzLnZ1ICAgICAgICAgPSBuZXcgQXJyYXkoKTtcblxuICAgIGZvcihpPTA7aTx0aGlzLmNoYW5uZWxzO2krKykgdGhpcy52dVtpXT0wLjA7XG5cbiAgICBmb3IoaT0wO2k8dGhpcy5zYW1wbGVzO2krKykge1xuICAgICAgdmFyIHN0PTIwK2kqMzA7XG4gICAgICBqPTA7XG4gICAgICB3aGlsZSh0aGlzLmJ1ZmZlcltzdCtqXSAmJiBqPDIyKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAgICgodGhpcy5idWZmZXJbc3Qral0+MHgxZikgJiYgKHRoaXMuYnVmZmVyW3N0K2pdPDB4N2YpKSA/XG4gICAgICAgICAgICAoU3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlcltzdCtqXSkpIDpcbiAgICAgICAgICAgIChcIiBcIik7XG4gICAgICAgIGorKztcbiAgICAgIH1cblxuXG4gICAgICBjb25zb2xlLmxvZyhpLHRoaXMuc2FtcGxlW2ldLm5hbWUpO1xuXG4gICAgICB0aGlzLnNhbXBsZVtpXS5sZW5ndGg9MioodGhpcy5idWZmZXJbc3QrMjJdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzIzXSk7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLmJ1ZmZlcltzdCsyNF07XG4gICAgICBpZiAodGhpcy5zYW1wbGVbaV0uZmluZXR1bmUgPiA3KSB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLnNhbXBsZVtpXS5maW5ldHVuZS0xNjtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLnZvbHVtZT10aGlzLmJ1ZmZlcltzdCsyNV07XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MioodGhpcy5idWZmZXJbc3QrMjZdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI3XSk7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTIqKHRoaXMuYnVmZmVyW3N0KzI4XSoyNTYgKyB0aGlzLmJ1ZmZlcltzdCsyOV0pO1xuICAgICAgaWYgKHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9PTIpIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ+dGhpcy5zYW1wbGVbaV0ubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0wO1xuICAgICAgICB0aGlzLnNhbXBsZVtpXS5sb29wbGVuZ3RoPTA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG5cblxuICAgIGlmICh0aGlzLmJ1ZmZlcls5NTFdICE9IDEyNykgdGhpcy5yZXBlYXRwb3M9dGhpcy5idWZmZXJbOTUxXTtcbiAgICBmb3IoaT0wO2k8MTI4O2krKykge1xuICAgICAgdGhpcy5wYXR0ZXJudGFibGVbaV09dGhpcy5idWZmZXJbOTUyK2ldO1xuICAgICAgaWYgKHRoaXMucGF0dGVybnRhYmxlW2ldID4gdGhpcy5wYXR0ZXJucykgdGhpcy5wYXR0ZXJucz10aGlzLnBhdHRlcm50YWJsZVtpXTtcbiAgICB9XG4gICAgdGhpcy5wYXR0ZXJucys9MTtcbiAgICB2YXIgcGF0bGVuPTQqNjQqdGhpcy5jaGFubmVscztcblxuICAgIHRoaXMucGF0dGVybj1uZXcgQXJyYXkoKTtcbiAgICB0aGlzLm5vdGU9bmV3IEFycmF5KCk7XG4gICAgdGhpcy5wYXR0ZXJucz1wYXJzZUludCh0aGlzLmJ1ZmZlcls3Ml0rdGhpcy5idWZmZXJbNzJdKTtcbiAgICBmb3IoaT0wO2k8dGhpcy5wYXR0ZXJucztpKyspIHtcbiAgICAgIHRoaXMucGF0dGVybltpXT1uZXcgVWludDhBcnJheShwYXRsZW4pO1xuICAgICAgdGhpcy5ub3RlW2ldPW5ldyBVaW50OEFycmF5KHRoaXMuY2hhbm5lbHMqNjQpO1xuICAgICAgZm9yKGo9MDtqPHBhdGxlbjtqKyspIHRoaXMucGF0dGVybltpXVtqXT10aGlzLmJ1ZmZlclsxMDg0K2kqcGF0bGVuK2pdO1xuICAgICAgZm9yKGo9MDtqPDY0O2orKykgZm9yKGM9MDtjPHRoaXMuY2hhbm5lbHM7YysrKSB7XG4gICAgICAgIHRoaXMubm90ZVtpXVtqKnRoaXMuY2hhbm5lbHMrY109MDtcbiAgICAgICAgdmFyIG49KHRoaXMucGF0dGVybltpXVtqKjQqdGhpcy5jaGFubmVscytjKjRdJjB4MGYpPDw4IHwgdGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNCsxXTtcbiAgICAgICAgZm9yKHZhciBucD0wOyBucDx0aGlzLmJhc2VwZXJpb2R0YWJsZS5sZW5ndGg7IG5wKyspXG4gICAgICAgICAgaWYgKG49PXRoaXMuYmFzZXBlcmlvZHRhYmxlW25wXSkgdGhpcy5ub3RlW2ldW2oqdGhpcy5jaGFubmVscytjXT1ucDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmRlYnVnKHRoaXMpXG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgc3N0PTEwODQrdGhpcy5wYXR0ZXJucypwYXRsZW47XG4gICAgZm9yKGk9MDtpPHRoaXMuc2FtcGxlcztpKyspIHtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGE9bmV3IEZsb2F0MzJBcnJheSh0aGlzLnNhbXBsZVtpXS5sZW5ndGgpO1xuICAgICAgZm9yKGo9MDtqPHRoaXMuc2FtcGxlW2ldLmxlbmd0aDtqKyspIHtcbiAgICAgICAgdmFyIHE9dGhpcy5idWZmZXJbc3N0K2pdO1xuICAgICAgICBpZiAocTwxMjgpIHtcbiAgICAgICAgICBxPXEvMTI4LjA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcT0oKHEtMTI4KS8xMjguMCktMS4wO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zYW1wbGVbaV0uZGF0YVtqXT1xO1xuICAgICAgfVxuICAgICAgc3N0Kz10aGlzLnNhbXBsZVtpXS5sZW5ndGg7XG4gICAgfVxuXG4gICAgdGhpcy5yZWFkeT10cnVlO1xuICAgIHRoaXMubG9hZGluZz1mYWxzZTtcbiAgICB0aGlzLmJ1ZmZlcj0wO1xuXG4gICAgaWYgKHRoaXMuY29udGV4dCkgdGhpcy5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG5cbiAgICB0aGlzLm9uUmVhZHkoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbn07IiwiLypcbiAgYW1pZ2EgcHJvdHJhY2tlciBtb2R1bGUgcGxheWVyIGZvciB3ZWIgYXVkaW8gYXBpXG4gIChjKSAyMDEyLTIwMTQgZmlyZWhhd2svdGRhICAoZmlyZWhhd2tAaGF4b3IuZmkpXG4gIFxuICBvcmlnaW5hbGx5IGhhY2tlZCB0b2dldGhlciBpbiBhIHdlZWtlbmQsIHNvIHBsZWFzZSBleGN1c2VcbiAgbWUgZm9yIHRoZSBzcGFnaGV0dGkgY29kZS4gOilcbiAgZmVlbCBmcmVlIHRvIHVzZSB0aGlzIHBsYXllciBpbiB5b3VyIHdlYnNpdGUvZGVtby93aGF0ZXZlclxuICBpZiB5b3UgZmluZCBpdCB1c2VmdWwuIGRyb3AgbWUgYW4gZW1haWwgaWYgeW91IGRvLlxuICBBTUlHQUFBQUFBQUFIISFcbiAgYWxsIGNvZGUgbGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2U6XG4gIGh0dHA6Ly9vcGVuc291cmNlLm9yZy9saWNlbnNlcy9NSVRcbiAga2luZGEgc29ydGEgY2hhbmdlbG9nOlxuICAoc2VwIDIwMTQpXG4gIC0gZml4ZWQgYnVnIHdpdGggRTh4IHN5bmMgYW5kIGFkZGVkIDgweCB0byBhbHNvIGZ1bmN0aW9uIGZvciBzeW5jXG4gICAgZXZlbnRzIGR1ZSB0byBwcm9ibGVtcyB3aXRoIHNvbWUgcHJvdHJhY2tlciB2ZXJzaW9ucyAodGhhbmtzIHNwb3QpXG4gIChhdWcgMjAxNClcbiAgLSBhZGRlZCBzeW5jIGV2ZW50IHF1ZXVlIGZvciBFOHggY29tbWFuZHNcbiAgLSBjaGFuZ2VkIHRoZSBhbWlnYSBmaXhlZCBmaWx0ZXIgbW9kZWwgdG8gYWxsb3cgY2hhbmdlcyBhdCBydW50aW1lXG4gIC0gdGhyZWUgc3RlcmVvIHNlcGFyYXRpb24gbW9kZXMgbm93LCAwPWFtaWdhLCAxPTY1LzM1LCAyPW1vbm9cbiAgLSBhIGZldyBidWdmaXhlcywgdGhhbmtzIHNwb3RedXByb3VnaCBhbmQgZXNhdV50cmFrdG9yIGZvciByZXBvcnRpbmdcbiAgICAqIGZpeGVkIGJ1ZyBpbiBzbGlkZS10by1ub3RlIHdoZW4gMzAwIHdpdGggbm8gcHJlY2VlZGluZyAzeHlcbiAgICAqIGZpeGVkIHZpYnJhdG8gZGVwdGggb24gdGlja3MgMSsgdG8gbWF0Y2ggdGljayAwXG4gICAgKiBhZGRlZCBib29sZWFuIHZhcmlhYmxlIGZvciBkaXNhYmxpbmcgQTUwMCBmaXhlZCBsb3dwYXNzIGZpbHRlclxuICAgICogYWRkZWQgYSBkZWxheSBvbiBtb2R1bGUgc3RhcnQsIG51bWJlciBvZiBidWZmZXJzIHNlbGVjdGFibGVcbiAgICAqIGZpeGVkIHNhbXBsZSBsb29wIGRpc2NhcmRpbmcgcG9pbnRlciBvdmVyZmxvd1xuICAobWF5IDIwMTQpXG4gIC0gYWRkZWQgYm9vbGVhbiB2YXJpYWJsZSBmb3IgdGhlIGFtaWdhIGxlZCBmaWx0ZXIgZm9yIHVpIHN0dWZmXG4gIChqYW4gMjAxNClcbiAgLSBkaXNhYmxlZCBlZTAgZmlsdGVyIGNvbW1hbmQgZm9yIHRyYWNrcyB3aXRoIG92ZXIgNCBjaGFubmVscyB0b1xuICAgIG1ha2UgbW9kLmRvcGUgcGxheSBjb3JyZWN0bHlcbiAgKG9jdCAyMDEzKVxuICAtIGFkZGVkIHN1cHBvcnQgZm9yIGZpcmVmb3ggMjRcbiAgKGFwciAyMDEzKVxuICAtIGNoYW5nZWQgdGhlIGxvZ2ljIGZvciBwYXR0ZXJuIGJyZWFrL2p1bXAuIG1vZC5wYXR0ZXJuX3NrYW5rIG5vd1xuICAgIHBsYXlzIGNvcnJlY3RseS5cbiAgKGZlYiAyMDEzKVxuICAtIGZpeGVkIE5hTiBzYW1wbGVzIHdpdGggbW9kLmZyYWN0dXJlZCBhbmQgbW9kLm11bHRpY29sb3VyICh0aGFua3MgQWVnaXMhKVxuICAoamFuIDIwMTMpXG4gIC0gZml4ZWQgdmlicmF0byBhbXBsaXR1ZGUgKHdhcyBoYWxmIG9mIHdoYXQgaXQgc2hvdWxkIGJlLCBhcHBhcmVudGx5KVxuICAtIGZpeGVkIHRvIHdvcmsgb24gc2FmYXJpIGFnYWluICh0aGFua3MgTWF0dCBEaWFtb25kIEAgc3RhY2tvdmVyZmxvdy5jb20pXG4gIChkZWMgMjAxMilcbiAgLSByZXBsYWNlZCBlZmZlY3Qgc3dpdGNoLXN0YXRlbWVudCB3aXRoIGp1bXB0YWJsZXNcbiAgLSBmaXhlZCBjbGlja3MgKGJhZCBsb29wcywgZW1wdHkgc2FtcGxlcylcbiAgLSBmaXhlZCBwbGF5YmFjayBidWcgd2l0aCBzYW1wbGUtb25seSByb3dzXG4gIC0gYWRkZWQgYW1pZ2EgNTAwIGxvd3Bhc3MgZmlsdGVycyAobm90IDEwMCUgYXV0aGVudGljLCB0aG91Z2gpXG4gIC0gYWRkZWQgY29tcHJlc3NvciB0byBvdXRwdXRcbiAgLSBsYXRlc3Qgc2FmYXJpIGhhcyBicm9rZW4gd2ViIGF1ZGlvIHNvIGNocm9tZS1vbmx5IGZvciBub3dcbiAgKGF1ZyAyMDEyKVxuICAtIGZpcnN0IHZlcnNpb24gd3JpdHRlbiBmcm9tIHNjcmF0Y2hcbiAgdG9kbzpcbiAgLSBwYXR0ZXJuIGxvb3BpbmcgaXMgd2F5IGJyb2tlbiBpbiBtb2QuYmxhY2tfcXVlZW5cbiAgLSBwcm9wZXJseSB0ZXN0IEVFeCBkZWxheSBwYXR0ZXJuXG4gIC0gaW1wbGVtZW50IHRoZSByZXN0IG9mIHRoZSBlZmZlY3RzXG4gIC0gb3B0aW1pemUgZm9yIG1vcmUgc3BlZWQhISBTUEVFRUVEISFcbiAgICAqIHN3aXRjaCB0byBmaXhlZCBwb2ludCBzYW1wbGUgcG9pbnRlcnMsIE1hdGguZmxvb3IoKSBpcyBfc2xvd18gb24gaU9TXG4qL1xuXG4vLyBjb25zdHJ1Y3RvciBmb3IgcHJvdHJhY2tlciBwbGF5ZXIgb2JqZWN0XG5mdW5jdGlvbiBQcm90cmFja2VyKClcbntcbiAgdmFyIGksIHQ7XG5cbiAgdGhpcy5pbml0aWFsaXplKCk7XG4gIHRoaXMuY2xlYXJzb25nKCk7XG5cbiAgdGhpcy51cmw9XCJcIjtcbiAgdGhpcy5sb2FkaW5nPWZhbHNlO1xuICB0aGlzLnJlYWR5PWZhbHNlO1xuICB0aGlzLnBsYXlpbmc9ZmFsc2U7XG4gIHRoaXMuYnVmZmVyPTA7XG4gIHRoaXMubWl4ZXJOb2RlPTA7XG4gIHRoaXMucGF1c2VkPWZhbHNlO1xuICB0aGlzLnJlcGVhdD1mYWxzZTtcbiAgdGhpcy5maWx0ZXI9ZmFsc2U7XG5cbiAgdGhpcy5zZXBhcmF0aW9uPTE7XG4gIHRoaXMucGFsY2xvY2s9dHJ1ZTtcbiAgdGhpcy5hbWlnYTUwMD10cnVlO1xuICBcbiAgdGhpcy5hdXRvc3RhcnQ9ZmFsc2U7XG4gIHRoaXMuYnVmZmVyc3RvZGVsYXk9NDsgLy8gYWRqdXN0IHRoaXMgaWYgeW91IGdldCBzdHV0dGVyIGFmdGVyIGxvYWRpbmcgbmV3IHNvbmdcbiAgdGhpcy5kZWxheWZpcnN0PTA7XG4gIHRoaXMuZGVsYXlsb2FkPTA7XG5cbiAgdGhpcy5zeW5jcXVldWU9W107XG5cbiAgdGhpcy5vblJlYWR5PWZ1bmN0aW9uKCl7fTtcbiAgdGhpcy5vblBsYXk9ZnVuY3Rpb24oKXt9O1xuICB0aGlzLm9uU3RvcD1mdW5jdGlvbigpe307XG5cbiAgdGhpcy5jb250ZXh0ID0gbnVsbDtcbiAgdGhpcy5zYW1wbGVyYXRlPTQ0MTAwO1xuICB0aGlzLmJ1ZmZlcmxlbj0yMDQ4O1xuXG4gIC8vIHBhdWxhIHBlcmlvZCB2YWx1ZXNcbiAgdGhpcy5iYXNlcGVyaW9kdGFibGU9bmV3IEFycmF5KFxuICAgIDg1Niw4MDgsNzYyLDcyMCw2NzgsNjQwLDYwNCw1NzAsNTM4LDUwOCw0ODAsNDUzLFxuICAgIDQyOCw0MDQsMzgxLDM2MCwzMzksMzIwLDMwMiwyODUsMjY5LDI1NCwyNDAsMjI2LFxuICAgIDIxNCwyMDIsMTkwLDE4MCwxNzAsMTYwLDE1MSwxNDMsMTM1LDEyNywxMjAsMTEzKTtcblxuICAvLyBmaW5ldHVuZSBtdWx0aXBsaWVyc1xuICB0aGlzLmZpbmV0dW5ldGFibGUgPSBbXTtcbiAgZm9yKHQ9MDt0PDE2O3QrKykgdGhpcy5maW5ldHVuZXRhYmxlW3RdPU1hdGgucG93KDIsICh0LTgpLzEyLzgpO1xuICBcbiAgLy8gY2FsYyB0YWJsZXMgZm9yIHZpYnJhdG8gd2F2ZWZvcm1zXG4gIHRoaXMudmlicmF0b3RhYmxlID0gW107XG4gIGZvcih0PTA7dDw0O3QrKykge1xuICAgIHRoaXMudmlicmF0b3RhYmxlW3RdID0gW107XG4gICAgZm9yKGk9MDtpPDY0O2krKykge1xuICAgICAgc3dpdGNoKHQpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIHRoaXMudmlicmF0b3RhYmxlW3RdW2ldPTEyNypNYXRoLnNpbihNYXRoLlBJKjIqKGkvNjQpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHRoaXMudmlicmF0b3RhYmxlW3RdW2ldPTEyNy00Kmk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICB0aGlzLnZpYnJhdG90YWJsZVt0XVtpXT0oaTwzMik/MTI3Oi0xMjc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICB0aGlzLnZpYnJhdG90YWJsZVt0XVtpXT0oMS0yKk1hdGgucmFuZG9tKCkpKjEyNztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBlZmZlY3QganVtcHRhYmxlc1xuICB0aGlzLmVmZmVjdHNfdDAgPSBuZXcgQXJyYXkoXG4gICAgdGhpcy5lZmZlY3RfdDBfMCwgdGhpcy5lZmZlY3RfdDBfMSwgdGhpcy5lZmZlY3RfdDBfMiwgdGhpcy5lZmZlY3RfdDBfMywgdGhpcy5lZmZlY3RfdDBfNCwgdGhpcy5lZmZlY3RfdDBfNSwgdGhpcy5lZmZlY3RfdDBfNiwgdGhpcy5lZmZlY3RfdDBfNyxcbiAgICB0aGlzLmVmZmVjdF90MF84LCB0aGlzLmVmZmVjdF90MF85LCB0aGlzLmVmZmVjdF90MF9hLCB0aGlzLmVmZmVjdF90MF9iLCB0aGlzLmVmZmVjdF90MF9jLCB0aGlzLmVmZmVjdF90MF9kLCB0aGlzLmVmZmVjdF90MF9lLCB0aGlzLmVmZmVjdF90MF9mKTtcbiAgdGhpcy5lZmZlY3RzX3QwX2UgPSBuZXcgQXJyYXkoXG4gICAgdGhpcy5lZmZlY3RfdDBfZTAsIHRoaXMuZWZmZWN0X3QwX2UxLCB0aGlzLmVmZmVjdF90MF9lMiwgdGhpcy5lZmZlY3RfdDBfZTMsIHRoaXMuZWZmZWN0X3QwX2U0LCB0aGlzLmVmZmVjdF90MF9lNSwgdGhpcy5lZmZlY3RfdDBfZTYsIHRoaXMuZWZmZWN0X3QwX2U3LFxuICAgIHRoaXMuZWZmZWN0X3QwX2U4LCB0aGlzLmVmZmVjdF90MF9lOSwgdGhpcy5lZmZlY3RfdDBfZWEsIHRoaXMuZWZmZWN0X3QwX2ViLCB0aGlzLmVmZmVjdF90MF9lYywgdGhpcy5lZmZlY3RfdDBfZWQsIHRoaXMuZWZmZWN0X3QwX2VlLCB0aGlzLmVmZmVjdF90MF9lZik7XG4gIHRoaXMuZWZmZWN0c190MSA9IG5ldyBBcnJheShcbiAgICB0aGlzLmVmZmVjdF90MV8wLCB0aGlzLmVmZmVjdF90MV8xLCB0aGlzLmVmZmVjdF90MV8yLCB0aGlzLmVmZmVjdF90MV8zLCB0aGlzLmVmZmVjdF90MV80LCB0aGlzLmVmZmVjdF90MV81LCB0aGlzLmVmZmVjdF90MV82LCB0aGlzLmVmZmVjdF90MV83LFxuICAgIHRoaXMuZWZmZWN0X3QxXzgsIHRoaXMuZWZmZWN0X3QxXzksIHRoaXMuZWZmZWN0X3QxX2EsIHRoaXMuZWZmZWN0X3QxX2IsIHRoaXMuZWZmZWN0X3QxX2MsIHRoaXMuZWZmZWN0X3QxX2QsIHRoaXMuZWZmZWN0X3QxX2UsIHRoaXMuZWZmZWN0X3QxX2YpO1xuICB0aGlzLmVmZmVjdHNfdDFfZSA9IG5ldyBBcnJheShcbiAgICB0aGlzLmVmZmVjdF90MV9lMCwgdGhpcy5lZmZlY3RfdDFfZTEsIHRoaXMuZWZmZWN0X3QxX2UyLCB0aGlzLmVmZmVjdF90MV9lMywgdGhpcy5lZmZlY3RfdDFfZTQsIHRoaXMuZWZmZWN0X3QxX2U1LCB0aGlzLmVmZmVjdF90MV9lNiwgdGhpcy5lZmZlY3RfdDFfZTcsXG4gICAgdGhpcy5lZmZlY3RfdDFfZTgsIHRoaXMuZWZmZWN0X3QxX2U5LCB0aGlzLmVmZmVjdF90MV9lYSwgdGhpcy5lZmZlY3RfdDFfZWIsIHRoaXMuZWZmZWN0X3QxX2VjLCB0aGlzLmVmZmVjdF90MV9lZCwgdGhpcy5lZmZlY3RfdDFfZWUsIHRoaXMuZWZmZWN0X3QxX2VmKTtcblxuXG59XG5cblxuXG4vLyBjcmVhdGUgdGhlIHdlYiBhdWRpbyBjb250ZXh0XG5Qcm90cmFja2VyLnByb3RvdHlwZS5jcmVhdGVDb250ZXh0ID0gZnVuY3Rpb24oKVxue1xuICBpZiAoIHR5cGVvZiBBdWRpb0NvbnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuY29udGV4dCA9IG5ldyB3ZWJraXRBdWRpb0NvbnRleHQoKTtcbiAgfVxuICB0aGlzLnNhbXBsZXJhdGU9dGhpcy5jb250ZXh0LnNhbXBsZVJhdGU7XG4gIHRoaXMuYnVmZmVybGVuPSh0aGlzLnNhbXBsZXJhdGUgPiA0NDEwMCkgPyA0MDk2IDogMjA0ODsgXG5cbiAgLy8gQW1pZ2EgNTAwIGZpeGVkIGZpbHRlciBhdCA2a0h6LiBXZWJBdWRpbyBsb3dwYXNzIGlzIDEyZEIvb2N0LCB3aGVyZWFzXG4gIC8vIG9sZGVyIEFtaWdhcyBoYWQgYSA2ZEIvb2N0IGZpbHRlciBhdCA0OTAwSHouIFxuICB0aGlzLmZpbHRlck5vZGU9dGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICBpZiAodGhpcy5hbWlnYTUwMCkge1xuICAgIHRoaXMuZmlsdGVyTm9kZS5mcmVxdWVuY3kudmFsdWU9NjAwMDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlck5vZGUuZnJlcXVlbmN5LnZhbHVlPTI4ODY3O1xuICB9XG5cbiAgLy8gXCJMRUQgZmlsdGVyXCIgYXQgMzI3NWtIeiAtIG9mZiBieSBkZWZhdWx0XG4gIHRoaXMubG93cGFzc05vZGU9dGhpcy5jb250ZXh0LmNyZWF0ZUJpcXVhZEZpbHRlcigpO1xuICB0aGlzLmxvd3Bhc3NOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcbiAgdGhpcy5maWx0ZXI9ZmFsc2U7XG5cbiAgLy8gbWl4ZXJcbiAgaWYgKCB0eXBlb2YgdGhpcy5jb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5taXhlck5vZGU9dGhpcy5jb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlKHRoaXMuYnVmZmVybGVuLCAxLCAyKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1peGVyTm9kZT10aGlzLmNvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yKHRoaXMuYnVmZmVybGVuLCAxLCAyKTtcbiAgfVxuICB0aGlzLm1peGVyTm9kZS5tb2R1bGU9dGhpcztcbiAgdGhpcy5taXhlck5vZGUub25hdWRpb3Byb2Nlc3M9UHJvdHJhY2tlci5wcm90b3R5cGUubWl4O1xuXG4gIC8vIGNvbXByZXNzb3IgZm9yIGEgYml0IG9mIHZvbHVtZSBib29zdCwgaGVscHMgd2l0aCBtdWx0aWNoIHR1bmVzXG4gIHRoaXMuY29tcHJlc3Nvck5vZGU9dGhpcy5jb250ZXh0LmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xuXG4gIC8vIHBhdGNoIHVwIHNvbWUgY2FibGVzIDopICBcbiAgdGhpcy5taXhlck5vZGUuY29ubmVjdCh0aGlzLmZpbHRlck5vZGUpO1xuICB0aGlzLmZpbHRlck5vZGUuY29ubmVjdCh0aGlzLmxvd3Bhc3NOb2RlKTtcbiAgdGhpcy5sb3dwYXNzTm9kZS5jb25uZWN0KHRoaXMuY29tcHJlc3Nvck5vZGUpO1xuICB0aGlzLmNvbXByZXNzb3JOb2RlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTtcbn07XG5cblxuXG4vLyBwbGF5IGxvYWRlZCBhbmQgcGFyc2VkIG1vZHVsZSB3aXRoIHdlYmF1ZGlvIGNvbnRleHRcblByb3RyYWNrZXIucHJvdG90eXBlLnBsYXkgPSBmdW5jdGlvbigpXG57XG4gIGlmICh0aGlzLmNvbnRleHQ9PT1udWxsKSB7XG4gICAgdGhpcy5jcmVhdGVDb250ZXh0KCk7XG4gIH1cbiAgXG4gIGlmICghdGhpcy5yZWFkeSkgcmV0dXJuIGZhbHNlO1xuICBpZiAodGhpcy5wYXVzZWQpIHtcbiAgICB0aGlzLnBhdXNlZD1mYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICB0aGlzLmVuZG9mc29uZz1mYWxzZTtcbiAgdGhpcy5wYXVzZWQ9ZmFsc2U7XG4gIHRoaXMuaW5pdGlhbGl6ZSgpO1xuICB0aGlzLmZsYWdzPTErMjtcbiAgdGhpcy5wbGF5aW5nPXRydWU7XG4gIHRoaXMub25QbGF5KCk7XG4gIHRoaXMuZGVsYXlmaXJzdD10aGlzLmJ1ZmZlcnN0b2RlbGF5O1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuXG4vLyBwYXVzZSBwbGF5YmFja1xuUHJvdHJhY2tlci5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpXG57XG4gIGlmICghdGhpcy5wYXVzZWQpIHtcbiAgICB0aGlzLnBhdXNlZD10cnVlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucGF1c2VkPWZhbHNlO1xuICB9XG59O1xuXG5cblxuLy8gc3RvcCBwbGF5YmFja1xuUHJvdHJhY2tlci5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKClcbntcbiAgdGhpcy5wbGF5aW5nPWZhbHNlO1xuICB0aGlzLm9uU3RvcCgpO1xuICB0aGlzLmRlbGF5bG9hZD0xO1xufTtcblxuXG5cbi8vIHN0b3AgcGxheWluZyBidXQgZG9uJ3QgY2FsbCBjYWxsYmFja3NcblByb3RyYWNrZXIucHJvdG90eXBlLnN0b3BhdWRpbyA9IGZ1bmN0aW9uKHN0KVxue1xuICB0aGlzLnBsYXlpbmc9c3Q7XG59O1xuXG5cblxuLy8ganVtcCBwb3NpdGlvbnMgZm9yd2FyZC9iYWNrXG5Qcm90cmFja2VyLnByb3RvdHlwZS5qdW1wID0gZnVuY3Rpb24oc3RlcClcbntcbiAgdGhpcy50aWNrPTA7XG4gIHRoaXMucm93PTA7XG4gIHRoaXMucG9zaXRpb24rPXN0ZXA7XG4gIHRoaXMuZmxhZ3M9MSsyOyAgXG4gIGlmICh0aGlzLnBvc2l0aW9uPDApIHRoaXMucG9zaXRpb249MDtcbiAgaWYgKHRoaXMucG9zaXRpb24gPj0gdGhpcy5zb25nbGVuKSB0aGlzLnN0b3AoKTtcbn07XG5cblxuXG4vLyBzZXQgd2hldGhlciBtb2R1bGUgcmVwZWF0cyBhZnRlciBzb25nbGVuXG5Qcm90cmFja2VyLnByb3RvdHlwZS5zZXRyZXBlYXQgPSBmdW5jdGlvbihyZXApXG57XG4gIHRoaXMucmVwZWF0PXJlcDtcbn07XG5cblxuXG4vLyBzZXQgc3RlcmVvIHNlcGFyYXRpb24gbW9kZSAoMD1wYXVsYSwgMT1iZXR0ZXJwYXVsYSAoNjAvNDApLCAyPW1vbm8pXG5Qcm90cmFja2VyLnByb3RvdHlwZS5zZXRzZXBhcmF0aW9uID0gZnVuY3Rpb24oc2VwKVxue1xuICB0aGlzLnNlcGFyYXRpb249c2VwO1xufTtcblxuXG5cbi8vIHNldCBhbWlnYSB2aWRlbyBzdGFuZGFyZCAoZmFsc2U9TlRTQywgdHJ1ZT1QQUwpXG5Qcm90cmFja2VyLnByb3RvdHlwZS5zZXRhbWlnYXR5cGUgPSBmdW5jdGlvbihjbG9jaylcbntcbiAgdGhpcy5wYWxjbG9jaz1jbG9jaztcbn07XG5cblxuXG4vLyBzZXQgYXV0b3N0YXJ0IHRvIHBsYXkgaW1tZWRpYXRlbHkgYWZ0ZXIgbG9hZGluZ1xuUHJvdHJhY2tlci5wcm90b3R5cGUuc2V0YXV0b3N0YXJ0ID0gZnVuY3Rpb24oc3QpXG57XG4gIHRoaXMuYXV0b3N0YXJ0PXN0O1xufTtcblxuXG5cblxuXG4vLyBzZXQgYW1pZ2EgbW9kZWwgLSBjaGFuZ2VzIGZpeGVkIGZpbHRlciBzdGF0ZVxuUHJvdHJhY2tlci5wcm90b3R5cGUuc2V0YW1pZ2Ftb2RlbCA9IGZ1bmN0aW9uKGFtaWdhKVxue1xuICBpZiAoYW1pZ2E9PVwiNjAwXCIgfHwgYW1pZ2E9PVwiMTIwMFwiIHx8IGFtaWdhPT1cIjQwMDBcIikge1xuICAgIHRoaXMuYW1pZ2E1MDA9ZmFsc2U7XG4gICAgaWYgKHRoaXMuZmlsdGVyTm9kZSkgdGhpcy5maWx0ZXJOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmFtaWdhNTAwPXRydWU7XG4gICAgaWYgKHRoaXMuZmlsdGVyTm9kZSkgdGhpcy5maWx0ZXJOb2RlLmZyZXF1ZW5jeS52YWx1ZT02MDAwO1xuICB9XG59O1xuXG5cblxuLy8gYXJlIHRoZXJlIEU4eCBzeW5jIGV2ZW50cyBxdWV1ZWQ/XG5Qcm90cmFja2VyLnByb3RvdHlwZS5oYXNzeW5jZXZlbnRzID0gZnVuY3Rpb24oKVxue1xuICByZXR1cm4gKHRoaXMuc3luY3F1ZXVlLmxlbmd0aCAhPT0gMCk7XG59O1xuXG5cblxuLy8gcG9wIG9sZGVzdCBzeW5jIGV2ZW50IG55YmJsZSBmcm9tIHRoZSBGSUZPIHF1ZXVlXG5Qcm90cmFja2VyLnByb3RvdHlwZS5wb3BzeW5jZXZlbnQgPSBmdW5jdGlvbigpXG57XG4gIHJldHVybiB0aGlzLnN5bmNxdWV1ZS5wb3AoKTtcbn07XG5cblxuXG4vLyBjbGVhciBzb25nIGRhdGFcblByb3RyYWNrZXIucHJvdG90eXBlLmNsZWFyc29uZyA9IGZ1bmN0aW9uKClcbnsgIFxuICB0aGlzLnRpdGxlPVwiXCI7XG4gIHRoaXMuc2lnbmF0dXJlPVwiXCI7XG4gIHRoaXMuc29uZ2xlbj0xO1xuICB0aGlzLnJlcGVhdHBvcz0wO1xuICB0aGlzLnBhdHRlcm50YWJsZT1uZXcgQXJyYXlCdWZmZXIoMTI4KTtcbiAgZm9yKHZhciBpPTA7aTwxMjg7aSsrKSB0aGlzLnBhdHRlcm50YWJsZVtpXT0wO1xuXG4gIHRoaXMuY2hhbm5lbHM9NDtcblxuICB0aGlzLnNhbXBsZT1bXTtcbiAgdGhpcy5zYW1wbGVzPTMxO1xuICBmb3IoaT0wO2k8MzE7aSsrKSB7XG4gICAgdGhpcy5zYW1wbGVbaV09e307XG4gICAgdGhpcy5zYW1wbGVbaV0ubmFtZT1cIlwiO1xuICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0wO1xuICAgIHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lPTA7XG4gICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPTY0O1xuICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BzdGFydD0wO1xuICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICB0aGlzLnNhbXBsZVtpXS5kYXRhPTA7XG4gIH1cblxuICB0aGlzLnBhdHRlcm5zPTA7XG4gIHRoaXMucGF0dGVybj1bXTtcbiAgdGhpcy5ub3RlPVtdO1xuICBcbiAgdGhpcy5sb29wcm93PTA7XG4gIHRoaXMubG9vcHN0YXJ0PTA7XG4gIHRoaXMubG9vcGNvdW50PTA7XG4gIFxuICB0aGlzLnBhdHRlcm5kZWxheT0wO1xuICB0aGlzLnBhdHRlcm53YWl0PTA7XG4gIFxuICB0aGlzLnN5bmNxdWV1ZT1bXTtcbn07XG5cblxuLy8gaW5pdGlhbGl6ZSBhbGwgcGxheWVyIHZhcmlhYmxlc1xuUHJvdHJhY2tlci5wcm90b3R5cGUuaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKClcbntcbiAgdGhpcy5zeW5jcXVldWU9W107XG5cbiAgdGhpcy50aWNrPTA7XG4gIHRoaXMucG9zaXRpb249MDtcbiAgdGhpcy5yb3c9MDtcbiAgdGhpcy5vZmZzZXQ9MDtcbiAgdGhpcy5mbGFncz0wO1xuXG4gIHRoaXMuc3BlZWQ9NjtcbiAgdGhpcy5icG09MTI1O1xuICB0aGlzLmJyZWFrcm93PTA7XG4gIHRoaXMucGF0dGVybmp1bXA9MDtcbiAgdGhpcy5wYXR0ZXJuZGVsYXk9MDtcbiAgdGhpcy5wYXR0ZXJud2FpdD0wO1xuICB0aGlzLmVuZG9mc29uZz1mYWxzZTtcbiAgXG4gIHRoaXMuY2hhbm5lbD1bXTtcbiAgZm9yKGk9MDtpPHRoaXMuY2hhbm5lbHM7aSsrKSB7XG4gICAgdGhpcy5jaGFubmVsW2ldPXt9O1xuICAgIHRoaXMuY2hhbm5lbFtpXS5zYW1wbGU9MDtcbiAgICB0aGlzLmNoYW5uZWxbaV0ucGVyaW9kPTIxNDtcbiAgICB0aGlzLmNoYW5uZWxbaV0udm9pY2VwZXJpb2Q9MjE0O1xuICAgIHRoaXMuY2hhbm5lbFtpXS5ub3RlPTI0OyAgICBcbiAgICB0aGlzLmNoYW5uZWxbaV0udm9sdW1lPTY0O1xuICAgIHRoaXMuY2hhbm5lbFtpXS5jb21tYW5kPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLmRhdGE9MDtcbiAgICB0aGlzLmNoYW5uZWxbaV0uc2FtcGxlcG9zPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnNhbXBsZXNwZWVkPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLmZsYWdzPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLm5vdGVvbj0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS5zbGlkZXNwZWVkPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnNsaWRldG89MjE0O1xuICAgIHRoaXMuY2hhbm5lbFtpXS5zbGlkZXRvc3BlZWQ9MDtcbiAgICB0aGlzLmNoYW5uZWxbaV0uYXJwZWdnaW89MDtcblxuICAgIHRoaXMuY2hhbm5lbFtpXS5zZW1pdG9uZT0xMjtcbiAgICB0aGlzLmNoYW5uZWxbaV0udmlicmF0b3NwZWVkPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnZpYnJhdG9kZXB0aD0wO1xuICAgIHRoaXMuY2hhbm5lbFtpXS52aWJyYXRvcG9zPTA7XG4gICAgdGhpcy5jaGFubmVsW2ldLnZpYnJhdG93YXZlPTA7XG4gIH1cbiAgdGhpcy52dT1bXTtcbn07XG5cblxuXG4vLyBsb2FkIG1vZHVsZSBmcm9tIHVybCBpbnRvIGxvY2FsIGJ1ZmZlclxuUHJvdHJhY2tlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uKHVybClcbntcbiAgICB0aGlzLnBsYXlpbmc9ZmFsc2U7IC8vIGEgcHJlY2F1dGlvblxuXG4gICAgdGhpcy51cmw9dXJsO1xuICAgIHRoaXMuY2xlYXJzb25nKCk7XG4gICAgXG4gICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdGhpcy51cmwsIHRydWUpO1xuICAgIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgIHRoaXMucmVxdWVzdCA9IHJlcXVlc3Q7XG4gICAgdGhpcy5sb2FkaW5nPXRydWU7XG4gICAgdmFyIGFzc2V0ID0gdGhpcztcbiAgICByZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBhc3NldC5idWZmZXI9bmV3IFVpbnQ4QXJyYXkocmVxdWVzdC5yZXNwb25zZSk7XG4gICAgICAgIGFzc2V0LnBhcnNlKCk7XG4gICAgICAgIGlmIChhc3NldC5hdXRvc3RhcnQpIGFzc2V0LnBsYXkoKTtcbiAgICB9O1xuICAgIHJlcXVlc3Quc2VuZCgpOyAgXG59O1xuXG5cblxuLy8gcGFyc2UgdGhlIG1vZHVsZSBmcm9tIGxvY2FsIGJ1ZmZlclxuUHJvdHJhY2tlci5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbigpXG57XG4gIHZhciBpLGosYztcbiAgXG4gIGlmICghdGhpcy5idWZmZXIpe1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgZm9yKGk9MDtpPDQ7aSsrKXtcbiAgICB0aGlzLnNpZ25hdHVyZSs9U3RyaW5nLmZyb21DaGFyQ29kZSh0aGlzLmJ1ZmZlclsxMDgwK2ldKTtcbiAgfVxuXG4gIHN3aXRjaCAodGhpcy5zaWduYXR1cmUpIHtcbiAgICBjYXNlIFwiTS5LLlwiOlxuICAgIGNhc2UgXCJNIUshXCI6XG4gICAgY2FzZSBcIjRDSE5cIjpcbiAgICBjYXNlIFwiRkxUNFwiOlxuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIFwiNkNITlwiOlxuICAgICAgdGhpcy5jaGFubmVscz02O1xuICAgICAgYnJlYWs7XG4gICAgICBcbiAgICBjYXNlIFwiOENITlwiOlxuICAgIGNhc2UgXCJGTFQ4XCI6XG4gICAgICB0aGlzLmNoYW5uZWxzPTg7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCIyOENIXCI6XG4gICAgICB0aGlzLmNoYW5uZWxzPTI4O1xuICAgICAgYnJlYWs7XG4gICAgXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB0aGlzLnZ1PVtdO1xuICBmb3IoaT0wO2k8dGhpcy5jaGFubmVscztpKyspe1xuICAgIHRoaXMudnVbaV09MC4wO1xuICB9XG4gIFxuICBpPTA7XG4gIHdoaWxlKHRoaXMuYnVmZmVyW2ldICYmIGk8MjApe1xuICAgIHRoaXMudGl0bGU9dGhpcy50aXRsZStTdHJpbmcuZnJvbUNoYXJDb2RlKHRoaXMuYnVmZmVyW2krK10pO1xuICB9XG5cbiAgZm9yKGk9MDtpPHRoaXMuc2FtcGxlcztpKyspIHtcbiAgICB2YXIgc3Q9MjAraSozMDtcbiAgICBqPTA7XG4gICAgd2hpbGUodGhpcy5idWZmZXJbc3Qral0gJiYgajwyMikgeyBcbiAgICAgIHRoaXMuc2FtcGxlW2ldLm5hbWUrPVxuICAgICAgICAoKHRoaXMuYnVmZmVyW3N0K2pdPjB4MWYpICYmICh0aGlzLmJ1ZmZlcltzdCtqXTwweDdmKSkgPyBcbiAgICAgICAgKFN0cmluZy5mcm9tQ2hhckNvZGUodGhpcy5idWZmZXJbc3Qral0pKSA6XG4gICAgICAgIChcIiBcIik7XG4gICAgICBqKys7XG4gICAgfVxuICAgIHRoaXMuc2FtcGxlW2ldLmxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyMl0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjNdKTtcbiAgICB0aGlzLnNhbXBsZVtpXS5maW5ldHVuZT10aGlzLmJ1ZmZlcltzdCsyNF07XG4gICAgaWYgKHRoaXMuc2FtcGxlW2ldLmZpbmV0dW5lID4gNykgdGhpcy5zYW1wbGVbaV0uZmluZXR1bmU9dGhpcy5zYW1wbGVbaV0uZmluZXR1bmUtMTY7XG4gICAgdGhpcy5zYW1wbGVbaV0udm9sdW1lPXRoaXMuYnVmZmVyW3N0KzI1XTtcbiAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MioodGhpcy5idWZmZXJbc3QrMjZdKjI1NiArIHRoaXMuYnVmZmVyW3N0KzI3XSk7XG4gICAgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0yKih0aGlzLmJ1ZmZlcltzdCsyOF0qMjU2ICsgdGhpcy5idWZmZXJbc3QrMjldKTtcbiAgICBpZiAodGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD09MikgdGhpcy5zYW1wbGVbaV0ubG9vcGxlbmd0aD0wO1xuICAgIGlmICh0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ+dGhpcy5zYW1wbGVbaV0ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnNhbXBsZVtpXS5sb29wc3RhcnQ9MDtcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmxvb3BsZW5ndGg9MDtcbiAgICB9XG4gIH1cblxuICB0aGlzLnNvbmdsZW49dGhpcy5idWZmZXJbOTUwXTtcbiAgaWYgKHRoaXMuYnVmZmVyWzk1MV0gIT0gMTI3KSB0aGlzLnJlcGVhdHBvcz10aGlzLmJ1ZmZlcls5NTFdO1xuICBmb3IoaT0wO2k8MTI4O2krKykge1xuICAgIHRoaXMucGF0dGVybnRhYmxlW2ldPXRoaXMuYnVmZmVyWzk1MitpXTtcbiAgICBpZiAodGhpcy5wYXR0ZXJudGFibGVbaV0gPiB0aGlzLnBhdHRlcm5zKSB0aGlzLnBhdHRlcm5zPXRoaXMucGF0dGVybnRhYmxlW2ldO1xuICB9XG4gIHRoaXMucGF0dGVybnMrPTE7XG4gIHZhciBwYXRsZW49NCo2NCp0aGlzLmNoYW5uZWxzO1xuXG4gIHRoaXMucGF0dGVybj1bXTtcbiAgdGhpcy5ub3RlPVtdO1xuICBmb3IoaT0wO2k8dGhpcy5wYXR0ZXJucztpKyspIHtcbiAgICB0aGlzLnBhdHRlcm5baV09bmV3IFVpbnQ4QXJyYXkocGF0bGVuKTtcbiAgICB0aGlzLm5vdGVbaV09bmV3IFVpbnQ4QXJyYXkodGhpcy5jaGFubmVscyo2NCk7XG4gICAgZm9yKGo9MDtqPHBhdGxlbjtqKyspIHRoaXMucGF0dGVybltpXVtqXT10aGlzLmJ1ZmZlclsxMDg0K2kqcGF0bGVuK2pdO1xuICAgIGZvcihqPTA7ajw2NDtqKyspIGZvcihjPTA7Yzx0aGlzLmNoYW5uZWxzO2MrKykge1xuICAgICAgdGhpcy5ub3RlW2ldW2oqdGhpcy5jaGFubmVscytjXT0wO1xuICAgICAgdmFyIG49KHRoaXMucGF0dGVybltpXVtqKjQqdGhpcy5jaGFubmVscytjKjRdJjB4MGYpPDw4IHwgdGhpcy5wYXR0ZXJuW2ldW2oqNCp0aGlzLmNoYW5uZWxzK2MqNCsxXTtcbiAgICAgIGZvcih2YXIgbnA9MDsgbnA8dGhpcy5iYXNlcGVyaW9kdGFibGUubGVuZ3RoOyBucCsrKVxuICAgICAgICBpZiAobj09dGhpcy5iYXNlcGVyaW9kdGFibGVbbnBdKSB0aGlzLm5vdGVbaV1baip0aGlzLmNoYW5uZWxzK2NdPW5wO1xuICAgIH0gICAgICAgIFxuICB9XG4gIFxuICB2YXIgc3N0PTEwODQrdGhpcy5wYXR0ZXJucypwYXRsZW47XG4gIGZvcihpPTA7aTx0aGlzLnNhbXBsZXM7aSsrKSB7XG4gICAgdGhpcy5zYW1wbGVbaV0uZGF0YT1uZXcgRmxvYXQzMkFycmF5KHRoaXMuc2FtcGxlW2ldLmxlbmd0aCk7XG4gICAgZm9yKGo9MDtqPHRoaXMuc2FtcGxlW2ldLmxlbmd0aDtqKyspIHtcbiAgICAgIHZhciBxPXRoaXMuYnVmZmVyW3NzdCtqXTtcbiAgICAgIGlmIChxPDEyOCkge1xuICAgICAgICBxPXEvMTI4LjA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBxPSgocS0xMjgpLzEyOC4wKS0xLjA7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHRoaXMuc2FtcGxlW2ldLmRhdGFbal09cTtcbiAgICB9XG4gICAgc3N0Kz10aGlzLnNhbXBsZVtpXS5sZW5ndGg7XG4gIH1cblxuICBpZiAodGhpcy5jb250ZXh0KSB7XG4gICAgdGhpcy5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9Mjg4Njc7XG4gICAgdGhpcy5maWx0ZXI9ZmFsc2U7XG4gIH1cblxuICB0aGlzLnJlYWR5PXRydWU7XG4gIHRoaXMubG9hZGluZz1mYWxzZTtcbiAgdGhpcy5idWZmZXI9MDtcblxuICB0aGlzLm9uUmVhZHkoKTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG5cblxuLy8gYWR2YW5jZSBwbGF5ZXJcblByb3RyYWNrZXIucHJvdG90eXBlLmFkdmFuY2U9ZnVuY3Rpb24obW9kKSB7XG4gIHZhciBzcGQ9KCgobW9kLnNhbXBsZXJhdGUqNjApL21vZC5icG0pLzQpLzY7XG5cbiAgLy8gYWR2YW5jZSBwbGF5ZXJcbiAgaWYgKG1vZC5vZmZzZXQ+c3BkKSB7IG1vZC50aWNrKys7IG1vZC5vZmZzZXQ9MDsgbW9kLmZsYWdzfD0xOyB9XG4gIGlmIChtb2QudGljaz49bW9kLnNwZWVkKSB7XG5cbiAgICBpZiAobW9kLnBhdHRlcm5kZWxheSkgeyAvLyBkZWxheSBwYXR0ZXJuXG4gICAgICBpZiAobW9kLnRpY2sgPCAoKG1vZC5wYXR0ZXJud2FpdCsxKSptb2Quc3BlZWQpKSB7XG4gICAgICAgIG1vZC5wYXR0ZXJud2FpdCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbW9kLnJvdysrOyBtb2QudGljaz0wOyBtb2QuZmxhZ3N8PTI7IG1vZC5wYXR0ZXJuZGVsYXk9MDtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG5cbiAgICAgIGlmIChtb2QuZmxhZ3MmKDE2KzMyKzY0KSkge1xuICAgICAgICBpZiAobW9kLmZsYWdzJjY0KSB7IC8vIGxvb3AgcGF0dGVybj9cbiAgICAgICAgICBtb2Qucm93PW1vZC5sb29wcm93O1xuICAgICAgICAgIG1vZC5mbGFncyY9MHhhMTtcbiAgICAgICAgICBtb2QuZmxhZ3N8PTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKG1vZC5mbGFncyYxNikgeyAvLyBwYXR0ZXJuIGp1bXAvYnJlYWs/XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiYnJlYWsgdG8gcGF0dGVybiBcIiArIG1vZC5wYXR0ZXJuanVtcCArIFwiIHJvdyBcIittb2QuYnJlYWtyb3cpO1xuICAgICAgICAgICAgbW9kLnBvc2l0aW9uPW1vZC5wYXR0ZXJuanVtcDtcbiAgICAgICAgICAgIG1vZC5yb3c9bW9kLmJyZWFrcm93O1xuICAgICAgICAgICAgbW9kLnBhdHRlcm5qdW1wPTA7XG4gICAgICAgICAgICBtb2QuYnJlYWtyb3c9MDtcbiAgICAgICAgICAgIG1vZC5mbGFncyY9MHhlMTtcbiAgICAgICAgICAgIG1vZC5mbGFnc3w9MjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kLnRpY2s9MDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZC5yb3crKzsgbW9kLnRpY2s9MDsgbW9kLmZsYWdzfD0yO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAobW9kLnJvdz49NjQpIHsgbW9kLnBvc2l0aW9uKys7IG1vZC5yb3c9MDsgbW9kLmZsYWdzfD00OyB9XG4gIGlmIChtb2QucG9zaXRpb24+PW1vZC5zb25nbGVuKSB7XG4gICAgaWYgKG1vZC5yZXBlYXQpIHtcbiAgICAgIG1vZC5wb3NpdGlvbj0wO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZG9mc29uZz10cnVlO1xuICAgICAgbW9kLnN0b3AoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG59O1xuXG5cblxuLy8gbWl4IGFuIGF1ZGlvIGJ1ZmZlciB3aXRoIGRhdGFcblByb3RyYWNrZXIucHJvdG90eXBlLm1peCA9IGZ1bmN0aW9uKGFwZSkge1xuICB2YXIgZjtcbiAgdmFyIHAsIHBwLCBuLCBubjtcbiAgdmFyIG1vZDtcbiAgaWYgKGFwZS5zcmNFbGVtZW50KSB7XG4gICAgbW9kPWFwZS5zcmNFbGVtZW50Lm1vZHVsZTtcbiAgfSBlbHNlIHtcbiAgICBtb2Q9dGhpcy5tb2R1bGU7XG4gIH1cbiAgb3V0cD1bXTtcblxuICB2YXIgYnVmcz1uZXcgQXJyYXkoYXBlLm91dHB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKSwgYXBlLm91dHB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKSk7XG4gIHZhciBidWZsZW49YXBlLm91dHB1dEJ1ZmZlci5sZW5ndGg7XG4gIGZvcih2YXIgcz0wO3M8YnVmbGVuO3MrKylcbiAge1xuICAgIG91dHBbMF09MC4wO1xuICAgIG91dHBbMV09MC4wO1xuXG4gICAgaWYgKCFtb2QucGF1c2VkICYmIG1vZC5wbGF5aW5nICYmIG1vZC5kZWxheWZpcnN0PT09MClcbiAgICB7XG4gICAgICBtb2QuYWR2YW5jZShtb2QpO1xuXG4gICAgICB2YXIgb2NoPTA7XG4gICAgICBmb3IodmFyIGNoPTA7Y2g8bW9kLmNoYW5uZWxzO2NoKyspXG4gICAgICB7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSBwbGF5YmFjayBwb3NpdGlvblxuICAgICAgICBwPW1vZC5wYXR0ZXJudGFibGVbbW9kLnBvc2l0aW9uXTtcbiAgICAgICAgcHA9bW9kLnJvdyo0Km1vZC5jaGFubmVscyArIGNoKjQ7XG4gICAgICAgIGlmIChtb2QuZmxhZ3MmMikgeyAvLyBuZXcgcm93XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLmNvbW1hbmQ9bW9kLnBhdHRlcm5bcF1bcHArMl0mMHgwZjtcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uZGF0YT1tb2QucGF0dGVybltwXVtwcCszXTtcblxuICAgICAgICAgIGlmICghKG1vZC5jaGFubmVsW2NoXS5jb21tYW5kPT0weDBlICYmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSYweGYwKT09MHhkMCkpIHtcbiAgICAgICAgICAgIG49KG1vZC5wYXR0ZXJuW3BdW3BwXSYweDBmKTw8OCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzFdO1xuICAgICAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgICAgLy8gbm90ZW9uLCBleGNlcHQgaWYgY29tbWFuZD0zIChwb3J0YSB0byBub3RlKVxuICAgICAgICAgICAgICBpZiAoKG1vZC5jaGFubmVsW2NoXS5jb21tYW5kICE9IDB4MDMpICYmIChtb2QuY2hhbm5lbFtjaF0uY29tbWFuZCAhPSAweDA1KSkge1xuICAgICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5wZXJpb2Q9bjtcbiAgICAgICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zPTA7XG4gICAgICAgICAgICAgICAgaWYgKG1vZC5jaGFubmVsW2NoXS52aWJyYXRvd2F2ZT4zKSBtb2QuY2hhbm5lbFtjaF0udmlicmF0b3Bvcz0wO1xuICAgICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkXG4gICAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0xO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGluIGVpdGhlciBjYXNlLCBzZXQgdGhlIHNsaWRlIHRvIG5vdGUgdGFyZ2V0XG4gICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zbGlkZXRvPW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBubj1tb2QucGF0dGVybltwXVtwcCswXSYweGYwIHwgbW9kLnBhdHRlcm5bcF1bcHArMl0+PjQ7XG4gICAgICAgICAgICBpZiAobm4pIHtcbiAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnNhbXBsZT1ubi0xO1xuICAgICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPW1vZC5zYW1wbGVbbm4tMV0udm9sdW1lO1xuICAgICAgICAgICAgICBpZiAoIW4gJiYgKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MgPiBtb2Quc2FtcGxlW25uLTFdLmxlbmd0aCkpIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3M9MDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZvaWNlcGVyaW9kPW1vZC5jaGFubmVsW2NoXS5wZXJpb2Q7XG4gICAgICAgIFxuICAgICAgICAvLyBraWxsIGVtcHR5IHNhbXBsZXNcbiAgICAgICAgaWYgKCFtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxlbmd0aCkgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0wO1xuXG4gICAgICAgIC8vIGVmZmVjdHMgICAgICAgIFxuICAgICAgICBpZiAobW9kLmZsYWdzJjEpIHtcbiAgICAgICAgICBpZiAoIW1vZC50aWNrKSB7XG4gICAgICAgICAgICAvLyBwcm9jZXNzIG9ubHkgb24gdGljayAwXG4gICAgICAgICAgICBtb2QuZWZmZWN0c190MFttb2QuY2hhbm5lbFtjaF0uY29tbWFuZF0obW9kLCBjaCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1vZC5lZmZlY3RzX3QxW21vZC5jaGFubmVsW2NoXS5jb21tYW5kXShtb2QsIGNoKTsgICAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVjYWxjIG5vdGUgbnVtYmVyIGZyb20gcGVyaW9kXG4gICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0uZmxhZ3MmMikge1xuICAgICAgICAgIGZvcih2YXIgbnA9MDsgbnA8bW9kLmJhc2VwZXJpb2R0YWJsZS5sZW5ndGg7IG5wKyspXG4gICAgICAgICAgICBpZiAobW9kLmJhc2VwZXJpb2R0YWJsZVtucF0+PW1vZC5jaGFubmVsW2NoXS5wZXJpb2QpIG1vZC5jaGFubmVsW2NoXS5ub3RlPW5wO1xuICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zZW1pdG9uZT03O1xuICAgICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPj0xMjApXG4gICAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2VtaXRvbmU9bW9kLmJhc2VwZXJpb2R0YWJsZVttb2QuY2hhbm5lbFtjaF0ubm90ZV0tbW9kLmJhc2VwZXJpb2R0YWJsZVttb2QuY2hhbm5lbFtjaF0ubm90ZSsxXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlY2FsYyBzYW1wbGUgc3BlZWQgYW5kIGFwcGx5IGZpbmV0dW5lXG4gICAgICAgIGlmICgobW9kLmNoYW5uZWxbY2hdLmZsYWdzJjEgfHwgbW9kLmZsYWdzJjIpICYmIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZClcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlc3BlZWQ9XG4gICAgICAgICAgICAobW9kLnBhbGNsb2NrID8gNzA5Mzc4OS4yIDogNzE1OTA5MC41KS8obW9kLmNoYW5uZWxbY2hdLnZvaWNlcGVyaW9kKjIpICogbW9kLmZpbmV0dW5ldGFibGVbbW9kLnNhbXBsZVttb2QuY2hhbm5lbFtjaF0uc2FtcGxlXS5maW5ldHVuZSs4XSAvIG1vZC5zYW1wbGVyYXRlO1xuICAgICAgICBcbiAgICAgICAgLy8gYWR2YW5jZSB2aWJyYXRvIG9uIGVhY2ggbmV3IHRpY2tcbiAgICAgICAgaWYgKG1vZC5mbGFncyYxKSB7XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3MrPW1vZC5jaGFubmVsW2NoXS52aWJyYXRvc3BlZWQ7XG4gICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3MmPTB4M2Y7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtaXggY2hhbm5lbCB0byBvdXRwdXQgICAgICAgIFxuICAgICAgICBvY2g9b2NoXihjaCYxKTtcbiAgICAgICAgZj0wLjA7XG4gICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ubm90ZW9uKSB7XG4gICAgICAgICAgaWYgKG1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0ubGVuZ3RoID4gbW9kLmNoYW5uZWxbY2hdLnNhbXBsZXBvcylcbiAgICAgICAgICAgIGY9KDEuMC9tb2QuY2hhbm5lbHMpICpcbiAgICAgICAgICAgICAgKG1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0uZGF0YVtNYXRoLmZsb29yKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MpXSptb2QuY2hhbm5lbFtjaF0udm9sdW1lKS82NC4wO1xuICAgICAgICAgIG91dHBbb2NoXSs9ZjtcbiAgICAgICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zKz1tb2QuY2hhbm5lbFtjaF0uc2FtcGxlc3BlZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHM9PT0wKXtcbiAgICAgICAgICBtb2QudnVbY2hdPU1hdGguYWJzKGYpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbG9vcCBvciBlbmQgc2FtcGxlc1xuICAgICAgICBpZiAobW9kLmNoYW5uZWxbY2hdLm5vdGVvbikge1xuICAgICAgICAgIGlmIChtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BzdGFydCB8fCBtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BsZW5ndGgpIHtcbiAgICAgICAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zID49IChtb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BzdGFydCttb2Quc2FtcGxlW21vZC5jaGFubmVsW2NoXS5zYW1wbGVdLmxvb3BsZW5ndGgpKSB7XG4gICAgICAgICAgICAgIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MtPW1vZC5zYW1wbGVbbW9kLmNoYW5uZWxbY2hdLnNhbXBsZV0ubG9vcGxlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3MgPj0gbW9kLnNhbXBsZVttb2QuY2hhbm5lbFtjaF0uc2FtcGxlXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgbW9kLmNoYW5uZWxbY2hdLm5vdGVvbj0wO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFyIGNoYW5uZWwgZmxhZ3NcbiAgICAgICAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzPTA7XG4gICAgICB9IFxuICAgICAgbW9kLm9mZnNldCsrO1xuICAgICAgbW9kLmZsYWdzJj0weDcwOyAgICAgIFxuICAgIH1cbiAgICBcbiAgICAvLyBhIG1vcmUgaGVhZHBob25lLWZyaWVuZGx5IHN0ZXJlbyBzZXBhcmF0aW9uIChha2EuIGJldHRlcnBhdWxhKVxuICAgIGlmIChtb2Quc2VwYXJhdGlvbikge1xuICAgICAgdD1vdXRwWzBdO1xuICAgICAgaWYgKG1vZC5zZXBhcmF0aW9uPT0yKSB7XG4gICAgICAgIG91dHBbMF09b3V0cFswXSowLjUgKyBvdXRwWzFdKjAuNTtcbiAgICAgICAgb3V0cFsxXT1vdXRwWzFdKjAuNSArIHQqMC41O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3V0cFswXT1vdXRwWzBdKjAuNjUgKyBvdXRwWzFdKjAuMzU7XG4gICAgICAgIG91dHBbMV09b3V0cFsxXSowLjY1ICsgdCowLjM1O1xuICAgICAgfVxuICAgIH1cbiAgICBidWZzWzBdW3NdPW91dHBbMF07XG4gICAgYnVmc1sxXVtzXT1vdXRwWzFdO1xuICB9XG4gIGlmIChtb2QuZGVsYXlmaXJzdD4wKSBtb2QuZGVsYXlmaXJzdC0tOyAvLz1mYWxzZTtcbiAgbW9kLmRlbGF5bG9hZD0wO1xufTtcblxuXG5cbi8vXG4vLyB0aWNrIDAgZWZmZWN0IGZ1bmN0aW9uc1xuLy9cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF8wPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMCBhcnBlZ2dpb1xuICBtb2QuY2hhbm5lbFtjaF0uYXJwZWdnaW89bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzE9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAxIHNsaWRlIHVwXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSkgbW9kLmNoYW5uZWxbY2hdLnNsaWRlc3BlZWQ9bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzI9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAyIHNsaWRlIGRvd25cbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhKSBtb2QuY2hhbm5lbFtjaF0uc2xpZGVzcGVlZD1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfMz1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIDMgc2xpZGUgdG8gbm90ZVxuICBpZiAobW9kLmNoYW5uZWxbY2hdLmRhdGEpIG1vZC5jaGFubmVsW2NoXS5zbGlkZXRvc3BlZWQ9bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwXzQ9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA0IHZpYnJhdG9cbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYgJiYgbW9kLmNoYW5uZWxbY2hdLmRhdGEmMHhmMCkge1xuICAgIG1vZC5jaGFubmVsW2NoXS52aWJyYXRvZGVwdGg9KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xuICAgIG1vZC5jaGFubmVsW2NoXS52aWJyYXRvc3BlZWQ9KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4ZjApPj40O1xuICB9XG4gIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZCs9XG4gICAgKG1vZC5jaGFubmVsW2NoXS52aWJyYXRvZGVwdGgvMzIpKm1vZC5jaGFubmVsW2NoXS5zZW1pdG9uZSoobW9kLnZpYnJhdG90YWJsZVttb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmUmM11bbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3NdLzEyNyk7ICAgICAgICBcbiAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzfD0xO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF81PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gNVxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF82PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gNlxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF83PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gN1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF84PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOCB1bnVzZWQsIHVzZWQgZm9yIHN5bmNpbmdcbiAgbW9kLnN5bmNxdWV1ZS51bnNoaWZ0KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF85PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOSBzZXQgc2FtcGxlIG9mZnNldFxuICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zPW1vZC5jaGFubmVsW2NoXS5kYXRhKjI1Njtcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfYT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGFcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfYj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGIgcGF0dGVybiBqdW1wXG4gIG1vZC5icmVha3Jvdz0wO1xuICBtb2QucGF0dGVybmp1bXA9bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG4gIG1vZC5mbGFnc3w9MTY7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2M9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBjIHNldCB2b2x1bWVcbiAgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZT1tb2QuY2hhbm5lbFtjaF0uZGF0YTtcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGQgcGF0dGVybiBicmVha1xuICBtb2QuYnJlYWtyb3c9KChtb2QuY2hhbm5lbFtjaF0uZGF0YSYweGYwKT4+NCkqMTAgKyAobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZik7XG4gIGlmICghKG1vZC5mbGFncyYxNikpIG1vZC5wYXR0ZXJuanVtcD1tb2QucG9zaXRpb24rMTtcbiAgbW9kLmZsYWdzfD0xNjsgIFxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZVxuICB2YXIgaT0obW9kLmNoYW5uZWxbY2hdLmRhdGEmMHhmMCk+PjQ7XG4gIG1vZC5lZmZlY3RzX3QwX2VbaV0obW9kLCBjaCk7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2Y9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBmIHNldCBzcGVlZFxuICBpZiAobW9kLmNoYW5uZWxbY2hdLmRhdGEgPiAzMikge1xuICAgIG1vZC5icG09bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhKSBtb2Quc3BlZWQ9bW9kLmNoYW5uZWxbY2hdLmRhdGE7XG4gIH1cbn07XG5cblxuXG4vL1xuLy8gdGljayAwIGVmZmVjdCBlIGZ1bmN0aW9uc1xuLy9cblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lMD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGUwIGZpbHRlciBvbi9vZmZcbiAgaWYgKG1vZC5jaGFubmVscyA+IDQpIHJldHVybjsgLy8gdXNlIG9ubHkgZm9yIDRjaCBhbWlnYSB0dW5lc1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZikge1xuICAgIG1vZC5sb3dwYXNzTm9kZS5mcmVxdWVuY3kudmFsdWU9MzI3NTtcbiAgICBtb2QuZmlsdGVyPXRydWU7XG4gIH0gZWxzZSB7XG4gICAgbW9kLmxvd3Bhc3NOb2RlLmZyZXF1ZW5jeS52YWx1ZT0yODg2NztcbiAgICBtb2QuZmlsdGVyPWZhbHNlO1xuICB9XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2UxPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTEgZmluZSBzbGlkZSB1cFxuICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kLT1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnBlcmlvZCA8IDExMykgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD0xMTM7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2UyPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTIgZmluZSBzbGlkZSBkb3duXG4gIG1vZC5jaGFubmVsW2NoXS5wZXJpb2QrPW1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGY7XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kID4gODU2KSBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPTg1NjtcbiAgbW9kLmNoYW5uZWxbY2hdLmZsYWdzfD0xO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lMz1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGUzIHNldCBnbGlzc2FuZG9cbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTQ9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNCBzZXQgdmlicmF0byB3YXZlZm9ybVxuICBtb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmU9bW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwNztcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTU9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNSBzZXQgZmluZXR1bmVcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTY9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNiBsb29wIHBhdHRlcm5cbiAgaWYgKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpIHtcbiAgICBpZiAobW9kLmxvb3Bjb3VudCkge1xuICAgICAgbW9kLmxvb3Bjb3VudC0tO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2QubG9vcGNvdW50PW1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGY7XG4gICAgfVxuICAgIGlmIChtb2QubG9vcGNvdW50KSBtb2QuZmxhZ3N8PTY0O1xuICB9IGVsc2Uge1xuICAgIG1vZC5sb29wcm93PW1vZC5yb3c7XG4gIH1cbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZTc9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlN1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lOD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU4LCB1c2UgZm9yIHN5bmNpbmdcbiAgbW9kLnN5bmNxdWV1ZS51bnNoaWZ0KG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lOT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU5XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2VhPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWEgZmluZSB2b2xzbGlkZSB1cFxuICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lKz1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnZvbHVtZSA+IDY0KSBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPTY0O1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lYj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGViIGZpbmUgdm9sc2xpZGUgZG93blxuICBtb2QuY2hhbm5lbFtjaF0udm9sdW1lLT1tb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmO1xuICBpZiAobW9kLmNoYW5uZWxbY2hdLnZvbHVtZSA8IDApIG1vZC5jaGFubmVsW2NoXS52b2x1bWU9MDtcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZWM9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlY1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MF9lZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVkIGRlbGF5IHNhbXBsZVxuICBpZiAobW9kLnRpY2s9PShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKSkge1xuICAgIC8vIHN0YXJ0IG5vdGVcbiAgICB2YXIgcD1tb2QucGF0dGVybnRhYmxlW21vZC5wb3NpdGlvbl07XG4gICAgdmFyIHBwPW1vZC5yb3cqNCptb2QuY2hhbm5lbHMgKyBjaCo0OyAgICAgICAgICAgIFxuICAgIG49KG1vZC5wYXR0ZXJuW3BdW3BwXSYweDBmKTw8OCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzFdO1xuICAgIGlmIChuKSB7XG4gICAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPW47XG4gICAgICBtb2QuY2hhbm5lbFtjaF0udm9pY2VwZXJpb2Q9bW9kLmNoYW5uZWxbY2hdLnBlcmlvZDsgICAgICBcbiAgICAgIG1vZC5jaGFubmVsW2NoXS5zYW1wbGVwb3M9MDtcbiAgICAgIGlmIChtb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmU+MykgbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3M9MDtcbiAgICAgIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkXG4gICAgICBtb2QuY2hhbm5lbFtjaF0ubm90ZW9uPTE7XG4gICAgfVxuICAgIG49bW9kLnBhdHRlcm5bcF1bcHArMF0mMHhmMCB8IG1vZC5wYXR0ZXJuW3BdW3BwKzJdPj40O1xuICAgIGlmIChuKSB7XG4gICAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlPW4tMTtcbiAgICAgIG1vZC5jaGFubmVsW2NoXS52b2x1bWU9bW9kLnNhbXBsZVtuLTFdLnZvbHVtZTtcbiAgICB9XG4gIH1cbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDBfZWU9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlZSBkZWxheSBwYXR0ZXJuXG4gIG1vZC5wYXR0ZXJuZGVsYXk9bW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZjtcbiAgbW9kLnBhdHRlcm53YWl0PTA7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QwX2VmPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWZcbn07XG5cblxuXG4vL1xuLy8gdGljayAxKyBlZmZlY3QgZnVuY3Rpb25zXG4vL1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzA9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAwIGFycGVnZ2lvXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0uZGF0YSkge1xuICAgIHZhciBhcG49bW9kLmNoYW5uZWxbY2hdLm5vdGU7XG4gICAgaWYgKChtb2QudGljayUzKT09MSkgYXBuKz1tb2QuY2hhbm5lbFtjaF0uYXJwZWdnaW8+PjQ7XG4gICAgaWYgKChtb2QudGljayUzKT09MikgYXBuKz1tb2QuY2hhbm5lbFtjaF0uYXJwZWdnaW8mMHgwZjtcbiAgICBpZiAoYXBuPj0wICYmIGFwbiA8PSBtb2QuYmFzZXBlcmlvZHRhYmxlLmxlbmd0aClcbiAgICAgIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZCA9IG1vZC5iYXNlcGVyaW9kdGFibGVbYXBuXTtcbiAgICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTE7XG4gIH1cbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfMT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIDEgc2xpZGUgdXBcbiAgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZC09bW9kLmNoYW5uZWxbY2hdLnNsaWRlc3BlZWQ7XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPDExMykgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD0xMTM7XG4gIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkXG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzI9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyAyIHNsaWRlIGRvd25cbiAgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZCs9bW9kLmNoYW5uZWxbY2hdLnNsaWRlc3BlZWQ7XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPjg1NikgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD04NTY7XG4gIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MzsgLy8gcmVjYWxjIHNwZWVkICAgICAgICAgICAgICAgIFxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV8zPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gMyBzbGlkZSB0byBub3RlXG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kIDwgbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pIHtcbiAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kKz1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0b3NwZWVkO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kID4gbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pXG4gICAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPW1vZC5jaGFubmVsW2NoXS5zbGlkZXRvO1xuICB9XG4gIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kID4gbW9kLmNoYW5uZWxbY2hdLnNsaWRldG8pIHtcbiAgICBtb2QuY2hhbm5lbFtjaF0ucGVyaW9kLT1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0b3NwZWVkO1xuICAgIGlmIChtb2QuY2hhbm5lbFtjaF0ucGVyaW9kPG1vZC5jaGFubmVsW2NoXS5zbGlkZXRvKVxuICAgICAgbW9kLmNoYW5uZWxbY2hdLnBlcmlvZD1tb2QuY2hhbm5lbFtjaF0uc2xpZGV0bztcbiAgfVxuICBtb2QuY2hhbm5lbFtjaF0uZmxhZ3N8PTM7IC8vIHJlY2FsYyBzcGVlZFxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV80PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gNCB2aWJyYXRvXG4gIG1vZC5jaGFubmVsW2NoXS52b2ljZXBlcmlvZCs9XG4gICAgKG1vZC5jaGFubmVsW2NoXS52aWJyYXRvZGVwdGgvMzIpKm1vZC5jaGFubmVsW2NoXS5zZW1pdG9uZSoobW9kLnZpYnJhdG90YWJsZVttb2QuY2hhbm5lbFtjaF0udmlicmF0b3dhdmUmM11bbW9kLmNoYW5uZWxbY2hdLnZpYnJhdG9wb3NdLzEyNyk7XG4gIG1vZC5jaGFubmVsW2NoXS5mbGFnc3w9MTtcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfNT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIDUgdm9sc2xpZGUgKyBzbGlkZSB0byBub3RlXG4gIG1vZC5lZmZlY3RfdDFfMyhtb2QsIGNoKTsgLy8gc2xpZGUgdG8gbm90ZVxuICBtb2QuZWZmZWN0X3QxX2EobW9kLCBjaCk7IC8vIHZvbHNsaWRlXG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxXzY9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyA2IHZvbHNsaWRlICsgdmlicmF0b1xuICBtb2QuZWZmZWN0X3QxXzQobW9kLCBjaCk7IC8vIHZpYnJhdG9cbiAgbW9kLmVmZmVjdF90MV9hKG1vZCwgY2gpOyAvLyB2b2xzbGlkZVxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV83PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gN1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV84PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOCB1bnVzZWRcblxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV85PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gOSBzZXQgc2FtcGxlIG9mZnNldFxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9hPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gYSB2b2x1bWUgc2xpZGVcbiAgaWYgKCEobW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZikpIHtcbiAgICAvLyB5IGlzIHplcm8sIHNsaWRlIHVwXG4gICAgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZSs9KG1vZC5jaGFubmVsW2NoXS5kYXRhPj40KTtcbiAgICBpZiAobW9kLmNoYW5uZWxbY2hdLnZvbHVtZT42NCkgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZT02NDtcbiAgfVxuICBpZiAoIShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweGYwKSkge1xuICAgIC8vIHggaXMgemVybywgc2xpZGUgZG93blxuICAgIG1vZC5jaGFubmVsW2NoXS52b2x1bWUtPShtb2QuY2hhbm5lbFtjaF0uZGF0YSYweDBmKTtcbiAgICBpZiAobW9kLmNoYW5uZWxbY2hdLnZvbHVtZTwwKSBtb2QuY2hhbm5lbFtjaF0udm9sdW1lPTA7ICAgICAgICAgICAgICAgICAgXG4gIH1cbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfYj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGIgcGF0dGVybiBqdW1wXG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2M9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBjIHNldCB2b2x1bWVcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGQgcGF0dGVybiBicmVha1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZVxuICB2YXIgaT0obW9kLmNoYW5uZWxbY2hdLmRhdGEmMHhmMCk+PjQ7XG4gIG1vZC5lZmZlY3RzX3QxX2VbaV0obW9kLCBjaCk7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2Y9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBmXG59O1xuXG5cblxuLy9cbi8vIHRpY2sgMSsgZWZmZWN0IGUgZnVuY3Rpb25zXG4vL1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2UwPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTBcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTE9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlMVxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lMj1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGUyXG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2UzPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTNcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTQ9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlNFxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lNT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU1XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2U2PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTZcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZTc9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlN1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lOD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGU4XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2U5PWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZTkgcmV0cmlnIHNhbXBsZVxuICBpZiAobW9kLnRpY2slKG1vZC5jaGFubmVsW2NoXS5kYXRhJjB4MGYpPT09MClcbiAgICBtb2QuY2hhbm5lbFtjaF0uc2FtcGxlcG9zPTA7XG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2VhPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWFcbn07XG5Qcm90cmFja2VyLnByb3RvdHlwZS5lZmZlY3RfdDFfZWI9ZnVuY3Rpb24obW9kLCBjaCkgeyAvLyBlYlxufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lYz1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVjIGN1dCBzYW1wbGVcbiAgaWYgKG1vZC50aWNrPT0obW9kLmNoYW5uZWxbY2hdLmRhdGEmMHgwZikpXG4gICAgbW9kLmNoYW5uZWxbY2hdLnZvbHVtZT0wO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lZD1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVkIGRlbGF5IHNhbXBsZVxuICBtb2QuZWZmZWN0X3QwX2VkKG1vZCwgY2gpO1xufTtcblByb3RyYWNrZXIucHJvdG90eXBlLmVmZmVjdF90MV9lZT1mdW5jdGlvbihtb2QsIGNoKSB7IC8vIGVlXG59O1xuUHJvdHJhY2tlci5wcm90b3R5cGUuZWZmZWN0X3QxX2VmPWZ1bmN0aW9uKG1vZCwgY2gpIHsgLy8gZWZcbn07XG5cbi8vIGZlZWwgZnJlZSB0byBkaXNhYmxlIHRoZSBmb3JtYXRzXG5yZXF1aXJlKCcuL2Zvcm1hdHMvaXQnKShQcm90cmFja2VyKTtcbnJlcXVpcmUoJy4vZm9ybWF0cy9tb2QnKShQcm90cmFja2VyKTtcbnJlcXVpcmUoJy4vZm9ybWF0cy94bScpKFByb3RyYWNrZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFByb3RyYWNrZXI7Il19
