// Plan m-zvirata-nahodny-vzhled: every animal gets one of the approved looks, seeded by its id.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { animalLook, adultLooks } from '../src/game/animalArt.js';
import { APPROVED_ANIMAL_ART } from '../src/data/objects/approvedAnimalArt.js';

const approvals=JSON.parse(readFileSync(new URL('../art/approvals.json',import.meta.url),'utf8')).assets;
const pub=file=>new URL(`../public${file}`,import.meta.url);

test('only approved looks and poses, and their files are in the game',()=>{
  for(const [species,s] of Object.entries(APPROVED_ANIMAL_ART)){
    for(const [id,look] of Object.entries(s.looks)){
      assert.equal(approvals[species].variants[id]?.status,'approved',`${id} approved`);
      assert.ok(existsSync(pub(`${look.base}.walk.png`)),`${id} walk sheet`);
      for(const [pose,p] of Object.entries(look.poses)){assert.equal(approvals[species].variants[`${id}-${pose}`]?.status,'approved');assert.ok(existsSync(pub(p.src)),`${id}-${pose} image`);}
    }
  }
  assert.deepEqual(adultLooks('cat').sort(),['cat-black','cat-ginger','cat-tabby','cat-white']);
  assert.deepEqual(adultLooks('dog').sort(),['dog-hound','dog-mastiff','dog-sheepdog']);
  assert.deepEqual(adultLooks('wolf').sort(),['wolf-dark','wolf-grey']);
  assert.deepEqual(adultLooks('rat').sort(),['rat-brown','rat-grey']);
});
test('the look follows the id: the same after Load, spread over every approved look',()=>{
  for(const species of ['cat','dog','wolf','rat']){
    const seen=new Map();
    for(let i=0;i<400;i++){const id=`${species}-${i}`,look=animalLook(species,id);assert.equal(animalLook(species,id),look,'deterministic');seen.set(look,(seen.get(look)??0)+1);}
    const looks=adultLooks(species);assert.equal(seen.size,looks.length,`${species}: every look appears`);
    for(const n of seen.values())assert.ok(n>400/looks.length*.6,`${species}: roughly even (${[...seen.values()]})`);
  }
});
test('kittens use the kitten look; unknown species have none',()=>{
  assert.equal(animalLook('cat','cat-3',{young:true}),'cat-kitten');
  assert.notEqual(animalLook('cat','cat-3'),'cat-kitten');
  assert.equal(animalLook('dog','dog-1',{young:true})===null,false,'no young dog look: an adult look');
  assert.equal(animalLook('bear','b-1'),null);
});
