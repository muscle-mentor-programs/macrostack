import { createServer } from 'vite'
const server = await createServer({server:{host:'127.0.0.1',port:5199,strictPort:true},plugins:[{
  name:'food-form-qa',configureServer(server){server.middlewares.use('/__food-form-qa',async(_req,res)=>{
    res.setHeader('Content-Type','text/html')
    res.end(await server.transformIndexHtml('/__food-form-qa',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="test"></div><script type="module">
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import ScannedFoodModal from '/src/components/ScannedFoodModal.jsx';
    import {FoodModal} from '/src/pages/MyFoods.jsx';
    import {FoodForm} from '/src/pages/coach/mobile/MobileMyFoods.jsx';
    import ClientLog from '/src/pages/client/ClientLog.jsx';
    import useStore from '/src/store/index.js';
    import '/src/index.css';
    document.documentElement.classList.add('ocean-dark');
    const save=food=>{window.savedFood=food;return {ok:true,food}};
    useStore.setState({scannedFoods:[],addScannedFood:save});
    const kind=new URLSearchParams(location.search).get('kind');
    const initial={name:'Whey Protein Rich Chocolate',brand:'Equate',servingSize:new URLSearchParams(location.search).has('corrupt')?3.335545365857573e50:33,servingUnit:'g',calories:110,protein:24,carbs:2,fat:1};
    if(kind==='log') useStore.setState({activeClientId:'test',logDate:'2026-09-15',clients:[{id:'test',name:'Test',goals:{calories:2000,protein:150,carbs:200,fat:60},log:{'2026-09-15':[{id:'bad',name:'Whey Protein Rich Chocolate',meal:'Breakfast',quantity:1,servingSize:3.335545365857573e50,servingUnit:'g',calories:110,protein:24,carbs:2,fat:1}]}}],updateClientEntry:()=>{window.logWrite=true}});
    ReactDOM.createRoot(document.getElementById('test')).render(React.createElement(kind==='log'?ClientLog:kind==='custom'?FoodModal:kind==='mobile'?FoodForm:ScannedFoodModal,{upc:'synthetic',initial,onSave:save,onAfterSave:save,onClose:()=>{}}));
    </script></body></html>`))
  })}
}]})
await server.listen()
console.log('Food form QA: http://127.0.0.1:5199/__food-form-qa')
