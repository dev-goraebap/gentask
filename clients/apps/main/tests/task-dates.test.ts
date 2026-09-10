import test from 'node:test';
import assert from 'node:assert/strict';
import {localDate, taskDates} from '../src/pages/tasks/model/taskDates';
import type {TaskFilters} from '../src/pages/tasks/model/filters';
const filters:TaskFilters={states:[],dateMode:'today',date:'',sort:{key:'created',direction:'desc'}};
test('오늘은 로컬 날짜를 사용하고 미완료 기한 초과도 요청한다',()=>{
 assert.equal(localDate(new Date(2026,8,10,0,1)), '2026-09-10');
 assert.deepEqual(taskDates(filters,'2026-09-10'),{date:'2026-09-10',includeOverdue:true});
 assert.deepEqual(taskDates({...filters,dateMode:'date',date:'2026-09-12'},'2026-09-10'),{date:'2026-09-12'});
 assert.deepEqual(taskDates({...filters,dateMode:'undated'},'2026-09-10'),{undated:true});
 assert.deepEqual(taskDates({...filters,dateMode:'all'},'2026-09-10'),{});
});
