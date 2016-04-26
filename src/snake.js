/**
 * Created by wanghx on 4/23/16.
 *
 * snake
 *
 */
'use strict';

import map from './map';

const BASE_ANGLE = Math.PI * 200; // 用于保证蛇的角度一直都是正数

// 蛇头和蛇身的基类
class Base {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.r = options.r;
    this.speed = options.speed;
    this.aims = [];

    // 皮肤颜色
    this.color_1 = options.color;
    // 描边颜色
    this.color_2 = `#000`;

    this.vx = 0;
    this.vy = 0;
    this.tox = this.x;
    this.toy = this.y;

    // 生成元素图片镜像
    this.createImage();
  }

  /**
   * 绘制时的x坐标, 要根据视窗来计算位置
   * @returns {number}
   */
  get paintX() {
    return this.x - map.frame.x;
  }

  /**
   * 绘制时的y坐标, 要根据视窗来计算位置
   * @returns {number}
   */
  get paintY() {
    return this.y - map.frame.y;
  }

  /**
   * 在视窗内是否可见
   * @returns {boolean}
   */
  get visible() {
    const paintX = this.paintX;
    const paintY = this.paintY;

    return (paintX + this.r > 0)
      && (paintX - this.r < map.frame.w)
      && (paintY + this.r > 0)
      && (paintY - this.r < map.frame.h)
  }

  /**
   * 生成图片镜像
   */
  createImage() {
    this.img = document.createElement('canvas');
    this.img.width = this.r * 2 + 10;
    this.img.height = this.r * 2 + 10;
    this.imgctx = this.img.getContext('2d');

    this.imgctx.lineWidth = 2;
    this.imgctx.save();
    this.imgctx.beginPath();
    this.imgctx.arc(this.img.width / 2, this.img.height / 2, this.r, 0, Math.PI * 2);
    this.imgctx.fillStyle = this.color_1;
    this.imgctx.strokeStyle = this.color_2;
    this.imgctx.stroke();
    this.imgctx.fill();
    this.imgctx.restore();
  }

  /**
   * 给予目标点, 计算速度
   * @param x
   * @param y
   */
  moveTo(x, y) {
    if(Number.isNaN(x)) {
      console.log(this);
      throw new Error('ss');
    }

    this.tox = x;
    this.toy = y;

    const dis_x = this.tox - this.x;
    const dis_y = this.toy - this.y;
    const dis = Math.hypot(dis_x, dis_y);

    this.vy = dis_y * (this.speed / dis) || 0;
    this.vx = dis_x * (this.speed / dis) || 0;
  }

  /**
   * 更新位置
   */
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * 渲染镜像图片
   */
  render() {
    // 如果该元素在视窗内不可见, 则不进行绘制
    if (!this.visible) return;

    // 如果该对象有角度属性, 则使用translate来绘制, 因为要旋转
    if (this.hasOwnProperty('angle')) {
      map.ctx.save();
      map.ctx.translate(this.paintX, this.paintY);
      map.ctx.rotate(this.angle - BASE_ANGLE - Math.PI / 2);
      map.ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
      map.ctx.restore();
    } else {
      map.ctx.drawImage(
        this.img,
        this.paintX - this.img.width / 2,
        this.paintY - this.img.height / 2
      );
    }
  }
}

// 蛇的身躯类
class Body extends Base {
  constructor(options) {
    super(options);
  }

  // 身躯跟头部的运动轨迹不同, 身躯要走完当前目标后才进入下一个目标
  moveTo(x, y) {
    this.aims.push({x, y});

    if (this.tox == this.x && this.toy == this.y) {
      let naim = this.aims.shift();
      super.moveTo(naim.x, naim.y);
    }
  }

  update() {
    super.update();

    // 到达目的地设置x为目标x
    if (Math.abs(this.tox - this.x) <= this.speed) {
      this.x = this.tox;
    }

    // 到达目的地设置y为目标y
    if (Math.abs(this.toy - this.y) <= this.speed) {
      this.y = this.toy;
    }
  }
}

// 蛇头类
class Header extends Base {
  constructor(options) {
    super(options);

    this.vx = this.speed;
    this.angle = BASE_ANGLE + Math.PI / 2;
    this.toa = this.angle;
  }

  /**
   * 添加画眼睛的功能
   */
  createImage() {
    super.createImage();
    const self = this;
    const eye_r = this.r * 3 / 7;

    // 画左眼
    drawEye(
      this.img.width / 2 + this.r - eye_r,
      this.img.height / 2 - this.r + eye_r
    );

    // 画右眼
    drawEye(
      this.img.width / 2 + this.r - eye_r,
      this.img.height / 2 + this.r - eye_r
    );

    function drawEye(eye_x, eye_y) {
      self.imgctx.beginPath();
      self.imgctx.fillStyle = '#fff';
      self.imgctx.strokeStyle = self.color_2;
      self.imgctx.arc(eye_x, eye_y, eye_r, 0, Math.PI * 2);
      self.imgctx.fill();
      self.imgctx.stroke();

      self.imgctx.beginPath();
      self.imgctx.fillStyle = '#000';
      self.imgctx.arc(eye_x + eye_r / 2, eye_y, 3, 0, Math.PI * 2);
      self.imgctx.fill();
    }
  }

