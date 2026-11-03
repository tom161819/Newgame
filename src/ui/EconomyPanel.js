export class EconomyPanel {
  constructor(scene){this.scene=scene;this.signature=null;this.update();}
  update(){
    const values=this.scene.wageSystem.overview(),signature=JSON.stringify(values);if(signature===this.signature)return;this.signature=signature;
    for(const [key,value]of Object.entries(values)){
      const signed=['income','balance'].includes(key)&&value>=0?'+':key==='wages'?'-':'';
      document.querySelector(`[data-economy="${key}"]`).textContent=`${signed}${value.toFixed(2)}`;
    }
    document.querySelector('#wage-warning').hidden=values.unpaid===0;
  }
}
