// m-zamestnani-2: staffing icon tones (nobody = empty/yellow, some = partial/grey, switched off = disabled sign).
import test from 'node:test';
import assert from 'node:assert/strict';
import { staffingStatus } from '../src/systems/StaffingStatus.js';

const quarry={id:7,type:'quarry',x:10,y:10};
function scene(ids,blocked=false){
  const workers=new Map(ids.map(id=>[id,{id,isAlive:true,assignedWorkplaceId:7}]));
  return {workplaceSystem:{records:new Map([[7,{workerIds:ids}]])},workerSystem:{workers},employment:{blockReason:()=>blocked?'local':null}};
}
test('nobody is a yellow warning, some missing is grey, employment off is its own sign',()=>{
  assert.equal(staffingStatus(scene([]),quarry).tone,'empty');
  assert.equal(staffingStatus(scene([1]),quarry).tone,'partial');
  const full=staffingStatus(scene([1,2,3]),quarry);assert.equal(full.missing,0,'a full building shows nothing');
  assert.equal(staffingStatus(scene([],true),quarry).tone,'disabled');
});
