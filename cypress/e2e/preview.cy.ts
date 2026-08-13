/**
 * P0 — Preview e impressão dos templates demo.
 * docs/cypress-plano-de-testes.md §4.6
 */
describe('P0 — Preview', () => {
  it('V1 — A4 com 50 usuários pagina e lista dados', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');

    cy.contains('h2', 'Pré-visualização').should('be.visible');
    cy.contains('.report-preview-toolbar', '794×1123px').should('be.visible');
    cy.contains('.report-preview-toolbar', /folha/i).should('be.visible');

    cy.get('.preview-sheet-block').should('have.length.at.least', 2);
    cy.contains('John Doe').should('be.visible');
    cy.contains('Usuário 50').should('exist');
  });

  it('V2 — expressões resolvidas (não mostra tokens crus)', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');

    cy.contains('John Doe').should('be.visible');
    cy.contains('john@example.com').should('be.visible');
    cy.contains('1º Cartório de Notas — Demo').should('be.visible');
    cy.contains('contato@cartorio-demo.com.br').should('exist');

    cy.get('#report-print-root').should('not.contain', '{users.name}');
    cy.get('#report-print-root').should('not.contain', '{cartorio.nome}');
  });

  it('V3 — gráfico no resumo renderiza', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');

    cy.get('#report-print-root .recharts-wrapper', { timeout: 15000 }).should(
      'have.length.at.least',
      1
    );
    cy.contains('Vendas').should('exist');
  });

  it('V4 — contador de páginas no rodapé', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');

    cy.contains(/Página \d+ de \d+/).should('exist');
    cy.contains('Folha 1 de').should('exist');
  });

  it('V5 — multipágina (capa + corpo)', () => {
    cy.openReport('Multipágina (capa + corpo)', 'preview');

    cy.get('[data-report-id="rep_multipage"]').should('exist');
    cy.contains('.report-preview-toolbar', '2 páginas de design').should('be.visible');
    // Texto pode ficar sob outra banda (layout absoluto) — validar no DOM
    cy.get('#report-print-root').should(($root) => {
      const text = $root.text();
      expect(text).to.include('Relatório multipágina');
      expect(text).to.include('Capa do documento');
      expect(text).to.include('John Doe');
    });
    cy.get('.preview-sheet-block').should('have.length.at.least', 2);
  });

  it('V6 — A5 usa dimensão menor que A4', () => {
    cy.openReport('Lista compacta A5', 'preview');

    cy.get('[data-report-id="rep_a5"]').should('exist');
    cy.contains('.report-preview-toolbar', '559×794px').should('be.visible');
    cy.contains('.report-preview-toolbar', '794×1123px').should('not.exist');
    cy.contains('Lista A5').should('be.visible');
    cy.contains('John Doe').should('exist');
  });

  it('V7 — cupom 80 mm (perfil contínuo estreito)', () => {
    cy.openReport('Cupom 80 mm', 'preview');

    cy.get('[data-report-id="rep_receipt"]').should('exist');
    cy.contains('.report-preview-toolbar', '302×').should('be.visible');
    cy.contains('RESTAURANTE DEMO').should('be.visible');
    cy.contains('Obrigado!').should('exist');

    // View modes multi/livro indisponíveis em bobina
    cy.get('button[aria-label="Múltiplas páginas"]').should('be.disabled');
    cy.get('button[aria-label="Livro"]').should('be.disabled');
  });

  it('V10 — Imprimir dispara onPrint do host', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');
    cy.stubHostConsole();

    cy.contains('button', 'Imprimir').click();
    cy.get('@hostConsoleInfo').should('have.been.called');
    cy.get('@hostConsoleInfo').should(
      'have.been.calledWithMatch',
      '[demo] onPrint'
    );
  });

  it('V11 — Voltar sai do preview e limpa a sessão', () => {
    cy.openReport('Lista de usuários (A4)', 'preview');
    cy.contains('button', 'Voltar').click();

    cy.contains('Meu ERP — Relatórios').should('be.visible');
    cy.get('[data-report-mode="preview"]').should('not.exist');
    cy.contains('h2', 'Pré-visualização').should('not.exist');
  });
});
