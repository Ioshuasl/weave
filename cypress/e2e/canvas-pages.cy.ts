/**
 * P1 — Canvas, zoom, páginas e painéis.
 * docs/cypress-plano-de-testes.md §4.5
 */
describe('P1 — Canvas e páginas', () => {
  function ensureAccordionOpen(title: string) {
    cy.contains('button', title).then(($btn) => {
      if ($btn.attr('aria-expanded') === 'false') {
        cy.wrap($btn).click({ force: true });
      }
    });
  }

  describe('zoom e snap (A4)', () => {
    beforeEach(() => {
      cy.openReport('Lista de usuários (A4)', 'design');
    });

    it('P1 — Zoom + / − / 100%', () => {
      cy.get('button[aria-label="Zoom 100%"]').click();
      cy.get('button[aria-label="Redefinir zoom"]').should('contain.text', '100%');

      cy.get('button[aria-label="Aumentar zoom"]').click();
      cy.get('button[aria-label="Redefinir zoom"]')
        .invoke('text')
        .should('match', /^\s*(1[1-9]|[2-9]\d|[1-9]\d{2,})%\s*$/);

      cy.get('button[aria-label="Redefinir zoom"]')
        .invoke('text')
        .then((zoomedIn) => {
          cy.get('button[aria-label="Diminuir zoom"]').click();
          cy.get('button[aria-label="Redefinir zoom"]')
            .invoke('text')
            .should('not.eq', zoomedIn);
        });

      cy.get('button[aria-label="Zoom 100%"]').click();
      cy.get('button[aria-label="Redefinir zoom"]').should('contain.text', '100%');

      cy.addBand('Título');
      cy.get('.band-toolbar').should('contain.text', 'Título');
    });

    it('P2 — Snap on/off', () => {
      cy.get('button[aria-label="Desativar snap"]')
        .should('have.attr', 'aria-pressed', 'true')
        .click();

      cy.get('button[aria-label="Ativar snap"]')
        .should('have.attr', 'aria-pressed', 'false')
        .click();

      cy.get('button[aria-label="Desativar snap"]').should(
        'have.attr',
        'aria-pressed',
        'true'
      );
    });
  });

  describe('páginas (CRUD e abas)', () => {
    beforeEach(() => {
      cy.openReport('Lista de usuários (A4)', 'design');
    });

    it('P3 — Nova página', () => {
      cy.get('[role="tablist"][aria-label="Páginas do relatório"]')
        .find('[role="tab"]')
        .its('length')
        .then((count) => {
          cy.get('button[aria-label="Nova página"]').click();
          cy.get('[role="tablist"][aria-label="Páginas do relatório"]')
            .find('[role="tab"]')
            .should('have.length', Number(count) + 1);
          cy.get('[role="tab"][aria-selected="true"]').should(
            'contain.text',
            'Página'
          );
          // Nova página começa sem bandas no canvas
          cy.get('[data-band-overlay]').should('have.length', 0);
        });
    });

    it('P4 — Renomear página com duplo clique', () => {
      cy.get('[role="tab"][aria-selected="true"]').dblclick();
      cy.get('input[aria-label="Renomear página"]')
        .should('be.visible')
        .clear()
        .type('Capa Cypress{enter}');

      cy.get('[role="tab"][aria-selected="true"]').should(
        'contain.text',
        'Capa Cypress'
      );
    });

    it('P5 — Excluir página (quando há mais de uma)', () => {
      cy.get('[role="tab"]').its('length').then((before) => {
        cy.get('button[aria-label="Nova página"]').click();
        cy.get('[role="tab"]').should('have.length', Number(before) + 1);

        cy.get('button[aria-label^="Excluir"]').filter(':visible').first().click();
        cy.get('[role="tab"]').should('have.length', Number(before));
      });
    });
  });

  describe('multipágina demo', () => {
    it('P6 — trocar aba Capa → Corpo', () => {
      cy.openReport('Multipágina (capa + corpo)', 'design');

      cy.contains('[role="tab"]', 'Capa').should('have.attr', 'aria-selected', 'true');
      cy.get('[data-designer-page]').should(($el) => {
        expect($el.text()).to.include('Relatório multipágina');
      });
      cy.get('[data-band-overlay]').should('have.length', 1);

      cy.contains('[role="tab"]', 'Corpo').click();
      cy.contains('[role="tab"]', 'Corpo').should('have.attr', 'aria-selected', 'true');

      // Corpo: 3 bandas e conteúdo distinto da capa (sem vazamento)
      cy.get('[data-band-overlay]').should('have.length', 3);
      cy.get('[data-designer-page]').should(($el) => {
        const text = $el.text();
        expect(text).to.not.include('Relatório multipágina');
        expect(text).to.include('Nome');
      });
    });
  });

  describe('propriedades da folha', () => {
    beforeEach(() => {
      cy.openReport('Lista de usuários (A4)', 'design');
    });

    it('P7 — preset A5 e orientação alteram a folha', () => {
      cy.clearCanvasSelection();
      cy.contains('Propriedades da folha').should('be.visible');

      ensureAccordionOpen('Tamanho da folha');
      cy.contains('label', 'Preset')
        .parent()
        .find('select')
        .select('a5-portrait');

      cy.get('[data-designer-page]').should(($el) => {
        const width = parseFloat(($el[0] as HTMLElement).style.width);
        expect(width).to.be.closeTo(559, 2);
      });

      cy.contains('button', 'Orientação').click();
      cy.get('[data-designer-page]').should(($el) => {
        const width = parseFloat(($el[0] as HTMLElement).style.width);
        const height = parseFloat(($el[0] as HTMLElement).style.height || '0');
        // Paisagem A5: largura > altura
        expect(width).to.be.greaterThan(height > 0 ? height : 0);
        expect(width).to.be.closeTo(794, 2);
      });

      ensureAccordionOpen('Margens');
      cy.contains('label', 'Topo').parent().find('input').clear().type('1.5{enter}');
      // Round-trip cm↔px pode exibir 1.51
      cy.propertyNumber('Topo').should('be.closeTo', 1.5, 0.02);
    });
  });

  describe('painéis em viewport compacto', () => {
    it('P8 — atalhos [ e ] abrem/fecham painéis', () => {
      cy.viewport(1200, 900);
      cy.openReport('Lista de usuários (A4)', 'design');

      // Normaliza estado persistido: propriedades fechadas
      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label="Abrir painel de propriedades"]').length === 0) {
          cy.designerKey(']', { code: 'BracketRight' });
        }
      });
      cy.get('button[aria-label="Abrir painel de propriedades"]').should('be.visible');

      cy.designerKey(']', { code: 'BracketRight' });
      cy.get('[aria-label="Painel de propriedades"]').should('be.visible');
      cy.get('button[aria-label="Fechar propriedades"]').should('be.visible');

      cy.designerKey(']', { code: 'BracketRight' });
      cy.get('button[aria-label="Abrir painel de propriedades"]').should('be.visible');

      // Normaliza paleta esquerda fechada, depois abre com [
      cy.get('body').then(($body) => {
        if ($body.find('button[aria-label="Fechar paleta"]').length > 0) {
          cy.designerKey('[', { code: 'BracketLeft' });
        }
      });
      cy.designerKey('[', { code: 'BracketLeft' });
      cy.get('button[aria-label="Fechar paleta"]').should('be.visible');
    });
  });
});
