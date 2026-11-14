import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// Owner 14 Nov 2026: saving often failed with "check: animals". An animal fighting back at another animal (a hunter's
// dog, a wolf) or at somebody already gone was written with an id the check did not know.
test('m-ulozeni-animals: an animal that fights back at another animal or at a unit that is gone can be saved', () => {
  const s=workerScene(),deer=s.animalSystem.create(s.objectRegistry.require('deer'),{x:51,y:50}),other=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:52,y:50});
  deer.retaliationTarget=other;let state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,other.id);
  deer.retaliationTarget={id:'worker-999',isAlive:true};state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,null,'a target that is not in the game is not saved');
  const w=s.workerSystem.create({x:40,y:40});deer.retaliationTarget=w;state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,w.id);
});
