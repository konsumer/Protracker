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