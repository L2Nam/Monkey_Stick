const { ccclass, property } = cc._decorator;

export enum GameStatus {
    Game_Ready = 0,
    Game_Playing,
    Game_Over
}
@ccclass
export default class MainControl extends cc.Component {
    cloud0: cc.Sprite
    cloud1: cc.Sprite
    max_alti_cloud = 230
    min_alti_cloud = 50

    @property(cc.Prefab)
    PlatformPrefab: cc.Prefab = null;
    Platform: cc.Node[] = [null, null]
    Platform_parent: cc.Node
    min_plat = -115
    max_plat = 80
    min_scale_plat = 0.4
    max_scale_plat = 1.1

    monkey: cc.Sprite
    stick: cc.Sprite
    is_longer = false
    is_ok = false
    monkey_die = false
    plat_number = 0
    stick_length = 0

    game_over: cc.Sprite
    gameStatus: GameStatus = GameStatus.Game_Ready
    score: cc.Label
    score_num = 0
    Best_score: cc.Label
    Best_score_num = 0
    Best_score_img: cc.Sprite
    replay: cc.Button

    // anim_monkey_walk: cc.Animation

    onLoad() {
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        cc.Canvas.instance.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.Platform_parent = this.node.getChildByName("Platform")
        this.cloud0 = this.node.getChildByName("Cloud0").getComponent(cc.Sprite)
        this.cloud1 = this.node.getChildByName("Cloud1").getComponent(cc.Sprite)
        this.stick = this.node.getChildByName("Stick").getComponent(cc.Sprite)
        this.monkey = this.node.getChildByName("Monkey").getComponent(cc.Sprite)
        this.game_over = this.node.getChildByName("GameOver").getComponent(cc.Sprite)
        this.score = this.node.getChildByName("Score_label").getComponent(cc.Label)
        this.Best_score = this.node.getChildByName("Best_Score_label").getComponent(cc.Label)
        this.Best_score_img = this.node.getChildByName("Best_Score").getComponent(cc.Sprite)
        this.replay = this.node.getChildByName("Replay").getComponent(cc.Button)
        this.replay.node.on(cc.Node.EventType.TOUCH_END, this.replay_btn, this)
    }

    start() {
        // make platform
        for (let i = 0; i < this.Platform.length; i++) {
            this.Platform[i] = cc.instantiate(this.PlatformPrefab);
            this.node.getChildByName("Platform").addChild(this.Platform[i]);
        }
        this.Platform[0].x = -115;
        this.Platform[1].scaleX = Math.random() * (this.max_scale_plat - this.min_scale_plat) + this.min_scale_plat
        this.Platform[1].x = Math.random() * (this.max_plat - this.min_plat) + this.min_plat + this.Platform[0].width / 2 + this.Platform[1].scaleX * this.Platform[1].width / 2
        this.gameStatus = GameStatus.Game_Playing
    }

