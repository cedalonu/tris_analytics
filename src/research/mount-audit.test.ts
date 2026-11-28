import test from "node:test";
import assert from "node:assert/strict";
import { findComponentReferences } from "./mount-audit";

test("finds component import and JSX mount in a dashboard",()=>{
 const refs=findComponentReferences("InaMemoryPanel",[
  {path:"src/TrisOpsDashboard.tsx",content:'import InaMemoryPanel from "./InaMemoryPanel";\nexport const View=()=> <InaMemoryPanel />;'},
 ]);
 assert.deepEqual(refs,[{file:"src/TrisOpsDashboard.tsx",imported:true,jsx:true}]);
});
test("detects root App through the entrypoint JSX",()=>{
 const refs=findComponentReferences("App",[
  {path:"src/main.tsx",content:"import App from './App'; root.render(<App />);"},
 ]);
 assert.equal(refs.length,1);
 assert.equal(refs[0].jsx,true);
});
test("does not confuse similarly named components or strings with JSX",()=>{
 const refs=findComponentReferences("App",[
  {path:"src/Other.tsx",content:'const text="<App/>";\nconst node=<Application />;'},
 ]);
 assert.equal(refs.length,0);
});
test("rejects invalid component identifiers",()=>{
 assert.throws(()=>findComponentReferences("../App",[]),/invalid component name/);
});
