import assert from 'node:assert/strict';
import {
  getExpressionTriggerInTextarea,
  replaceExpressionTriggerInTextarea,
} from './expressionAutocompleteTextarea';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok — ${name}`);
  } catch (error) {
    console.error(`fail — ${name}`);
    throw error;
  }
}

test('detecta trigger após abre-chaves', () => {
  const trigger = getExpressionTriggerInTextarea('Olá {car', 8);
  assert.ok(trigger);
  assert.equal(trigger.query, 'car');
  assert.equal(trigger.replaceStart, 4);
  assert.equal(trigger.replaceEnd, 8);
});

test('ignora query inválida', () => {
  assert.equal(getExpressionTriggerInTextarea('Olá {car!', 9), null);
});

test('substitui trigger pelo token completo', () => {
  const trigger = getExpressionTriggerInTextarea('Prefixo {use', 12)!;
  const { nextValue, nextCaret } = replaceExpressionTriggerInTextarea(
    'Prefixo {use',
    trigger,
    '{users.name}'
  );
  assert.equal(nextValue, 'Prefixo {users.name}');
  assert.equal(nextCaret, '{users.name}'.length + 'Prefixo '.length);
});

test('caret no meio do texto', () => {
  const value = 'A {x} B {car';
  const trigger = getExpressionTriggerInTextarea(value, value.length)!;
  const { nextValue } = replaceExpressionTriggerInTextarea(value, trigger, '{cartorio.nome}');
  assert.equal(nextValue, 'A {x} B {cartorio.nome}');
});

console.log('expressionAutocompleteTextarea.test.ts — todos os testes passaram');