    update(dt) {
        if (this.gameStatus !== GameStatus.Game_Playing) {
            return;
        }

        if (this.score_num > this.Best_score_num) {
            this.Best_score_num = this.score_num
            this.Best_score.string = this.Best_score_num.toString()
        }

        // Cloud
        this.cloud0.node.x -= 1.5;
        this.cloud1.node.x--;
        if (this.cloud0.node.x <= -200) {
            this.cloud0.node.y = this.min_alti_cloud + Math.random() * (this.max_alti_cloud - this.min_alti_cloud)
            this.cloud0.node.x = 200
        }
        if (this.cloud1.node.x <= -250) {
            this.cloud1.node.y = this.min_alti_cloud + Math.random() * (this.max_alti_cloud - this.min_alti_cloud)
            this.cloud1.node.x = 250
        }

        // click chuột làm dài gậy, nhả chuột gậy rơi xuống ngang
        if (this.is_longer) {
            this.stick.node.scaleY += 0.4
        }
        else
            this.stick_length = this.stick.node.height * this.stick.node.scaleY
        if (this.stick.node.scaleY != 1 && !this.is_longer && this.stick.node.angle >= -88) {
            this.stick.node.angle -= 3
        }


        // dưng rơi, check die
        if (this.stick.node.angle <= -86) {
            if (this.monkey.node.x <= -100 + this.stick_length)
                this.monkey.node.x += 3
            if (this.monkey.node.x >= -100 + this.stick_length) {
                if (this.check_die()) {
                    this.monkey_die = true
                    // cc.Tween.stopAllByTarget(this.monkey.node);
                    // cc.tween(this.monkey.node).by(2, { y: -400 }).call(() => {
                    //     this.die()
                    // }).start()
                    // cc.tween(this.stick.node).by(2, { angle: -110 }).start()
                    cc.tween(this.monkey.node).by(2, { y: -400, angle: -270 }).start()
                    this.die()

                }
                if (!this.monkey_die) {
                    this.score_num++
                    this.score.string = this.score_num.toString()
                }
                this.stick.node.active = false
                this.stick.node.scaleY = 1
                this.stick.node.angle = 0
                this.plat_number = (this.plat_number + 1) % 2
                this.stick.node.x = this.Platform[this.plat_number].scaleX * this.Platform[this.plat_number].width / 2 - 120
            }
        }

        // new platform
        if (!this.monkey_die) {
            if (this.Platform[this.plat_number].x >= -115) {
                for (let i = 0; i < this.Platform.length; i++) {
                    this.Platform[i].x -= 2.5
                }
                this.monkey.node.x -= 2.5
                this.is_ok = true;
            }
        }
        if (this.Platform[this.plat_number].x <= -115 && this.is_ok) {
            this.Platform[(this.plat_number + 1) % 2].scaleX = Math.random() * (this.max_scale_plat - this.min_scale_plat) + this.min_scale_plat
            this.Platform[(this.plat_number + 1) % 2].x = Math.random() * (this.max_plat - this.min_plat) + this.min_plat + this.Platform[this.plat_number].width / 2 + this.Platform[(this.plat_number + 1) % 2].scaleX * this.Platform[(this.plat_number + 1) % 2].width / 2
            this.is_ok = false
        }
    }

    onTouchStart(event: cc.Event.EventTouch) {
        if (!this.monkey_die) {
            this.is_longer = true
            this.stick.node.active = true
        }
    }
    onTouchEnd(event: cc.Event.EventTouch) {
        this.is_longer = false
    }

    check_die(): boolean {
        if (this.stick_length + this.Platform[this.plat_number].scaleX * this.Platform[this.plat_number].width / 2 - 120 < this.Platform[(this.plat_number + 1) % 2].x - this.Platform[(this.plat_number + 1) % 2].scaleX * this.Platform[(this.plat_number + 1) % 2].width / 2)
            return true;
        if (this.stick_length + this.Platform[this.plat_number].scaleX * this.Platform[this.plat_number].width / 2 - 120 > this.Platform[(this.plat_number + 1) % 2].x + this.Platform[(this.plat_number + 1) % 2].scaleX * this.Platform[(this.plat_number + 1) % 2].width / 2)
            return true;
        return false;
    }

    die() {
        this.scheduleOnce(() => {
            this.game_over.node.active = true
            this.gameStatus = GameStatus.Game_Over
            this.monkey_die = true
            this.Best_score_img.node.active = true
            this.Best_score.node.active = true
            this.replay.node.active = true
            this.Platform_parent.active = false
            // this.stick.node.active = false
        }, 2)
    }

    replay_btn() {
        this.Platform[0].scaleX = 1
        this.Platform[0].x = -115;
        this.Platform[1].scaleX = Math.random() * (this.max_scale_plat - this.min_scale_plat) + this.min_scale_plat
        this.Platform[1].x = Math.random() * (this.max_plat - this.min_plat) + this.min_plat + this.Platform[0].width / 2 + this.Platform[1].scaleX * this.Platform[1].width / 2
        this.game_over.node.active = false
        this.gameStatus = GameStatus.Game_Playing
        this.Best_score_img.node.active = false
        this.Best_score.node.active = false
        this.replay.node.active = false
        this.Platform_parent.active = true
        this.score_num = 0
        this.score.string = this.score_num.toString()
        this.monkey.node.x = -120
        this.monkey.node.y = 0
        this.monkey.node.angle = 0
        this.plat_number = 0
        this.stick.node.x = this.Platform[this.plat_number].scaleX * this.Platform[this.plat_number].width / 2 - 120
        this.is_ok = false
        this.monkey_die = false
    }
}