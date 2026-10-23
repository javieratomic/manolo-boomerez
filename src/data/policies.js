// Políticas de empresa. Cada opción tiene efectos mensuales:
//  moral / rep: variación por mes · insp / hac: subida del radar por mes (antes de multiplicadores)

export const POLICIES = {
  salario: {
    label: 'Política salarial',
    options: {
      convenio: { label: 'Convenio', desc: 'Lo que dice la ley. Tu padre lo hacía así.', wage: 1900, moral: 1, insp: 0, hac: 0 },
      minimo: { label: 'Salario mínimo y gracias', desc: 'Legal... por los pelos.', wage: 1500, moral: -0.5, insp: 0.4, hac: 0 },
      negro: { label: 'Falsos autónomos y sobres', desc: '"Así tienen más libertad."', wage: 950, moral: -2.5, insp: 2.0, hac: 0.8 },
    },
  },
  horas: {
    label: 'Horas extra',
    options: {
      pagadas: { label: 'Pagadas', desc: 'Como manda el Estatuto.', laborMult: 1, moral: 0, insp: 0 },
      gratis: { label: '"Voluntarias"', desc: '"Aquí somos una familia."', laborMult: 0.87, moral: -1.5, insp: 0.8 },
      tiburon: { label: 'Modo tiburón 24/7', desc: '"El que quiere, puede."', laborMult: 0.77, moral: -4, insp: 2.0 },
    },
  },
  becarios: {
    label: 'Becarios',
    options: {
      ninguno: { label: 'Ninguno', desc: 'Toda la plantilla con contrato.', share: 0, service: 1, moral: 0, insp: 0 },
      algunos: { label: 'Algunos (30 %)', desc: '"Están aprendiendo."', share: 0.3, service: 0.95, moral: -0.5, insp: 1.0 },
      legion: { label: 'Legión (60 %)', desc: '"Les estamos dando una oportunidad."', share: 0.6, service: 0.88, moral: -1, insp: 2.5 },
    },
  },
  alquiler: {
    label: 'Alquiler de los pisos de la plantilla',
    options: {
      social: { label: 'Social (350 €)', desc: 'Casi caridad. Casi.', rent: 350, moral: 1, insp: 0 },
      mercado: { label: 'Mercado (600 €)', desc: '"Es lo que hay."', rent: 600, moral: -0.5, insp: 0.2 },
      abusivo: { label: 'Abusivo (850 €)', desc: 'Por una habitación compartida con el horno.', rent: 850, moral: -2.5, insp: 1.0 },
    },
  },
  contabilidad: {
    label: 'Contabilidad',
    options: {
      limpia: { label: 'Limpia', desc: 'Declaras todo. Qué aburrido.', declared: 1, hac: 0 },
      creativa: { label: 'Creativa', desc: 'Algún ticket de gasolina de más.', declared: 0.55, hac: 1.2 },
      artistica: { label: 'Artística', desc: 'Picasso de la contabilidad.', declared: 0.2, hac: 3.5 },
    },
  },
  ingredientes: {
    label: 'Ingredientes',
    options: {
      mantequilla: { label: 'Mantequilla pasiega', desc: 'La receta de la abuela.', cost: 1, quality: 1, rep: 0.3 },
      margarina: { label: 'Margarina', desc: '"Nadie nota la diferencia."', cost: 0.65, quality: 0.75, rep: 0 },
      misteriosa: { label: 'Grasa industrial misteriosa', desc: 'Viene en bidones sin etiqueta.', cost: 0.4, quality: 0.5, rep: -0.8 },
    },
  },
};

export const DEFAULT_POLICIES = {
  salario: 'convenio',
  horas: 'pagadas',
  becarios: 'ninguno',
  alquiler: 'mercado',
  contabilidad: 'limpia',
  ingredientes: 'mantequilla',
};

export const LEGAL_LABOR = { salario: 'convenio', horas: 'pagadas', becarios: 'ninguno' };

export const BECARIO_WAGE = 400;
