/**
 * P0/P1 — Bandas (sidebar + canvas + propriedades).
 * docs/cypress-plano-de-testes.md §4.3
 */
describe('P0/P1 — Bandas', () => {
  const BAND_TYPES = [
    'Título',
    'Cabeçalho',
    'Lista livre',
    'Lista numerada',
    'Tabela',
    'Linha',
    'Rodapé',
    'Resumo',
  ] as const;

  beforeEach(() => {
    cy.openReport('Lista de usuários (A4)', 'design');
  });

  it('B1 — adicionar cada tipo de banda', () => {
    cy.get('[data-band-overlay]').then(($before) => {
      const initial = $before.length;

      BAND_TYPES.forEach((label) => {
        cy.addBand(label);
      });

      cy.get('[data-band-overlay]').should('have.length', initial + BAND_TYPES.length);
    });
  });

  it('B2 — cascata de posição (bandas não nascem no mesmo pixel)', () => {
    const ys: number[] = [];

    cy.wrap([1, 2, 3]).each(() => {
      cy.addBand('Título');
      cy.propertyNumber('Y').then((y) => {
        ys.push(y);
      });
    }).then(() => {
      expect(ys).to.have.length(3);
      expect(new Set(ys).size, `Y distintos: ${ys.join(', ')}`).to.eq(3);
    });
  });

  it('B3 — selecionar banda atualiza propriedades e toolbar', () => {
    cy.addBand('Título');
    cy.get('.band-toolbar').should('contain.text', 'Título');
    cy.contains('button', 'Layout').should('be.visible');
    cy.contains('label', 'X').should('be.visible');
    cy.contains('label', 'Y').should('be.visible');

    cy.addBand('Cabeçalho');
    cy.get('.band-toolbar').should('contain.text', 'Cabeçalho');
    cy.get('.band-toolbar').should('not.contain.text', 'Título');
    cy.contains('label', 'Y').should('be.visible');
  });

  it('B4 — excluir banda (toolbar + Delete); Backspace em input não remove', () => {
    cy.addBand('Resumo');
    cy.get('[data-band-overlay]').its('length').as('countAfterAdd');

    // Backspace dentro do campo de propriedade não deve excluir a banda
    cy.contains('label', 'Y').parent().find('input').click().type('{backspace}');
    cy.get('.band-toolbar').should('contain.text', 'Resumo');
    cy.get('@countAfterAdd').then((count) => {
      cy.get('[data-band-overlay]').should('have.length', Number(count));
    });

    // Delete via atalho (foco fora de input)
    cy.contains('label', 'Y').parent().find('input').blur();
    cy.get('.band-toolbar').should('be.visible');
    cy.window().then((win) => {
      win.dispatchEvent(
        new win.KeyboardEvent('keydown', {
          key: 'Delete',
          code: 'Delete',
          bubbles: true,
          cancelable: true,
        })
      );
    });

    cy.get('@countAfterAdd').then((count) => {
      cy.get('[data-band-overlay]').should('have.length', Number(count) - 1);
    });
    cy.get('.band-toolbar').should('not.exist');
  });

  it('B5 — duplicar banda (Ctrl+D)', () => {
    cy.addBand('Rodapé');
    cy.get('[data-band-overlay]').its('length').as('beforeDup');

    cy.window().then((win) => {
      win.dispatchEvent(
        new win.KeyboardEvent('keydown', {
          key: 'd',
          code: 'KeyD',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
    });

    cy.get('@beforeDup').then((count) => {
      cy.get('[data-band-overlay]').should('have.length', Number(count) + 1);
    });
    cy.get('.band-toolbar').should('contain.text', 'Rodapé');
  });

  it('B6 — Linha (divider): ângulo/espessura e sem componentes filhos', () => {
    cy.addBand('Linha');

    cy.contains('Orientação rápida').should('be.visible');
    cy.contains('button', 'Vertical').click();
    cy.contains('label', 'Ângulo').parent().should('contain.text', '90°');

    cy.contains('label', 'Espessura').parent().find('input').clear().type('4{enter}');
    cy.propertyNumber('Espessura').should('eq', 4);

    // Divider não oferece "Adicionar texto" na toolbar
    cy.get('button[aria-label="Adicionar texto"]').should('not.exist');

    // Clique em Texto na sidebar é no-op (não há banda alvo válida)
    cy.contains('section', 'Componentes').within(() => {
      cy.contains('button', 'Texto').click();
    });
    cy.get('.band-toolbar').should('contain.text', 'Linha');
    cy.contains('Orientação rápida').should('be.visible');
  });

  it('B7 — banda de dados: ligar fonte Usuários', () => {
    cy.addBand('Lista livre');

    cy.contains('label', 'Fonte de dados')
      .parent()
      .find('button[aria-haspopup="listbox"]')
      .click();

    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="option"]').contains('Usuários').click();

    cy.contains('label', 'Fonte de dados')
      .parent()
      .find('button[aria-haspopup="listbox"]')
      .should('contain.text', 'Usuários');

    cy.get('.band-toolbar').should('contain.text', 'users');
  });

  it('B8 — Lista livre vs Tabela expõem painéis diferentes', () => {
    cy.addBand('Lista livre');
    cy.contains('Marcadores').should('be.visible');
    cy.contains('Colunas').should('not.exist');
    cy.contains('section', 'Componentes').within(() => {
      cy.contains('button', 'Texto').should('not.be.disabled');
    });
    cy.get('button[aria-label="Adicionar texto"]').should('be.visible');

    cy.addBand('Tabela');
    cy.contains('Colunas').should('be.visible');
    cy.contains('button', 'Sincronizar').should('be.visible');
    cy.contains('Marcadores').should('not.exist');
    cy.get('button[aria-label="Adicionar texto"]').should('not.exist');
  });

  it('B9 — Sincronizar colunas da tabela a partir do dataset', () => {
    cy.addBand('Tabela');

    cy.contains('label', 'Fonte de dados')
      .parent()
      .find('button[aria-haspopup="listbox"]')
      .click();
    cy.get('[role="option"]').contains('Usuários').click();

    cy.contains('button', 'Sincronizar').click();

    cy.contains('Colunas').parent().parent().within(() => {
      cy.contains('name').should('exist');
      cy.contains('email').should('exist');
      cy.contains('role').should('exist');
      cy.contains('sales').should('exist');
    });
  });
});
