export const samples=[
{id:'sample-top',name:'白色圆领 T 恤',category:'上衣',type:'T 恤',color:'白色',fit:'宽松',pattern:'纯色',image:'assets/tee.jpg',sample:true},
{id:'sample-jeans',name:'蓝色宽直筒牛仔裤',category:'裤子',type:'牛仔裤',color:'蓝色',fit:'宽直筒',pattern:'纯色',image:'assets/jeans.jpg',sample:true},
{id:'sample-shoes',name:'米白红边运动鞋',category:'鞋子',type:'运动鞋',color:'米白色',fit:'低帮',pattern:'拼色',image:'assets/sneakers.webp',sample:true},
{id:'sample-blue',name:'深蓝锥形牛仔裤',category:'裤子',type:'牛仔裤',color:'深蓝色',fit:'锥形',pattern:'纯色',image:'assets/blue-jeans.jpg',sample:true}
];
export const scenes=['日常休闲','轻松通勤','周末约会'];
export const categories=['上衣','裤子','鞋子'];
export function initialState(){return {version:1,wardrobe:structuredClone(samples.slice(0,2)),favorites:[]}}
export function validItem(x){return !!x&&typeof x.id==='string'&&typeof x.name==='string'&&categories.includes(x.category)&&['type','color','fit','pattern','image'].every(k=>typeof x[k]==='string')&&(/^(assets\/[\w.-]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/.test(x.image))}
export function loadState(raw){try{const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.wardrobe)||!Array.isArray(s.favorites)||!s.wardrobe.every(validItem))return initialState();return {...s,favorites:s.favorites.filter(f=>f&&typeof f.id==='string'&&validItem(f.top)&&validItem(f.pants)&&validItem(f.shoes)&&typeof f.reason==='string'&&scenes.includes(f.scene))}}catch{return initialState()}}
export function exactDuplicate(items,draft){return items.find(x=>x.image===draft.image)}
export function similarDuplicate(items,draft){return items.find(x=>x.category===draft.category&&x.type===draft.type&&x.color===draft.color&&x.fit===draft.fit)}
export function matchItem(items,target){return items.find(x=>x.category===target.category&&x.type===target.type&&x.color===target.color&&x.fit===target.fit)}
export function addItem(s,item){if(!validItem(item))throw Error('衣物数据不完整');const existing=exactDuplicate(s.wardrobe,item);return existing?{state:s,item:existing,added:false}:{state:{...s,wardrobe:[item,...s.wardrobe]},item,added:true}}
export function recommendation(top,scene,index=0){if(!validItem(top)||top.category!=='上衣'||!scenes.includes(scene))throw Error('请选择一件上衣和有效场景');const pants=structuredClone(samples[index%2===0?1:3]);const shoes=structuredClone(samples[2]);return {id:top.id+'-'+scene+'-'+index%2,top:structuredClone(top),pants,shoes,scene,title:index%2===0?'松弛有型，刚刚好。':'收一点轮廓，换一种感觉。',reason:top.color+' '+top.type+'搭配'+pants.color+ pants.fit+'牛仔裤，让上下装的轮廓形成呼应。米白鞋面提亮整体，红色细节带来一点轻快。',tip:scene==='轻松通勤'?'适合着装要求宽松的工作日；正式办公场合需换更正式的鞋裤。':scene==='周末约会'?'上衣前摆轻轻收进裤腰，保留自然的松弛感。':'裤脚整理到鞋面附近，让整体看起来更利落。',mock:true}}
export function saveFavorite(s,r){return s.favorites.some(x=>x.id===r.id)?s:{...s,favorites:[structuredClone(r),...s.favorites]}}
export function deleteItem(s,id){return {...s,wardrobe:s.wardrobe.filter(x=>x.id!==id)}}
export function validateUpload(file){if(!file)throw Error('请选择照片');if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请使用 JPG、PNG 或 WebP 图片');if(file.size>10*1024*1024)throw Error('图片不能超过 10 MB');if(!file.size)throw Error('图片为空');return true}

