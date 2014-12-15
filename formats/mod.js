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