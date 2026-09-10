import test from 'node:test';import assert from 'node:assert/strict';
const nodes=new Map(),handlers={},registered=new Map(),data=new Map();
function node(){return {innerHTML:'',textContent:'',open:false,classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []},setAttribute(){},focus(){},showModal(){this.open=true},close(){this.open=false},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,right:500,bottom:500}}}}
globalThis.document={activeElement:null,querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(n,fn){handlers[n]=fn},modelContext:{registerTool(t){registered.set(t.name,t)}}};
globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
globalThis.window={scrollTo(){},addEventListener(){}};
const click=dataset=>handlers.click({target:{closest:()=>({dataset,matches:()=>false,hasAttribute:()=>false})}});
await import('../app.js');
test('initial UI exposes upload and wardrobe, no backend invocation',()=>{assert.match(nodes.get('#app').innerHTML,/拍照 \/ 上传/);assert.match(nodes.get('#app').innerHTML,/模拟/)});
test('navigation uses the same app state',()=>{click({view:'wardrobe'});assert.match(nodes.get('#app').innerHTML,/我的衣柜/);assert.match(nodes.get('#app').innerHTML,/蓝色宽直筒牛仔裤/)});
test('category filter has empty state',()=>{click({filter:'鞋子'});assert.match(nodes.get('#app').innerHTML,/还在等第一件/);click({filter:'全部'})});
test('WebMCP mock registry exposes schema and read-only annotation',()=>{assert.equal(registered.size,2);assert.equal(registered.get('read_yida_demo').annotations.readOnlyHint,true);assert.deepEqual(registered.get('start_yida_demo_outfit').inputSchema.required,['itemId'])});
test('WebMCP invalid top is rejected without mutation',async()=>{const before=registered.get('read_yida_demo').execute();await assert.rejects(()=>registered.get('start_yida_demo_outfit').execute({itemId:'missing'}));assert.deepEqual(registered.get('read_yida_demo').execute(),before)});
test('start from wardrobe updates actual app state and markup',async()=>{const r=await registered.get('start_yida_demo_outfit').execute({itemId:'sample-top'});assert.equal(r.view,'result');assert.equal(r.mock,true);assert.match(nodes.get('#app').innerHTML,/衣柜已有/);assert.match(nodes.get('#app').innerHTML,/AI 参考款 · 模拟/)});
test('favorite action persists and list displays saved result',()=>{click({action:'favorite'});assert.equal(JSON.parse(data.get('yida-demo-v1')).favorites.length,1);click({view:'favorites'});assert.match(nodes.get('#app').innerHTML,/白色圆领 T 恤/);assert.match(nodes.get('#app').innerHTML,/look-board/)});
test('remove favorite and empty list',()=>{const id=JSON.parse(data.get('yida-demo-v1')).favorites[0].id;click({removeFav:id});assert.equal(JSON.parse(data.get('yida-demo-v1')).favorites.length,0);assert.match(nodes.get('#app').innerHTML,/下一套喜欢的搭配/)});
test('reset requires explicit confirmation',()=>{click({action:'reset'});assert.equal(nodes.get('#modal').open,true);assert.match(nodes.get('#modal').innerHTML,/无法撤销/);assert.equal(JSON.parse(data.get('yida-demo-v1')).wardrobe.length,2)});

