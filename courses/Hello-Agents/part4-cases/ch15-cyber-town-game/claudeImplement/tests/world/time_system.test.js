/**
 * 时间系统测试
 * 测试 src/world/time_system.js 的 TimeSystem 类
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { TimeSystem, TimeOfDay, TIME_PERIODS, isWorkTime, isRestTime, isMealTime } from '../../src/world/time_system.js';

describe('TimeSystem', () => {
  let timeSystem;

  beforeEach(() => {
    timeSystem = new TimeSystem({
      startTime: 8 * 60, // 8:00
      startDay: 1,
      timeScale: 60
    });
  });

  // ============ 初始化测试 ============
  describe('初始化', () => {
    test('应该正确初始化默认值', () => {
      const ts = new TimeSystem();

      expect(ts.gameTime).toBe(8 * 60); // 默认早上8:00
      expect(ts.day).toBe(1);
      expect(ts.timeScale).toBe(60);
      expect(ts.paused).toBe(false);
    });

    test('应该接受自定义配置', () => {
      const ts = new TimeSystem({
        startTime: 12 * 60, // 中午
        startDay: 5,
        timeScale: 120
      });

      expect(ts.gameTime).toBe(12 * 60);
      expect(ts.day).toBe(5);
      expect(ts.timeScale).toBe(120);
    });
  });

  // ============ 时间获取测试 ============
  describe('时间获取', () => {
    test('getCurrentHour 应该返回正确小时', () => {
      timeSystem.gameTime = 8 * 60 + 30; // 8:30
      expect(timeSystem.getCurrentHour()).toBe(8);

      timeSystem.gameTime = 23 * 60; // 23:00
      expect(timeSystem.getCurrentHour()).toBe(23);
    });

    test('getCurrentMinute 应该返回正确分钟', () => {
      timeSystem.gameTime = 8 * 60 + 45;
      expect(timeSystem.getCurrentMinute()).toBe(45);

      timeSystem.gameTime = 12 * 60 + 5;
      expect(timeSystem.getCurrentMinute()).toBe(5);
    });

    test('getFormattedTime 应该返回格式化的时间', () => {
      timeSystem.gameTime = 8 * 60 + 5; // 8:05
      expect(timeSystem.getFormattedTime()).toBe('08:05');

      timeSystem.gameTime = 12 * 60 + 30; // 12:30
      expect(timeSystem.getFormattedTime()).toBe('12:30');
    });

    test('getFullTimeInfo 应该返回完整信息', () => {
      timeSystem.gameTime = 10 * 60 + 30;
      timeSystem.day = 3;

      const info = timeSystem.getFullTimeInfo();

      expect(info.day).toBe(3);
      expect(info.hour).toBe(10);
      expect(info.minute).toBe(30);
      expect(info.formatted).toBe('10:30');
      expect(info.timeOfDay).toBeDefined();
      expect(info.periodInfo).toBeDefined();
      expect(info.totalMinutes).toBe(10 * 60 + 30);
    });
  });

  // ============ 时段判断测试 ============
  describe('时段判断', () => {
    test('黎明 (5:00-7:00)', () => {
      timeSystem.gameTime = 5 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.DAWN);

      timeSystem.gameTime = 6 * 60 + 30;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.DAWN);
    });

    test('早晨 (7:00-12:00)', () => {
      timeSystem.gameTime = 7 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.MORNING);

      timeSystem.gameTime = 10 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.MORNING);

      timeSystem.gameTime = 11 * 60 + 59;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.MORNING);
    });

    test('下午 (12:00-18:00)', () => {
      timeSystem.gameTime = 12 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.AFTERNOON);

      timeSystem.gameTime = 15 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.AFTERNOON);

      timeSystem.gameTime = 17 * 60 + 59;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.AFTERNOON);
    });

    test('傍晚 (18:00-21:00)', () => {
      timeSystem.gameTime = 18 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.EVENING);

      timeSystem.gameTime = 20 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.EVENING);
    });

    test('夜晚 (21:00-5:00) - 跨越午夜', () => {
      timeSystem.gameTime = 21 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.NIGHT);

      timeSystem.gameTime = 23 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.NIGHT);

      timeSystem.gameTime = 0 * 60; // 午夜
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.NIGHT);

      timeSystem.gameTime = 4 * 60;
      expect(timeSystem.getTimeOfDay()).toBe(TimeOfDay.NIGHT);
    });

    test('getTimePeriodInfo 应该返回时段信息', () => {
      timeSystem.gameTime = 10 * 60;
      const info = timeSystem.getTimePeriodInfo();

      expect(info.name).toBeDefined();
      expect(info.icon).toBeDefined();
      expect(info.startHour).toBeDefined();
      expect(info.endHour).toBeDefined();
      expect(info.activityMultiplier).toBeDefined();
    });
  });

  // ============ 时间更新测试 ============
  describe('时间更新', () => {
    test('update 应该推进游戏时间', () => {
      const deltaTime = 1000; // 1秒现实时间
      timeSystem.timeScale = 60; // 1秒 = 1分钟游戏时间

      const result = timeSystem.update(deltaTime);

      expect(timeSystem.gameTime).toBeGreaterThan(8 * 60);
      expect(result).toBeDefined();
    });

    test('暂停时不应该更新时间', () => {
      timeSystem.paused = true;
      const initialTime = timeSystem.gameTime;

      timeSystem.update(1000);

      expect(timeSystem.gameTime).toBe(initialTime);
    });

    test('应该触发小时变化事件', () => {
      const hourListener = jest.fn();
      timeSystem.on('hourChange', hourListener);

      // 设置接近整点
      timeSystem.gameTime = 8 * 60 + 59; // 8:59
      timeSystem.timeScale = 60;

      // 推进超过1分钟（游戏时间）
      timeSystem.update(2000); // 2秒现实 = 2分钟游戏

      expect(hourListener).toHaveBeenCalled();
    });

    test('应该触发日期变化事件', () => {
      const dayListener = jest.fn();
      timeSystem.on('dayChange', dayListener);

      // 设置接近午夜
      timeSystem.gameTime = 23 * 60 + 59; // 23:59
      timeSystem.timeScale = 60;

      // 推进超过1分钟
      timeSystem.update(2000);

      expect(dayListener).toHaveBeenCalled();
      expect(timeSystem.day).toBe(2);
    });

    test('应该触发时段变化事件', () => {
      const periodListener = jest.fn();
      timeSystem.on('timeOfDayChange', periodListener);

      // 从早晨到下午
      timeSystem.gameTime = 11 * 60 + 59; // 11:59
      timeSystem.timeScale = 60;

      timeSystem.update(2000); // 跨越 12:00

      expect(periodListener).toHaveBeenCalled();
    });
  });

  // ============ 设置方法测试 ============
  describe('设置方法', () => {
    test('setTime 应该正确设置时间', () => {
      timeSystem.setTime(15, 30);

      expect(timeSystem.getCurrentHour()).toBe(15);
      expect(timeSystem.getCurrentMinute()).toBe(30);
    });

    test('setDay 应该正确设置天数', () => {
      timeSystem.setDay(10);
      expect(timeSystem.day).toBe(10);
    });

    test('setTimeScale 应该限制范围', () => {
      timeSystem.setTimeScale(0);
      expect(timeSystem.timeScale).toBe(1);

      timeSystem.setTimeScale(10000);
      expect(timeSystem.timeScale).toBe(3600);

      timeSystem.setTimeScale(100);
      expect(timeSystem.timeScale).toBe(100);
    });

    test('togglePause 应该切换暂停状态', () => {
      expect(timeSystem.paused).toBe(false);

      timeSystem.togglePause();
      expect(timeSystem.paused).toBe(true);

      timeSystem.togglePause();
      expect(timeSystem.paused).toBe(false);
    });
  });

  // ============ 事件系统测试 ============
  describe('事件系统', () => {
    test('应该正确注册事件监听器', () => {
      const callback = jest.fn();
      timeSystem.on('testEvent', callback);

      expect(timeSystem.listeners.has('testEvent')).toBe(true);
    });

    test('应该正确移除事件监听器', () => {
      const callback = jest.fn();
      timeSystem.on('testEvent', callback);
      timeSystem.off('testEvent', callback);

      expect(timeSystem.listeners.get('testEvent').has(callback)).toBe(false);
    });

    test('emitEvent 应该触发回调', () => {
      const callback = jest.fn();
      timeSystem.on('testEvent', callback);

      timeSystem.emitEvent('testEvent', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('回调错误不应该中断其他回调', () => {
      const errorCallback = () => { throw new Error('Test error'); };
      const normalCallback = jest.fn();

      timeSystem.on('testEvent', errorCallback);
      timeSystem.on('testEvent', normalCallback);

      expect(() => timeSystem.emitEvent('testEvent', {})).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  // ============ 日程系统测试 ============
  describe('日程系统', () => {
    test('应该正确添加日程', () => {
      timeSystem.addSchedule('char1', {
        hour: 9,
        minute: 0,
        action: 'go_to_work'
      });

      expect(timeSystem.schedules.has('char1')).toBe(true);
      expect(timeSystem.schedules.get('char1').length).toBe(1);
    });

    test('getCurrentSchedules 应该返回当前日程', () => {
      timeSystem.gameTime = 9 * 60; // 9:00

      timeSystem.addSchedule('char1', {
        hour: 9,
        minute: 0,
        action: 'morning_meeting'
      });

      const schedules = timeSystem.getCurrentSchedules('char1');

      expect(schedules.length).toBe(1);
      expect(schedules[0].schedule.action).toBe('morning_meeting');
    });

    test('getCurrentSchedules 应该只返回5分钟窗口内的日程', () => {
      timeSystem.gameTime = 9 * 60; // 9:00

      timeSystem.addSchedule('char1', { hour: 9, minute: 0, action: 'on_time' });
      timeSystem.addSchedule('char1', { hour: 9, minute: 10, action: 'too_late' }); // 10分钟后

      const schedules = timeSystem.getCurrentSchedules('char1');

      expect(schedules.length).toBe(1);
      expect(schedules[0].schedule.action).toBe('on_time');
    });

    test('不指定角色应该返回所有日程', () => {
      timeSystem.gameTime = 10 * 60;

      timeSystem.addSchedule('char1', { hour: 10, minute: 0, action: 'task1' });
      timeSystem.addSchedule('char2', { hour: 10, minute: 2, action: 'task2' });

      const schedules = timeSystem.getCurrentSchedules();

      expect(schedules.length).toBe(2);
    });
  });

  // ============ 导出/导入测试 ============
  describe('export/import', () => {
    test('应该正确导出状态', () => {
      timeSystem.gameTime = 12 * 60 + 30;
      timeSystem.day = 5;
      timeSystem.timeScale = 120;
      timeSystem.paused = true;

      const data = timeSystem.export();

      expect(data.gameTime).toBe(12 * 60 + 30);
      expect(data.day).toBe(5);
      expect(data.timeScale).toBe(120);
      expect(data.paused).toBe(true);
    });

    test('应该正确导入状态', () => {
      const data = {
        gameTime: 15 * 60 + 45,
        day: 10,
        timeScale: 90,
        paused: true
      };

      timeSystem.import(data);

      expect(timeSystem.gameTime).toBe(15 * 60 + 45);
      expect(timeSystem.day).toBe(10);
      expect(timeSystem.timeScale).toBe(90);
      expect(timeSystem.paused).toBe(true);
    });
  });

  // ============ TimeOfDay 常量测试 ============
  describe('TimeOfDay 常量', () => {
    test('应该定义所有时段', () => {
      expect(TimeOfDay.DAWN).toBe('dawn');
      expect(TimeOfDay.MORNING).toBe('morning');
      expect(TimeOfDay.AFTERNOON).toBe('afternoon');
      expect(TimeOfDay.EVENING).toBe('evening');
      expect(TimeOfDay.NIGHT).toBe('night');
    });
  });

  // ============ TIME_PERIODS 配置测试 ============
  describe('TIME_PERIODS 配置', () => {
    test('每个时段应该有必要属性', () => {
      Object.entries(TIME_PERIODS).forEach(([key, period]) => {
        expect(period.name).toBeDefined();
        expect(period.icon).toBeDefined();
        expect(period.startHour).toBeDefined();
        expect(period.endHour).toBeDefined();
        expect(period.activityMultiplier).toBeDefined();
      });
    });
  });
});

// ============ 工具函数测试 ============
describe('时间工具函数', () => {
  let timeSystem;

  beforeEach(() => {
    timeSystem = new TimeSystem();
  });

  test('isWorkTime 应该正确判断工作时间', () => {
    // 早晨是工作时间
    timeSystem.gameTime = 9 * 60;
    expect(isWorkTime(timeSystem)).toBe(true);

    // 下午早些时候是工作时间
    timeSystem.gameTime = 14 * 60;
    expect(isWorkTime(timeSystem)).toBe(true);

    // 下午晚些时候不是工作时间
    timeSystem.gameTime = 17 * 60;
    expect(isWorkTime(timeSystem)).toBe(false);

    // 夜晚不是工作时间
    timeSystem.gameTime = 22 * 60;
    expect(isWorkTime(timeSystem)).toBe(false);
  });

  test('isRestTime 应该正确判断休息时间', () => {
    // 夜晚是休息时间
    timeSystem.gameTime = 22 * 60;
    expect(isRestTime(timeSystem)).toBe(true);

    timeSystem.gameTime = 2 * 60;
    expect(isRestTime(timeSystem)).toBe(true);

    // 白天不是休息时间
    timeSystem.gameTime = 10 * 60;
    expect(isRestTime(timeSystem)).toBe(false);
  });

  test('isMealTime 应该正确判断用餐时间', () => {
    // 早餐 7-9
    timeSystem.gameTime = 8 * 60;
    expect(isMealTime(timeSystem)).toBe(true);

    // 午餐 11-13
    timeSystem.gameTime = 12 * 60;
    expect(isMealTime(timeSystem)).toBe(true);

    // 晚餐 18-20
    timeSystem.gameTime = 19 * 60;
    expect(isMealTime(timeSystem)).toBe(true);

    // 非用餐时间
    timeSystem.gameTime = 15 * 60;
    expect(isMealTime(timeSystem)).toBe(false);
  });
});
