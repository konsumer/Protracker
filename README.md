# simplemodplay

Simple JS modplayer, using amiga protracker module player by firehawk/tda.

I made some developer tools, wrote these docs, & re-packed for all (CommonJS, AMD, browser-global) to use.

You can see a demo [here](http://konsumer.github.io/Protracker/).

_NOT COMPLETE_: I am working on it, right now!

## usage

This is browser-only, but works with RequireJS, browserify, & as a plain javascript browser global.

### browser global

```html
<script src="http://konsumer.github.io/Protracker/Protracker.min.js"></script>
<script>
var mod = new Protracker();
</script>
```

### browserify

```javascript
var Protracker = require('Protracker');
var mod = new Protracker();
```

### requirejs

```javascript
define(['Protracker'],  function(Protracker){
  var mod = new Protracker();
});
```

### api

After that, you can run `mod.load('cool.mod')` and then `mod.atostart(true)` to make it load.

#### todo

write much more stuff here



## development

Install developer dependencies with `npm install`.

The source file is index.js. Edit that and then re-generate Protracker.js & Protracker.min.js with `npm run prod`. You should do that if you make any changes to any files.