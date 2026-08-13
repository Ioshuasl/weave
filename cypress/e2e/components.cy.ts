/**
 * P1 — Componentes (sidebar, canvas, editor, atalhos).
 * docs/cypress-plano-de-testes.md §4.4
 */
describe('P1 — Componentes', () => {
  const COMPONENT_TYPES = ['Texto', 'Forma', 'Imagem', 'Tabela', 'Gráfico'] as const;

  function ensureAccordionOpen(title: string) {
    cy.contains('button', title).then(($btn) => {
      if ($btn.attr('aria-expanded') === 'false') {
        cy.wrap($btn).click({ force: true });
      }
    });
  }

  beforeEach(() => {
    cy.openReport('Lista de usuários (A4)', 'design');
  });

  it('C1 — adicionar Texto/Forma/Imagem/Tabela/Gráfico com banda selecionada', () => {
    cy.addBand('Título');

    cy.get('[data-component-id]').its('length').then((initial) => {
      cy.wrap([...COMPONENT_TYPES]).each((label) => {
        cy.addComponent(String(label));
      });
      cy.get('[data-component-id]').should('have.length', Number(initial) + COMPONENT_TYPES.length);
    });
  });

  it('C2 — sem banda selecionada, clique em componente não adiciona', () => {
    cy.clearCanvasSelection();
    cy.get('[data-component-id]').its('length').as('before');

    cy.addComponent('Texto');

    cy.get('@before').then((before) => {
      cy.get('[data-component-id]').should('have.length', Number(before));
    });
  });

  it('C3 — divider não aceita componente via sidebar', () => {
    cy.addBand('Linha');
    cy.contains('Orientação rápida').should('be.visible');
    cy.get('[data-component-id]').its('length').as('before');

    cy.addComponent('Texto');

    cy.get('@before').then((before) => {
      cy.get('[data-component-id]').should('have.length', Number(before));
    });
    cy.contains('Orientação rápida').should('be.visible');
    cy.contains('button', 'Editar texto…').should('not.exist');
  });

  it('C4 — arrastar campo da árvore cria texto com expressão', () => {
    cy.addBand('Título');
    cy.get('[data-component-id]').its('length').as('before');

    cy.contains('button', 'Usuários').click({ force: true });

    cy.window().then((win) => {
      const dataTransfer = new win.DataTransfer();

      cy.contains('span', /^name$/)
        .closest('[draggable="true"], [draggable]')
        .trigger('dragstart', { dataTransfer, force: true });

      cy.get('.band-toolbar')
        .contains('Título')
        .closest('[data-band-overlay]')
        .trigger('dragover', { dataTransfer, force: true })
        .trigger('drop', { dataTransfer, force: true });
    });

    cy.get('@before').then((before) => {
      cy.get('[data-component-id]').should('have.length', Number(before) + 1);
    });

    cy.get('body').should(($body) => {
      const text = $body.text();
      expect(text).to.include('{users.name}');
    });
  });

  it('C5 — selecionar componente no canvas abre propriedades do tipo', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');

    cy.get('[data-component-id]').last().click({ force: true });
    cy.contains('button', 'Editar texto…').should('be.visible');
    cy.contains('button', 'Conteúdo').should('be.visible');
  });

  it('C6 — Delete, duplicar e copiar/colar', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');

    cy.get('[data-component-id]').its('length').then((initial) => {
      const n = Number(initial);

      cy.get('button[aria-label="Duplicar seleção"]').click();
      cy.get('[data-component-id]').should('have.length', n + 1);

      cy.get('button[aria-label="Duplicar seleção"]').click();
      cy.get('[data-component-id]').should('have.length', n + 2);

      ensureAccordionOpen('Ações');
      cy.get('button[title="Copiar componente (Ctrl+C)"]').click();
      cy.contains('button', 'Colar na banda').should('be.visible').click();
      cy.get('[data-component-id]').should('have.length', n + 3);

      ensureAccordionOpen('Ações');
      cy.contains('button', 'Excluir componente').click();
      cy.get('[data-component-id]').should('have.length', n + 2);
    });
  });

  it('C7 — F2 abre o editor de texto', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');
    cy.get('[data-component-id]').last().click({ force: true });

    cy.designerKey('F2', { code: 'F2' });

    cy.get('[role="dialog"][aria-labelledby="text-editor-modal-title"]').should(
      'be.visible'
    );
    cy.contains('h2', 'Editar texto').should('be.visible');
    cy.contains('button', 'Salvar').should('be.visible');
  });

  it('C8 — rich text: editar conteúdo, alinhar e salvar', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');
    cy.contains('button', 'Editar texto…').click();

    cy.get('[role="dialog"] [contenteditable="true"]')
      .first()
      .click()
      .type('{selectall}Relatório Cypress');

    // Alinhamento é estilo do componente (mais estável que negrito por seleção)
    cy.get('button[aria-label="Centralizar"]').click();
    cy.get('button[aria-label="Centralizar"]').should('have.attr', 'aria-pressed', 'true');

    cy.contains('[role="dialog"] button', 'Salvar').click();
    cy.get('[role="dialog"]').should('not.exist');

    cy.get('[data-component-id]').last().should('contain.text', 'Relatório Cypress');
  });

  it('C9 — inserir chip de campo no editor', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');
    cy.contains('button', 'Editar texto…').click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /Campos disponíveis/).click({ force: true });
      cy.contains(/Cart[oó]rio\.nome|cartorio\.nome/i).click({ force: true });
    });

    cy.get('[role="dialog"]').should(($dialog) => {
      expect($dialog.find('[data-field]').length, 'chip de campo').to.be.greaterThan(0);
    });

    cy.contains('[role="dialog"] button', 'Salvar').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('C10 — descartar edição sem salvar preserva conteúdo', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');
    cy.contains('button', 'Editar texto…').click();

    cy.get('[role="dialog"] [contenteditable="true"]')
      .first()
      .click()
      .type('{selectall}TEXTO QUE DEVE SER DESCARTADO');

    cy.contains('[role="dialog"] button', 'Cancelar').click();
    cy.get('[role="alertdialog"]').should('be.visible');
    cy.contains('button', 'Descartar').click();

    cy.get('[role="dialog"]').should('not.exist');
    cy.get('[data-component-id]').last().should('not.contain.text', 'TEXTO QUE DEVE SER DESCARTADO');
    cy.get('[data-component-id]').last().should('contain.text', 'Texto');
  });

  it('C11 — gráfico: trocar tipo e fonte no painel', () => {
    cy.addBand('Resumo');
    cy.addComponent('Gráfico');

    cy.contains('Tipo de gráfico').should('be.visible');
    cy.contains('button', 'Pizza').click();
    cy.contains('button', 'Pizza').should('have.class', 'bg-white');
    cy.contains('Raio interno').should('be.visible');

    cy.contains('label', 'Fonte de dados')
      .parent()
      .find('button[aria-haspopup="listbox"]')
      .click();
    cy.get('[role="option"]').contains('Usuários').click();

    cy.contains('label', 'Fonte de dados')
      .parent()
      .find('button[aria-haspopup="listbox"]')
      .should('contain.text', 'Usuários');

    cy.get('[data-designer-chart-placeholder]').should('exist');
    cy.contains('Gráfico de pizza').should('exist');
  });

  it('C12 — seleção múltipla (Ctrl+clique)', () => {
    cy.addBand('Título');
    cy.addComponent('Texto');
    ensureAccordionOpen('Dimensões');
    cy.contains('label', 'X').parent().find('input').clear().type('40{enter}');

    cy.addComponent('Forma');
    ensureAccordionOpen('Dimensões');
    cy.contains('label', 'X').parent().find('input').clear().type('160{enter}');

    cy.get('[data-component-id]').then(($comps) => {
      const lastTwo = [...$comps].slice(-2);
      const idA = lastTwo[0].getAttribute('data-component-id')!;
      const idB = lastTwo[1].getAttribute('data-component-id')!;

      cy.get(`[data-component-id="${idA}"]`).then(($a) => {
        $a[0].dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            ctrlKey: false,
          })
        );
      });

      cy.get(`[data-component-id="${idB}"]`).then(($b) => {
        $b[0].dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            ctrlKey: true,
          })
        );
      });
    });

    cy.contains('2 componentes').should('be.visible');
    cy.contains('Duplicar seleção').should('be.visible');
    cy.contains(/Excluir 2 componentes/).should('be.visible');
  });
});
