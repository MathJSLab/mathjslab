/**
 * Parse identifier replacing greek names and others symbols by HTML entities
 * @param id String containing greek names
 * @returns String with greek names replaced by HTML entities
 */
function substSymbol(id: string): string {
    const greekLetters: Array<string> = [
        'alpha',
        'beta',
        'gamma',
        'delta',
        'epsilon',
        'zeta',
        'eta',
        'theta',
        'iota',
        'kappa',
        'lambda',
        'mu',
        'nu',
        'xi',
        'omicron',
        'pi',
        'rho',
        'sigma',
        'tau',
        'upsilon',
        'phi',
        'chi',
        'psi',
        'omega',
    ];
    const greekAlias: Array<[string, string]> = [
        ['alfa', 'alpha'],
        ['Alfa', 'Alpha'],
        ['gama', 'gamma'],
        ['Gama', 'Gamma'],
        ['épsilon', 'epsilon'],
        ['Épsilon', 'Epsilon'],
        ['dzeta', 'zeta'],
        ['Dzeta', 'Zeta'],
        ['teta', 'theta'],
        ['Teta', 'Theta'],
        ['capa', 'kappa'],
        ['Capa', 'Kappa'],
        ['kapa', 'kappa'],
        ['Kapa', 'Kappa'],
        ['mi', 'mu'],
        ['Mi', 'Mu'],
        ['ni', 'nu'],
        ['Ni', 'Nu'],
        ['csi', 'xi'],
        ['Csi', 'Xi'],
        ['ksi', 'xi'],
        ['Ksi', 'Xi'],
        ['ômicron', 'omicron'],
        ['Ômicron', 'Omicron'],
        ['ómicron', 'omicron'],
        ['Ómicron', 'Omicron'],
        ['ro', 'rho'],
        ['Ro', 'Rho'],
        ['rô', 'rho'],
        ['Rô', 'Rho'],
        ['úpsilon', 'upsilon'],
        ['Úpsilon', 'Upsilon'],
        ['ipsilon', 'upsilon'],
        ['Ipsilon', 'Upsilon'],
        ['ípsilon', 'upsilon'],
        ['Ípsilon', 'Upsilon'],
        ['ypsilon', 'upsilon'],
        ['Ypsilon', 'Upsilon'],
        ['ýpsilon', 'upsilon'],
        ['Ýpsilon', 'Upsilon'],
        ['fi', 'phi'],
        ['Fi', 'Phi'],
        ['qui', 'chi'],
        ['Qui', 'Chi'],
        ['ômega', 'omega'],
        ['Ômega', 'Omega'],
    ];
    let regex: RegExp;
    for (let i = 0; i < greekAlias.length; i++) {
        regex = new RegExp('([^a-zA-Z0-9])(' + greekAlias[i][0] + ')(?![a-zA-Z0-9;])', 'g');
        id = id.replace(regex, '$1' + greekAlias[i][1]);
        regex = new RegExp('^(' + greekAlias[i][0] + ')(?![a-zA-Z0-9;])', 'g');
        id = id.replace(regex, greekAlias[i][1]);
    }
    for (let i = 0; i < greekLetters.length; i++) {
        regex = new RegExp('([^a-zA-Z0-9])([' + greekLetters[i][0] + greekLetters[i][0].toUpperCase() + ']' + greekLetters[i].substring(1) + ')(?![a-zA-Z0-9;])', 'g');
        id = id.replace(regex, '$1&$2;');
        regex = new RegExp('^([' + greekLetters[i][0] + greekLetters[i][0].toUpperCase() + ']' + greekLetters[i].substring(1) + ')(?![a-zA-Z0-9;])', 'g');
        id = id.replace(regex, '&$1;');
    }
    id = id.replace(/^[Ii]nf$/, '&infin;').replace(/^NaN$|^nan$/, '<b>NaN</b>');
    return id;
}
export { substSymbol };
export default substSymbol;