  /**
   * 这里不进行真正的移动, 而是计算移动位置与目前位置的补间位置, 目的是为了让蛇的转弯不那么突兀
   */
  moveTo(x, y) {
    if (!this.aims.length)
      return this.aims.push({x, y});

    const olderAim = this.aims[this.aims.length - 1];
    const dis_x = x - olderAim.x;
    const dis_y = y - olderAim.y;
    const dis = Math.hypot(dis_x, dis_y);
    const min = 20;

    if (dis > min) {
      const part = ~~(dis / min);
      for (let i = 1; i <= part; i++) {
        // 记录的目标点不超过20个
        if (this.aims.length > 30)
          this.aims.shift();

        this.aims.push({
          x: olderAim.x + dis_x * i / part,
          y: olderAim.y + dis_y * i / part
        });
      }
    } else {
      this.aims[this.aims.length - 1] = {x, y};
    }
  }

  /**
   * 增加蛇头的逐帧逻辑
   */
  update() {
    const time = new Date();

    // 每隔一段时间获取一次目标位置集合中的数据, 进行移动
    if ((!this.time || time - this.time > 30) && this.aims.length) {
      const aim = this.aims.shift();

      // 调用父类的moveTo, 让蛇头朝目标移动
      super.moveTo(aim.x, aim.y);

      // 根据新的目标位置, 更新toa
      this.turnTo();

      this.time = time;
    }

    // 让蛇转头
    this.turnAround();

    super.update();

    // 不让蛇走出边界
    if (this.x < this.r) {
      this.x = this.r;
    } else if (this.x + this.r > map.width) {
      this.x = map.width - this.r;
    }

    if (this.y < this.r) {
      this.y = this.r;
    } else if (this.y + this.r > map.height) {
      this.y = map.height - this.r;
    }
  }

  /**
   * 根据蛇的目的地, 调整蛇头的目标角度
   */
  turnTo() {
    const olda = Math.abs(this.toa % (Math.PI * 2));// 老的目标角度, 但是是小于360度的, 因为每次计算出来的目标角度也是0 - 360度
    let rounds = ~~(this.toa / (Math.PI * 2));      // 转了多少圈
    this.toa = Math.atan(this.vy / this.vx) + (this.vx < 0 ? Math.PI : 0) + Math.PI / 2; // 目标角度

    if (olda >= Math.PI * 3 / 2 && this.toa <= Math.PI / 2) {
      // 角度从第一象限左划至第四象限, 增加圈数
      rounds++;
    } else if (olda <= Math.PI / 2 && this.toa >= Math.PI * 3 / 2) {
      // 角度从第四象限划至第一象限, 减少圈数
      rounds--;
    }

    // 计算真实要转到的角度
    this.toa += rounds * Math.PI * 2;
  }

  /**
   * 让蛇头转角更加平滑, 渐增转头
   */
  turnAround() {
    const angle_dis = this.toa - this.angle;

    if (angle_dis) {
      this.angle += angle_dis * 0.2;

      // 当转到目标角度, 重置蛇头角度
      if (Math.abs(angle_dis) <= 0.01) {
        this.toa = this.angle = BASE_ANGLE + this.toa % (Math.PI * 2)
      }
    }
  }
}

/**
 * 蛇类
 */
export default class Snake {
  constructor(options) {
    options.speed = options.speed || 1.8;

    this.speed = options.speed;  // 蛇的速度
    this.length = options.length; // 蛇的长度

    // 创建脑袋
    this.header = new Header(options);

    // 创建身躯
    this.bodys = [];
    let body_dis = options.r * 0.6;
    for (let i = 0; i < this.length; i++) {
      options.x -= body_dis;
      options.r -= 0.2;

      this.bodys.push(new Body(options));
    }
  }

  get x() {
    return this.header.x;
  }

  get y() {
    return this.header.y;
  }

  /**
   * 蛇的移动就是头部的移动
   */
  moveTo(x, y) {
    this.header.moveTo(x, y);
  }

  render() {
    // 蛇的身躯沿着蛇头的运动轨迹运动
    for (let i = this.bodys.length - 1; i >= 0; i--) {
      let body = this.bodys[i];
      let front = this.bodys[i - 1] || this.header;

      body.moveTo(front.x, front.y);

      body.update();
      body.render();
    }

    this.header.update();
    this.header.render();
  }
}