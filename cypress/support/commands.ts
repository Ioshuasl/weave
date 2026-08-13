/// <reference types="cypress" />

/**
 * Comandos customizados do FastReport JSON Web.
 * Preferir seletores por aria-label / role / texto estável.
 */

declare global {
  namespace Cypress {
    interface Chainable {
      /** Abre a lista demo do host e entra no designer no modo indicado */
      openReport(reportName: string, mode?: 'design' | 'preview'): Chainable<void>;
      /** Volta à lista do host a partir do designer (design) ou preview embutido */
      returnToHost(): Chainable<void>;
      /** Stub de console.info e captura chamadas do host demo (onSave / onPrint) */
      stubHostConsole(): Chainable<void>;
      /** Adiciona banda pela sidebar (seção Bandas) */
      addBand(label: string): Chainable<void>;
      /** Adiciona componente pela sidebar (requer banda alvo selecionada) */
      addComponent(label: string): Chainable<void>;
      /** Limpa seleção (clique na margem da folha → selectPage) */
      clearCanvasSelection(): Chainable<void>;
      /** Lê o valor numérico de um PropertyNumberInput pelo label */
      propertyNumber(label: string): Chainable<number>;
      /** Dispara atalho de teclado no window (listeners do designer) */
      designerKey(
        key: string,
        opts?: { ctrl?: boolean; shift?: boolean; code?: string }
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add('openReport', (reportName, mode = 'design') => {
  cy.visit('/');
  cy.contains('tr', reportName).within(() => {
    cy.contains('button', mode === 'preview' ? 'Visualizar' : 'Editar layout').click();
  });
});

Cypress.Commands.add('returnToHost', () => {
  cy.get('body').then(($body) => {
    if ($body.find('button[aria-label="Voltar ao sistema"]').length) {
      cy.get('button[aria-label="Voltar ao sistema"]').click();
      return;
    }
    if ($body.find('button:contains("Voltar")').length) {
      cy.contains('button', 'Voltar').click();
      return;
    }
    cy.contains('button', 'Fechar').click();
  });
});

Cypress.Commands.add('stubHostConsole', () => {
  cy.window().then((win) => {
    cy.stub(win.console, 'info').as('hostConsoleInfo');
  });
});

Cypress.Commands.add('addBand', (label) => {
  cy.contains('section', 'Bandas').within(() => {
    cy.contains('button', label).click();
  });
  cy.get('.band-toolbar').should('contain.text', label);
});

Cypress.Commands.add('addComponent', (label) => {
  cy.contains('section', 'Componentes').within(() => {
    cy.contains('button', label).click();
  });
});

Cypress.Commands.add('clearCanvasSelection', () => {
  cy.get('[data-designer-page]').click(4, 4, { force: true });
});

Cypress.Commands.add('propertyNumber', (label) => {
  return cy
    .contains('label', label)
    .parent()
    .find('input')
    .invoke('val')
    .then((val) => Number(val));
});

Cypress.Commands.add('designerKey', (key, opts = {}) => {
  cy.window().then((win) => {
    win.dispatchEvent(
      new win.KeyboardEvent('keydown', {
        key,
        code: opts.code ?? `Key${key.toUpperCase()}`,
        ctrlKey: Boolean(opts.ctrl),
        metaKey: Boolean(opts.ctrl),
        shiftKey: Boolean(opts.shift),
        bubbles: true,
        cancelable: true,
      })
    );
  });
});

export {};
