# simplemodplay

Simple JS modplayer, using [standingwavejs](https://www.npmjs.com/package/standingwavejs)

_NOT COMPLETE_: I am working on it, right now!

## usage

This is browser-only, but works with RequireJS, browserify, & as a plain javascript browser global.

### browser global

```html
<script src="http://konsumer.github.io/simplemodplay/simplemodplay.min.js"></script>
<script>
var mod = new SimpleModPlayer();
</script>
```

### browserify

```javascript
var SimpleModPlayer = require('simplemodplay');
var mod = new SimpleModPlayer();
```

### requirejs

```javascript
define(['simplemodplay'],  function(SimpleModPlayer){
  var mod = new SimpleModPlayer();
});
```

### api

After that, you can run `mod.load('cool.mod')` and then `mod.play()`, `mod.pause()` & `mod.stop()`.

You can also load your mod file in the constructor, and optionally set the path for [standingwavejs](https://www.npmjs.com/package/standingwavejs) SWF file:

```javascript
var mod = new SimpleModPlayer('cool.mod', '/flash/standingwavejs.swf');
```

You can also check `mod.playing`to see is it's playing.

#### events

These events get triggered:

- `load`  - fired when `load()` is called with `path` param.
- `play`  - fired when `play()` is called
- `pause` - fired when `pause()` is called
- `stop`  - fired when `stop()` is called or the file finishes

You can listen for them like this: `mod.on('play', function(){ doStuff(); });`


## development

You can re-generate simplemodplay.js & simplemodplay.min.js with `npm run prod`. You should do that if you make any changes to index.js.