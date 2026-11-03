import Phaser from 'phaser';
import { GameApplication } from '../ui/GameApplication.js';

export class MainMenu extends Phaser.Scene {
  constructor(){super('MainMenu');}
  create(){
    let app=this.game.registry.get('application');
    if(!app){app=new GameApplication(this.game);this.game.registry.set('application',app);}
    app.showMainMenu();
  }
}
