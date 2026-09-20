import assert from 'node:assert/strict'
import {parseAssessmentCSV,planIssues,classifyTask} from '../src/retail/model.js'
const header='date,weight,unit,body_fat,muscle_mass\n'
assert.deepEqual(parseAssessmentCSV(header+'2026-09-01,180,lbs,20,80')[0].errors,[])
for(const row of ['2026-02-31,180,lbs,20,80','2026-09-01,Infinity,lbs,20,80','2026-09-01,180,stones,20,80','2026-09-01,180,lbs,120,80'])assert.ok(parseAssessmentCSV(header+row)[0].errors.length)
assert.ok(parseAssessmentCSV(header+'2026-09-01,180,lbs,20,80\n2026-09-01,180,lbs,20,80')[1].errors.includes('Duplicate row'))
assert.throws(()=>parseAssessmentCSV(header+Array(101).fill('2026-09-01,180,lbs,20,80').join('\n')),/100 assessments/)
assert.ok(planIssues({goal:'',guidance:'',calories:'1e10000'}).length>=3)
assert.equal(classifyTask({status:'open',due_at:'2020-01-01'},Date.parse('2021-01-01')),'due')
assert.equal(classifyTask({status:'done',due_at:'2020-01-01'}),'completed')
console.log('PASS retail validation: invalid dates, nonfinite values, units, duplicate and oversized imports')
