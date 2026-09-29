/**
 * Smoke — garante que a demo sobe e os fluxos de entrada funcionam.
 * Specs completos devem seguir docs/cypress-plano-de-testes.md
 */
describe('Smoke — host demo', () => {
  it('lista templates mockados na home', () => {
    cy.visit('/');
    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.contains('Lista de usuários (A4)').should('be.visible');
    cy.contains('Multipágina (capa + corpo)').should('be.visible');
    cy.contains('Lista compacta A5').should('be.visible');
    cy.contains('Cupom 80 mm').should('be.visible');
    cy.contains('Etiqueta extraprotocolar (9×5 cm)').should('be.visible');
  });

  it('abre o designer em modo design', () => {
    cy.openReport('Lista de usuários (A4)', 'design');
    cy.get('button[aria-label="Pré-visualização"]').should('be.visible');
    cy.contains('Bandas').should('be.visible');
  });

  it('abre o relatório em modo preview', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');
    cy.contains('button', 'Imprimir').should('be.visible');
  });
});
