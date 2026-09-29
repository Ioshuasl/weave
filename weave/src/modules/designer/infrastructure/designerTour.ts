import { driver, type Alignment, type DriveStep, type Side } from 'driver.js';
import 'driver.js/dist/driver.css';

type DesignerTourInstance = ReturnType<typeof driver>;

let activeTour: DesignerTourInstance | null = null;

type TourStepDef = {
  selectors?: string[];
  title: string;
  description: string;
  side?: Side;
  align?: Alignment;
  prepare?: () => void | Promise<void>;
};

function isElementOnScreen(el: Element): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 2 &&
    rect.height > 2 &&
    rect.bottom > 8 &&
    rect.right > 8 &&
    rect.top < window.innerHeight - 8 &&
    rect.left < window.innerWidth - 8
  );
}

function queryVisible(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const matches = document.querySelectorAll(selector);
    for (const el of matches) {
      if (el instanceof HTMLElement && isElementOnScreen(el)) return el;
    }
  }
  return null;
}

function clickIfPresent(selector: string) {
  const el = document.querySelector<HTMLElement>(selector);
  if (el && isElementOnScreen(el)) el.click();
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveTourSteps(defs: TourStepDef[]): Promise<DriveStep[]> {
  const steps: DriveStep[] = [];

  for (const def of defs) {
    if (def.prepare) {
      await def.prepare();
      await wait(200);
    }

    if (!def.selectors?.length) {
      steps.push({
        popover: {
          title: def.title,
          description: def.description,
          align: def.align ?? 'center',
        },
      });
      continue;
    }

    const element = queryVisible(def.selectors);
    if (!element) continue;

    steps.push({
      element,
      popover: {
        title: def.title,
        description: def.description,
        side: def.side,
        align: def.align ?? 'start',
      },
    });
  }

  return steps;
}

function buildStepCatalog(): TourStepDef[] {
  return [
    {
      title: 'Bem-vindo ao designer',
      description:
        'Este guia percorre a interface atual — só os painéis e botões visíveis agora. Você monta o layout com bandas e componentes, liga campos de dados e confere o resultado na pré-visualização.',
    },
    {
      selectors: ['[data-tour="sidebar"]'],
      title: 'Paleta à esquerda',
      description:
        'Aqui ficam as ferramentas do relatório: bandas (estrutura da página), componentes (texto, gráfico, tabela…) e fontes de dados. Clique para inserir ou arraste para o canvas.',
      side: 'right',
    },
    {
      selectors: ['[data-tour="bands"]'],
      title: 'Bandas',
      description:
        'Bandas organizam a folha: título, cabeçalho, lista, tabela, linha, rodapé e resumo. Cada tipo tem um papel na impressão (uma vez, em toda página ou repetindo dados).',
      side: 'right',
    },
    {
      selectors: ['[data-tour="components"]'],
      title: 'Componentes',
      description:
        'Texto, forma, imagem, QR Code, tabela e gráfico. Selecione uma banda e clique, ou arraste o componente para cima dela. Duplo clique no texto abre o editor.',
      side: 'right',
    },
    {
      selectors: ['[data-tour="datasets"]', '[aria-label="Fontes de dados"]'],
      title: 'Fontes de dados',
      description:
        'Arraste um campo para o canvas para criar um texto com expressão, por exemplo <code>{cartorio.nome}</code> ou <code>{ato.tipo}</code>. No designer você vê o molde; os valores reais aparecem só na pré-visualização.',
      side: 'right',
      prepare: () => {
        if (!queryVisible(['[data-tour="datasets"]'])) {
          clickIfPresent('[aria-label="Fontes de dados"]');
        }
      },
    },
    {
      selectors: ['[data-tour="page-tabs"]'],
      title: 'Páginas do relatório',
      description:
        'Um relatório pode ter várias páginas de design (capa, corpo, etiqueta…). Duplo clique renomeia; o botão + cria outra folha.',
      side: 'bottom',
      prepare: () => {
        clickIfPresent('[aria-label="Fechar paleta"]');
      },
    },
    {
      selectors: ['[data-tour="page"]', '[data-designer-page]'],
      title: 'A folha',
      description:
        'Clique na página (fora das bandas) para editar preset, tamanho e margens. Arraste bandas para posicionar. O canvas mostra o molde, não o relatório preenchido.',
      side: 'left',
    },
    {
      selectors: ['[data-band-overlay]'],
      title: 'Bandas no canvas',
      description:
        'Cada retângulo é uma banda. Arraste, redimensione e use a toolbar para adicionar texto, duplicar ou excluir. Delete remove a seleção; Ctrl+D duplica.',
      side: 'bottom',
    },
    {
      selectors: ['[data-tour="zoom"]'],
      title: 'Zoom e alinhamento',
      description:
        'Ajuste o zoom da folha e o ímã de snap. Com snap ativo, as bandas encaixam umas nas outras. Segure Shift ao arrastar para desligar o snap temporariamente.',
      side: 'top',
    },
    {
      selectors: ['[data-tour="toolbar"]'],
      title: 'Barra de ações',
      description:
        'Salvar, pré-visualizar, histórico e importar/exportar JSON ficam aqui. O botão de salvar destaca quando há alterações não gravadas.',
      side: 'bottom',
    },
    {
      selectors: ['[data-tour="save"]', '[aria-label^="Salvar alterações"]'],
      title: 'Salvar',
      description:
        'Grava o layout no sistema hospedeiro. Atalho: <b>Ctrl+S</b>. Se o host configurou auto-save, o intervalo aparece na dica do botão.',
      side: 'bottom',
    },
    {
      selectors: ['[data-tour="preview"]', '[aria-label="Pré-visualização"]'],
      title: 'Pré-visualização',
      description:
        'Abre o relatório com dados reais: listas, tabelas, gráficos e paginação. Use Visualizar no host ou este botão no designer para conferir o resultado final.',
      side: 'bottom',
    },
    {
      selectors: ['[data-tour="history"]', '[aria-label*="Histórico de alterações"]'],
      title: 'Histórico',
      description:
        'Linha do tempo das edições (<b>Ctrl+H</b>). Dá para restaurar uma versão anterior sem perder o trabalho atual.',
      side: 'bottom',
    },
    {
      selectors: [
        '[data-tour="export"]',
        '[aria-label="Exportar relatório (JSON)"]',
        '[aria-label="Mais ações"]',
      ],
      title: 'Exportar e importar',
      description:
        'Exporte o layout em JSON para backup ou compartilhe com outro ambiente. Importar substitui o relatório atual.',
      side: 'bottom',
    },
    {
      selectors: ['[data-tour="layers"]'],
      title: 'Camadas',
      description:
        'Árvore de páginas, bandas e componentes — como as camadas do Photoshop. Clique para selecionar sem alterar a ordem. <b>Ctrl/Cmd</b> adiciona à seleção. A folha ativa no canvas fica destacada.',
      side: 'left',
      prepare: () => {
        if (!queryVisible(['[data-tour="layers"]', '[data-tour="properties"]'])) {
          clickIfPresent('[aria-label="Abrir painel de propriedades"]');
        }
      },
    },
    {
      selectors: [
        '[data-tour="properties"]',
        '[aria-label="Painel de propriedades"]',
        '[aria-label="Abrir painel de propriedades"]',
      ],
      title: 'Propriedades',
      description:
        'Edite o que estiver selecionado — folha, banda ou componente: tamanho, fonte, dataset, colunas, gráfico… No final, o grupo <b>Camadas</b> lista a hierarquia. Em telas estreitas, abra com <b>]</b>.',
      side: 'left',
      prepare: () => {
        if (!queryVisible(['[data-tour="properties"]'])) {
          clickIfPresent('[aria-label="Abrir painel de propriedades"]');
        }
      },
    },
    {
      title: 'Atalhos úteis',
      description:
        '<b>Delete</b> excluir · <b>Ctrl/Cmd+clique</b> seleção múltipla · <b>Ctrl+C / V / D</b> copiar, colar, duplicar · <b>Ctrl+Z</b> desfazer · <b>Ctrl+H</b> histórico · <b>F2</b> editar texto · <b>Shift</b> arrastar sem snap.<br/><br/>Pronto — feche este guia e monte o relatório. Pode abrir de novo pelo ícone de interrogação a qualquer momento.',
    },
  ];
}

/** Abre um tour do designer só com os elementos visíveis na tela atual. */
export async function startDesignerTour() {
  if (activeTour?.isActive()) {
    activeTour.destroy();
    activeTour = null;
  }

  clickIfPresent('[aria-label="Abrir paleta completa"]');
  clickIfPresent('[aria-label="Abrir painel de propriedades"]');
  await wait(240);

  const steps = await resolveTourSteps(buildStepCatalog());
  if (steps.length === 0) return;

  activeTour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayColor: '#171717',
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 10,
    popoverClass: 'designer-tour-popover',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Concluir',
    progressText: '{{current}} de {{total}}',
    steps,
    onDestroyed: () => {
      activeTour = null;
    },
  });

  activeTour.drive();
}
