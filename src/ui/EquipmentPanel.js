import { element,formatModifiers } from './objectLabels.js';

export class EquipmentPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#equipment-dialog');this.root=document.querySelector('#equipment-summary');
    this.controller=new AbortController();const options={signal:this.controller.signal};this.restored=true;
    this.root.addEventListener('click',()=>this.open(),options);
    document.querySelector('#equipment-slots').addEventListener('click',event=>{
      const button=event.target.closest('[data-equip]');if(button)scene.equipment.equip(button.dataset.equip);
      const remove=event.target.closest('[data-unequip]');if(remove)scene.equipment.unequip(remove.dataset.unequip);
    },options);
    document.querySelector('#close-equipment').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);this.render();
  }
  open(){if(this.dialog.open)return;this.restored=false;this.scene.setGalleryInput(false);this.render();this.dialog.showModal();}
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){this.dialog.close();this.restore();}
  signature(){return JSON.stringify([this.scene.equipment.slots,this.scene.objectRegistry.byCategory('equipment').map(d=>[d.id,this.scene.inventory.count(d.id)])]);}
  refresh(){if(this.lastSignature!==this.signature())this.render();else if(this.dialog.open)this.updateStats();}
  render(){
    const s=this.scene,summary=[],cards=[];
    for(const [slot,label]of [['weapon','Weapon'],['armor','Armor']]){
      const id=s.equipment.slots[slot],d=id?s.objectRegistry.require(id):null;
      const button=element('button','equipment-summary-button');button.type='button';
      if(d){const icon=element('img','');icon.src=s.assets.previewURL(d);icon.alt='';button.append(icon);}
      button.append(element('span','',`${label}: ${d?.name??'—'}${d?` ${formatModifiers(d.equipment.modifiers)}`:''}`));summary.push(button);
      const card=element('section','equipment-slot');card.append(element('h3','',label));
      if(d){
        const image=element('img','equipment-icon');image.src=s.assets.previewURL(d);image.alt=d.name;
        const remove=element('button','','Odložit');remove.type='button';remove.dataset.unequip=slot;
        card.append(image,element('strong','',d.name),element('p','',formatModifiers(d.equipment.modifiers)),element('p','',d.description),remove);
      }else card.append(element('p','','Prázdný slot'));
      for(const item of s.equipment.owned(slot))if(item.id!==id){
        const equip=element('button','',`Vybavit ${item.name}`);equip.type='button';equip.dataset.equip=item.id;card.append(equip);
      }
      cards.push(card);
    }
    this.root.replaceChildren(...summary);document.querySelector('#equipment-slots').replaceChildren(...cards);this.lastSignature=this.signature();this.updateStats();
  }
  updateStats(){
    const unit=this.scene.character,format=value=>String(Math.round(value*100)/100);
    const values={baseDPS:unit.baseStats.attackDPS,finalDPS:unit.attackDPS,baseArmor:unit.baseStats.armor,finalArmor:unit.armor,
      hp:`${format(unit.currentHP)} / ${unit.maxHP}`,regeneration:`${format(unit.hpRegenPerSecond)} HP/s`};
    for(const [key,value]of Object.entries(values)){const output=document.querySelector(`[data-stat="${key}"]`);if(output.textContent!==String(value))output.textContent=String(value);}
  }
  destroy(){this.close();this.controller.abort();}
}
