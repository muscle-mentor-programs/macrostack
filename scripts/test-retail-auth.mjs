import assert from 'node:assert/strict';
import { isRetailLoginRoute, isRetailAccount } from '../src/retail/authRouting.mjs';
for (const [path,query,expected] of [
 ['/retailers','',true],['/retailers/','?signin=1',true],['/retail/start','',true],
 ['/retail','',true],['/retail','?setup=1',true],['/retail','?staff=1&invite=token',true],
 ['/retail/member','',false],['/retail/member','?invite=token',false],
 ['/retail','?store=token',false],['/retail','?invite=token',false],['/login','',false],['/dashboard','',false],
]) assert.equal(isRetailLoginRoute(path,query),expected,path+query);
assert.equal(isRetailAccount({user_metadata:{account_type:'retailer'}}),false);
assert.equal(isRetailAccount({app_metadata:{role:'coach'}}),false);
assert.equal(isRetailAccount({app_metadata:{account_type:'retailer'}}),true);
assert.equal(isRetailAccount(null),false);
console.log('PASS retailer routes use separate sessions; personal customer links remain personal; editable metadata cannot grant retailer login');
