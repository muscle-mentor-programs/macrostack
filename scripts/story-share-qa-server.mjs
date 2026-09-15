// Synthetic, local-only harness. No app store, auth or production data is loaded.
import { createServer } from 'vite'
const server = await createServer({ server: { host: '127.0.0.1', port: 5198, strictPort: true }, plugins: [{
  name: 'story-share-qa', configureServer(server) {
    server.middlewares.use('/__story-qa', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html')
      res.end(await server.transformIndexHtml('/__story-qa', `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="test"></div><script type="module">
        import React from '/node_modules/.vite/deps/react.js';
        import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
        const {createRoot}=ReactDOM;
        import StoryShareButton from '/src/components/StoryShareButton.jsx';
        import '/src/index.css';
        document.documentElement.classList.add('ocean-dark');
        const totals={calories:1847,protein:156,carbs:203,fat:46};
        const goals={calories:2200,protein:180,carbs:250,fat:65};
        const items=[{name:'Grilled chicken breast',amount:180},{name:'Jasmine rice',amount:150},{name:'Roasted broccoli',amount:100},{name:'Extra virgin olive oil',quantity:1,servingUnit:'tsp'},{name:'Fresh lemon juice',quantity:1,servingUnit:'tbsp'},{name:'Smoked paprika',quantity:0.5,servingUnit:'tsp'}];
        window.storyFixtures={totals,goals,items};
        const e=React.createElement;
        if(location.pathname.endsWith('/log')) {
          const {default:useStore}=await import('/src/store/index.js');
          const {default:ClientLog}=await import('/src/pages/client/ClientLog.jsx');
          useStore.setState({activeClientId:'synthetic',logDate:'2026-09-13',clients:[{id:'synthetic',name:'QA',goals,log:{'2026-09-13':[{id:'test-food',name:'Grilled chicken',meal:'Lunch',calories:685,protein:54,carbs:72,fat:19,amount:200}]}}]});
          createRoot(document.getElementById('test')).render(e(ClientLog));
        } else createRoot(document.getElementById('test')).render(e('main',{style:{padding:24}},
          e(StoryShareButton,{label:'Share lunch',getStory:()=>({kind:'meal',date:'2026-09-13',meal:'Lunch',totals:{calories:685,protein:54,carbs:72,fat:19},items})}),
          e(StoryShareButton,{label:'Share large meal',getStory:()=>({kind:'meal',date:'2026-09-13',meal:'Dinner',totals,items:[...items,{name:'Avocado',amount:50},{name:'Greek yogurt',amount:40}]})}),
          e(StoryShareButton,{label:'Share daily totals',getStory:()=>({kind:'daily',date:'2026-09-12',totals,goals})})))
      </script></body></html>`))
    })
  },
}] })
await server.listen()
console.log('Synthetic Story QA: http://127.0.0.1:5198/__story-qa')
