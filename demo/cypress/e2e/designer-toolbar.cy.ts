/**
 * P0 — Toolbar do designer (preview interno + salvar).
 * docs/cypress-plano-de-testes.md §4.2 (casos P0)
 */
describe('P0 — Designer toolbar', () => {
  it('T1 — Pré-visualização abre o modal com dados', () => {
    cy.openReport('Lista de usuários (A4)', 'design');

    cy.get('button[aria-label="Pré-visualização"]').click();

    cy.contains('h2', 'Pré-visualização').should('be.visible');
    cy.contains('button', 'Fechar').should('be.visible');
    cy.contains('button', 'Imprimir').should('be.visible');
    // Conteúdo pode estar coberto por bandas sobrepostas no layout absoluto
    cy.get('#report-print-root').should(($root) => {
      expect($root.text()).to.include('John Doe');
    });
  });

  it('T2 — Fechar preview interno volta ao canvas editável', () => {
    cy.openReport('Lista de usuários (A4)', 'design');
    cy.get('button[aria-label="Pré-visualização"]').click();
    cy.contains('button', 'Fechar').click();

    cy.contains('h2', 'Pré-visualização').should('not.exist');
    cy.contains('Bandas').should('be.visible');
    cy.contains('Componentes').should('be.visible');
    cy.get('[data-report-mode="design"]').should('exist');
    cy.get('button[aria-label="Pré-visualização"]').should('be.visible');
  });

  it('T3 — Salvar após alteração limpa o estado dirty', () => {
    cy.openReport('Lista de usuários (A4)', 'design');
    cy.stubHostConsole();

    // Estado limpo: botão sem destaque amber de dirty
    cy.get('button[aria-label^="Salvar alterações"]')
      .should('be.visible')
      .and('not.have.class', 'bg-amber-50');

    cy.contains('button', 'Título').click();

    cy.get('button[aria-label^="Salvar alterações"]')
      .should('have.class', 'bg-amber-50')
      .click();

    cy.get('@hostConsoleInfo').should(
      'have.been.calledWithMatch',
      '[demo] onSave'
    );

    cy.get('button[aria-label^="Salvar alterações"]', { timeout: 10000 }).should(
      'not.have.class',
      'bg-amber-50'
    );
  });
});
