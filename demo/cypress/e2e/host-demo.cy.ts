/**
 * P0 — Host demo: entrada, saída e troca de relatório.
 * docs/cypress-plano-de-testes.md §4.1
 */
describe('P0 — Host demo', () => {
  const REPORTS = [
    'Lista de usuários (A4)',
    'Multipágina (capa + corpo)',
    'Lista compacta A5',
    'Cupom 80 mm',
    'Etiqueta extraprotocolar (9×5 cm)',
  ] as const;

  it('H1 — home carrega com os 5 templates', () => {
    cy.visit('/');
    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.contains('Templates de relatório').should('be.visible');
    REPORTS.forEach((name) => {
      cy.contains('tr', name).should('be.visible');
    });
  });

  it('H2 — Editar layout abre o designer (mode=design)', () => {
    cy.openReport('Lista de usuários (A4)', 'design');
    cy.get('[data-report-mode="design"]').should('exist');
    cy.get('[data-report-id="rep_1"]').should('exist');
    cy.contains('Bandas').should('be.visible');
    cy.contains('Componentes').should('be.visible');
    cy.get('button[aria-label="Pré-visualização"]').should('be.visible');
    cy.get('button[aria-label="Voltar ao sistema"]').should('be.visible');
    cy.contains('button', 'Imprimir').should('not.exist');
  });

  it('H3 — Visualizar abre o preview embutido (mode=preview)', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');
    cy.get('[data-report-mode="preview"]').should('exist');
    cy.contains('h2', 'Pré-visualização').should('be.visible');
    cy.contains('button', 'Imprimir').should('be.visible');
    cy.contains('button', 'Voltar').should('be.visible');
    cy.contains('Bandas').should('not.exist');
  });

  it('H4 — Fechar preview e designer volta à lista', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');
    cy.contains('button', 'Voltar').click();
    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.contains('tr', 'Lista de usuários (A4)').should('be.visible');

    cy.contains('tr', 'Lista de usuários (A4)').within(() => {
      cy.contains('button', 'Editar layout').click();
    });
    cy.get('[data-report-mode="design"]').should('exist');
    cy.get('button[aria-label="Voltar ao sistema"]').click();
    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.contains('tr', 'Cupom 80 mm').should('be.visible');
  });

  it('H5 — trocar de relatório não mantém layout anterior (store residual)', () => {
    cy.visit('/');

    cy.contains('tr', 'Lista de usuários (A4)').within(() => {
      cy.contains('button', 'Visualizar').click();
    });
    cy.contains('.report-preview-toolbar', '794×').should('be.visible');
    cy.contains('button', 'Voltar').click();

    cy.contains('tr', 'Cupom 80 mm').within(() => {
      cy.contains('button', 'Visualizar').click();
    });
    cy.get('[data-report-id="rep_receipt"]').should('exist');
    cy.contains('.report-preview-toolbar', '302×').should('be.visible');
    cy.contains('.report-preview-toolbar', '794×').should('not.exist');
    cy.contains('RESTAURANTE DEMO').should('be.visible');
  });
});
