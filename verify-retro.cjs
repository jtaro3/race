const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const context = new Proxy({}, { get(target, key) {
  if (key === 'createImageData') return (w, h) => ({data: new Uint8ClampedArray(w*h*4)});
  if (key === 'createLinearGradient') return () => ({addColorStop(){}});
  return target[key] || (() => {});
}});
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, {
    getContext: () => context, addEventListener(){}, style:{setProperty(){}},
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    getBoundingClientRect(){return {width:390,height:600,left:0,top:0};},
    clientWidth:390,clientHeight:600
  });
  return elements.get(selector);
}
const sandbox = {
  console, Uint8ClampedArray, Math, performance:{now:()=>0}, ResizeObserver:class{observe(){}},
  document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>element('offscreen'),
    addEventListener(){},documentElement:element('html'),body:element('body')},
  window:{PointerEvent:true},devicePixelRatio:1,addEventListener(){},
  requestAnimationFrame(){},setTimeout(){},localStorage:{getItem:()=>null}
};
vm.createContext(sandbox);
for(const path of ['design-data.js','game.js','retro-render.js']) {
  vm.runInContext(fs.readFileSync(path,'utf8'),sandbox,{filename:path});
}
vm.runInContext(`
  render();
  const first = retroPixels.data.slice();
  player.x += 90; camera.x = player.x;
  render();
  if (!retroPixels.data.some((value, i) => value !== first[i])) throw Error('Ground did not scroll');
  const second = retroPixels.data.slice();
  camera.angle += Math.PI;
  render();
  if (!retroPixels.data.some((value, i) => value !== second[i])) throw Error('Ground did not rotate');
  if (!cameraPoint(player.x,player.y,390,384)) throw Error('Player contact missing');
`,sandbox);
console.log('PASS: render, floor scroll, 180-degree rotation and kart contact projection');
