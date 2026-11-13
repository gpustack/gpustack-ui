import assert from 'node:assert/strict';
import { test } from 'node:test';
import english from '../../../../../locales/en-US/menu';
import englishMonitoring from '../../../../../locales/en-US/model-monitoring';
import japanese from '../../../../../locales/ja-JP/menu';
import japaneseMonitoring from '../../../../../locales/ja-JP/model-monitoring';
import russian from '../../../../../locales/ru-RU/menu';
import russianMonitoring from '../../../../../locales/ru-RU/model-monitoring';
import turkish from '../../../../../locales/tr-TR/menu';
import turkishMonitoring from '../../../../../locales/tr-TR/model-monitoring';
import chinese from '../../../../../locales/zh-CN/menu';
import chineseMonitoring from '../../../../../locales/zh-CN/model-monitoring';

test('the native model detail route has a translated document/menu title in each shipped locale', () => {
  for (const messages of [english, japanese, russian, turkish, chinese]) {
    const title = (messages as Record<string, string>)[
      'menu.models.deploymentDetail'
    ];
    assert.ok(
      title && !title.startsWith('menu.'),
      'detail route must not expose its message key as the browser title'
    );
  }
});

test('generic monitoring explanations do not include PD-specific instructions', () => {
  for (const messages of [
    englishMonitoring,
    japaneseMonitoring,
    russianMonitoring,
    turkishMonitoring,
    chineseMonitoring
  ]) {
    for (const key of ['statisticsExplanation', 'phaseNote', 'help.ttft']) {
      assert.ok(
        !/\bPD\b/.test(
          (messages as Record<string, string>)[`modelMonitoring.${key}`]
        )
      );
    }
  }
});
