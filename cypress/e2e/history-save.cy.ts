/**
 * P1 — Histórico, dirty state e guards de saída.
 * docs/cypress-plano-de-testes.md §4.8
 */
describe('P1 — Histórico e save', () => {
  beforeEach(() => {
    cy.openReport('Lista de usuários (A4)', 'design');
  });

  it('S1 — Undo / Redo restaura bandas adicionadas', () => {
    cy.get('[data-band-overlay]').its('length').then((initial) => {
      const n = Number(initial);

      cy.addBand('Título');
      cy.get('[data-band-overlay]').should('have.length', n + 1);
      cy.get('.band-toolbar').should('contain.text', 'Título');

      cy.designerKey('z', { ctrl: true, code: 'KeyZ' });
      cy.get('[data-band-overlay]').should('have.length', n);
      cy.get('.band-toolbar').should('not.exist');

      cy.designerKey('y', { ctrl: true, code: 'KeyY' });
      cy.get('[data-band-overlay]').should('have.length', n + 1);
    });
  });

  it('S2 — indicador dirty no botão Salvar após editar', () => {
    cy.get('button[aria-label^="Salvar alterações"]')
      .should('be.visible')
      .and('not.have.class', 'bg-amber-50');

    cy.addBand('Resumo');

    cy.get('button[aria-label^="Salvar alterações"]').should('have.class', 'bg-amber-50');
  });

  it('S3 — fechar com dirty abre modal de alterações não salvas', () => {
    cy.addBand('Rodapé');
    cy.get('button[aria-label="Voltar ao sistema"]').click();

    cy.get('[role="alertdialog"]').should('be.visible');
    cy.contains('h2', 'Alterações não salvas').should('be.visible');
    cy.contains('button', 'Sair sem salvar').should('be.visible');
    cy.contains('button', 'Salvar e sair').should('be.visible');

    cy.contains('button', 'Cancelar').click();
    cy.get('[role="alertdialog"]').should('not.exist');
    cy.get('[data-report-mode="design"]').should('exist');
  });

  it('S4 — fechar sem dirty volta à lista sem modal', () => {
    cy.get('button[aria-label="Voltar ao sistema"]').click();

    cy.get('[role="alertdialog"]').should('not.exist');
    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.contains('tr', 'Lista de usuários (A4)').should('be.visible');
  });

  it('S5 — timeline restaura layout ao clicar em entrada anterior', () => {
    cy.get('[data-band-overlay]').its('length').then((initial) => {
      const n = Number(initial);

      cy.addBand('Título');
      cy.get('[data-band-overlay]').should('have.length', n + 1);

      cy.get('button[aria-label*="Histórico de alterações"]').click();
      cy.contains('h2', 'Histórico de alterações').should('be.visible');
      cy.get('[data-history-current="true"]').should(
        'contain.text',
        'Adicionar banda: Título'
      );

      // Volta um passo na timeline
      cy.get('[data-history-current="true"]').prev('div').find('button').click();

      cy.get('[data-band-overlay]').should('have.length', n);
      cy.get('[data-history-current="true"]').should(
        'not.contain.text',
        'Adicionar banda: Título'
      );

      // Restaura clicando na entrada futura
      cy.contains('button', 'Adicionar banda: Título').click();
      cy.get('[data-history-current="true"]').should(
        'contain.text',
        'Adicionar banda: Título'
      );
      cy.get('[data-band-overlay]').should('have.length', n + 1);

      cy.get('button[aria-label="Fechar"]').click();
      cy.contains('h2', 'Histórico de alterações').should('not.exist');
    });
  });

  it('S6 — backup do histórico dispara onPersistHistory do host', () => {
    cy.stubHostConsole();
    cy.addBand('Cabeçalho');

    cy.get('button[aria-label^="Salvar backup do histórico"]').click();

    cy.get('@hostConsoleInfo').should('have.been.called');
    cy.get('@hostConsoleInfo').should(
      'have.been.calledWithMatch',
      '[demo] onPersistHistory'
    );
  });
});
