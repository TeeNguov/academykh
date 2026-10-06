export const mathSnippets = [
  { label: "∫", title: "Integral", value: "$\\int_a^b f(x)\\,dx$" },
  { label: "Σ", title: "Summation", value: "$\\sum_{n=1}^{\\infty} a_n$" },
  { label: "√", title: "Square Root", value: "$\\sqrt{x}$" },
  { label: "a/b", title: "Fraction", value: "$\\frac{a}{b}$" },
  { label: "π", title: "Pi", value: "$\\pi$" },
  { label: "θ", title: "Theta", value: "$\\theta$" },
  { label: "Δ", title: "Delta", value: "$\\Delta$" },
  { label: "≤", title: "Less Than Or Equal", value: "$\\le$" },
  { label: "≥", title: "Greater Than Or Equal", value: "$\\ge$" }
];

export const mathFormulaTemplates = [
  { label: "Integral", value: "$$\\int_a^b f(x)\\,dx$$" },
  { label: "Derivative", value: "$$\\frac{d}{dx} f(x)$$" },
  { label: "Limit", value: "$$\\lim_{x \\to a} f(x)$$" },
  { label: "Quadratic Formula", value: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" },
  { label: "Pythagorean Theorem", value: "$$a^2 + b^2 = c^2$$" },
  { label: "Slope Formula", value: "$$m = \\frac{y_2 - y_1}{x_2 - x_1}$$" },
  { label: "Distance Formula", value: "$$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$" },
  { label: "Summation", value: "$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$" },
  { label: "Matrix", value: "$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$" },
  { label: "Chemical Equation", value: "$$2H_2 + O_2 \\rightarrow 2H_2O$$" },
  { label: "Physics Work", value: "$$W = Fd\\cos\\theta$$" },
  { label: "Newton's Second Law", value: "$$F = ma$$" }
];

export const mathPaletteGroups = [
  {
    label: "Common",
    items: [
      { label: "x²", value: "^2" },
      { label: "xₙ", value: "_n" },
      { label: "√", value: "\\sqrt{x}" },
      { label: "a/b", value: "\\frac{a}{b}" },
      { label: "()", value: "\\left( x \\right)" },
      { label: "[]", value: "\\left[ x \\right]" }
    ]
  },
  {
    label: "Operators",
    items: [
      { label: "∫", value: "\\int_a^b f(x)\\,dx" },
      { label: "∑", value: "\\sum_{i=1}^{n} i" },
      { label: "lim", value: "\\lim_{x \\to a} f(x)" },
      { label: "d/dx", value: "\\frac{d}{dx} f(x)" },
      { label: "±", value: "\\pm" },
      { label: "∞", value: "\\infty" }
    ]
  },
  {
    label: "Relations",
    items: [
      { label: "≤", value: "\\le" },
      { label: "≥", value: "\\ge" },
      { label: "≠", value: "\\ne" },
      { label: "≈", value: "\\approx" },
      { label: "→", value: "\\rightarrow" },
      { label: "∈", value: "\\in" }
    ]
  },
  {
    label: "Greek",
    items: [
      { label: "π", value: "\\pi" },
      { label: "θ", value: "\\theta" },
      { label: "α", value: "\\alpha" },
      { label: "β", value: "\\beta" },
      { label: "Δ", value: "\\Delta" },
      { label: "Ω", value: "\\Omega" }
    ]
  },
  {
    label: "Science",
    items: [
      { label: "H₂O", value: "H_2O" },
      { label: "CO₂", value: "CO_2" },
      { label: "F=ma", value: "F = ma" },
      { label: "W", value: "W = Fd\\cos\\theta" },
      { label: "v", value: "v = \\frac{\\Delta x}{\\Delta t}" },
      { label: "E", value: "E = mc^2" }
    ]
  }
];

export function stripMathDelimiters(value: string) {
  return value.replace(/^\$\$\s*/, "").replace(/\s*\$\$$/, "").replace(/^\$\s*/, "").replace(/\s*\$$/, "");
}
